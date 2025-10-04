# Testing the Externalization Workflow

This guide walks you through testing the package externalization workflow end-to-end.

## Prerequisites Setup

### 1. Configure NPM_TOKEN Secret

Before running the workflow, you need to set up the NPM_TOKEN secret:

1. **Get your npm token**:
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token" → "Classic Token"
   - Select "Automation" type
   - Copy the token

2. **Add to GitHub repository**:
   - Go to your repository: https://github.com/BPMSoftwareSolutions/package-builder
   - Click **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click **Add secret**

### 2. Verify Workflow Permissions

Ensure the workflow has permission to create repositories:

1. Go to **Settings** → **Actions** → **General**
2. Scroll to **Workflow permissions**
3. Select **Read and write permissions**
4. Check **Allow GitHub Actions to create and approve pull requests**
5. Click **Save**

## Test Plan

### Test 1: Dry Run (Preview Mode)

This test verifies the workflow without making any actual changes.

**Steps**:

1. Go to https://github.com/BPMSoftwareSolutions/package-builder/actions
2. Click on **Externalize Package** workflow (left sidebar)
3. Click **Run workflow** (right side)
4. Fill in the form:
   - **Use workflow from**: `feature/llm-driven-pipeline` (or `main` after merge)
   - **Package path**: `packages/svg-editor`
   - **New repository name**: `tiny-svg-editor`
   - **Visibility**: `public`
   - **NPM package name**: `tiny-svg-editor`
   - **Dry run**: ✓ **Check this box**
5. Click **Run workflow**

**Expected Results**:
- ✅ Workflow completes successfully
- ✅ Shows what would be done without creating repository
- ✅ Summary shows "This was a DRY RUN"
- ✅ No new repository is created

**Verification**:
```bash
# Verify no repository was created
gh repo view BPMSoftwareSolutions/tiny-svg-editor
# Should return: "repository not found"
```

### Test 2: Actual Externalization

This test creates the actual repository.

**Steps**:

1. Go to https://github.com/BPMSoftwareSolutions/package-builder/actions
2. Click on **Externalize Package** workflow
3. Click **Run workflow**
4. Fill in the form:
   - **Use workflow from**: `feature/llm-driven-pipeline` (or `main` after merge)
   - **Package path**: `packages/svg-editor`
   - **New repository name**: `tiny-svg-editor`
   - **Visibility**: `public`
   - **NPM package name**: `tiny-svg-editor`
   - **Dry run**: ☐ **Uncheck this box**
5. Click **Run workflow**

**Expected Results**:
- ✅ Workflow completes successfully
- ✅ New repository created: https://github.com/BPMSoftwareSolutions/tiny-svg-editor
- ✅ All files copied from `packages/svg-editor`
- ✅ `.github/workflows/release.yml` present
- ✅ `package.json` updated with repository URL
- ✅ `NPM_TOKEN` secret set on new repository
- ✅ Summary shows repository URL and next steps

**Verification**:

1. **Check repository exists**:
   ```bash
   gh repo view BPMSoftwareSolutions/tiny-svg-editor
   ```

2. **Verify files are present**:
   - Visit: https://github.com/BPMSoftwareSolutions/tiny-svg-editor
   - Check for:
     - `src/index.ts`
     - `test/index.test.ts`
     - `package.json`
     - `README.md`
     - `.github/workflows/release.yml`

3. **Check package.json**:
   ```bash
   # Clone and inspect
   git clone https://github.com/BPMSoftwareSolutions/tiny-svg-editor.git
   cd tiny-svg-editor
   cat package.json
   ```
   
   Should contain:
   - `"name": "tiny-svg-editor"`
   - `"repository": { "type": "git", "url": "https://github.com/BPMSoftwareSolutions/tiny-svg-editor.git" }`
   - `"publishConfig": { "access": "public", ... }`

4. **Verify NPM_TOKEN secret**:
   - Go to: https://github.com/BPMSoftwareSolutions/tiny-svg-editor/settings/secrets/actions
   - Should see `NPM_TOKEN` listed

5. **Check GitHub Actions workflow**:
   - Go to: https://github.com/BPMSoftwareSolutions/tiny-svg-editor/blob/main/.github/workflows/release.yml
   - Verify it contains npm publish steps

### Test 3: Publishing a Release

