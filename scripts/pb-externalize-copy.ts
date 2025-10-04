#!/usr/bin/env node
/**
 * pb-externalize-copy.ts
 * Externalizes a package from the monorepo to a new GitHub repository (copy mode)
 */

import { execSync } from "node:child_process";
import {
  existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, cpSync
} from "node:fs";
import { join, resolve } from "node:path";

type Args = {
  pkgPath: string;     // e.g., packages/svg-editor
  newRepo: string;     // e.g., tiny-svg-editor or @bpm/tiny-svg-editor
  org: string;         // e.g., your-github-org
  visibility?: "public" | "private";
  scopeNameInPkgJson?: string; // optional override for package.json "name"
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
      "Usage: node scripts/pb-externalize-copy.ts " +
      "pkgPath=packages/svg-editor newRepo=tiny-svg-editor org=your-org " +
      "[visibility=public|private] [scopeNameInPkgJson=@bpm/tiny-svg-editor] [dryRun=true]"
    );
    process.exit(1);
  }
  return {
    pkgPath: kv.pkgPath,
    newRepo: kv.newRepo,
    org: kv.org,
    visibility: (kv.visibility as any) ?? "public",
    scopeNameInPkgJson: kv.scopeNameInPkgJson,
    dryRun: kv.dryRun === "true",
  };
}

function requireCleanPkgPath(pkgPath: string) {
  if (!existsSync(pkgPath)) {
    console.error(`Package path not found: ${pkgPath}`);
    process.exit(1);
  }
  const pkgJson = join(pkgPath, "package.json");
  if (!existsSync(pkgJson)) {
    console.error(`Missing package.json in ${pkgPath}`);
    process.exit(1);
  }
}

function ensureReleaseWorkflow(dir: string) {
  const wfDir = join(dir, ".github/workflows");
  mkdirSync(wfDir, { recursive: true });
  const yml = `name: release
on:
  push:
    tags:
      - "v*.*.*"
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          registry-url: "https://registry.npmjs.org"
      - run: npm ci
      - run: npm test --if-present
      - run: npm run build --if-present
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
`;
  writeFileSync(join(wfDir, "release.yml"), yml, "utf8");
}

function patchPackageJson(dir: string, nameOverride: string | undefined, repoUrl: string) {
  const file = join(dir, "package.json");
  const pkg = JSON.parse(readFileSync(file, "utf8"));

  // Prefer explicit override; else keep existing name
  if (nameOverride) pkg.name = nameOverride;

  // Ensure ESM + exports hygiene (idempotent)
  pkg.type ??= "module";
  pkg.sideEffects ??= false;
  pkg.repository = { type: "git", url: repoUrl };
  pkg.publishConfig ??= { access: "public", registry: "https://registry.npmjs.org" };
  pkg.scripts ??= {};
  pkg.scripts.release ??= "npm version patch && git push --follow-tags";

  writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}

function writeReadmeIfMissing(dir: string, pkgName: string) {
  const file = join(dir, "README.md");
  if (existsSync(file)) return;
  const md = `# ${pkgName}

Tiny SVG DOM manipulation utilities (translate, set attributes, etc.).

\`\`\`bash
npm i ${pkgName}
\`\`\`

\`\`\`ts
import { setAttrs, translate } from "${pkgName}";
setAttrs("#rect1", { fill: "tomato", width: 24 });
translate("#rect1", 10, 8);
\`\`\`

- Built with TypeScript & ESM.
- Publishes on tag push (\`vX.Y.Z\`).
`;
  writeFileSync(file, md, "utf8");
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
}

function main() {
  const { pkgPath, newRepo, org, visibility, scopeNameInPkgJson, dryRun } = parseArgs();
  
  console.log("🚀 Starting externalization process...");
  console.log(`   Package: ${pkgPath}`);
  console.log(`   New repo: ${org}/${newRepo}`);
  console.log(`   Visibility: ${visibility}`);
  console.log(`   Dry run: ${dryRun ? 'YES' : 'NO'}`);
  console.log("");

  // Validate prerequisites
  if (!dryRun) {
    checkGitHubCLI();
  }
  requireCleanPkgPath(pkgPath);

  const remote = `https://github.com/${org}/${newRepo}.git`;
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
      try {
        const currentUser = sh(`gh api user --jq .login`, { captureOutput: true }).toString().trim();
        isCurrentUser = (currentUser === org);
      } catch {
        // If we can't determine, assume it's not the current user
      }

      try {
        // For user accounts, use just the repo name
        // For organizations, use org/repo format
        const repoArg = isCurrentUser ? newRepo : `${org}/${newRepo}`;
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
    sh(`git clone "${remote}" "${tmp}"`);
  } else {
    console.log(`[dryRun] Would clone ${remote} to ${tmp}`);
    mkdirSync(tmp, { recursive: true });
  }

  // 3) Copy package content into new repo working tree
  const srcAbs = resolve(pkgPath);
  if (!dryRun) {
    cpSync(srcAbs, tmp, { recursive: true, force: true });
  } else {
    console.log(`[dryRun] Would copy ${srcAbs} to ${tmp}`);
  }

  // 4) Patch repo metadata
  if (!dryRun) {
    ensureReleaseWorkflow(tmp);
    patchPackageJson(tmp, scopeNameInPkgJson ?? newRepo, remote);
    writeReadmeIfMissing(tmp, scopeNameInPkgJson ?? newRepo);
  } else {
    console.log(`[dryRun] Would patch metadata in ${tmp}`);
  }

  // 5) Commit & push
  if (dryRun) {
    console.log("[dryRun] Skipping commit/push");
  } else {
    sh(`git -C "${tmp}" add .`);
    // allow empty commit to be no-op
    try { sh(`git -C "${tmp}" commit -m "chore: initial import from ${pkgPath}"`); } catch {}
    sh(`git -C "${tmp}" push origin HEAD:main`);
  }

  // 6) Set NPM_TOKEN secret on the new repo
  if (dryRun) {
    console.log(`[dryRun] Would set NPM_TOKEN secret on ${org}/${newRepo}`);
  } else {
    try {
      const npmToken = process.env.NPM_TOKEN;
      if (npmToken) {
        console.log("🔑 Setting NPM_TOKEN secret on new repository...");
        sh(`gh secret set NPM_TOKEN -R ${org}/${newRepo} --body "${npmToken}"`);
        console.log("✅ NPM_TOKEN secret set successfully");
      } else {
        console.warn("⚠️  NPM_TOKEN environment variable not found. You'll need to set it manually:");
        console.warn(`   gh secret set NPM_TOKEN -R ${org}/${newRepo} --body "$NPM_TOKEN"`);
      }
    } catch (error) {
      console.warn("⚠️  Failed to set NPM_TOKEN secret. You may need to set it manually:");
      console.warn(`   gh secret set NPM_TOKEN -R ${org}/${newRepo} --body "$NPM_TOKEN"`);
    }
  }

  // 7) Output machine-readable result for the LLM runner
  console.log(JSON.stringify({ repo: remote, method: "copy", ok: true }));
}

main();
