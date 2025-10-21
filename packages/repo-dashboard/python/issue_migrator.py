"""
GitHub Issue Migrator

Migrates issues from one GitHub repository to another with full metadata preservation.
Supports issue extraction, transformation, and creation with source attribution.
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GitHubAPIClient:
    """GitHub API client with retry logic and rate limiting awareness."""
    
    def __init__(self, token: str, base_url: str = "https://api.github.com"):
        self.token = token
        self.base_url = base_url
        self.session = self._create_session()
        self.rate_limit_remaining = None
        self.rate_limit_reset = None
    
    def _create_session(self) -> requests.Session:
        """Create a requests session with retry strategy."""
        session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS", "POST"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        return session
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authentication."""
        return {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "issue-migrator"
        }
    
    def _update_rate_limit(self, response: requests.Response) -> None:
        """Update rate limit info from response headers."""
        self.rate_limit_remaining = int(response.headers.get('X-RateLimit-Remaining', 0))
        self.rate_limit_reset = int(response.headers.get('X-RateLimit-Reset', 0))
        
        if self.rate_limit_remaining < 10:
            logger.warning(f"⚠️ Rate limit low: {self.rate_limit_remaining} requests remaining")
    
    def get(self, endpoint: str) -> Dict[str, Any]:
        """Make a GET request to GitHub API."""
        url = f"{self.base_url}{endpoint}"
        response = self.session.get(url, headers=self._get_headers())
        self._update_rate_limit(response)
        response.raise_for_status()
        return response.json()
    
    def post(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Make a POST request to GitHub API."""
        url = f"{self.base_url}{endpoint}"
        response = self.session.post(url, headers=self._get_headers(), json=data)
        self._update_rate_limit(response)
        response.raise_for_status()
        return response.json()


class IssueExtractor:
    """Extracts issues from a GitHub repository."""
    
    def __init__(self, client: GitHubAPIClient):
        self.client = client
    
    def fetch_issues(self, repo: str, state: str = "all", limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch issues from a repository."""
        logger.info(f"📥 Fetching issues from {repo} (state={state})")
        
        issues = []
        page = 1
        per_page = min(limit, 100)
        
        while len(issues) < limit:
            endpoint = f"/repos/{repo}/issues?state={state}&per_page={per_page}&page={page}&sort=updated&direction=asc"
            
            try:
                data = self.client.get(endpoint)
                if not data:
                    break
                
                issues.extend(data)
                page += 1
                
                if len(data) < per_page:
                    break
            except requests.exceptions.RequestException as e:
                logger.error(f"❌ Error fetching issues from {repo}: {e}")
                break
        
        logger.info(f"✅ Fetched {len(issues)} issues from {repo}")
        return issues[:limit]


class IssueTransformer:
    """Transforms issues with source repository attribution."""
    
    @staticmethod
    def transform_issue(issue: Dict[str, Any], source_repo: str) -> Dict[str, str]:
        """Transform an issue with source attribution."""
        
        # Build the issue body with source attribution
        original_body = issue.get('body', '') or ''
        original_url = issue.get('html_url', '')
        original_author = issue.get('user', {}).get('login', 'unknown')
        created_at = issue.get('created_at', '')
        
        attribution = f"""
---
**Migrated from:** [{source_repo}]({original_url})
**Original Author:** @{original_author}
**Original Created:** {created_at}
"""
        
        new_body = f"{original_body}\n{attribution}"
        
        # Extract labels (excluding pull_request label)
        labels = [label['name'] for label in issue.get('labels', []) 
                 if label['name'] != 'pull_request']
        
        # Add source repo label
        labels.append(f"migrated-from-{source_repo.split('/')[-1]}")
        
        return {
            'title': issue.get('title', 'Untitled'),
            'body': new_body,
            'labels': labels,
            'state': issue.get('state', 'open'),
            'assignees': [assignee['login'] for assignee in issue.get('assignees', [])],
            'milestone': issue.get('milestone', {}).get('title') if issue.get('milestone') else None,
            'original_number': issue.get('number'),
            'original_repo': source_repo,
            'original_url': original_url,
        }


class IssueMigrator:
    """Migrates issues to a target repository."""
    
    def __init__(self, client: GitHubAPIClient):
        self.client = client
        self.migrated_count = 0
        self.failed_count = 0
        self.migration_log = []
    
    def migrate_issue(self, target_repo: str, transformed_issue: Dict[str, Any], dry_run: bool = False) -> bool:
        """Migrate a single issue to target repository."""
        
        if dry_run:
            logger.info(f"🔄 [DRY RUN] Would create issue: {transformed_issue['title']}")
            self.migration_log.append({
                'status': 'dry_run',
                'title': transformed_issue['title'],
                'original_repo': transformed_issue['original_repo'],
                'original_number': transformed_issue['original_number'],
            })
            return True
        
        try:
            # Prepare issue data
            issue_data = {
                'title': transformed_issue['title'],
                'body': transformed_issue['body'],
                'labels': transformed_issue['labels'],
            }
            
            # Add assignees if any
            if transformed_issue['assignees']:
                issue_data['assignees'] = transformed_issue['assignees']
            
            # Create the issue
            endpoint = f"/repos/{target_repo}/issues"
            result = self.client.post(endpoint, issue_data)
            
            self.migrated_count += 1
            new_issue_number = result.get('number')
            
            logger.info(f"✅ Migrated {transformed_issue['original_repo']}#{transformed_issue['original_number']} → {target_repo}#{new_issue_number}")
            
            self.migration_log.append({
                'status': 'success',
                'title': transformed_issue['title'],
                'original_repo': transformed_issue['original_repo'],
                'original_number': transformed_issue['original_number'],
                'new_number': new_issue_number,
                'new_url': result.get('html_url'),
            })
            
            return True
        
        except requests.exceptions.RequestException as e:
            self.failed_count += 1
            logger.error(f"❌ Failed to migrate {transformed_issue['original_repo']}#{transformed_issue['original_number']}: {e}")
            
            self.migration_log.append({
                'status': 'failed',
                'title': transformed_issue['title'],
                'original_repo': transformed_issue['original_repo'],
                'original_number': transformed_issue['original_number'],
                'error': str(e),
            })
            
            return False
    
    def get_summary(self) -> Dict[str, Any]:
        """Get migration summary."""
        return {
            'migrated': self.migrated_count,
            'failed': self.failed_count,
            'total': self.migrated_count + self.failed_count,
            'timestamp': datetime.now().isoformat(),
            'log': self.migration_log,
        }


def migrate_issues(source_repo: str, target_repo: str, token: str, dry_run: bool = False, limit: int = 100) -> Dict[str, Any]:
    """
    Migrate issues from source repository to target repository.
    
    Args:
        source_repo: Source repository in format 'owner/repo'
        target_repo: Target repository in format 'owner/repo'
        token: GitHub API token
        dry_run: If True, don't actually create issues
        limit: Maximum number of issues to migrate
    
    Returns:
        Migration summary with results
    """
    
    logger.info(f"🚀 Starting issue migration from {source_repo} to {target_repo}")
    
    client = GitHubAPIClient(token)
    extractor = IssueExtractor(client)
    migrator = IssueMigrator(client)
    
    # Fetch issues from source
    issues = extractor.fetch_issues(source_repo, state="all", limit=limit)
    
    if not issues:
        logger.warning(f"⚠️ No issues found in {source_repo}")
        return migrator.get_summary()
    
    # Migrate each issue
    for issue in issues:
        # Skip pull requests
        if issue.get('pull_request'):
            logger.info(f"⏭️ Skipping PR: {issue.get('title')}")
            continue
        
        # Transform and migrate
        transformed = IssueTransformer.transform_issue(issue, source_repo)
        migrator.migrate_issue(target_repo, transformed, dry_run=dry_run)
    
    summary = migrator.get_summary()
    logger.info(f"✅ Migration complete: {summary['migrated']} migrated, {summary['failed']} failed")
    
    return summary

