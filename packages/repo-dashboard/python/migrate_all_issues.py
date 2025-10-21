"""
Batch Issue Migration Script

Migrates issues from multiple RenderX plugin repositories to renderx-mono-repo.
Provides configuration, progress tracking, and comprehensive reporting.
"""

import os
import json
import logging
import sys
from typing import Dict, List, Any
from datetime import datetime
import click
from issue_migrator import migrate_issues

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# RenderX repositories to migrate from
RENDERX_SOURCE_REPOS = [
    "BPMSoftwareSolutions/renderx-plugins-sdk",
    "BPMSoftwareSolutions/renderx-manifest-tools",
    "BPMSoftwareSolutions/musical-conductor",
    "BPMSoftwareSolutions/renderx-plugins-canvas",
    "BPMSoftwareSolutions/renderx-plugins-components",
    "BPMSoftwareSolutions/renderx-plugins-control-panel",
    "BPMSoftwareSolutions/renderx-plugins-header",
    "BPMSoftwareSolutions/renderx-plugins-library",
]

# Target repository
TARGET_REPO = "BPMSoftwareSolutions/renderx-mono-repo"


class BatchMigrator:
    """Manages batch migration of issues from multiple repositories."""
    
    def __init__(self, token: str, target_repo: str = TARGET_REPO):
        self.token = token
        self.target_repo = target_repo
        self.results = {}
        self.start_time = None
        self.end_time = None
    
    def migrate_from_repos(self, source_repos: List[str], dry_run: bool = False, 
                          limit_per_repo: int = 100, skip_repos: List[str] = None) -> Dict[str, Any]:
        """
        Migrate issues from multiple repositories.
        
        Args:
            source_repos: List of source repositories
            dry_run: If True, don't actually create issues
            limit_per_repo: Maximum issues per repository
            skip_repos: List of repos to skip
        
        Returns:
            Comprehensive migration report
        """
        
        self.start_time = datetime.now()
        skip_repos = skip_repos or []
        
        logger.info(f"🚀 Starting batch migration to {self.target_repo}")
        logger.info(f"📊 Source repositories: {len(source_repos)}")
        logger.info(f"🔧 Dry run: {dry_run}")
        
        total_migrated = 0
        total_failed = 0
        
        for i, source_repo in enumerate(source_repos, 1):
            if source_repo in skip_repos:
                logger.info(f"⏭️ [{i}/{len(source_repos)}] Skipping {source_repo}")
                continue
            
            logger.info(f"📦 [{i}/{len(source_repos)}] Processing {source_repo}...")
            
            try:
                summary = migrate_issues(
                    source_repo=source_repo,
                    target_repo=self.target_repo,
                    token=self.token,
                    dry_run=dry_run,
                    limit=limit_per_repo
                )
                
                self.results[source_repo] = summary
                total_migrated += summary['migrated']
                total_failed += summary['failed']
                
                logger.info(f"✅ {source_repo}: {summary['migrated']} migrated, {summary['failed']} failed")
            
            except Exception as e:
                logger.error(f"❌ Error processing {source_repo}: {e}")
                self.results[source_repo] = {
                    'error': str(e),
                    'migrated': 0,
                    'failed': 0,
                }
        
        self.end_time = datetime.now()
        
        return self._generate_report(total_migrated, total_failed)
    
    def _generate_report(self, total_migrated: int, total_failed: int) -> Dict[str, Any]:
        """Generate comprehensive migration report."""
        
        duration = (self.end_time - self.start_time).total_seconds()
        
        report = {
            'summary': {
                'total_migrated': total_migrated,
                'total_failed': total_failed,
                'total_processed': total_migrated + total_failed,
                'success_rate': f"{(total_migrated / (total_migrated + total_failed) * 100):.1f}%" if (total_migrated + total_failed) > 0 else "N/A",
                'duration_seconds': duration,
                'start_time': self.start_time.isoformat(),
                'end_time': self.end_time.isoformat(),
            },
            'target_repo': self.target_repo,
            'repositories': self.results,
        }
        
        return report
    
    def save_report(self, filename: str = None) -> str:
        """Save migration report to file."""
        
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"migration_report_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        logger.info(f"📄 Report saved to {filename}")
        return filename
    
    def print_summary(self, report: Dict[str, Any]) -> None:
        """Print migration summary to console."""
        
        summary = report['summary']
        
        print("\n" + "="*60)
        print("📊 MIGRATION SUMMARY")
        print("="*60)
        print(f"Target Repository: {report['target_repo']}")
        print(f"Total Migrated:    {summary['total_migrated']}")
        print(f"Total Failed:      {summary['total_failed']}")
        print(f"Success Rate:      {summary['success_rate']}")
        print(f"Duration:          {summary['duration_seconds']:.1f}s")
        print("="*60)
        
        print("\n📦 Repository Details:")
        for repo, result in report['repositories'].items():
            if 'error' in result:
                print(f"  ❌ {repo}: ERROR - {result['error']}")
            else:
                print(f"  ✅ {repo}: {result['migrated']} migrated, {result['failed']} failed")
        
        print("\n" + "="*60 + "\n")


@click.command()
@click.option('--token', envvar='GITHUB_TOKEN', required=True, help='GitHub API token')
@click.option('--target', default=TARGET_REPO, help='Target repository')
@click.option('--dry-run', is_flag=True, help='Perform dry run without creating issues')
@click.option('--limit', default=100, help='Maximum issues per repository')
@click.option('--skip', multiple=True, help='Repositories to skip')
@click.option('--report', default=None, help='Report filename')
@click.option('--repos', multiple=True, help='Specific repos to migrate (default: all)')
def main(token: str, target: str, dry_run: bool, limit: int, skip: tuple, report: str, repos: tuple):
    """
    Migrate issues from RenderX repositories to renderx-mono-repo.
    
    Example:
        python migrate_all_issues.py --token $GITHUB_TOKEN --dry-run
        python migrate_all_issues.py --token $GITHUB_TOKEN --limit 50
        python migrate_all_issues.py --token $GITHUB_TOKEN --skip renderx-plugins-sdk
    """
    
    try:
        # Determine which repos to migrate
        source_repos = list(repos) if repos else RENDERX_SOURCE_REPOS
        skip_list = list(skip) if skip else []
        
        # Create migrator and run migration
        migrator = BatchMigrator(token, target)
        report_data = migrator.migrate_from_repos(
            source_repos=source_repos,
            dry_run=dry_run,
            limit_per_repo=limit,
            skip_repos=skip_list
        )
        
        # Print summary
        migrator.print_summary(report_data)
        
        # Save report
        report_file = migrator.save_report(report)
        
        # Exit with appropriate code
        if report_data['summary']['total_failed'] > 0:
            sys.exit(1)
        else:
            sys.exit(0)
    
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()

