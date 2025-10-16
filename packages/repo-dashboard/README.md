# @bpm/repo-dashboard

A repository and package management dashboard with CLI and library API for viewing and operating on repository, issues, CI, and package publishing status across your org and local monorepo packages.

## Features

- 📊 **Repo listing & metadata** - View repositories for a given org or single repo
- 🐛 **Issues & PR summary** - Track open issues, stale PRs, and counts per repo
- ⚙️ **CI/workflow status** - Monitor GitHub Actions status for the last workflow run per repo
- 📦 **Local package discovery** - Find packages under `packages/` and report build/pack readiness
- 🖥️ **Lightweight CLI** - Simple commands for automation and human workflows
- 📚 **Library API** - Typed functions for programmatic use and integrations

## Installation

```bash
npm install @bpm/repo-dashboard
```

## Quick Start

### CLI Usage

```bash
# Show health summary for an organization
repo-dashboard status --org BPMSoftwareSolutions

# Report open issues and stale PRs
repo-dashboard issues --repo BPMSoftwareSolutions/package-builder --filter stale

# List packages ready for publishing
repo-dashboard packages --list-ready

# Pack a specific package (dry-run)
repo-dashboard pack --package packages/repo-dashboard --dry-run
```

### Library API

```typescript
import { listRepos, listIssues, getWorkflowStatus, findLocalPackages } from '@bpm/repo-dashboard';

// List repositories
const repos = await listRepos({ org: 'BPMSoftwareSolutions' });

// Get issues for a repo
const issues = await listIssues({ repo: 'BPMSoftwareSolutions/package-builder' });

// Check workflow status
const status = await getWorkflowStatus({ repo: 'BPMSoftwareSolutions/package-builder' });

// Find local packages
const packages = await findLocalPackages({ basePath: './packages' });
```

## Configuration

### Environment Variables

- `GITHUB_TOKEN` or `GH_TOKEN` - GitHub API token (required for GitHub operations)
- `NPM_TOKEN` - NPM token (optional, for publishing operations)

### Token Setup

#### Step 1: Create a GitHub Token

You can use either **classic tokens** or **fine-grained tokens**:

**Option A: Classic Token (Recommended for simplicity)**
- Visit: https://github.com/settings/tokens/new?scopes=repo,workflow
- Select scopes:
  - `repo` - Full control of private repositories
  - `workflow` - Full control of GitHub Actions workflows

**Option B: Fine-Grained Token (Recommended for security)**
- Visit: https://github.com/settings/tokens?type=beta
- Click "Generate new token" → "Generate new fine-grained token"
- Set permissions:
  - Repository permissions: `Contents: read`, `Metadata: read`, `Pull requests: read`
  - Organization permissions: `Members: read`

#### Step 2: Set the Environment Variable

**PowerShell (Windows):**
```powershell
$env:GITHUB_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Bash/Zsh (macOS/Linux):**
```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Permanent Setup (PowerShell - requires admin):**
```powershell
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx", "User")
```

Then restart your terminal for the change to take effect.

**Alternative:** Use `GH_TOKEN` instead of `GITHUB_TOKEN`:
```powershell
$env:GH_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Note:** The CLI automatically detects token format:
- Classic tokens (starting with `ghp_`) use `token` authentication
- Fine-grained tokens (starting with `github_pat_`) use `Bearer` authentication

## CLI Commands

### `repo-dashboard status`

Show health summary for repositories.

```bash
repo-dashboard status --org BPMSoftwareSolutions [--json]
```

Options:
- `--org <org>` - Organization name (required)
- `--json` - Output as JSON

### `repo-dashboard issues`

Report open issues and stale PRs.

```bash
repo-dashboard issues --repo <owner/name> [--filter stale] [--json]
```

Options:
- `--repo <owner/name>` - Repository (required)
- `--filter stale` - Filter for stale PRs (>30 days)
- `--json` - Output as JSON

### `repo-dashboard packages`

Find and report on local packages.

```bash
repo-dashboard packages [--list-ready] [--json]
```

Options:
- `--list-ready` - Only show packages ready for publishing
- `--json` - Output as JSON

### `repo-dashboard pack`

Pack a specific package.

```bash
repo-dashboard pack --package <path> [--dry-run]
```

Options:
- `--package <path>` - Package path (required)
- `--dry-run` - Preview changes without executing

## Library API

### `listRepos(options)`

List repositories for an organization.

```typescript
interface ListReposOptions {
  org: string;
  topic?: string;
  limit?: number;
}