This test verifies the automated npm publishing works.

**Steps**:

1. **Clone the new repository**:
   ```bash
   git clone https://github.com/BPMSoftwareSolutions/tiny-svg-editor.git
   cd tiny-svg-editor
   ```

2. **Install dependencies and test**:
   ```bash
   npm install
   npm test
   npm run build
   ```

3. **Create a release**:
   ```bash
   npm version patch
   git push --follow-tags
   ```

4. **Monitor the workflow**:
   - Go to: https://github.com/BPMSoftwareSolutions/tiny-svg-editor/actions
   - Watch the "release" workflow run
   - Should complete successfully

5. **Verify npm package**:
   - Wait a few minutes for npm to index
   - Visit: https://www.npmjs.com/package/tiny-svg-editor
   - Should show the published package

**Expected Results**:
- ✅ Tag created (e.g., `v0.1.1`)
- ✅ GitHub Actions workflow triggered
- ✅ Tests pass
- ✅ Build succeeds
- ✅ Package published to npm
- ✅ Package visible on npmjs.com

### Test 4: Installing the Published Package

This test verifies the package can be installed and used.

**Steps**:

1. **Create a test project**:
   ```bash
   mkdir test-tiny-svg-editor
   cd test-tiny-svg-editor
   npm init -y
   ```

2. **Install the package**:
   ```bash
   npm install tiny-svg-editor
   ```

3. **Test the import**:
   ```javascript
   // test.js
   import { setAttrs, translate } from 'tiny-svg-editor';
   console.log('Functions imported:', typeof setAttrs, typeof translate);
   ```

4. **Run the test**:
   ```bash
   node test.js
   ```

**Expected Results**:
- ✅ Package installs without errors
- ✅ Functions can be imported
- ✅ TypeScript types are available

## Troubleshooting

### Issue: "GITHUB_TOKEN doesn't have permission"

**Solution**:
1. Go to Settings → Actions → General → Workflow permissions
2. Select "Read and write permissions"
3. Save and re-run workflow

### Issue: "NPM_TOKEN secret not found"

**Solution**:
1. Verify secret is set in source repository
2. Check secret name is exactly `NPM_TOKEN` (case-sensitive)
3. Re-run workflow after adding secret

### Issue: "Package path does not exist"

**Solution**:
1. Verify the package path is correct: `packages/svg-editor`
2. Check the branch has the package
3. Ensure you're running from the correct branch

### Issue: "Failed to create repository"

**Possible causes**:
1. Repository already exists
2. Insufficient permissions
3. Organization restrictions

**Solution**:
1. Check if repository exists: `gh repo view OWNER/REPO`
2. If exists, delete it or use a different name
3. Verify you have permission to create repositories in the organization

### Issue: "npm publish failed"

**Possible causes**:
1. Package name already taken on npm
2. NPM_TOKEN invalid or expired
3. Package version already published

**Solution**:
1. Check package availability: https://www.npmjs.com/package/PACKAGE_NAME
2. Use a scoped name: `@your-org/package-name`
3. Verify NPM_TOKEN is valid
4. Bump version and try again

## Cleanup (Optional)

If you want to clean up after testing:

### Delete the test repository

```bash
gh repo delete BPMSoftwareSolutions/tiny-svg-editor --yes
```

### Unpublish from npm (within 72 hours)

```bash
npm unpublish tiny-svg-editor --force
```

**Note**: npm unpublish is only allowed within 72 hours of publishing and if no other packages depend on it.

## Success Criteria

The externalization workflow is successful if:

- ✅ Dry run completes without errors
- ✅ Repository is created with all files
- ✅ GitHub Actions workflow is present
- ✅ NPM_TOKEN secret is configured
- ✅ Release workflow publishes to npm
- ✅ Published package can be installed and used

## Next Steps

After successful testing:

1. **Merge the PR** to main branch
2. **Document the process** for your team
3. **Externalize other packages** as needed
4. **Set up branch protection** on externalized repositories
5. **Configure npm provenance** for supply chain security

## Questions or Issues?

If you encounter any issues during testing:

1. Check the workflow logs for detailed error messages
2. Review [docs/EXTERNALIZATION.md](EXTERNALIZATION.md) for detailed documentation
3. Verify all prerequisites are met
4. Check GitHub Actions permissions
5. Ensure secrets are properly configured

