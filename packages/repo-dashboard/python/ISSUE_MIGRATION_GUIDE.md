# Issue Migration Guide

Migrate issues from distributed RenderX plugin repositories to the centralized `renderx-mono-repo`.

## Overview

This guide explains how to use the issue migration scripts to consolidate issues from 8 RenderX plugin repositories into a single repository. The migration preserves all issue metadata and includes source repository attribution.

## Prerequisites

1. **GitHub Token**: Create a personal access token with `repo` scope
   - Go to https://github.com/settings/tokens
   - Create new token with `repo` scope
   - Copy the token

2. **Python Environment**: Python 3.8+
   ```bash
   cd packages/repo-dashboard
   pip install -r python/requirements.txt
   ```

## Quick Start

### Dry Run (Recommended First Step)

Test the migration without creating any issues:

```bash
cd packages/repo-dashboard/python
export GITHUB_TOKEN="your_token_here"
python migrate_all_issues.py --dry-run
```

### Full Migration

Migrate all issues from all source repositories:

```bash
python migrate_all_issues.py --token $GITHUB_TOKEN
```

## Usage

### Basic Commands

```bash
# Dry run - test without creating issues
python migrate_all_issues.py --token $GITHUB_TOKEN --dry-run

# Migrate all issues
python migrate_all_issues.py --token $GITHUB_TOKEN

# Migrate with custom limit per repo
python migrate_all_issues.py --token $GITHUB_TOKEN --limit 50

# Skip specific repositories
python migrate_all_issues.py --token $GITHUB_TOKEN --skip renderx-plugins-sdk --skip renderx-manifest-tools

# Migrate from specific repositories only
python migrate_all_issues.py --token $GITHUB_TOKEN \
  --repos BPMSoftwareSolutions/renderx-plugins-sdk \
  --repos BPMSoftwareSolutions/renderx-plugins-canvas

# Custom target repository
python migrate_all_issues.py --token $GITHUB_TOKEN --target MyOrg/my-repo

# Save report to custom file
python migrate_all_issues.py --token $GITHUB_TOKEN --report my_report.json
```

## Source Repositories

The following repositories are migrated by default:

1. `renderx-plugins-sdk`
2. `renderx-manifest-tools`
3. `musical-conductor`
4. `renderx-plugins-canvas`
5. `renderx-plugins-components`
6. `renderx-plugins-control-panel`
7. `renderx-plugins-header`
8. `renderx-plugins-library`

## What Gets Migrated

### Issue Metadata
- ✅ Title
- ✅ Description/Body
- ✅ Labels
- ✅ Assignees
- ✅ State (open/closed)
- ✅ Milestones
- ✅ Created/Updated timestamps (in attribution)

### Source Attribution
Each migrated issue includes:
- Link to original issue
- Original author mention
- Original creation date
- Source repository label (e.g., `migrated-from-renderx-plugins-sdk`)

### What's NOT Migrated
- ❌ Pull Requests (skipped automatically)
- ❌ Issue comments (Phase 2 enhancement)
- ❌ Issue reactions (Phase 2 enhancement)
- ❌ Project associations

## Example Output

### Dry Run Output
```
🚀 Starting batch migration to BPMSoftwareSolutions/renderx-mono-repo
📊 Source repositories: 8
🔧 Dry run: True
📦 [1/8] Processing BPMSoftwareSolutions/renderx-plugins-sdk...
📥 Fetching issues from BPMSoftwareSolutions/renderx-plugins-sdk (state=all)
✅ Fetched 15 issues from BPMSoftwareSolutions/renderx-plugins-sdk
🔄 [DRY RUN] Would create issue: Add support for custom themes
✅ BPMSoftwareSolutions/renderx-plugins-sdk: 15 migrated, 0 failed

============================================================
📊 MIGRATION SUMMARY
============================================================
Target Repository: BPMSoftwareSolutions/renderx-mono-repo
Total Migrated:    120
Total Failed:      0
Success Rate:      100.0%
Duration:          45.3s
============================================================
```

### Migration Report

A JSON report is automatically generated:

```json
{
  "BPMSoftwareSolutions/renderx-plugins-sdk": {
    "migrated": 15,
    "failed": 0,
    "total": 15,
    "timestamp": "2025-10-21T20:00:00",
    "log": [
      {
        "status": "success",
        "title": "Add support for custom themes",
        "original_repo": "BPMSoftwareSolutions/renderx-plugins-sdk",
        "original_number": 42,
        "new_number": 100,
        "new_url": "https://github.com/BPMSoftwareSolutions/renderx-mono-repo/issues/100"
      }
    ]
  }
}
```

## Advanced Usage

### Using the Python API Directly

```python
from issue_migrator import migrate_issues

# Migrate from single repository
summary = migrate_issues(
    source_repo="BPMSoftwareSolutions/renderx-plugins-sdk",
    target_repo="BPMSoftwareSolutions/renderx-mono-repo",
    token="your_token",
    dry_run=False,
    limit=100
)

print(f"Migrated: {summary['migrated']}")
print(f"Failed: {summary['failed']}")
```

### Batch Migration with Custom Configuration

```python
from migrate_all_issues import BatchMigrator

migrator = BatchMigrator(
    token="your_token",
    target_repo="BPMSoftwareSolutions/renderx-mono-repo"
)

report = migrator.migrate_from_repos(
    source_repos=[
        "BPMSoftwareSolutions/renderx-plugins-sdk",
        "BPMSoftwareSolutions/renderx-plugins-canvas",
    ],
    dry_run=False,
    limit_per_repo=50
)

migrator.print_summary(report)
migrator.save_report("custom_report.json")
```

## Troubleshooting

### Rate Limiting
If you hit GitHub API rate limits:
- Wait for the rate limit window to reset (typically 1 hour)
- Use `--limit` to reduce issues per repository
- Migrate repositories in batches

### Authentication Errors
- Verify your GitHub token is valid
- Check token has `repo` scope
- Ensure token hasn't expired

### Migration Failures
- Check the generated report for specific errors
- Verify target repository exists and is accessible
- Ensure you have write permissions to target repo

## Testing

Run unit tests:

```bash
cd packages/repo-dashboard/python
pytest test_issue_migrator.py -v
pytest test_issue_migrator.py --cov=issue_migrator
```

## Performance

- **Average time per issue**: ~0.5-1 second
- **Rate limit**: 5,000 requests/hour (GitHub API limit)
- **Batch size**: Configurable via `--limit` flag
- **Typical migration time**: 2-5 minutes for all 8 repos

## Related Issues

- #159 - Externalize renderx-mono-repo to separate GitHub repository
- #160 - Migrate issues from distributed RenderX repos to renderx-mono-repo

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the generated migration report
3. Check GitHub API status: https://www.githubstatus.com/

