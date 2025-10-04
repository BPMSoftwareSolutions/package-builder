# package-builder
An AI-assisted monorepo that turns small ideas into fully tested npm packages. Generate, validate, and publish micro-features with zero setup.

# Package-Builder: LLM-Driven Pipeline (end-to-end)

## 0) Repo shape (monorepo, minimal but opinionated)

```
package-builder/
├─ .github/workflows/
│  └─ package-builder.yml
├─ agents/
│  ├─ planner.prompt.md
│  ├─ implementer.prompt.md
│  ├─ tester.prompt.md
│  ├─ packager.prompt.md
│  └─ verifier.prompt.md
├─ scripts/
│  ├─ pb-scaffold.ts           # create package skeleton (+ example tests)
│  ├─ pb-move.ts               # move src/tests into /packages/<name>
│  ├─ pb-build-tgz.ts          # pack tarball; emit metadata (path/hash)
│  ├─ pb-spinup-integration.ts # temp project to install/test the tarball
│  ├─ pb-report.ts             # summarize statuses for the PR check
│  └─ pb-guardrails.ts         # quick validations (naming, exports, deps)
├─ packages/
│  └─ (generated on demand)
├─ examples/
│  └─ host-app/                # tiny app for E2E (Playwright) harness
├─ e2e/
│  └─ svg-editor.spec.ts
├─ valence/                    # (optional) validators/profiles for guardrails
├─ package.json
├─ turbo.json (or nx.json)     # optional: caching/parallelization
└─ tsconfig.json
```

---

## 1) The LLM “assembly line” (5 agents, 6 gates)

**Agents (or tool-executed prompts)**

* **Planner** → decomposes the feature into atomic tasks, API sketch, dependency list.
* **Implementer** → writes TypeScript, story/examples, and unit tests.
* **Tester** → runs unit + E2E locally; proposes fixes until green.
* **Packager** → materializes `/packages/<name>` with `package.json`, builds `.tgz`.
* **Verifier** → spins a throwaway project, installs `.tgz`, smoke-tests usage as an external dep.

**Quality gates**
G1: Structure & naming → scaffold passes.
G2: Unit tests → green.
G3: E2E in `examples/host-app` → green.
G4: Pack & publishability → `.tgz` produced with correct exports/types.
G5: External install test → smoke test passes in temp project.
G6: Guardrails → no violations (import boundaries, missing exports, heavy deps, etc.).

> When G1→G6 are green, the PR check posts “✅ packaged & verifiable”.

---

## 2) CLI helpers (these are what your LLM calls)

**scripts/pb-scaffold.ts**
Creates a package skeleton + example test:

```bash
# create skeleton in working area (not yet “packages/”)
node scripts/pb-scaffold.ts svg-editor \
  --desc "Tiny SVG DOM manipulation helpers for UI" \
  --keywords "svg,dom,ui" \
  --runtime "browser" \
  --entry "src/index.ts"
```

**scripts/pb-move.ts**
Moves the feature into the canonical location:

```bash
node scripts/pb-move.ts svg-editor  # -> packages/svg-editor/...
```

**scripts/pb-build-tgz.ts**
Packs the package and prints JSON (path/hash/version) to stdout.

**scripts/pb-spinup-integration.ts**
Creates a temp folder, runs:

```bash
npm init -y
npm i "<path-to-tgz>"
# generates a tiny TS file that imports your API and runs a smoke test,
# then runs "ts-node" or "tsx" to execute it.
```

**scripts/pb-guardrails.ts**
Fast checks (name, files, exports map, types, peerDeps sanity, “no heavy deps”, etc.). Exit non-zero on violations.

**scripts/pb-externalize-copy.ts**
Externalizes a package from the monorepo to a new GitHub repository (copy mode):

```bash
# Externalize svg-editor package to a new repository
node scripts/pb-externalize-copy.ts \
  pkgPath=packages/svg-editor \
  newRepo=tiny-svg-editor \
  org=your-github-org \
  visibility=public \
  scopeNameInPkgJson=tiny-svg-editor

# With dry-run to preview changes
node scripts/pb-externalize-copy.ts \
  pkgPath=packages/svg-editor \
  newRepo=tiny-svg-editor \
  org=your-github-org \
  dryRun=true
```

