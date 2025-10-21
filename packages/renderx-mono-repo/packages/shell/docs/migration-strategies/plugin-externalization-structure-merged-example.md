# Plugin Externalization: Merged Structure Example

This document merges the ADR-0025 and Augment agent examples to provide a clear, phase-by-phase view of the codebase and DevTools structure as plugins are externalized to npm packages.

---

## Plugin Repo (External Package)

**General Structure:**
```
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
```
- `package.json`:
  - `type: module`
  - `exports`: “.” → ./dist/index.js (+ types), optional “./symphonies/*” for bare-spec imports
  - `keywords`: ["renderx-plugin"] for host discovery
- Sourcemaps enabled for DevTools TS/TSX visibility.

---

## Host Repo Structure by Phase

### Phase 1: UI-Only Externalization
```
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
```
- PanelSlot entry uses `ui.module: "@scope/renderx-header"` (package name).
- No `/public/plugins/@scope/renderx-header/...` yet (handlers not externalized).

### Phase 2: Handlers Externalized
```
public/
├─ plugins/
│  ├─ plugin-manifest.json
│  └─ @scope.renderx-header/           # handlers copied here
│     └─ symphonies/...
└─ json-sequences/                      # still local
```

### Phase 3: JSON Sequences Externalized
```
public/
├─ plugins/
│  ├─ plugin-manifest.json
│  └─ @scope.renderx-header/
│     └─ symphonies/...
└─ json-sequences/
   └─ header/
      ├─ index.json
      └─ *.json
```

### Phase 4: Bare Specifiers (Optional)
- `handlersPath` in manifest/sequence JSON uses bare package subpaths (e.g., `@scope/renderx-header/symphonies/resize.js`).
- Loader imports directly from node_modules; assets may not be copied to public.

### Production (Artifacts)
- All assets live under `dist/artifacts` and are served from `HOST_ARTIFACTS_DIR`.

---

## Chrome DevTools Structure

### Phase 1 (UI-Only)
```
Sources
└─ (dev server)
   ├─ src/...                      # host source
   ├─ node_modules/.vite/deps/...  # optimized deps
   └─ @scope/renderx-header/...    # plugin bundle; sourcemaps → plugin src/*
Network
├─ /plugins/plugin-manifest.json
└─ /json-sequences/<dir>/index.json (Phase 1)
```

### Phase 2–3 (Handlers/JSON Externalized)
```
Sources
└─ (dev server)
   ├─ plugins/@scope.renderx-header/symphonies/...  # served handlers (Phase 2)
   └─ json-sequences/header/...                     # (if DevTools opened from Network)
Network
├─ /plugins/plugin-manifest.json
├─ /plugins/@scope.renderx-header/symphonies/...
└─ /json-sequences/header/index.json
```

### Phase 4 (Bare Specifiers)
- Modules appear under Vite’s `@id/@scope/...` resolution, sourcemapped to TS.

---

## Quick Mapping Rules
- Manifest: Runtime reads `/plugins/plugin-manifest.json` (copied from json-plugins).
- UI: Loaded by package name from node_modules; visible in Sources under Vite’s module resolution with sourcemaps.
- Handlers/JSON: Path-based mode → assets copied to served paths; bare specifiers → modules resolved via Vite’s graph.

---

## Notes
- Aggregation scripts merge manifest fragments and copy assets as needed.
- Backward compatibility: local plugin code and assets supported during migration.
- Sourcemaps and workspace/npm link ensure good DX in DevTools.
- Security: prefer npm packages and integrity checks over URL imports.
