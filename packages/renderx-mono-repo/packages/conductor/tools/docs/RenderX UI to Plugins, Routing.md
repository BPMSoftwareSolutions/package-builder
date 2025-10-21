# RenderX UI to Plugins, Routing

## Goal
Assess how much of the RenderX UI can be moved into plugins so the client app becomes mainly routing.

## What I examined
- RenderX app structure, routing entry points
  - index.html, src/main.tsx, src/App.tsx, src/components/AppContent.tsx
- Core UI components
  - ElementLibrary.tsx, Canvas.tsx, CanvasElement.tsx, ControlPanel.tsx
- Conductor integration
  - ConductorService.ts, modules/communication (PluginManager/Loader), vite alias “musical-conductor”
- Plugin system
  - public/plugins/manifest.json and plugin modules (component-library, library-drag/drop, canvas-create/drag/resize/selection, theme-management)
  - Vite middleware serving ESM plugins from /plugins

## Current architectural pattern
- Thin client shell with three panels: ElementLibrary, Canvas, ControlPanel, plus a toolbar.
- Musical Conductor is initialized via ConductorService and exposed globally as renderxCommunicationSystem.conductor.
- Many behaviors already delegated to plugins via conductor.play() and event subscriptions:
  - Element discovery/loading: “Component Library Plugin” loads JSON components and emits components:loaded.
  - Drag/drop orchestration: Library.component-drag-symphony / Library.component-drop-symphony.
  - Canvas behaviors: create, select, drag/move, resize are all implemented in corresponding plugins.
- Canvas and ElementLibrary subscribe to conductor events and provide callbacks for plugins to update local React state.

## Bounded contexts and what can move to plugins

1) Element Library (left panel)
- Already largely plugin-driven for data loading, but the UI rendering is in ElementLibrary.tsx.
- Candidates to move into plugins:
  - Rendering and grouping of components by category
  - Preview template generation and scoping of preview CSS
  - Drag image customization and drag metadata
- Keep in shell:
  - Shell-provided slot/region and minimal bridge props (e.g., onDragStart/onDragEnd) or even remove these if fully event-driven.
- Feasibility: High. A “UI shell plugin” could render into a designated DOM slot or via a React portal exposed by the shell. Alternatively, the shell can mount a plugin-rendered React element by importing a plugin UI entry (served via Vite plugin loader) if we standardize an export like render(element: HTMLElement, api: ShellAPI).

2) Canvas (center workspace)
- Current Canvas.tsx renders elements and manages local state; behavior updates are plugin-driven (events + callbacks).
- Candidates to move into plugins:
  - State model for canvas elements (creation, selection, movement, resizing) can be plugin-owned; the Canvas view could become a very thin reactive projection of conductor state.
  - The entire Canvas rendering, including CanvasElement rendering and VisualTools overlays, could be plugin-rendered if we expose a mount point.
- Keep in shell:
  - Just a container route/slot for the workspace; possibly a minimal “view adapter” that listens to Conductor state or asks a plugin to mount its own UI.
- Feasibility: Medium–High. Because CanvasElement uses DOMParser and transforms JSON templates into React elements, we can either:
  - Move that rendering into a plugin UI module (preferred), or
  - Keep a small “TemplateRenderer” micro-component in core as a shared utility while plugins own composition and state.

3) Control Panel (right panel)
- Currently a placeholder; ideal for full plugin ownership.
- Keep in shell:
  - Provide a slot and maybe a selected-element context, or rely purely on Conductor event state.
- Feasibility: High.

4) Global toolbar and Theme toggle
- Toolbar buttons are disabled; these could be plugin-provided actions/menus.
- Theme is already a plugin (Theme Management Plugin).
- Keep in shell:
  - Optional minimal header and route outlet, or even make the header pluggable.

5) Routing
- Currently there is no route-based navigation; App is a single page with panels.
- A “mainly routing” shell implies:
  - Use a router (React Router) to define high-level routes like /editor, /preview, /settings.
  - Each route renders a plugin-owned page (mounted UI from plugin).
- Feasibility: High. Introduce a minimal routing layer and a plugin-page registry read from manifest to map routes to plugin pages.

## Proposed target architecture
- Shell responsibilities:
  - Initialize Conductor, register CIA/SPA plugins (already done).
  - Provide a Router and a minimal layout with named slots (left, center, right), each slot optionally bound to a “page plugin” or “panel plugin.”
  - Provide a small ShellAPI to plugins: conductor reference, publish/subscribe, selected-element accessor, mount/unmount helpers, and a theming hook or token.
