# Package Externalization Guide

This guide explains how to externalize packages from the monorepo to independent GitHub repositories using the automated workflow.

## Overview

The externalization process creates a new GitHub repository and copies your package content with all necessary configuration for independent publishing to npm.

## Prerequisites

### Required Secrets

The following secrets must be configured in your repository settings:

1. **`GITHUB_TOKEN`** (automatically provided by GitHub Actions)
   - Used to create repositories and set secrets
   - No manual configuration needed

2. **`NPM_TOKEN`** (must be manually configured)
   - Required for npm publishing in the new repository
   - Get your token from: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Add it to repository secrets: Settings → Secrets and variables → Actions → New repository secret

### Token Permissions

The `GITHUB_TOKEN` needs the following permissions:
- `repo` - Full control of repositories
- `workflow` - Update GitHub Action workflows

For organization repositories, ensure the token has organization access.

## Using the GitHub Actions Workflow

### Method 1: Via GitHub UI (Recommended)

1. Go to your repository on GitHub
2. Click on **Actions** tab
3. Select **Externalize Package** workflow from the left sidebar
4. Click **Run workflow** button
5. Fill in the required parameters:
   - **Package path**: `packages/svg-editor`
   - **New repository name**: `tiny-svg-editor`
   - **Visibility**: `public` or `private`
   - **NPM package name** (optional): `tiny-svg-editor` or `@bpm/tiny-svg-editor`
   - **Dry run**: Check this to preview without making changes
6. Click **Run workflow**

### Method 2: Via GitHub CLI

```bash
gh workflow run externalize-package.yml \
  -f package_path=packages/svg-editor \
  -f new_repo_name=tiny-svg-editor \
  -f visibility=public \
  -f scoped_name=tiny-svg-editor \
  -f dry_run=false
```

### Method 3: Via API

```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/actions/workflows/externalize-package.yml/dispatches \
  -d '{
    "ref": "main",
    "inputs": {
      "package_path": "packages/svg-editor",
      "new_repo_name": "tiny-svg-editor",
      "visibility": "public",
      "scoped_name": "tiny-svg-editor",
      "dry_run": "false"
    }
  }'
```

## Workflow Parameters

### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `package_path` | Path to the package in the monorepo | `packages/svg-editor` |
| `new_repo_name` | Name for the new repository | `tiny-svg-editor` |
| `visibility` | Repository visibility (`public` or `private`) | `public` |

### Optional Parameters

| Parameter | Description | Example | Default |
|-----------|-------------|---------|---------|
| `scoped_name` | NPM package name (if different from repo name) | `@bpm/tiny-svg-editor` | Same as `new_repo_name` |
| `dry_run` | Preview changes without creating repository | `true` | `false` |

## What the Workflow Does

