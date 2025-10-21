Here is the initial surface area of the "library" code in the workspace:

### Main Code Locations
- library — Contains the main implementation:
  - index.ts (exports `LibraryPanel`, `register`)
  - LibraryPanel.tsx, LibraryPreview.tsx, preview.model.ts
  - LibraryPanel.css
  - library.utils.js
  - load.symphony.ts

### Tests
- library — Direct tests for library logic and UI
- library-component — Tests for related components (e.g., drag/preview, registration)

### Data/Manifests
- library
- `json-interactions/library*.json`
- `json-components/json-topics/library*.json`

### Key Contracts & Exports
- Functions: `LibraryPanel`, `LibraryPreview`, `computePreviewModel`, utility functions, `handlers`, `register`
- Types: `PreviewModel`
- Exports are mostly named, no default exports.

### Dependencies
- Internal: UI and utils import each other via relative paths.
- External: Uses `@renderx-plugins/host-sdk` for core interactions, event routing, feature flags, and mapping.
- One import from `../../control-panel/state/css-registry.store` (cross-plugin dependency).

---

Here is a map of the main coupling points for the "library" code that will impact migration/decoupling:

---

### Internal (Relative) Coupling
- LibraryPreview.tsx
  - imports `computePreviewModel` from `./preview.model`
  - imports `varsToStyle`, `pickDataAttrs` from library.utils.js
- LibraryPanel.tsx
  - imports `LibraryPreview` from `./LibraryPreview`
  - imports utility functions from library.utils.js
- index.ts
  - exports `LibraryPanel` from `./ui/LibraryPanel`
- load.symphony.ts
  - imports `cssRegistry` from `../../control-panel/state/css-registry.store` (cross-plugin dependency)

---

### External (Workspace/SDK) Coupling
- `@renderx-plugins/host-sdk` (used in multiple files)
  - `resolveInteraction`, `EventRouter`, `isFlagEnabled`, `mapJsonComponentToTemplate`
- `react` (UI components)

---

### Cross-Plugin/Workspace Coupling
- The import from `../../control-panel/state/css-registry.store` in load.symphony.ts is a direct dependency on another plugin's state/store, which will need to be refactored or exposed via a public API if decoupled.

---

### Summary of Impact
- **Internal imports** are straightforward to migrate if the folder structure is preserved in the new repo.
- **External SDK usage** (`@renderx-plugins/host-sdk`) is expected and should remain as a peer dependency.
- **Cross-plugin dependency** (`cssRegistry` from control-panel) is the most significant coupling point. Decoupling will require:
  - Refactoring to use a public API, event, or contract.
  - Possibly duplicating or abstracting shared state logic.

---

Here is a deeper analysis of the contracts/interfaces at the main coupling points for migration:

---

### 1. `cssRegistry` (Shared API via Host SDK)
- **Type:** Singleton instance of `CssRegistryStore`, exposed through the host-sdk.
- **API Used by Library:**
  - `hasClass(name: string): boolean`
  - `createClass(name: string, content: string): boolean`
  - `updateClass(name: string, content: string): boolean`
- **Contract:** The library expects to register/update CSS classes for components at runtime, and relies on this API to persist and manage those classes.
- **Migration Impact:**  
  - Refactor all direct imports of `cssRegistry` to use the host-sdk public API.
  - This enforces domain boundaries, supports orchestration, and ensures plugin decoupling.
  - Consumers only interact with the registry via the host-sdk, making future migrations and maintenance easier.

---

### 2. `@renderx-plugins/host-sdk` (External SDK)
- **Functions/Types Used:**
  - `resolveInteraction`, `EventRouter`, `isFlagEnabled`, `useConductor`, `mapJsonComponentToTemplate`
- **Contract:** These are expected to remain as peer dependencies in the new package. No migration issues if SDK is properly versioned and available.

---

### 3. Internal Utility Contracts
- **Types:**
  - `PreviewModel` (from preview.model.ts)
- **Functions:**
  - `computePreviewModel(component: any): PreviewModel`
  - `varsToStyle(vars: Record<string, string>): React.CSSProperties`
  - `pickDataAttrs(attrs: Record<string, string>): Record<string, string>`
  - `groupComponentsByCategory(components: any[]): Record<string, any[]>`
  - `getCategoryDisplayName(category: string): string`
- **Contract:** These are all local to the library plugin and can be migrated as-is.

---

### 4. UI Contracts
- **React Components:**
  - `LibraryPanel`, `LibraryPreview`
- **Contract:** Standard React component props, no special migration issues.

---

### Summary of Migration/Coupling Points
- **Critical:** The only hard coupling is to `cssRegistry` in the control-panel plugin. This must be refactored to use a public/shared API or moved to a shared package.
- **Other contracts** (SDK, utilities, types, React) are safe to migrate.

