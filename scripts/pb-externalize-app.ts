#!/usr/bin/env node
/**
 * pb-externalize-app.ts
 * Externalizes an application from the monorepo to a new GitHub repository (application mode)
 * Similar to pb-externalize-copy.ts but skips npm packaging setup
 */

import { execSync } from "node:child_process";
import {
  existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, cpSync
} from "node:fs";
import { join, resolve } from "node:path";

type Args = {
  pkgPath: string;     // e.g., packages/python-skill-builder
  newRepo: string;     // e.g., python-skill-builder
  org: string;         // e.g., your-github-org
  visibility?: "public" | "private";
  dryRun?: boolean;
};

function sh(cmd: string, opts: {cwd?: string, captureOutput?: boolean} = {}) {
  console.log(`$ ${cmd}`);
  try {
    if (opts.captureOutput) {
      return execSync(cmd, { encoding: 'utf8', ...opts });
    }
    return execSync(cmd, { stdio: "inherit", ...opts });
  } catch (error: any) {
    if (error.stderr) {
      console.error(`Error output: ${error.stderr.toString()}`);
    }
    if (error.stdout) {
      console.error(`Command output: ${error.stdout.toString()}`);
    }
    throw error;
  }
}

function parseArgs(): Args {
  const kv = Object.fromEntries(process.argv.slice(2).map(s => {
    const [k, ...rest] = s.split("="); return [k, rest.join("=")];
  }));
  if (!kv.pkgPath || !kv.newRepo || !kv.org) {
    console.error(
      "Usage: node scripts/pb-externalize-app.ts " +
      "pkgPath=packages/python-skill-builder newRepo=python-skill-builder org=your-org " +
      "[visibility=public|private] [dryRun=true]"
    );
    process.exit(1);
  }
  return {
    pkgPath: kv.pkgPath,
    newRepo: kv.newRepo,
    org: kv.org,
    visibility: (kv.visibility as any) ?? "public",
    dryRun: kv.dryRun === "true",
  };
}

function requireCleanPkgPath(pkgPath: string) {
  if (!existsSync(pkgPath)) {
    console.error(`Package path not found: ${pkgPath}`);
    process.exit(1);
  }
}