1. **Validates** the package exists and has a valid `package.json`
2. **Authenticates** with GitHub using the provided token
3. **Creates** a new GitHub repository (if it doesn't exist)
4. **Copies** all package files to the new repository
5. **Generates** `.github/workflows/release.yml` for automated npm publishing
6. **Updates** `package.json` with:
   - Repository URL
   - Publish configuration
   - Release script
7. **Creates** a `README.md` if one doesn't exist
8. **Sets** `NPM_TOKEN` secret on the new repository
9. **Pushes** all changes to the new repository
10. **Reports** results in the workflow summary

## Example: Externalizing svg-editor

### Dry Run (Preview)

First, run a dry run to see what will happen:

```bash
# Via GitHub UI
Actions → Externalize Package → Run workflow
- package_path: packages/svg-editor
- new_repo_name: tiny-svg-editor
- visibility: public
- scoped_name: tiny-svg-editor
- dry_run: ✓ (checked)
```

Review the output to ensure everything looks correct.

### Actual Externalization

Once you're satisfied with the dry run:

```bash
# Via GitHub UI
Actions → Externalize Package → Run workflow
- package_path: packages/svg-editor
- new_repo_name: tiny-svg-editor
- visibility: public
- scoped_name: tiny-svg-editor
- dry_run: ☐ (unchecked)
```

### Verify the New Repository

After the workflow completes:

1. Visit: `https://github.com/YOUR_ORG/tiny-svg-editor`
2. Check that all files are present
3. Verify `.github/workflows/release.yml` exists
4. Confirm `package.json` has correct repository URL
5. Check that `NPM_TOKEN` secret is set (Settings → Secrets)

## Publishing Releases

Once the repository is created, you can publish releases:

```bash
# Clone the new repository
git clone https://github.com/YOUR_ORG/tiny-svg-editor.git
cd tiny-svg-editor

# Make any final adjustments
# ...

# Create and push a release
npm version patch  # or minor, major
git push --follow-tags
```

The GitHub Actions workflow will automatically:
- Run tests (if present)
- Build the package (if build script exists)
- Publish to npm with provenance

## Troubleshooting

### Error: "Package path does not exist"

**Cause**: The specified package path is incorrect or doesn't exist.

**Solution**: Verify the path is correct relative to the repository root:
```bash
ls -la packages/svg-editor  # Should show package contents
```

### Error: "No package.json found"

**Cause**: The package directory doesn't contain a `package.json` file.

**Solution**: Ensure your package has a valid `package.json`:
```bash
cat packages/svg-editor/package.json
```

### Error: "GitHub CLI authentication failed"

**Cause**: The `GITHUB_TOKEN` doesn't have sufficient permissions.

**Solution**: 
1. Check workflow permissions: Settings → Actions → General → Workflow permissions
2. Ensure "Read and write permissions" is selected
3. Re-run the workflow

### Error: "Failed to set NPM_TOKEN secret"

**Cause**: The `NPM_TOKEN` secret is not configured in the source repository.

**Solution**:
1. Get your npm token: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Add to repository: Settings → Secrets and variables → Actions → New repository secret
3. Name: `NPM_TOKEN`
4. Value: Your npm token

**Note**: You can also set the secret manually in the new repository after creation.

### Warning: "NPM_TOKEN not found"

**Cause**: The `NPM_TOKEN` secret is not set.

**Impact**: The new repository won't be able to publish to npm automatically.

**Solution**: Manually set the secret in the new repository:
```bash
gh secret set NPM_TOKEN -R YOUR_ORG/tiny-svg-editor --body "YOUR_NPM_TOKEN"
```

## Advanced Usage

### Custom Package Names

If you want the npm package name to differ from the repository name:

```bash
# Repository: tiny-svg-editor
# NPM Package: @bpm/tiny-svg-editor

Actions → Externalize Package → Run workflow
- package_path: packages/svg-editor
- new_repo_name: tiny-svg-editor
- visibility: public
- scoped_name: @bpm/tiny-svg-editor  # ← Custom npm name
```

### Private Repositories

For private packages:

```bash
Actions → Externalize Package → Run workflow
- package_path: packages/internal-utils
- new_repo_name: internal-utils
- visibility: private  # ← Private repository
- scoped_name: @bpm/internal-utils
```

**Note**: Private npm packages require a paid npm account.

### Batch Externalization

To externalize multiple packages, run the workflow multiple times with different parameters, or create a script:

```bash
#!/bin/bash
packages=("svg-editor" "dom-utils" "event-bus")

for pkg in "${packages[@]}"; do
  gh workflow run externalize-package.yml \
    -f package_path="packages/$pkg" \
    -f new_repo_name="$pkg" \
    -f visibility=public \
    -f scoped_name="$pkg"
  
  # Wait a bit between runs to avoid rate limits
  sleep 5
done
```

## Best Practices

1. **Always run a dry run first** to preview changes
2. **Verify package.json** is complete before externalizing
3. **Ensure tests pass** in the monorepo before externalizing
4. **Document the package** with a good README
5. **Set up NPM_TOKEN** before externalizing for seamless publishing
6. **Use semantic versioning** for releases
7. **Keep a changelog** in the new repository

## See Also

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)