This script:
- Creates a new GitHub repository (if it doesn't exist)
- Copies the package content to the new repo
- Adds a GitHub Actions workflow for automated npm publishing
- Updates package.json with repository URL and publish config
- Generates a README.md if missing
- Sets NPM_TOKEN secret on the new repository (if NPM_TOKEN env var is available)

---

## 3) `package.json` template for generated packages

`/packages/svg-editor/package.json`

```json
{
  "name": "@bpm/svg-editor",
  "version": "0.1.0",
  "description": "Tiny SVG DOM manipulation helpers for UI.",
  "keywords": ["svg", "dom", "ui", "renderx"],
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json && node ../../scripts/pb-guardrails.js --pkg .",
    "test": "vitest run",
    "lint": "eslint .",
    "prepack": "npm run build",
    "pack": "npm pack --pack-destination ../../.artifacts"
  },
  "peerDependencies": {},
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^2.0.0",
    "eslint": "^9.0.0"
  }
}
```

> Keeps **exports map** + **types** correct. `prepack` guarantees built artifacts before `.tgz`.

---

## 4) Example: `/packages/svg-editor/src/index.ts`

```ts
export type SvgSelector = string | SVGGraphicsElement;
const sel = (s: SvgSelector) =>
  typeof s === "string" ? (document.querySelector(s) as SVGGraphicsElement|null) : s;

export function setAttrs(target: SvgSelector, attrs: Record<string, string|number|boolean>) {
  const el = sel(target);
  if (!el) return false;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return true;
}

export function translate(target: SvgSelector, x: number, y: number) {
  const el = sel(target); if (!el) return false;
  const prev = el.getAttribute("transform") ?? "";
  const next = prev.trim() ? `${prev} translate(${x}, ${y})` : `translate(${x}, ${y})`;
  el.setAttribute("transform", next);
  return true;
}
```

**Unit test** `/packages/svg-editor/test/index.test.ts`

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { setAttrs, translate } from "../src/index";

describe("svg-editor", () => {
  let svg: SVGSVGElement, rect: SVGRectElement;
  beforeEach(() => {
    document.body.innerHTML = `<svg><rect id="r"/></svg>`;
    svg = document.querySelector("svg")!; rect = document.querySelector("#r")!;
  });
  it("sets attributes", () => {
    expect(setAttrs(rect, { fill: "red", width: 20 })).toBe(true);
    expect(rect.getAttribute("fill")).toBe("red");
    expect(rect.getAttribute("width")).toBe("20");
  });
  it("applies a translate", () => {
    expect(translate("#r", 5, 7)).toBe(true);
    expect(rect.getAttribute("transform")).toContain("translate(5, 7)");
  });
});
```

**E2E smoke** `e2e/svg-editor.spec.ts` (Playwright)

* Loads `examples/host-app` (a minimal Vite page that pulls `@bpm/svg-editor`).
* Clicks a button that calls `translate('#r', 10, 10)`.
* Asserts the `<rect>` `transform` attribute updates.

---

## 5) GitHub Actions (end-to-end)

`.github/workflows/package-builder.yml`

```yaml
name: package-builder

on:
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-test-package:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }

      - run: npm ci

      # █ Agent 1: PLAN
      - name: LLM Plan
        run: node -e "console.log('Planner would run here');"

      # █ Agent 2: IMPLEMENT
      - name: Implement Feature (LLM)
        run: node -e "console.log('Implementer would write code/tests here');"

      # Structure/guardrails quick pass
      - name: Guardrails
        run: node scripts/pb-guardrails.js --repo .

      # █ Agent 3: TEST (unit)
      - name: Unit tests
        run: npm test --workspaces

      # █ Agent 3b: E2E (examples/host-app)
      - name: E2E tests
        run: |
          npx playwright install --with-deps
          npm run e2e

      # █ Agent 4: PACK
      - name: Build package tarball(s)
        run: node scripts/pb-build-tgz.js --packages "packages/*"

      # █ Agent 5: VERIFY as external dependency
      - name: External install smoke
        run: node scripts/pb-spinup-integration.js --packages "packages/*"

      # Final report (comment on PR)
      - name: Summarize
        run: node scripts/pb-report.js

      # Optional: Externalize package to separate repository
      - name: Externalize package (if configured)
        if: github.event_name == 'workflow_dispatch' && github.event.inputs.externalize == 'true'
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: |
          node scripts/pb-externalize-copy.ts \
            pkgPath=packages/${{ github.event.inputs.package_name }} \
            newRepo=${{ github.event.inputs.new_repo_name }} \
            org=${{ github.event.inputs.target_org }} \
            visibility=${{ github.event.inputs.visibility || 'public' }} \
            scopeNameInPkgJson=${{ github.event.inputs.scoped_name }}
```

> If you prefer, swap in **Turborepo** or **Nx** to speed repeated runs and parallelize units/E2E.

---

## 6) LLM prompts (drop-in, agent-friendly)

`agents/planner.prompt.md`

```
You are the Planner for the "package-builder" repository.
Goal: turn a feature request into a minimal, testable package.

Given:
- Feature name: {{feature_name}} (e.g., svg-editor)
- Brief: {{brief}}
- Constraints: TypeScript, ESM, tree-shakeable, no heavy deps.

