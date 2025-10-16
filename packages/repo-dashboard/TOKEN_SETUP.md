# GitHub Token Setup for repo-dashboard

## Current Status

Your system has the following environment variables set:
- `GH_PAT` - ❌ Invalid/Expired
- `GitHubToken` - ❌ Invalid/Expired  
- `GITHUB_TOKEN` - ❌ Invalid/Expired

**You need to create a new GitHub token.**

## Step 1: Create a New GitHub Token

1. Visit: https://github.com/settings/tokens/new?scopes=repo,workflow
2. Or manually:
   - Go to https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Give it a name like "repo-dashboard"
   - Select these scopes:
     - ✓ `repo` - Full control of private repositories
     - ✓ `workflow` - Full control of GitHub Actions workflows
   - Click "Generate token"
   - **Copy the token immediately** (you won't see it again!)

## Step 2: Set the Token in PowerShell

### Option A: For Current Session Only

```powershell
$env:GITHUB_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Then test it:
```powershell
node packages/repo-dashboard/dist/bin/cli.js issues --repo BPMSoftwareSolutions/package-builder
```

### Option B: Permanent Setup (Requires Admin)

```powershell
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx", "User")
```

Then restart PowerShell and the token will be available automatically.

## Step 3: Verify the Token Works

Run the diagnostic script:
```powershell
powershell -ExecutionPolicy Bypass -File packages/repo-dashboard/diagnose.ps1
```

Or test directly:
```powershell
node packages/repo-dashboard/dist/bin/cli.js status --org BPMSoftwareSolutions
```

## Troubleshooting

### "Bad credentials" error
- Your token is invalid or expired
- Create a new token at: https://github.com/settings/tokens/new?scopes=repo,workflow

### "Unauthorized" error
- Your token doesn't have the required scopes
- Make sure you selected both `repo` and `workflow` scopes

### Token not being picked up
- Make sure you set it in the current PowerShell session
- Or set it permanently and restart PowerShell

## Alternative Token Names

The CLI checks for these environment variables (in order):
1. `GITHUB_TOKEN` (recommended)
2. `GH_TOKEN`
3. `GH_PAT`

You can use any of these names.

## Security Notes

- Never commit tokens to version control
- Tokens are like passwords - keep them secret
- If you accidentally expose a token, delete it immediately at https://github.com/settings/tokens
- Use fine-grained tokens when possible for better security

