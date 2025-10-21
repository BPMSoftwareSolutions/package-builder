## What I found in the repo (how things work today)

- UI plugin loading
  - PanelSlot dynamically imports UI components from a manifest entry that can be a path, package name, or URL.
  - Evidence: src/components/PanelSlot.tsx (lines ~70–99) imports whatever is in ui.module and takes ui.export from it.

````tsx path=src/components/PanelSlot.tsx mode=EXCERPT
const target = resolveModuleSpecifier(entry.ui.module);
const mod = await import(/* @vite-ignore */ target);
const Exported = mod[entry.ui.export] as React.ComponentType | undefined;
````

- Sequence loading and runtime integration
  - Sequences are driven by JSON catalogs under json-sequences/<dir>/index.json. Each entry points to a sequence JSON file and a handlersPath.
  - Conductor.fetches index + sequence JSONs in the browser and then dynamic-imports handlersPath to get `handlers`.
  - Evidence: src/conductor.ts (lines ~186–265 and ~145–176)

````ts path=src/conductor.ts mode=EXCERPT
const idxRes = await fetch(`/json-sequences/${dir}/index.json`);
const seqRes = await fetch(filePath);
// ...
const mod = await import(/* @vite-ignore */ spec as any);
const handlers = (mod as any)?.handlers || mod?.default?.handlers;
await (conductor as any)?.mount?.(seq, handlers, seq.pluginId);
````

- Plugin manifest and optional runtime registration
  - The plugin manifest (json-plugins/plugin-manifest.json → copied to public/plugins/plugin-manifest.json) lists UI entries and optional runtime entries.
  - Conductor.registerAllSequences also reads the manifest to import runtime.module (package name, path, or URL) and call a register function.
  - Evidence: src/conductor.ts (lines ~268–331)

````ts path=src/conductor.ts mode=EXCERPT
const res = await fetch('/plugins/plugin-manifest.json');
// ...
const mod = await import(/* @vite-ignore */ runtime.module);
const reg = mod[runtime.export];
if (typeof reg === 'function') await reg(conductor);
````

- Build/artifacts flow already in place
  - Scripts exist to copy json-plugins → public/plugins, and to build a consolidated “artifacts” folder that includes json-sequences, json-plugins (manifest), etc., with optional integrity/signing.
  - Evidence: package.json scripts, scripts/sync-plugins.js, scripts/build-artifacts.js

````js path=scripts/build-artifacts.js mode=EXCERPT
await cp(from, join(outDir, rel), { recursive: true }); // copies json-* trees
await writeFile(join(outDir,'interaction-manifest.json'), JSON.stringify(interactionManifest,null,2));
````

- External artifacts support
  - src/env.ts exposes HOST_ARTIFACTS_DIR/VITE_ARTIFACTS_DIR to point to an external artifacts directory; dev:artifacts copies an artifacts dir into public.

````ts path=src/env.ts mode=EXCERPT
export function getArtifactsDir(): string | null {
  const dir = process.env.HOST_ARTIFACTS_DIR || process.env.ARTIFACTS_DIR;
  // or import.meta.env.VITE_ARTIFACTS_DIR
}
````


## Answers to your specific questions

- How will we load the external component into the conductor and integrate it into the app?
  - UI components: via plugin-manifest.json entries. ui.module can be a package name (e.g., @org/renderx-header) and ui.export is the named export. PanelSlot already supports this.
  - Optional runtime: via plugin-manifest.json runtime.module/runtime.export. Conductor will import and call that function at startup.

- How will we load the JSON knowledge data about the plugin and resolve sequence execution?
  - The host expects sequence catalogs at /json-sequences/<dir>/index.json, and each sequence JSON lists a handlersPath. Conductor fetches the JSONs (browser) and imports the handlersPath to mount the sequence.
  - For external plugins, there are two workable patterns:
    1) Artifacts/asset copy: the plugin repo builds an artifacts folder containing its json-sequences and handler modules compiled to JS; the host copies these into public (either via a scan/aggregate script or via dev:artifacts) so existing fetch/import paths continue to work.
    2) Package specifiers for handlers: update handlersPath to be bare package subpaths (e.g., @org/plugin/symphonies/create/create.symphony.js) and enhance the loader to avoid forcing “/” on bare specifiers. This removes the need to copy handler files to public, but requires a small loader change and proper exports in the plugin package.