- Plugin responsibilities:
  - Supply page-level UIs (EditorPage, LibraryPanel, CanvasPanel, ControlPanel) with rendering logic and state handling via Conductor beats and Data Baton.
  - Supply micro features (create/drag/resize/select), already in place.
  - Optionally supply commands/toolbar actions.

## Concrete refactor steps
- Phase 1: Introduce routing-only shell
  - Add react-router-dom and define routes:
    - /editor: renders a route component that simply exposes three slots: left, center, right
    - /preview: optional
    - /settings: optional
  - Keep current panels as default components for each slot, but declare a Slot API so plugins can take ownership.

- Phase 2: Define a Plugin UI contract
  - Each UI-capable plugin can optionally export:
    - mount(el: HTMLElement, api: ShellAPI): UnmountFn
    - or a React component default export the shell can render given a lazy import path
  - Extend manifest.json to include uiMounts:
    - Example:
      - { name: "Library UI", path: "component-library-plugin/", ui: { slot: "left", export: "LibraryPanel" } }
      - { name: "Canvas UI", path: "canvas-ui-plugin/", ui: { slot: "center", export: "CanvasPage" } }
  - Update Vite plugin loader to allow importing the specified export for UI mounting.

- Phase 3: Migrate Element Library UI
  - Move ElementLibrary.tsx rendering into component-library-plugin as LibraryPanel React component.
  - Shell: in /editor route, for left slot, either mount that plugin component or fallback to legacy ElementLibrary if plugin is absent.

- Phase 4: Migrate Canvas UI
  - Move Canvas.tsx and CanvasElement.tsx logic into a new canvas-ui-plugin.
  - Keep shared template-to-element utilities in a minimal shared module if needed.
  - Shell: for center slot, mount the plugin page.

- Phase 5: Migrate Control Panel UI
  - Provide a control-panel-plugin with a basic properties panel driven from Conductor selection state.

- Phase 6: Toolbar and Commands
  - Add a “Commands” plugin interface; toolbar in shell renders available plugin commands as buttons/menus.
  - Or move full toolbar into an “EditorPage” plugin that controls its own header.

## Bounded context delineation
- Shell bounded context: Routing, plugin lifecycle, slot management, theme tokens, ShellAPI.
- Editing bounded contexts (plugins):
  - Library domain: discovery/display/filtering/drag of JSON components.
  - Canvas domain: element lifecycle, drag/move/resize, visual tools, selection; maintains canonical Canvas state via Conductor/Data Baton.
  - Properties domain: presentation/edits of selected element properties.
  - Theme domain: already present.

## Risks and mitigations
- Double rendering in StrictMode: PluginManager has a safeguard for autoMount; continue to ensure UI mounts are idempotent.
- CSS scoping: Keep current scoping strategies; consider CSS-in-JS at plugin level or adopt per-instance scoping rules exposed via ShellAPI.
- Performance: Route-based code splitting will improve; ensure plugin UI bundles are lazy-loaded per route.

## Minimal changes to prove the approach
- Add a basic Router and define /editor route that renders three divs with data-slot="left|center|right".
- Update manifest.json format to optionally include UI mounts for left/center/right.
- Add a small “mount-ui” helper in the shell that reads manifest and lazy-imports plugin exports to render into slots.
- Start with moving ControlPanel UI into a small plugin component to validate mount flow, since it’s least coupled.

## ADR suggestion
Document the decision to make RenderX a routing-first thin shell with plugin-rendered UI. Include:
- Context: move towards plugin-owned UI using SPA/CIA/TDA principles.
- Decision: Introduce router and slot-based plugin mounting; migrate panels to plugins.
- Consequences: Clear boundaries, better testability, smaller core, plugins can evolve independently.

## Code pointers
- Current shell containers:
  - AppContent mounts ElementLibrary, Canvas, ControlPanel and initializes Conductor:
    - See:
````tsx path=RenderX/src/components/AppContent.tsx mode=EXCERPT
{showElementLibrary && <aside className="app-sidebar left"><ElementLibrary .../></aside>}
<section className="app-canvas"><Canvas .../></section>
{showControlPanel && <aside className="app-sidebar right"><ControlPanel/></aside>}
````
- Example plugin already powering data side of library:
  - Component Library Plugin:
````js path=RenderX/public/plugins/component-library-plugin/index.js mode=EXCERPT
export const sequence = { id:"load-components-symphony", ... };
export const handlers = { fetchComponentDefinitions: async (...) => { ... }, ... };
````

## Recommendation
- Here are recommendations to move forward:
  - A minimal SlotRouter component and route setup.
  - A manifest extension and loader to mount a React component exported by a plugin into a slot.
  - A first plugin UI (ControlPanel UI) to validate the mechanism.
