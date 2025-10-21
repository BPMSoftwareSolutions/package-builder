## What this is based on
- Your ADR: docs/adr/ADR-0025 — Externalizing Plugins to NPM Packages, Aggregated Manifests, and Sequence Handling.md
- Current scripts that shape runtime/build:
  - scripts/sync-plugins.js (copies json-plugins → public/plugins)
  - scripts/build-artifacts.js (builds dist/artifacts, integrity, and copies json-* trees)

Below are the concrete structures you should expect when the first plugin is externalized, starting with Phase 1 (UI-only), plus how it will appear in Chrome DevTools. I also note what changes once you externalize handlers/JSON in later phases.

---

## Plugin repo (external package)

Phase 1 (UI-only, prep for later phases). The plugin should publish ESM + sourcemaps, with exports for the UI entry (and optional subpaths for future handler imports).

Example/skeleton for plugin repo:
````text mode=EXCERPT
renderx-plugin-header/
├─ package.json
├─ tsconfig.json
├─ src/            # UI + (optional) symphonies TS
│  └─ index.ts
├─ json-sequences/ # (Phase 3) catalog + sequence JSON
└─ dist/           # ESM + .map (built)
   ├─ index.js
   ├─ index.d.ts
   ├─ plugin-manifest.json     # fragment for aggregation
   └─ symphonies/...           # (Phase 2) compiled handlers
````

Notes
- package.json
  - type: module
  - exports: “.” → ./dist/index.js (+ types), optional “./symphonies/*” for later bare-spec imports
  - keywords: ["renderx-plugin"] for discovery during aggregation
- Sourcemaps enabled so DevTools shows TS/TSX.

---

## Host repo after first plugin is externalized

Phase 1 (UI-only plugin externalized; handlers/JSON still local):
- You keep the consolidated runtime manifest at /plugins/plugin-manifest.json via scripts/sync-plugins.js (from json-plugins).
- Only the UI module in the manifest points to the package name; no handler assets copied yet.

Host repo snapshot (dev):
````text mode=EXCERPT
renderx-plugins-demo/
├─ src/...
├─ json-plugins/
│  └─ plugin-manifest.json     # merged (copied to public/plugins/)
├─ json-sequences/             # still local for Phase 1
├─ public/
│  └─ plugins/
│     └─ plugin-manifest.json  # from sync-plugins.js
├─ node_modules/
│  └─ @scope/renderx-header/   # the externalized plugin package
└─ package.json
````

- The PanelSlot entry for this plugin uses ui.module: "@scope/renderx-header" (package name).
- No /public/plugins/@scope/renderx-header/... yet (that happens when you externalize handlers and copy them).

Phase 2–3 (when you externalize handlers and/or JSON sequences)
- Aggregation (as per ADR-0025) will copy the plugin’s compiled handlers and JSON catalogs into served assets. In dev you may copy to public; in prod into dist/artifacts.

Host repo snapshot (dev) after Phase 2–3:
````text mode=EXCERPT
public/
├─ plugins/
│  ├─ plugin-manifest.json
│  └─ @scope.renderx-header/           # Phase 2: handlers copied here
│     └─ symphonies/...
└─ json-sequences/                      # Phase 3: plugin JSON copied here
   └─ header/
      ├─ index.json
      └─ *.json
````

Prod (artifacts): the same trees live under dist/artifacts instead, and the app can serve from HOST_ARTIFACTS_DIR.

---

## How files appear in Chrome DevTools (Phase 1)

With a prebuilt ESM plugin and sourcemaps:
- Sources panel
  - You’ll see the externalized plugin code under a Vite-served module path. Depending on optimization it appears as:
    - node_modules/.vite/deps/... or
    - @id/@scope/renderx-header/dist/index.js
  - If sourcemaps point back to src, you’ll see original TS/TSX (often under a “sources” subtree or a path derived from the map’s sourceRoot). When linked via workspace/npm link, file paths may resolve to your plugin repo path.
- Network panel
  - GET /plugins/plugin-manifest.json
  - Any images/assets the UI imports
  - (Still local in Phase 1) GET /json-sequences/... requests for the host’s built-in sequences

Tiny mental model of what you’ll see:
````text mode=EXCERPT
Sources
└─ (dev server)
   ├─ src/...                      # host source
   ├─ node_modules/.vite/deps/...  # optimized deps
   └─ @scope/renderx-header/...    # plugin bundle; sourcemaps → plugin src/*
Network
├─ /plugins/plugin-manifest.json
└─ /json-sequences/<dir>/index.json (Phase 1)
````

---

## How files appear in Chrome DevTools (Phase 2–3)

Once you externalize handlers and JSON and copy them into served assets:
- Sources panel
  - If handlers are served from /plugins/@scope.renderx-header/symphonies/... (path-based), those JS files appear there and map to your plugin’s src via sourcemaps.
- Network panel
  - /plugins/plugin-manifest.json
  - /plugins/@scope.renderx-header/symphonies/... (handler modules)
  - /json-sequences/header/index.json and referenced sequence JSONs

Example view:
````text mode=EXCERPT
Sources
└─ (dev server)
   ├─ plugins/@scope.renderx-header/symphonies/...  # served handlers (Phase 2)
   └─ json-sequences/header/...                     # (if DevTools opened from Network)
Network
├─ /plugins/plugin-manifest.json
├─ /plugins/@scope.renderx-header/symphonies/...
└─ /json-sequences/header/index.json
````

If/when you switch to bare specifiers for handlersPath (Phase 4):
- You’ll see modules resolved via Vite’s module graph (e.g., @id/@scope/renderx-header/symphonies/...), still sourcemapped to original TS.

---

## Quick mapping rules

- Manifest:
  - Runtime still reads /plugins/plugin-manifest.json (copied from json-plugins) in dev; for prod, you can serve from artifacts.
- UI components:
  - Loaded by package name from node_modules; visible in Sources under Vite’s module resolution with sourcemaps mapping back to plugin src.
- Handlers/JSON (after Phase 2–3):
  - Path-based mode: assets are copied to “served” paths (/plugins/<pkg>/..., /json-sequences/<dir>/...), so both Sources and Network show those exact URL paths.
- Bare specifiers (optional later):
  - Modules appear under Vite’s @id/@scope/... resolution rather than /plugins/<pkg>/ paths, still sourcemapped to TS.