- What about debugging in DEV? Will we be able to see the plugin code in devTools with the other plugins?
  - Yes, if the plugin package publishes ESM JS with source maps, Vite will show original TS/TSX in devtools.
  - For local development, use a workspace or npm link to the plugin repo for HMR. Ensure the plugin build emits sourcemaps and that the package exports point to ESM.

- What will the build process look like (pre-build, copy manifest, artifacts, post build, vite config, etc.)?
  - Pre-build: existing pre:manifests runs sync/generate scripts. Add an “aggregate external plugins” script to:
    - Discover installed plugin packages (e.g., by a keyword in package.json).
    - Merge their manifest fragments into json-plugins/plugin-manifest.json.
    - Copy their json-sequences and handler assets into public or into json-* sources for the artifacts builder.
  - Build: vite build as today. If dynamic imports are only runtime, no special Vite config is strictly required; if we add bare-specifier-only dynamic imports, we might include them in optimizeDeps.include for faster dev.
  - Post-build: continue with scripts/build-artifacts.js, integrity/signing, and pack if desired.

- What about transpiling the ts files to js files to ensure ESM loading?
  - Each plugin should publish ESM JS. Recommend tsconfig target ES2020, module ESNext, declaration true, sourceMap true. Publish dist with:
    - package.json: "type": "module", "main": "dist/index.js", "module": "dist/index.js", "types": "dist/index.d.ts"
    - "exports": { ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" }, "./symphonies/*": "./dist/symphonies/*" }
  - Include sourcemaps in the package for dev debugging.


## Iterative migration plan (one plugin at a time)

- Phase 1: Externalize UI only (lowest risk; proves package import path)
  - Create @your-scope/renderx-header package with HeaderTitle/HeaderControls/HeaderThemeToggle exports (see plugins/header/index.ts).
  - Publish ESM build with sourcemaps.
  - Update plugin-manifest.json to use the package name for ui.module and keep ui.export as-is.
  - Verify PanelSlot loads from the package in dev/build and the code is visible in devtools.

- Phase 2: Externalize symphony handlers (keep host JSON sequences)
  - Move symphony handler code into the plugin package and build to an “assets” or “public/plugins/<plugin>” path inside the package.
  - Add a host aggregation step to copy the package’s handler assets into public/plugins/<plugin>.
  - Keep the host’s json-sequences entries intact (handlersPath stays “/plugins/<plugin>/...”), so conductor keeps working without loader changes.

- Phase 3: Externalize JSON sequences
  - Package ships json-sequences/<plugin>/index.json and its sequence JSONs.
  - Host aggregation copies those into public/json-sequences/<plugin> (or use HOST_ARTIFACTS_DIR + dev:artifacts to copy a whole artifact set in dev).
  - Conductor loads everything from the copied assets as before.

- Phase 4 (optional improvement): Switch handlersPath to package subpaths
  - Update handlersPath in sequence JSON to a bare specifier (e.g., "@your-scope/renderx-canvas/symphonies/resize/resize.start.symphony.js").
  - Enhance the loader to detect bare specifiers (not starting with “/” or “.”) and avoid adding a leading slash before dynamic import.
  - Ensure plugin export maps allow those subpath imports.

- Phase 5: Standardize and automate
  - Define a plugin package contract (package.json fields or a small manifest file) that the host aggregator consumes.
  - Add CI to validate plugin manifests and sequences (you already have artifact validation scripts to leverage).


## Coupling highlights to watch

- Handler path normalization in the loader: today, browser mode forces a leading “/” on handlersPath; that’s path-centric. If we want bare specifiers, we’ll need to tweak this.
- The host’s reliance on fetch for JSON sequences means in-browser availability is required. The existing artifacts and “copy to public” flows are the bridge for external repos.
- UI is already decoupled and supports package names today via PanelSlot.


## Suggested first move

- Pilot with the “header” plugin (UI only) as an npm package to validate:
  - Package import via ui.module (package name)
  - Sourcemaps in devtools
- Next, try “library” (has sequences) with Phase 2 (handlers externalized, JSON stays local), using a simple aggregation step to copy handlers into public/plugins/library.