Output JSON:
{
  "package": "{{kebab-cased-name}}",
  "public_api": ["functions/types to export"],
  "deps": {"runtime": [], "dev": ["typescript","vitest"]},
  "unit_tests": ["key test cases"],
  "e2e": {"host_page_actions": ["click X", "assert Y"]},
  "files": ["src/index.ts","test/index.test.ts","README.md"]
}
```

`agents/implementer.prompt.md`

```
You are the Implementer. Use the Planner JSON.
Write code in TypeScript, implement each export, and create unit tests that
reflect the cases. Keep functions pure where possible. Avoid heavy deps.
```

`agents/tester.prompt.md`

```
You are the Tester. Run npm test and the E2E suite.
If red, propose a minimal patch. Iterate until green.
```

`agents/packager.prompt.md`

```
You are the Packager. Move the code to /packages/{{name}} using scripts/pb-move.ts,
generate package.json with exports/types, and build a .tgz using pb-build-tgz.ts.
```

`agents/verifier.prompt.md`

```
You are the Verifier. Use pb-spinup-integration.ts to create a temp project,
npm install the .tgz, import the public API, and run a smoke test script.
Return JSON {installed:true, smoke:true}.
```

---

## 7) Externalization smoke (what the verifier executes)

Generated script inside the temp project:

```ts
import { setAttrs, translate } from "@bpm/svg-editor";
const div = globalThis.document?.createElement?.("div");
console.log(typeof setAttrs, typeof translate, !!div); // simple assertion for CI logs
```

Run with `tsx smoke.ts` (or `node --loader ts-node/esm`), exit non-zero on failure.

---

## 8) Guardrails you’ll love (fast + friendly)

* **Exports map & types** present, `sideEffects:false` for tree-shaking.
* **No heavy deps** (e.g., blocks adding `lodash`/`moment`—prefer native).
* **Naming & structure**: kebab-case package folder; has `src/`, `test/`, `README.md`.
* **E2E harness** uses the **public** API only (no deep imports).
* **(Optional)** Tie in your architecture validators (Valence/CIA/SPA) for import boundaries and runtime orchestration norms in future packages.

---

## 9) Package Externalization

Once a package is mature and ready for independent distribution, you can externalize it to its own GitHub repository using the externalization script.

### Prerequisites

1. **GitHub CLI installed and authenticated**:
   ```bash
   gh auth login   # choose GitHub.com, HTTPS, paste token
   ```

2. **Required token scopes**: `repo`, `workflow`

3. **NPM_TOKEN available**: Set as environment variable for npm publish permissions

### Usage Examples

**Basic externalization**:
```bash
node scripts/pb-externalize-copy.ts \
  pkgPath=packages/svg-editor \
  newRepo=tiny-svg-editor \
  org=your-github-org
```

**With custom package name**:
```bash
node scripts/pb-externalize-copy.ts \
  pkgPath=packages/svg-editor \
  newRepo=tiny-svg-editor \
  org=your-github-org \
  scopeNameInPkgJson=@bpm/tiny-svg-editor
```

**Private repository**:
```bash
node scripts/pb-externalize-copy.ts \
  pkgPath=packages/svg-editor \
  newRepo=tiny-svg-editor \
  org=your-github-org \
  visibility=private
```

**Dry run (preview changes)**:
```bash
node scripts/pb-externalize-copy.ts \
  pkgPath=packages/svg-editor \
  newRepo=tiny-svg-editor \
  org=your-github-org \
  dryRun=true
```

### What the script does

1. **Validates prerequisites**: Checks GitHub CLI installation and authentication
2. **Creates GitHub repository**: Creates the target repository if it doesn't exist
3. **Copies package content**: Copies all files from the source package
4. **Adds CI/CD workflow**: Creates `.github/workflows/release.yml` for automated publishing
5. **Updates package.json**: Sets repository URL, publish config, and release script
6. **Generates README**: Creates a basic README.md if one doesn't exist
7. **Sets NPM_TOKEN secret**: Configures the repository secret for npm publishing

### Publishing releases

In the new repository, create releases using:
```bash
npm version patch  # or minor, major
git push --follow-tags
```

The GitHub Actions workflow will automatically:
- Run tests (if present)
- Build the package (if build script exists)
- Publish to npm with provenance

---
## 10) Day-1 “do this now” checklist

1. Scaffold the repo with the folders above.
2. Add the workflow YAML exactly as shown.
3. Drop in the 5 agent prompts.
4. Implement `scripts/*` (they’re straightforward Node/TS CLIs; start with `pb-scaffold`, `pb-move`, `pb-build-tgz`, and `pb-spinup-integration`).
5. Run:

   ```bash
   node scripts/pb-scaffold.ts svg-editor --desc "Tiny SVG DOM manipulation helpers"
   node scripts/pb-move.ts svg-editor
   npm run -w packages/svg-editor test
   npm run -w packages/svg-editor pack
   node scripts/pb-spinup-integration.ts --packages packages/svg-editor
   ```
6. Open a PR. Watch the pipeline gate it end-to-end.

