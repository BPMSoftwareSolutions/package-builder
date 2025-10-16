# Getting Started with repo-dashboard

## What is repo-dashboard?

A repository and package management dashboard with CLI and library API for viewing and operating on repository, issues, CI, and package publishing status across your organization and local monorepo packages.

## Quick Start (5 minutes)

### 1. Create a GitHub Token

Visit: https://github.com/settings/tokens/new?scopes=repo,workflow

Select these scopes:
- ✓ `repo` - Full control of private repositories
- ✓ `workflow` - Full control of GitHub Actions workflows

Copy the token (you won't see it again!).

### 2. Set the Token in PowerShell

```powershell
$env:GITHUB_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 3. Try a Command

```powershell
# List local packages
node packages/repo-dashboard/dist/bin/cli.js packages

# Get repository status (requires token)
node packages/repo-dashboard/dist/bin/cli.js status --org BPMSoftwareSolutions

# Get issues for a repo
node packages/repo-dashboard/dist/bin/cli.js issues --repo BPMSoftwareSolutions/package-builder
```

## Available Commands

### `status` - Repository Health Summary

```powershell
node packages/repo-dashboard/dist/bin/cli.js status --org <org> [--json]
```

Shows:
- Number of open issues per repo
- Number of open PRs per repo
- Number of stale PRs (>30 days)
- Last GitHub Actions workflow status

### `issues` - Issues and PRs Report

```powershell
node packages/repo-dashboard/dist/bin/cli.js issues --repo <owner/repo> [--filter stale] [--json]
```

Shows:
- All open issues and PRs
- Filter for stale items (>30 days without update)
- Author and creation date

### `packages` - Local Package Discovery

```powershell
node packages/repo-dashboard/dist/bin/cli.js packages [--list-ready] [--json]
```

Shows:
- All packages in `packages/` directory
- Build readiness (has `dist/` directory)
- Pack readiness (has `.artifacts/` directory)
- Filter for ready packages only

### `pack` - Package Packing

```powershell
node packages/repo-dashboard/dist/bin/cli.js pack --package <path> [--dry-run]
```

Packs a specific package with optional dry-run mode.

## Using as a Library

```typescript
import {
  listRepos,
  listIssues,
  getWorkflowStatus,
  findLocalPackages,
  getPackageReadiness
} from '@bpm/repo-dashboard';

// List repositories
const repos = await listRepos({ org: 'BPMSoftwareSolutions', limit: 50 });

// Get issues
const issues = await listIssues({ repo: 'BPMSoftwareSolutions/package-builder' });

// Check workflow status
const workflow = await getWorkflowStatus({ repo: 'BPMSoftwareSolutions/package-builder' });

// Find local packages
const packages = await findLocalPackages({ basePath: './packages' });

// Get readiness stats
const readiness = await getPackageReadiness({ basePath: './packages' });
console.log(`${readiness.ready}/${readiness.total} packages ready`);
```

## Troubleshooting

### "GITHUB_TOKEN or GH_TOKEN environment variable is required"

You need to set your GitHub token:

```powershell
$env:GITHUB_TOKEN = "your_token_here"
```

See [TOKEN_SETUP.md](./TOKEN_SETUP.md) for detailed instructions.

### "Bad credentials" or "Unauthorized"

Your token is invalid or expired. Create a new one at:
https://github.com/settings/tokens/new?scopes=repo,workflow

### Token not persisting between sessions

Set it permanently (requires admin):

```powershell
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "your_token_here", "User")
```

Then restart PowerShell.

## Help

Get help for any command:

```powershell
node packages/repo-dashboard/dist/bin/cli.js <command> --help
```

Or run the diagnostic script:

```powershell
powershell -ExecutionPolicy Bypass -File packages/repo-dashboard/diagnose.ps1
```

## Next Steps

- Read [TOKEN_SETUP.md](./TOKEN_SETUP.md) for detailed token setup
- Check [README.md](./README.md) for full documentation
- See [examples](./README.md#examples) for more use cases

