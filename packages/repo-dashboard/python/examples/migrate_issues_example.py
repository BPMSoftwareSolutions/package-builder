#!/usr/bin/env python3
"""
Example: Migrate issues from RenderX repositories to renderx-mono-repo

This example demonstrates how to use the issue migration scripts.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path to import issue_migrator
sys.path.insert(0, str(Path(__file__).parent.parent))

from issue_migrator import migrate_issues
from migrate_all_issues import BatchMigrator


def example_1_single_repo_dry_run():
    """Example 1: Dry run migration from a single repository."""
    print("\n" + "="*60)
    print("Example 1: Single Repository Dry Run")
    print("="*60)
    
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("❌ GITHUB_TOKEN environment variable not set")
        return
    
    summary = migrate_issues(
        source_repo="BPMSoftwareSolutions/renderx-plugins-sdk",
        target_repo="BPMSoftwareSolutions/renderx-mono-repo",
        token=token,
        dry_run=True,
        limit=5
    )
    
    print(f"\n✅ Dry run complete:")
    print(f"   Migrated: {summary['migrated']}")
    print(f"   Failed: {summary['failed']}")


def example_2_single_repo_migration():
    """Example 2: Actual migration from a single repository."""
    print("\n" + "="*60)
    print("Example 2: Single Repository Migration")
    print("="*60)
    
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("❌ GITHUB_TOKEN environment variable not set")
        return
    
    summary = migrate_issues(
        source_repo="BPMSoftwareSolutions/renderx-plugins-canvas",
        target_repo="BPMSoftwareSolutions/renderx-mono-repo",
        token=token,
        dry_run=False,
        limit=10
    )
    
    print(f"\n✅ Migration complete:")
    print(f"   Migrated: {summary['migrated']}")
    print(f"   Failed: {summary['failed']}")
    
    # Print first few migration logs
    if summary['log']:
        print(f"\n📋 First 3 migrations:")
        for log_entry in summary['log'][:3]:
            if log_entry['status'] == 'success':
                print(f"   ✅ {log_entry['title']} → #{log_entry['new_number']}")
            else:
                print(f"   ❌ {log_entry['title']}")


def example_3_batch_migration_dry_run():
    """Example 3: Batch migration dry run from multiple repositories."""
    print("\n" + "="*60)
    print("Example 3: Batch Migration Dry Run")
    print("="*60)
    
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("❌ GITHUB_TOKEN environment variable not set")
        return
    
    migrator = BatchMigrator(token)
    
    report = migrator.migrate_from_repos(
        source_repos=[
            "BPMSoftwareSolutions/renderx-plugins-sdk",
            "BPMSoftwareSolutions/renderx-plugins-canvas",
        ],
        dry_run=True,
        limit_per_repo=5
    )
    
    migrator.print_summary(report)


def example_4_batch_migration_with_skip():
    """Example 4: Batch migration skipping specific repositories."""
    print("\n" + "="*60)
    print("Example 4: Batch Migration with Skip")
    print("="*60)
    
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("❌ GITHUB_TOKEN environment variable not set")
        return
    
    migrator = BatchMigrator(token)
    
    report = migrator.migrate_from_repos(
        source_repos=[
            "BPMSoftwareSolutions/renderx-plugins-sdk",
            "BPMSoftwareSolutions/renderx-manifest-tools",
            "BPMSoftwareSolutions/musical-conductor",
        ],
        dry_run=True,
        limit_per_repo=5,
        skip_repos=["BPMSoftwareSolutions/renderx-manifest-tools"]
    )
    
    migrator.print_summary(report)


def example_5_batch_migration_full():
    """Example 5: Full batch migration from all RenderX repositories."""
    print("\n" + "="*60)
    print("Example 5: Full Batch Migration (All Repos)")
    print("="*60)
    
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("❌ GITHUB_TOKEN environment variable not set")
        return
    
    migrator = BatchMigrator(token)
    
    # This would migrate from all 8 RenderX repositories
    # For this example, we'll use dry_run=True
    report = migrator.migrate_from_repos(
        source_repos=[
            "BPMSoftwareSolutions/renderx-plugins-sdk",
            "BPMSoftwareSolutions/renderx-manifest-tools",
            "BPMSoftwareSolutions/musical-conductor",
            "BPMSoftwareSolutions/renderx-plugins-canvas",
            "BPMSoftwareSolutions/renderx-plugins-components",
            "BPMSoftwareSolutions/renderx-plugins-control-panel",
            "BPMSoftwareSolutions/renderx-plugins-header",
            "BPMSoftwareSolutions/renderx-plugins-library",
        ],
        dry_run=True,
        limit_per_repo=10
    )
    
    migrator.print_summary(report)
    
    # Save report
    report_file = migrator.save_report("full_migration_report.json")
    print(f"\n📄 Report saved to: {report_file}")


def main():
    """Run examples."""
    print("\n🚀 GitHub Issue Migration Examples")
    print("="*60)
    
    # Check if GITHUB_TOKEN is set
    if not os.getenv("GITHUB_TOKEN"):
        print("\n⚠️  GITHUB_TOKEN environment variable not set")
        print("   Set it with: export GITHUB_TOKEN='your_token_here'")
        print("\n   Examples will still run but will fail at API calls")
    
    # Run examples
    try:
        # Uncomment the examples you want to run
        
        # Example 1: Dry run (safe to run)
        example_1_single_repo_dry_run()
        
        # Example 2: Single repo migration (requires valid token)
        # example_2_single_repo_migration()
        
        # Example 3: Batch dry run (safe to run)
        example_3_batch_migration_dry_run()
        
        # Example 4: Batch with skip (safe to run)
        example_4_batch_migration_with_skip()
        
        # Example 5: Full batch migration (requires valid token)
        # example_5_batch_migration_full()
        
        print("\n✅ Examples completed!")
    
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

