# Issue Migration Scripts

Migrate GitHub issues from distributed RenderX plugin repositories to the centralized `renderx-mono-repo`.

## Overview

This package provides Python scripts to consolidate issues from 8 RenderX plugin repositories into a single repository. The migration preserves all issue metadata and includes source repository attribution.

## Files

- **`issue_migrator.py`** - Core migration library with classes for extracting, transforming, and migrating issues
- **`migrate_all_issues.py`** - Batch migration script for migrating from multiple repositories
- **`test_issue_migrator.py`** - Comprehensive unit tests (14 tests, 90% coverage)
- **`ISSUE_MIGRATION_GUIDE.md`** - Detailed usage guide
- **`examples/migrate_issues_example.py`** - Usage examples

## Quick Start

### 1. Set GitHub Token

```bash
export GITHUB_TOKEN="your_github_token_here"
```

### 2. Dry Run (Recommended)

Test the migration without creating any issues:

```bash
cd packages/repo-dashboard/python
python migrate_all_issues.py --dry-run
```

### 3. Full Migration

Migrate all issues from all source repositories:

```bash
python migrate_all_issues.py
```

## Architecture

### Core Classes

#### `GitHubAPIClient`
- Handles GitHub API communication
- Implements retry logic and rate limiting awareness
- Manages authentication and headers

#### `IssueExtractor`
- Fetches issues from source repositories
- Handles pagination
- Supports filtering by state (open/closed/all)

#### `IssueTransformer`
- Transforms issues with source repository attribution
- Preserves labels, assignees, milestones
- Adds source repo label and attribution footer

#### `IssueMigrator`
- Creates issues in target repository
- Tracks migration progress
- Generates migration reports

### Migration Flow

```
Source Repo Issues
       ↓
IssueExtractor (fetch)
       ↓
IssueTransformer (add attribution)
       ↓
IssueMigrator (create in target)
       ↓
Migration Report
```

## Features

✅ **Full Metadata Preservation**
- Title, description, labels, assignees
- State (open/closed)
- Milestones
- Created/updated timestamps (in attribution)

✅ **Source Attribution**
- Link to original issue
- Original author mention
- Original creation date
- Source repository label

✅ **Error Handling**
- Graceful API error handling
- Retry logic for transient failures
- Detailed error logging
- Migration report with status

✅ **Dry Run Mode**
- Test migration without creating issues
- Verify configuration
- Preview results

✅ **Batch Processing**
- Migrate from multiple repositories
- Progress tracking
- Summary reporting
- Skip specific repositories

## Usage Examples

### Command Line

```bash
# Dry run
python migrate_all_issues.py --dry-run

# Migrate all issues
python migrate_all_issues.py

# Limit issues per repo
python migrate_all_issues.py --limit 50

# Skip specific repos
python migrate_all_issues.py --skip renderx-plugins-sdk

# Migrate specific repos only
python migrate_all_issues.py \
  --repos BPMSoftwareSolutions/renderx-plugins-sdk \
  --repos BPMSoftwareSolutions/renderx-plugins-canvas

# Custom target repo
python migrate_all_issues.py --target MyOrg/my-repo

# Save report to file
python migrate_all_issues.py --report my_report.json
```

### Python API

```python
from issue_migrator import migrate_issues

# Single repository migration
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

```python
from migrate_all_issues import BatchMigrator

# Batch migration
migrator = BatchMigrator(token="your_token")

report = migrator.migrate_from_repos(
    source_repos=[
        "BPMSoftwareSolutions/renderx-plugins-sdk",
        "BPMSoftwareSolutions/renderx-plugins-canvas",
    ],
    dry_run=False,
    limit_per_repo=50
)

migrator.print_summary(report)
migrator.save_report("report.json")
```

## Testing

Run unit tests:

```bash
pytest test_issue_migrator.py -v
```

Run with coverage:

```bash
pytest test_issue_migrator.py --cov=issue_migrator --cov-report=term-missing
```

Current coverage: **90%**

## Source Repositories

Default source repositories:
1. renderx-plugins-sdk
2. renderx-manifest-tools
3. musical-conductor
4. renderx-plugins-canvas
5. renderx-plugins-components
6. renderx-plugins-control-panel
7. renderx-plugins-header
8. renderx-plugins-library

Target repository: `renderx-mono-repo`

## Performance

- **Average time per issue**: ~0.5-1 second
- **Rate limit**: 5,000 requests/hour (GitHub API)
- **Typical migration time**: 2-5 minutes for all 8 repos

## Troubleshooting

### Rate Limiting
- Wait for rate limit window to reset (typically 1 hour)
- Use `--limit` to reduce issues per repository
- Migrate repositories in batches

### Authentication Errors
- Verify GitHub token is valid
- Check token has `repo` scope
- Ensure token hasn't expired

### Migration Failures
- Check generated report for specific errors
- Verify target repository exists and is accessible
- Ensure write permissions to target repo

## Related Issues

- #159 - Externalize renderx-mono-repo to separate GitHub repository
- #160 - Migrate issues from distributed RenderX repos to renderx-mono-repo

## Documentation

- **ISSUE_MIGRATION_GUIDE.md** - Comprehensive usage guide with examples
- **examples/migrate_issues_example.py** - Python API usage examples

## Dependencies

- `requests>=2.28.0` - HTTP library
- `click>=8.0` - CLI framework
- `pytest>=7.0.0` - Testing framework
- `pytest-cov>=4.0.0` - Coverage reporting

All dependencies are already in `requirements.txt`.