function checkGitHubCLI() {
  try {
    sh("gh --version");
  } catch (error) {
    console.error("❌ GitHub CLI (gh) is not installed or not in PATH");
    console.error("Please install it from: https://cli.github.com/");
    process.exit(1);
  }

  try {
    sh("gh auth status");
  } catch (error) {
    console.error("❌ GitHub CLI is not authenticated");
    console.error("Please run: gh auth login");
    process.exit(1);
  }

  // Check token scopes
  console.log("\n🔍 Checking token scopes...");
  try {
    // First try to get scopes from gh auth status
    const authStatus = sh("gh auth status 2>&1", { captureOutput: true }).toString();
    const authScopeLine = authStatus.split('\n').find(line => line.includes('Token scopes:'));
    
    if (authScopeLine) {
      const scopes = authScopeLine.substring(authScopeLine.indexOf(':') + 1).trim().replace(/'/g, '');
      console.log(`   Token scopes: ${scopes}`);
      
      if (scopes.includes('repo')) {
        console.log("   ✅ Token has required 'repo' scope");
        return; // Exit early if we found the scope
      }
    }
    
    // Fallback to API call
    const response = sh("gh api /user -i", { captureOutput: true }).toString();
    const scopeLine = response.split('\n').find(line => line.toLowerCase().startsWith('x-oauth-scopes:'));
    if (scopeLine) {
      // Extract the actual scopes value after the header name
      const scopes = scopeLine.substring(scopeLine.indexOf(':') + 1).trim();
      console.log(`   Token scopes: ${scopes || '(none)'}`);

      if (!scopes || scopes === '' || !scopes.includes('repo')) {
        console.error("\n❌ ERROR: Token does not have 'repo' scope!");
        console.error("   The token needs 'repo' scope to create repositories.");
        console.error("   Current scopes: " + (scopes || '(none)'));
        console.error("\n   To fix:");
        console.error("   1. Create a new Personal Access Token:");
        console.error("      https://github.com/settings/tokens/new?scopes=repo,workflow");
        console.error("   2. Select 'repo' and 'workflow' scopes");
        console.error("   3. In GitHub Actions, add it as GH_PAT secret:");
        console.error("      Settings → Secrets and variables → Actions → New repository secret");
        console.error("   4. Name: GH_PAT");
        console.error("   5. Value: Your new token");
        process.exit(1);
      }
      console.log("   ✅ Token has required 'repo' scope");
    } else {
      console.log("   ⚠️  Could not find X-OAuth-Scopes header");
    }
  } catch (err) {
    console.log("   ⚠️  Could not verify token scopes (this may be okay)");
  }
}

function patchPackageJsonForApp(dir: string, repoUrl: string) {
  const file = join(dir, "package.json");
  const pkg = JSON.parse(readFileSync(file, "utf8"));

  // Update repository URL but don't add publishing config
  pkg.repository = { type: "git", url: repoUrl };

  writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}

function main() {
  const { pkgPath, newRepo, org, visibility, dryRun } = parseArgs();
  
  console.log("🚀 Starting application externalization process...");
  console.log(`   Package: ${pkgPath}`);
  console.log(`   New repo: ${org}/${newRepo}`);
  console.log(`   Visibility: ${visibility}`);
  console.log(`   Dry run: ${dryRun ? 'YES' : 'NO'}`);
  console.log("   Note: This will externalize as an application (no npm packaging setup)");
  console.log("");

  // Validate prerequisites
  if (!dryRun) {
    checkGitHubCLI();
  }
  requireCleanPkgPath(pkgPath);

  // Use authenticated URL with token for cloning and pushing
  const ghToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
  const authenticatedRemote = ghToken
    ? `https://x-access-token:${ghToken}@github.com/${org}/${newRepo}.git`
    : `https://github.com/${org}/${newRepo}.git`;
  // Clean URL without token for package.json
  const publicRemote = `https://github.com/${org}/${newRepo}.git`;
  const tmp = `.tmp-${newRepo}`;

  // 1) Create the GitHub repo (idempotent)
  try {
    sh(`gh repo view ${org}/${newRepo}`, { captureOutput: true });
    console.log(`✅ Repo exists: ${org}/${newRepo}`);
  } catch {
    if (dryRun) {
      console.log(`[dryRun] Would create repo ${org}/${newRepo} (${visibility})`);
    } else {
      console.log(`📦 Creating repository ${org}/${newRepo}...`);

      // Determine if org is the current user or an actual organization
      let isCurrentUser = false;
      let currentUser = '';
      try {
        currentUser = sh(`gh api user -q .login`, { captureOutput: true }).toString().trim();
        console.log(`🔍 Current authenticated user: ${currentUser}`);
        isCurrentUser = (currentUser === org);
        console.log(`🔍 Is current user: ${isCurrentUser}`);
      } catch (err) {
        console.log(`⚠️  Could not determine current user, will try org/repo format`);
      }

      try {
        // For user accounts, use just the repo name
        // For organizations, use org/repo format
        const repoArg = isCurrentUser ? newRepo : `${org}/${newRepo}`;
        console.log(`🔍 Using repo argument: ${repoArg}`);
        sh(`gh repo create ${repoArg} --${visibility}`);
        console.log(`✅ Repository created successfully`);
      } catch (error: any) {
        console.error(`❌ Failed to create repository: ${org}/${newRepo}`);
        console.error(`Error: ${error.message}`);
        console.error(`\nPossible causes:`);
        console.error(`  1. GH_PAT/GITHUB_TOKEN doesn't have 'repo' scope`);
        console.error(`  2. You don't have permission to create repos in '${org}'`);
        console.error(`  3. Repository name already exists`);
        console.error(`  4. Organization '${org}' doesn't exist or is not accessible`);
        console.error(`  5. Token needs organization access (if ${org} is an org)`);
        console.error(`\nTo fix:`);
        console.error(`  - Verify token has 'repo' and 'workflow' scopes`);
        console.error(`  - For organizations: Enable SSO or grant organization access to token`);
        console.error(`  - Check Settings → Actions → General → Workflow permissions`);
        console.error(`  - Ensure 'Read and write permissions' is selected`);
        process.exit(1);
      }
    }
  }

  // 2) Fresh clone
  if (existsSync(tmp)) rmSync(tmp, { recursive: true, force: true });
  if (!dryRun) {
    sh(`git clone "${authenticatedRemote}" "${tmp}"`);
  } else {
    // Mask token in dry-run output
    const safeRemote = ghToken ? authenticatedRemote.replace(ghToken, '***') : authenticatedRemote;
    console.log(`[dryRun] Would clone ${safeRemote} to ${tmp}`);
    mkdirSync(tmp, { recursive: true });
  }

  // 3) Copy package content into new repo working tree
  const srcAbs = resolve(pkgPath);
  if (!dryRun) {
    cpSync(srcAbs, tmp, { recursive: true, force: true });
  } else {
    console.log(`[dryRun] Would copy ${srcAbs} to ${tmp}`);
  }

  // 4) Patch package.json for application (no publishing config)
  if (!dryRun) {
    patchPackageJsonForApp(tmp, publicRemote);
  } else {
    console.log(`[dryRun] Would patch package.json in ${tmp} (application mode)`);
  }

  // 5) Commit & push
  if (dryRun) {
    console.log("[dryRun] Skipping commit/push");
  } else {
    // Configure git user identity for the commit
    sh(`git -C "${tmp}" config user.name "github-actions[bot]"`);
    sh(`git -C "${tmp}" config user.email "github-actions[bot]@users.noreply.github.com"`);

    sh(`git -C "${tmp}" add .`);
    // allow empty commit to be no-op
    try {
      sh(`git -C "${tmp}" commit -m "chore: initial import from ${pkgPath}"`);
    } catch (err) {
      console.log("   ℹ️  No changes to commit (repository may already have content)");
    }
    sh(`git -C "${tmp}" push origin HEAD:main`);
  }

  // 6) Output machine-readable result for the LLM runner
  console.log(JSON.stringify({ repo: publicRemote, method: "app-copy", ok: true }));
  console.log("\n✅ Application externalization complete!");
  console.log(`   Repository: https://github.com/${org}/${newRepo}`);
  console.log(`   Next steps:`);
  console.log(`   1. Visit the repository to verify files`);
  console.log(`   2. Set up deployment workflows as needed`);
  console.log(`   3. Update any internal references to the new repository`);
}

main();