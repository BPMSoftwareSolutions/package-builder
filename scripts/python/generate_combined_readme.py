#!/usr/bin/env python3
"""
Generate a combined README file from multiple repositories matching glob patterns.

This script fetches README files from repositories in a GitHub organization that
match specified glob patterns and combines them into a single, well-formatted README.
"""

import os
import sys
import logging
import fnmatch
import time
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import requests
import click
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()


class GitHubAPIClient:
    """Client for interacting with GitHub API."""
    
    def __init__(self, token: str, org: str):
        """
        Initialize GitHub API client.
        
        Args:
            token: GitHub API token
            org: GitHub organization name
        """
        self.token = token
        self.org = org
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        self.rate_limit_remaining = None
        self.rate_limit_reset = None
    
    def _make_request(self, endpoint: str, max_retries: int = 3) -> Optional[Dict]:
        """
        Make a request to GitHub API with retry logic.
        
        Args:
            endpoint: API endpoint
            max_retries: Maximum number of retries
            
        Returns:
            Response JSON or None if failed
        """
        url = f"{self.base_url}{endpoint}"
        
        for attempt in range(max_retries):
            try:
                response = requests.get(url, headers=self.headers, timeout=10)
                
                # Update rate limit info
                if "X-RateLimit-Remaining" in response.headers:
                    self.rate_limit_remaining = int(response.headers["X-RateLimit-Remaining"])
                    self.rate_limit_reset = int(response.headers["X-RateLimit-Reset"])
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 404:
                    logger.warning(f"Not found: {endpoint}")
                    return None
                elif response.status_code == 403:
                    logger.error("Rate limit exceeded or access denied")
                    return None
                else:
                    logger.warning(f"Request failed with status {response.status_code}")
                    
            except requests.RequestException as e:
                logger.warning(f"Request failed (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                    
        return None
    
    def get_repositories(self) -> List[Dict]:
        """
        Get all repositories in the organization or user account.

        Returns:
            List of repository dictionaries
        """
        repos = []
        page = 1

        while True:
            # Try organization endpoint first, then fall back to user endpoint
            endpoint = f"/orgs/{self.org}/repos?page={page}&per_page=100"
            data = self._make_request(endpoint)

            # If org endpoint fails, try user endpoint
            if data is None:
                endpoint = f"/users/{self.org}/repos?page={page}&per_page=100"
                data = self._make_request(endpoint)

            if not data:
                break

            if not data:  # Empty page
                break

            repos.extend(data)
            page += 1

        return repos
    
    def get_readme(self, repo_name: str) -> Optional[str]:
        """
        Get README content from a repository.
        
        Args:
            repo_name: Repository name
            
        Returns:
            README content or None if not found
        """
        # Try different README formats
        readme_formats = ["README.md", "README.rst", "README.txt", "readme.md"]
        
        for readme_name in readme_formats:
            endpoint = f"/repos/{self.org}/{repo_name}/contents/{readme_name}"
            data = self._make_request(endpoint)
            
            if data and "content" in data:
                import base64
                try:
                    content = base64.b64decode(data["content"]).decode("utf-8")
                    logger.info(f"Found {readme_name} in {repo_name}")
                    return content
                except Exception as e:
                    logger.warning(f"Failed to decode {readme_name}: {e}")
                    
        logger.warning(f"No README found in {repo_name}")
        return None


class RepositoryFilter:
    """Filter repositories by glob patterns."""
    
    @staticmethod
    def matches_patterns(repo_name: str, patterns: List[str], case_insensitive: bool = False) -> bool:
        """
        Check if repository name matches any of the patterns.
        
        Args:
            repo_name: Repository name
            patterns: List of glob patterns
            case_insensitive: Whether to use case-insensitive matching
            
        Returns:
            True if matches any pattern
        """
        for pattern in patterns:
            if case_insensitive:
                if fnmatch.fnmatch(repo_name.lower(), pattern.lower()):
                    return True
            else:
                if fnmatch.fnmatch(repo_name, pattern):
                    return True
        return False
    
    @staticmethod
    def filter_repositories(repos: List[Dict], patterns: List[str], case_insensitive: bool = False) -> List[Dict]:
        """
        Filter repositories by patterns.
        
        Args:
            repos: List of repository dictionaries
            patterns: List of glob patterns
            case_insensitive: Whether to use case-insensitive matching
            
        Returns:
            Filtered list of repositories
        """
        filtered = []
        for repo in repos:
            if RepositoryFilter.matches_patterns(repo["name"], patterns, case_insensitive):
                filtered.append(repo)
        return filtered


class ReadmeCombiner:
    """Combine multiple README files into one."""
    
    @staticmethod
    def generate_toc(repos: List[Dict]) -> str:
        """
        Generate table of contents.
        
        Args:
            repos: List of repository dictionaries
            
        Returns:
            Table of contents markdown
        """
        toc = "## Table of Contents\n\n"
        for repo in repos:
            repo_name = repo["name"]
            toc += f"- [{repo_name}](#{repo_name})\n"
        return toc + "\n"
    
    @staticmethod
    def generate_combined_readme(org: str, repos: List[Dict], readme_contents: Dict[str, str]) -> str:
        """
        Generate combined README.
        
        Args:
            org: Organization name
            repos: List of repository dictionaries
            readme_contents: Dictionary mapping repo names to README content
            
        Returns:
            Combined README markdown
        """
        output = f"# Combined README - {org}\n\n"
        output += f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        # Add table of contents
        output += ReadmeCombiner.generate_toc(repos)
        output += "---\n\n"
        
        # Add each repository's README
        for repo in repos:
            repo_name = repo["name"]
            output += f"## {repo_name}\n\n"
            
            # Add repository metadata
            if repo.get("description"):
                output += f"**Description**: {repo['description']}\n\n"
            
            output += f"**Repository**: {repo['html_url']}\n\n"
            
            if repo.get("topics"):
                topics = ", ".join(repo["topics"])
                output += f"**Topics**: {topics}\n\n"
            
            # Add README content
            if repo_name in readme_contents:
                output += "### README Content\n\n"
                output += readme_contents[repo_name]
            else:
                output += "*No README found*\n"
            
            output += "\n\n---\n\n"
        
        return output


@click.command()
@click.option("--org", required=True, help="GitHub organization name")
@click.option("--patterns", multiple=True, required=True, help="Glob patterns to match repository names")
@click.option("--output", default="combined-README.md", help="Output file path")
@click.option("--token", default=None, help="GitHub API token (defaults to GITHUB_TOKEN env var)")
@click.option("--stdout", is_flag=True, help="Output to stdout instead of file")
@click.option("--case-insensitive", is_flag=True, help="Use case-insensitive pattern matching")
def main(org: str, patterns: Tuple[str], output: str, token: Optional[str], stdout: bool, case_insensitive: bool):
    """
    Generate a combined README from repositories matching glob patterns.
    
    Example:
        python generate_combined_readme.py --org BPMSoftwareSolutions --patterns "renderx-*" --output combined-README.md
    """
    # Get token from parameter or environment
    if not token:
        token = os.getenv("GITHUB_TOKEN")
    
    if not token:
        logger.error("GitHub token not provided. Set GITHUB_TOKEN env var or use --token")
        sys.exit(1)
    
    logger.info(f"Fetching repositories from {org} matching patterns: {patterns}")
    
    # Initialize API client
    client = GitHubAPIClient(token, org)
    
    # Get all repositories
    all_repos = client.get_repositories()
    logger.info(f"Found {len(all_repos)} total repositories")
    
    # Filter by patterns
    filtered_repos = RepositoryFilter.filter_repositories(all_repos, list(patterns), case_insensitive)
    logger.info(f"Found {len(filtered_repos)} repositories matching patterns")
    
    if not filtered_repos:
        logger.warning("No repositories matched the patterns")
        sys.exit(0)
    
    # Fetch README files
    logger.info("Fetching README files...")
    readme_contents = {}
    for repo in filtered_repos:
        readme = client.get_readme(repo["name"])
        if readme:
            readme_contents[repo["name"]] = readme
    
    # Generate combined README
    logger.info("Generating combined README...")
    combined = ReadmeCombiner.generate_combined_readme(org, filtered_repos, readme_contents)
    
    # Output
    if stdout:
        print(combined)
    else:
        with open(output, "w", encoding="utf-8") as f:
            f.write(combined)
        logger.info(f"Combined README written to {output}")


if __name__ == "__main__":
    main()

