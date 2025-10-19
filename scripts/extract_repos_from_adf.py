#!/usr/bin/env python3
"""
Extract repositories from an Architecture Definition File (ADF).

This script reads an ADF JSON file and extracts all repositories defined in the containers.
It supports multiple ways repositories can be specified:
- repository: string (single repo)
- repository: object with owner/name
- repositories: array of strings or objects
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Set, Any


def extract_repos_from_adf(adf_path: str, default_org: str = "BPMSoftwareSolutions") -> Dict[str, Any]:
    """
    Extract repositories from an ADF file.
    
    Args:
        adf_path: Path to the ADF JSON file
        default_org: Default organization to use if not specified
        
    Returns:
        Dictionary with extracted repositories and metadata
    """
    
    # Load ADF file
    with open(adf_path, 'r') as f:
        adf = json.load(f)
    
    repos: Set[str] = set()
    repo_details: List[Dict[str, Any]] = []
    
    # Extract from top-level repository field
    if "repository" in adf:
        repo_name = adf["repository"]
        org = adf.get("organization", default_org)
        full_repo = f"{org}/{repo_name}"
        repos.add(full_repo)
        repo_details.append({
            "repo": full_repo,
            "source": "top-level",
            "organization": org,
            "name": repo_name
        })
    
    # Extract from containers
    containers = adf.get("c4Model", {}).get("containers", [])
    
    for container in containers:
        container_id = container.get("id", "unknown")
        container_name = container.get("name", "unknown")
        
        # Check for single repository field
        if "repository" in container:
            repo_value = container["repository"]
            
            if isinstance(repo_value, str):
                # Simple string: "repo-name" or "org/repo-name"
                if "/" in repo_value:
                    full_repo = repo_value
                else:
                    org = container.get("organization", default_org)
                    full_repo = f"{org}/{repo_value}"
                repos.add(full_repo)
                repo_details.append({
                    "repo": full_repo,
                    "source": f"container:{container_id}",
                    "container": container_name
                })
            
            elif isinstance(repo_value, dict):
                # Object with owner/name
                owner = repo_value.get("owner", default_org)
                name = repo_value.get("name")
                if name:
                    full_repo = f"{owner}/{name}"
                    repos.add(full_repo)
                    repo_details.append({
                        "repo": full_repo,
                        "source": f"container:{container_id}",
                        "container": container_name
                    })
        
        # Check for repositories array
        if "repositories" in container:
            repositories = container["repositories"]
            if isinstance(repositories, list):
                for repo_item in repositories:
                    if isinstance(repo_item, str):
                        if "/" in repo_item:
                            full_repo = repo_item
                        else:
                            org = container.get("organization", default_org)
                            full_repo = f"{org}/{repo_item}"
                        repos.add(full_repo)
                        repo_details.append({
                            "repo": full_repo,
                            "source": f"container:{container_id}",
                            "container": container_name
                        })
                    elif isinstance(repo_item, dict):
                        owner = repo_item.get("owner", default_org)
                        name = repo_item.get("name")
                        if name:
                            full_repo = f"{owner}/{name}"
                            repos.add(full_repo)
                            repo_details.append({
                                "repo": full_repo,
                                "source": f"container:{container_id}",
                                "container": container_name
                            })
    
    return {
        "adf_name": adf.get("name", "Unknown"),
        "adf_version": adf.get("version", "unknown"),
        "total_repos": len(repos),
        "repositories": sorted(list(repos)),
        "details": repo_details
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_repos_from_adf.py <adf_file> [default_org]")
        print("\nExample:")
        print("  python extract_repos_from_adf.py renderx-plugins-demo-adf.json BPMSoftwareSolutions")
        sys.exit(1)
    
    adf_path = sys.argv[1]
    default_org = sys.argv[2] if len(sys.argv) > 2 else "BPMSoftwareSolutions"
    
    if not Path(adf_path).exists():
        print(f"Error: File not found: {adf_path}")
        sys.exit(1)
    
    result = extract_repos_from_adf(adf_path, default_org)
    
    print(f"\n📋 ADF: {result['adf_name']} (v{result['adf_version']})")
    print(f"📦 Total Repositories: {result['total_repos']}")
    print("\n🔗 Repositories:")
    
    for repo in result['repositories']:
        print(f"  - {repo}")
    
    if result['total_repos'] == 0:
        print("\n⚠️  No repositories found in ADF!")
        print("\nTo add repositories to the ADF, add 'repository' or 'repositories' field to containers:")
        print("""
Example:
{
  "c4Model": {
    "containers": [
      {
        "id": "my-container",
        "name": "My Container",
        "repository": "BPMSoftwareSolutions/my-repo"
      }
    ]
  }
}
        """)
    
    print(f"\n✅ Extraction complete!")


if __name__ == "__main__":
    main()

