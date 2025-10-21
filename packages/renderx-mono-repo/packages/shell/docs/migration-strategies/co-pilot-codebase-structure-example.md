### File/Folder Structure After First Plugin Is Externalized

#### Host Repo (`renderx-plugins-demo`)
```
/src
  /components
    PanelSlot.tsx
  /conductor.ts
  /env.ts
  ...
/public
  /plugins
    plugin-manifest.json      # Aggregated manifest (includes external plugin entries)
    <other local plugin assets>
  /json-sequences
    <local sequence catalogs>
  ...
/node_modules
  /@your-scope/renderx-header # Externalized plugin package (installed via npm)
/docs
  /adr
    ADR-0025 — Externalizing Plugins to NPM Packages, Aggregated Manifests, and Sequence Handling.md
/scripts
  build-artifacts.js
  sync-plugins.js
  ...
package.json
```

#### External Plugin Repo (`renderx-plugin-header`)
```
/src
  HeaderTitle.tsx
  HeaderControls.tsx
  HeaderThemeToggle.tsx
  plugin-manifest.json
  json-sequences/
    index.json
    <sequence JSONs>
/dist
  HeaderTitle.js
  HeaderControls.js
  HeaderThemeToggle.js
  plugin-manifest.json
  json-sequences/
    index.json
    <sequence JSONs>
package.json
tsconfig.json
```

---

### Chrome DevTools Source Structure (When Debugging)

- **`node_modules/@your-scope/renderx-header/dist/`**  
  - You’ll see the plugin’s built JS files and sourcemaps.
  - If sourcemaps are present, DevTools will show original TS/TSX files (e.g., `HeaderTitle.tsx`).
- **PanelSlot.tsx**  
  - Host code that dynamically imports the plugin.
- **plugin-manifest.json**  
  - Manifest loaded by the host.
- **json-sequences**  
  - Sequence JSONs, if copied from the plugin package.

**DevTools Example:**
```
Sources
├── webpack:///
│   ├── src/
│   │   └── components/
│   │       └── PanelSlot.tsx
│   ├── node_modules/
│   │   └── @your-scope/
│   │       └── renderx-header/
│   │           └── src/
│   │               ├── HeaderTitle.tsx
│   │               ├── HeaderControls.tsx
│   │               └── HeaderThemeToggle.tsx
│   └── public/
│       └── plugins/
│           └── plugin-manifest.json
│       └── json-sequences/
│           └── index.json
```
- If using workspaces or npm link, you may see the plugin’s source directly under your workspace path.

---

