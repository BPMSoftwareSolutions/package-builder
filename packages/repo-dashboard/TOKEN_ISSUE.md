# GitHub Token Issue - Investigation Results

## Summary

Your system has three GitHub tokens set in environment variables:
- `GH_PAT` - Invalid/Expired ❌
- `GitHubToken` - Invalid/Expired ❌
- `GITHUB_TOKEN` - Invalid/Expired ❌

All three tokens are returning "Bad credentials" (401 Unauthorized) when tested against the GitHub API.

## What Works Without a Token

The CLI has full functionality for local operations that don't require GitHub API access:

```powershell
# List all local packages
node packages/repo-dashboard/dist/bin/cli.js packages

# List only ready packages
node packages/repo-dashboard/dist/bin/cli.js packages --list-ready

# Get JSON output
node packages/repo-dashboard/dist/bin/cli.js packages --json
```

## What Requires a Valid Token

These commands need a valid GitHub token:

```powershell
# Repository status
node packages/repo-dashboard/dist/bin/cli.js status --org BPMSoftwareSolutions

# Issues and PRs
node packages/repo-dashboard/dist/bin/cli.js issues --repo BPMSoftwareSolutions/package-builder

# Workflow status
node packages/repo-dashboard/dist/bin/cli.js pack --package packages/repo-dashboard
```

## Solution: Create a New Token

1. Visit: https://github.com/settings/tokens/new?scopes=repo,workflow
2. Select scopes:
   - ✓ `repo` - Full control of private repositories
   - ✓ `workflow` - Full control of GitHub Actions workflows
3. Click "Generate token"
4. Copy the token immediately (you won't see it again!)
5. Set it in PowerShell:
   ```powershell
   $env:GITHUB_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

## Why the Old Tokens Are Invalid

Possible reasons:
1. **Expired** - GitHub tokens can expire
2. **Revoked** - Someone may have revoked them
3. **Insufficient scopes** - They may not have `repo` and `workflow` scopes
4. **Wrong format** - They may be in an unexpected format

## Testing a Token

To verify a token works before using it with repo-dashboard:

```powershell
$headers = @{
    "Authorization" = "token YOUR_TOKEN_HERE"
    "Accept" = "application/vnd.github.v3+json"
}
Invoke-WebRequest -Uri "https://api.github.com/user" -Headers $headers
```

If it works, you'll see your GitHub user info. If it fails with 401, the token is invalid.

## Next Steps

1. Create a new token at: https://github.com/settings/tokens/new?scopes=repo,workflow
2. Set it: `$env:GITHUB_TOKEN = "your_new_token"`
3. Test it: `node packages/repo-dashboard/dist/bin/cli.js status --org BPMSoftwareSolutions`

## For Now

You can still use repo-dashboard for local package management:

```powershell
# See all packages
node packages/repo-dashboard/dist/bin/cli.js packages

# See which are ready to publish
node packages/repo-dashboard/dist/bin/cli.js packages --list-ready
```

This is fully functional and doesn't require a GitHub token!

