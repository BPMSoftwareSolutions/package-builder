## Review summary

Overall, the co‑pilot doc is directionally correct and aligns with the repo’s current architecture. A few important nuances from the current code should be added so the plan is actionable without surprises. Below I list what’s covered well, what’s missing/at risk, and concrete recommendations tied to the code.

## What the doc gets right

- Move plugins to npm packages, dynamically import UIs/runtime, and ship ESM builds with source maps for devTools visibility.
- Externalize JSON knowledge/sequences and standardize plugin metadata/manifest.
- Iterative migration and monorepo/dev linking for a good DX.

## High‑impact gaps and risks to address

1) Handlers import path normalization in the conductor
- Today, the sequence loader forces path-like imports for handlers; bare package specifiers or URLs will break.
- Evidence in src/conductor.ts: browser mode prepends “/” to handlersPath. This is correct for file paths but wrong for package specifiers or URLs.

````ts path=src/conductor.ts mode=EXCERPT
let spec = handlersPath;
if (isBrowser) {
  spec = spec.startsWith("/") ? spec : "/" + spec.replace(/^\.\/?/, "");
}
const mod = await import(/* @vite-ignore */ spec as any);
````

- Action: Update the loader to detect:
  - Bare specifiers (not starting with “/” or “.”) → import as‑is
  - Full URLs (http/https) → import as‑is
  - Relative/file paths → keep current normalization
- Without this, “handlersPath”: "@scope/plugin/symphonies/…” won’t load.

2) Legacy mapping from plugin IDs to catalog directory names
- The loader maps some plugin IDs to historical directory names (e.g., CanvasComponentPlugin → canvas-component).
- Evidence:

````ts path=src/conductor.ts mode=EXCERPT
const dir = plugin === 'CanvasComponentPlugin' ? 'canvas-component'
  : plugin === 'LibraryPlugin' ? 'library'
  : plugin === 'ControlPanelPlugin' ? 'control-panel'
  : /* header variants */ ? 'header'
  : plugin;
````

- Action: Standardize how packages declare the catalog dir(s) they own (e.g., in the plugin manifest) or remove legacy mappings after migration. Otherwise, external packages may not be discovered.

3) Discovery and aggregation of external plugin manifests and assets
- Current host expects a consolidated plugin manifest at /plugins/plugin-manifest.json (copied from json-plugins by scripts/sync-plugins.js).
- There’s already a full artifacts pipeline (scripts/build-artifacts.js) and an env/DEV pathway to load artifacts from outside the repo (HOST_ARTIFACTS_DIR/VITE_ARTIFACTS_DIR).
- Actions to add to the doc:
  - Define a host “aggregator” step that:
    - Scans installed node_modules for plugin packages (e.g., by keyword “renderx-plugin”).
    - Reads each package’s manifest fragment and merges into the host’s plugin-manifest.json.
    - Copies package json-sequences and handler assets into public/json-sequences and public/plugins (or composes an artifacts dir and points HOST_ARTIFACTS_DIR at it).
  - This reuses the host’s existing artifact/integrity tooling instead of bespoke per-plugin wiring.

4) Panel UI import via package names already works
- Good news: no loader change needed for UI. PanelSlot already supports ui.module as a package name, URL, or path.
- Evidence:

````tsx path=src/components/PanelSlot.tsx mode=EXCERPT
const target = resolveModuleSpecifier(entry.ui.module);
const mod = await import(/* @vite-ignore */ target);
const Exported = mod[entry.ui.export] as React.ComponentType | undefined;
````

- Action: In the doc, clarify that UIs can be migrated first by switching ui.module to a package name. This is the lowest‑risk pilot.

5) Multiple UI exports per package are supported
- The header plugin uses a single module with multiple exports mapped to different slots. The manifest supports this pattern out of the box.
- Evidence: json-plugins/plugin-manifest.json (header entries) and plugins/header/index.ts.

6) Stable plugin API surface via @renderx/host‑sdk
- The repo already exposes a host SDK for plugins (packages/host-sdk/public-api.ts).
- Action: In the migration doc, require plugins to target and import @renderx/host-sdk for conductor access and other host APIs, and treat it as the semver-stable contract between host and plugins.