const repos = await listRepos({ org: 'BPMSoftwareSolutions', limit: 50 });
```

### `listIssues(options)`

List issues and PRs for a repository.

```typescript
interface ListIssuesOptions {
  repo: string;
  state?: 'open' | 'closed' | 'all';
  limit?: number;
}

const issues = await listIssues({ repo: 'BPMSoftwareSolutions/package-builder' });
```

### `getWorkflowStatus(options)`

Get the status of the last workflow run.

```typescript
interface WorkflowStatusOptions {
  repo: string;
  branch?: string;
}

const status = await getWorkflowStatus({ repo: 'BPMSoftwareSolutions/package-builder' });
```

### `findLocalPackages(options)`

Find local packages and report readiness.

```typescript
interface FindPackagesOptions {
  basePath?: string;
  includePrivate?: boolean;
}

const packages = await findLocalPackages({ basePath: './packages' });
```

## Testing

```bash
npm test
npm run test:watch
```

## Examples

### Example 1: Monitor Organization Health

```bash
# Get a quick health summary of all repos in an organization
repo-dashboard status --org BPMSoftwareSolutions

# Output:
# 📊 Repository Status for BPMSoftwareSolutions
#
# Repository                    Issues    PRs       Stale     Last Workflow
# ────────────────────────────────────────────────────────────────────────
# package-builder               5         2         1         success
# svg-editor                    0         1         0         success
# repo-dashboard                2         0         0         failure
```

### Example 2: Find Stale PRs

```bash
# Find PRs that haven't been updated in 30+ days
repo-dashboard issues --repo BPMSoftwareSolutions/package-builder --filter stale

# Output:
# 🐛 Issues for BPMSoftwareSolutions/package-builder
#
# Number    Type      Title                                             Author
# ────────────────────────────────────────────────────────────────────────
# #42       PR        WIP: Add new feature                              user1
# #38       PR        Refactor authentication                           user2
```

### Example 3: List Ready Packages

```bash
# Find packages ready for publishing
repo-dashboard packages --list-ready

# Output:
# 📦 Local Packages
#
# Total: 5 | Ready: 3
#
# Package                       Version         Build     Pack Ready
# ────────────────────────────────────────────────────────────────────
# @bpm/svg-editor               0.1.0           ✓         ✓
# @bpm/repo-dashboard           0.1.0           ✓         ✓
# @bpm/utils                    1.2.3           ✓         ✓
```

### Example 4: JSON Output for Automation

```bash
# Get JSON output for scripting/automation
repo-dashboard status --org BPMSoftwareSolutions --json

# Output:
# [
#   {
#     "name": "package-builder",
#     "openIssues": 5,
#     "openPRs": 2,
#     "stalePRs": 1,
#     "lastWorkflow": "success"
#   },
#   ...
# ]
```

### Example 5: Programmatic Usage

```typescript
import {
  listRepos,
  listIssues,
  getWorkflowStatus,
  findLocalPackages,
  getPackageReadiness
} from '@bpm/repo-dashboard';

// List all repos in an organization
const repos = await listRepos({ org: 'BPMSoftwareSolutions', limit: 50 });
console.log(`Found ${repos.length} repositories`);

// Get issues for a specific repo
const issues = await listIssues({ repo: 'BPMSoftwareSolutions/package-builder' });
const openIssues = issues.filter(i => i.state === 'open' && !i.isPullRequest);
console.log(`${openIssues.length} open issues`);

// Check CI status
const workflow = await getWorkflowStatus({ repo: 'BPMSoftwareSolutions/package-builder' });
if (workflow?.conclusion === 'success') {
  console.log('✅ Last workflow run succeeded');
} else {
  console.log('❌ Last workflow run failed');
}

// Find local packages
const packages = await findLocalPackages({ basePath: './packages' });
console.log(`Found ${packages.length} local packages`);

// Get readiness statistics
const readiness = await getPackageReadiness({ basePath: './packages' });
console.log(`${readiness.ready}/${readiness.total} packages ready for publishing`);
```

## Troubleshooting

### "GITHUB_TOKEN or GH_TOKEN environment variable is required"

Make sure you have set your GitHub token:

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Or use the `GH_TOKEN` environment variable:

```bash
export GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### "GitHub API error: 401 Unauthorized"

Your token may have expired or been revoked. Create a new token at:
https://github.com/settings/tokens/new?scopes=repo,workflow

### "GitHub API error: 403 Forbidden"

Your token may not have the required scopes. Make sure your token has:
- `repo` - Full control of private repositories
- `workflow` - Full control of GitHub Actions workflows

## Contributing

Contributions are welcome! Please ensure:

1. All tests pass: `npm test`
2. Code is properly formatted
3. New features include tests
4. Documentation is updated

## License

MIT