7) Integrity/signing and dev/prod artifact paths
- The host includes integrity generation and verification (scripts/build-artifacts.js; src/startupValidation.ts: verifyArtifactsIntegrity).
- Action: Extend the doc with:
  - How external plugin files are included in integrity hashing/signing.
  - How to use HOST_ARTIFACTS_DIR/ARTIFACTS_DIR or dev:artifacts to serve prebuilt artifacts in dev without copying.

8) Topics/sequence coupling specifics
- topicsManifest ties topic routes to pluginId/sequenceId and is statically imported at runtime; sequences are mounted from JSON catalogs by the conductor.
- Actions:
  - Ensure externalized sequence catalogs keep pluginId/sequenceId stable across repos.
  - Define a convention for packages to declare their topic/sequence ids to avoid collisions.

9) URL imports vs packages: CORS and safety
- PanelSlot and the sequence loader can be extended to import URLs, but that introduces CORS and supply‑chain risks.
- Action: Prefer npm packages with lockfile integrity for code; use integrity-checked artifacts for JSON/assets. If URL loading is desired, define explicit trust rules.

10) Vite config
- The doc mentions Vite config, but note:
  - For package‑name UI imports, Vite will resolve node_modules fine if the package ships compiled ESM.
  - If handlersPath remains path‑based (served from public), no Vite change is required.
  - If we move handlersPath to bare specifiers, you may add optimizeDeps.include for faster dev, but it’s optional.

## Smaller improvements to include

- Explicit plugin package export maps for handler subpaths
  - Example (package.json):
    - "exports": { ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" }, "./symphonies/*": "./dist/symphonies/*" }

- Source maps requirement
  - Ensure plugin builds include sourcemap:true so devTools show source.

- Validation in CI
  - Reuse artifacts:ci or similar to validate plugin manifests and sequence indexes in the aggregated set.

- Backward compatibility window
  - Host should support mixed mode where some plugins come from packages and others remain local; current conductor merges discovered json-sequences dirs and the manifest—this is compatible with a phased migration.

## Concrete additions I recommend appending to the doc

- Loader change for handlersPath
  - Add a short “Loader compatibility note” explaining the need to detect bare specifiers/URLs and not prefix them with “/”.

- Aggregator step
  - Specify a “aggregate-plugins” script the host runs prebuild:
    - Find packages with "keywords": ["renderx-plugin"].
    - Merge their manifest fragments into json-plugins/plugin-manifest.json.
    - Copy json-sequences and handlers into public/json-sequences and public/plugins (or build an artifacts dir and set HOST_ARTIFACTS_DIR).

- Host SDK contract
  - State that plugins consume @renderx/host-sdk, and we’ll version it semver‑strictly.

- ID and directory conventions
  - Document how a plugin declares:
    - pluginId
    - catalog directory names (sequence catalogs)
  - Plan to remove hardcoded legacy mappings during/after migration.

- Integrity/signing integration
  - Document how external plugin assets participate in integrity hashing/signing and verification during startup.

## Quick code references

- Conductor sequence loading and handlers import:

````ts path=src/conductor.ts mode=EXCERPT
const idxRes = await fetch(`/json-sequences/${dir}/index.json`);
const mod = await import(/* @vite-ignore */ spec as any);
await (conductor as any)?.mount?.(seq, handlers, seq.pluginId);
````

- PanelSlot UI dynamic import (supports package names today):

````tsx path=src/components/PanelSlot.tsx mode=EXCERPT
const mod = await import(/* @vite-ignore */ target);
const Exported = mod[entry.ui.export] as React.ComponentType | undefined;
````

- Artifacts integrity verification:

````ts path=src/startupValidation.ts mode=EXCERPT
const res = await fetch('/artifacts.integrity.json');
// ...fallback to fs and verify SHA-256 per file
````

- Topics manifest coupling (pluginId/sequenceId):

````ts path=src/topicsManifest.ts mode=EXCERPT
export interface TopicRoute { pluginId: string; sequenceId: string }
import topicsManifestJson from '../topics-manifest.json' assert { type: 'json' };
````

## Bottom line

The plan is solid. Add the loader compatibility change, an explicit aggregation pipeline for manifests/sequences/handlers, lean on the existing artifacts+integrity tooling, anchor plugins to @renderx/host-sdk, and document the ID/dir conventions and integrity behavior. With these additions, you’ll have a smooth, low‑risk iterative path to externalize plugins into npm packages.
