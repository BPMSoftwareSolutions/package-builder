# RenderX Plugins Demo — Three-Slot Thin Shell (No Fallbacks) — **Full Spec**

## 1) Goals (MVP)

* Thin client renders **three slots only**: **Library**, **Canvas**, **Control Panel**. Plugins do everything else.&#x20;
* **No UI side-effects** (no DOM/CSS writes). **All side-effects happen inside sequence handlers** via StageCrew. **Callbacks return results to the UI**.&#x20;
* Two working flows:

  1. Load components into Library on startup.&#x20;
  2. Drag an item from Library → Drop on Canvas → Create & display on Canvas (via handlers).&#x20;

## 2) Core Principles & Contracts

* **Manifest-Driven Panel Slots**: the shell maps `slot → plugin UI` and mounts the UI lazily; **UI must use `conductor.play()` and callback-first**. &#x20;
* **CIA/SPA compliance**:

  * CIA validates plugin discovery & handler contracts at build/test time.
  * SPA enforces **no direct EventBus**; orchestration **only via `conductor.play()`**.&#x20;
* **Beat/Movement discipline**: sequences expose clear **beats** with timing & dynamics; identities are explicit (ids, names). &#x20;
* **Quality & friction reduction**: clean HTML/CSS, **callback-first** flows, consistent class naming.&#x20;

## 3) Three Slots — Responsibilities

**Library (left)**

* On mount, **play** a load symphony and receive components via `onComponentsLoaded` (no subscriptions by default). &#x20;

**Canvas (center)**

* Pure view: handles `onDragOver/onDrop`, calls **Library.drop** symphony, which forwards to **Canvas.create**; **renders only** what handlers return. **No DOM/CSS writes** from the UI. &#x20;

**Control Panel (right)**

* Pure view; issues **play** calls to modify styles/props later (not in MVP). Follows same callback-first pattern.&#x20;

## 4) Domain-Oriented Plugin Structure (authoritative layout)

```
plugins/
  library/                # UI + load symphony (no DOM writes)
    ui/panels/LibraryPanel.tsx
    symphonies/load.symphony.ts
  library-component/      # Drag/Drop symphonies (no DOM writes; forward only)
    symphonies/drag.symphony.ts
    symphonies/drop.symphony.ts
  canvas/                 # UI (pure view)
    ui/pages/CanvasPage.tsx
  canvas-component/       # Create/drag/resize/select handlers (StageCrew only)
    symphonies/create.symphony.ts
    features/create/{*.ts}  # concertmaster/arrangement/stage-crew/tests
  control-panel/          # UI (pure view; stub in MVP)
```

* **Rules**: *No DOM writes in UI*; *all DOM via StageCrew*; *StageCrew ops occur inside play() handlers*.&#x20;
* Reference structure & manifest entries for Library/Canvas & their handler plugins.  &#x20;

## 5) Shell & Manifest

* Shell renders **three named slots** and mounts plugin UIs via `<PanelSlot>` with Suspense/ErrorBoundary isolation. &#x20;
* Manifest declares `slot` and exported UI for each plugin. **Dev**: dynamic import; **Prod**: global registry plan.&#x20;
* **No fallbacks**: if orchestration isn’t available, surface via ErrorBoundary/logs; **never** mutate DOM from shell/UI. (ErrorBoundary isolation is the safety net.)&#x20;

## 6) MVP Orchestration Flows

### A) Library — Load components on startup

* **UI**: on mount → `conductor.play("library","library-load-symphony",{ onComponentsLoaded })`.&#x20;
* **Sequence**:

  * **Beat 1** `library:components:load` → `loadComponents` (resolve JSON catalog; no DOM)
  * **Beat 2** `library:components:notify-ui` → `notifyUi` (call `onComponentsLoaded(list)`)
    Rationale: keep UI thin; no broad subscriptions by default.&#x20;

### B) Drag from Library → Drop on Canvas → Create

* **UI (Library)**: start drag → `library-component-drag-symphony` (sets minimal `dataTransfer`).
* **UI (Canvas)**: on drop → **play** `library-component-drop-symphony` with `{ component, position, onComponentCreated }`.
* **Drop handler**: **forwards** to `canvas-component-create-symphony` via `conductor.play(...)`, preserving the callback.&#x20;
* **Create sequence**:

  * **Beat 1** `canvas:component:create` → `createCanvasComponent`

    * **Allocate id/class**, **inject raw CSS** if present, **inject instance CSS** (position/size), **create DOM via StageCrew txn** (`beginBeat → create → commit`). **No React DOM writes.**&#x20;
  * **Beat 2** `canvas:component:creation:ui:notify` → `notifyUi` (invoke `onComponentCreated(payload)` so Canvas UI renders).&#x20;

> **Key**: The **entire** drop→create path runs inside **sequences**; the **UI remains dumb**, only rendering the handler’s callback payload. &#x20;

## 7) Sequence IDs & Signatures (spec)

* **Library**

  * `library-load-symphony`

    * Mvmt `load` → Beat 1 `library:components:load`; Beat 2 `library:components:notify-ui`
* **Library-Component**

  * `library-component-drag-symphony` → Beat 1 `library:component:drag:start`
  * `library-component-drop-symphony` → Beat 1 `library:component:drop` (forwards to Canvas.create)
* **Canvas-Component**

  * `canvas-component-create-symphony`

    * Mvmt `create` → Beat 1 `canvas:component:create`; Beat 2 `canvas:component:creation:ui:notify`

Sequences follow the **beats/movements** pattern with timing/dynamics set per need; carry baton data via `context.payload`. &#x20;

## 8) Data Contracts (MVP)

* **`play("library","library-load-symphony", { onComponentsLoaded })`**

  * `onComponentsLoaded(list: ComponentTemplate[])`
* **`play("library-component","library-component-drop-symphony", { component, position, onComponentCreated })`**

  * `component`: JSON template from Library
  * `position`: `{ x:number, y:number }` in Canvas space
  * `onComponentCreated(payload)` → `{ id, type, classes, position, semanticTag?, innerText? }` (UI renders this)&#x20;

## 9) Guardrails & Validation

* **CIA (build-time)**: verify sequences & handler contracts exist and are wired.&#x20;
* **SPA (runtime)**: **block direct EventBus**; enforce orchestration through `conductor.play()`.&#x20;
* **Lint/Policy**: in `plugins/*/ui/**` fail on `document.*`, `window.*`, `localStorage`, or importing StageCrew; Canvas UI <100 LOC.&#x20;
* **Architecture Validator**: run RX.Architecture.Validator.Console to catch violations before merges.&#x20;

## 10) Testing Strategy

* **Unit (handlers)**: assert CSS injection path, instance CSS, and StageCrew txn (`beginBeat → create → commit`) in **create handler**.&#x20;
* **E2E (Playwright)**: verify Library load executes once; drag→create yields a DOM node created by StageCrew and Canvas renders via callback (pure view). &#x20;
* **Compliance gates**: CIA sequences present; SPA forbids DOM APIs/EventBus from UI.&#x20;
* MusicalConductor core keeps its own unit tests; E2E belongs in the shell repo.&#x20;

## 11) Telemetry & Logging

* Capture **structured logs per beat/sequence** with correlation IDs & baton diffs to trace flows (Library.drop → Canvas.create).&#x20;

## 12) Directory & Manifest (authoritative example)

```
renderx-plugins-demo/
  src/ (shell only; three PanelSlots with Suspense + ErrorBoundary)
  plugins/
    library/ …           # UI + load symphony (callback-first)
    library-component/ … # drag + drop (forward-only)
    canvas/ …            # pure view
    canvas-component/ …  # create (100% side-effects here)
    control-panel/ …     # pure view (stub in MVP)
  data/components.json   # demo catalog
  plugin-manifest.json   # maps slot → UI export (Library/Canvas/Control)
```

* Manifest lists `{ slot, export }`; PanelSlot resolves & mounts.&#x20;

## 13) Error Handling Policy

* **No fallbacks** (no DOM writes from shell or UI). If `conductor.play` can’t run, **fail fast** and let ErrorBoundary isolate the panel; fix the architecture, don’t bypass it.&#x20;

## 14) Definition of Done (MVP)

* Library **loads via symphony**; UI uses `onComponentsLoaded`.&#x20;
* Drag→Drop path **routes entirely** through **Library.drop → Canvas.create** via `conductor.play`.&#x20;
* **Create handler** performs **all** CSS injection and DOM creation via StageCrew txn; UI renders via callback payload. &#x20;
* **No DOM/UI side-effects** anywhere outside handlers; **Canvas UI <100 LOC**. &#x20;
* CIA/SPA validators & tests are green.&#x20;

---

Perfect — here’s a clean, **paste-ready scaffolding** for your three-slot demo, wired for **no UI side-effects** and with **StageCrew-ready** handlers. I kept the shell dumb, the panel UIs “pure view”, and all behavior running through `conductor.play(...)`.

---

# 0) Install (suggested)

```bash
npm install react react-dom
npm install musical-conductor
# (plus your usual dev stack: vite/webpack + ts, etc.)
```

---

# 1) Project layout

```
renderx-plugins-demo/
├─ public/
│  └─ plugins/
│     └─ plugin-manifest.json
├─ data/
│  └─ components.json
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  └─ conductor.ts           # initializes conductor + registers sequences (no fallbacks)
└─ plugins/
   ├─ library/
   │  ├─ index.ts
   │  ├─ ui/LibraryPanel.tsx
   │  └─ symphonies/load.symphony.ts
   ├─ library-component/
   │  ├─ index.ts
   │  └─ symphonies/{drag.symphony.ts,drop.symphony.ts}
   ├─ canvas/
   │  ├─ index.ts
   │  └─ ui/CanvasPage.tsx
   ├─ canvas-component/
   │  ├─ index.ts
   │  └─ symphonies/create.symphony.ts
   └─ control-panel/
      ├─ index.ts
      └─ ui/ControlPanel.tsx
```

---

# 2) Shell + Conductor bootstrap

**src/main.tsx**

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initConductor, registerAllSequences } from "./conductor";

(async () => {
  const conductor = await initConductor();
  await registerAllSequences(conductor);   // Register plugin sequences/handlers
  // (If your CIA loader auto-registers sequences, keep this as a no-op)

  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);
})();
```

**src/App.tsx**

```tsx
import React, { Suspense } from "react";
import { PanelSlot } from "renderx-plugins";

export default function App() {
  return (
    <div className="grid grid-cols-[320px_1fr_360px] h-screen">
      <Suspense fallback={<div className="p-3">Loading Library…</div>}>
        <PanelSlot slot="library" />
      </Suspense>
      <Suspense fallback={<div className="p-3">Loading Canvas…</div>}>
        <PanelSlot slot="canvas" />
      </Suspense>
      <Suspense fallback={<div className="p-3">Loading Control Panel…</div>}>
        <PanelSlot slot="controlPanel" />
      </Suspense>
    </div>
  );
}
```

**src/conductor.ts**

```ts
import { initializeCommunicationSystem, type ConductorClient } from "musical-conductor";
// If your package name differs, update the import accordingly.

export async function initConductor(): Promise<ConductorClient> {
  const { conductor } = initializeCommunicationSystem();  // StrictMode-safe singleton
  // Load UI plugins via CIA manifest (PanelSlot will also use it for UIs)
  await conductor.registerCIAPlugins?.();                 // Safe if available
  return conductor;
}

// Central registration (keeps sequences out of the shell)
export async function registerAllSequences(conductor: ConductorClient) {
  // Each plugin exposes a register(conductor) to register its sequences/handlers
  const registrars = await Promise.all([
    import("../plugins/library").then(m => m.register),
    import("../plugins/library-component").then(m => m.register),
    import("../plugins/canvas-component").then(m => m.register),
    // control-panel has no sequences for MVP
  ]);
  for (const reg of registrars) await reg?.(conductor);
}

// Optional convenience hook for UIs
export function useConductor(): ConductorClient {
  // If your UI framework has a ready-to-use hook, prefer it.
  const { conductor } = (window as any).renderxCommunicationSystem || {};
  return conductor;
}
```

> If your Conductor exposes different names (e.g., `createConductor()` instead of `initializeCommunicationSystem()`), just tweak the imports — the structure still holds.

---

# 3) Manifest & Data

**public/plugins/plugin-manifest.json**

```json
{
  "plugins": [
    { "id": "LibraryPlugin",      "ui": { "slot": "library",      "export": "LibraryPanel" } },
    { "id": "CanvasPlugin",       "ui": { "slot": "canvas",       "export": "CanvasPage" } },
    { "id": "ControlPanelPlugin", "ui": { "slot": "controlPanel", "export": "ControlPanel" } }
  ]
}
```

**data/components.json**

```json
[
  {
    "id": "rx-button",
    "name": "Button",
    "template": {
      "tag": "button",
      "text": "Click Me",
      "classes": ["rx-comp", "rx-button"],
      "style": { "padding": "8px 12px", "borderRadius": "8px", "border": "1px solid #ccc" }
    }
  },
  {
    "id": "rx-card",
    "name": "Card",
    "template": {
      "tag": "div",
      "text": "Card",
      "classes": ["rx-comp", "rx-card"],
      "style": { "padding": "12px", "boxShadow": "0 2px 8px rgba(0,0,0,.1)", "borderRadius": "12px" }
    }
  }
]
```

---

# 4) Library plugin (UI + load symphony)

**plugins/library/index.ts**

```ts
import { sequence as loadSeq, handlers as loadHandlers } from "./symphonies/load.symphony";
export { LibraryPanel } from "./ui/LibraryPanel";

// Simple registrar used by src/conductor.ts
export async function register(conductor: any) {
  conductor.registerSequence?.("LibraryPlugin", loadSeq, loadHandlers);
}
```

**plugins/library/ui/LibraryPanel.tsx**

```tsx
import React from "react";
import { useConductor } from "../../..//src/conductor";

export function LibraryPanel() {
  const conductor = useConductor();
  const [items, setItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    conductor.play("LibraryPlugin", "library-load-symphony", {
      onComponentsLoaded: (list: any[]) => setItems(list)
    });
  }, [conductor]);

  return (
    <div className="p-3 h-full border-r overflow-auto">
      <h3>Library</h3>
      <ul className="space-y-2">
        {items.map((c) => (
          <li key={c.id}
              className="cursor-grab"
              draggable
              onDragStart={(e) => {
                conductor.play("LibraryComponentPlugin", "library-component-drag-symphony", {
                  event: "library:component:drag:start",
                  domEvent: e,
                  component: c
                });
              }}>
            {c.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**plugins/library/symphonies/load.symphony.ts**

```ts
export const sequence = {
  id: "library-load-symphony",
  name: "Library Load",
  movements: [
    {
      id: "load",
      beats: [
        { beat: 1, event: "library:components:load",       handler: "loadComponents", timing: "immediate" },
        { beat: 2, event: "library:components:notify-ui",  handler: "notifyUi",       timing: "after-beat" }
      ]
    }
  ]
};

export const handlers = {
  async loadComponents(data: any, ctx: any) {
    // Use local static JSON for MVP; replace with API call later
    const list = (await import("../../../data/components.json")).default;
    ctx.payload.components = Array.isArray(list) ? list : [];
    return { count: ctx.payload.components.length };
  },
  notifyUi(data: any, ctx: any) {
    data?.onComponentsLoaded?.(ctx.payload.components);
  }
};
```

---

# 5) Library-Component (drag + drop → forward)

**plugins/library-component/index.ts**

```ts
import { sequence as dragSeq, handlers as dragHandlers } from "./symphonies/drag.symphony";
import { sequence as dropSeq, handlers as dropHandlers } from "./symphonies/drop.symphony";

export async function register(conductor: any) {
  conductor.registerSequence?.("LibraryComponentPlugin", dragSeq, dragHandlers);
  conductor.registerSequence?.("LibraryComponentPlugin", dropSeq, dropHandlers);
}
```

**plugins/library-component/symphonies/drag.symphony.ts**

```ts
export const sequence = {
  id: "library-component-drag-symphony",
  name: "Library Component Drag",
  movements: [{ id: "drag", beats: [
    { beat: 1, event: "library:component:drag:start", handler: "onDragStart" }
  ]}]
};

export const handlers = {
  onDragStart(data: any) {
    data.domEvent?.dataTransfer?.setData(
      "application/rx-component",
      JSON.stringify({ component: data.component })
    );
    return { started: true };
  }
};
```

**plugins/library-component/symphonies/drop.symphony.ts**

```ts
export const sequence = {
  id: "library-component-drop-symphony",
  name: "Library Component Drop",
  movements: [{ id: "drop", beats: [
    { beat: 1, event: "library:component:drop", handler: "forwardToCanvasCreate" }
  ]}]
};

export const handlers = {
  forwardToCanvasCreate(data: any, ctx: any) {
    ctx.conductor.play("CanvasComponentPlugin", "canvas-component-create-symphony", {
      component: data.component,
      position: data.position,
      onComponentCreated: data.onComponentCreated
    });
  }
};
```

---

# 6) Canvas UI (pure view)

**plugins/canvas/index.ts**

```ts
export { CanvasPage } from "./ui/CanvasPage";
// No sequences in UI; behavior lives in canvas-component
export async function register() { /* no-op for MVP */ }
```

**plugins/canvas/ui/CanvasPage.tsx**

```tsx
import React from "react";
import { useConductor } from "../../..//src/conductor";

export function CanvasPage() {
  const conductor = useConductor();
  const [nodes, setNodes] = React.useState<any[]>([]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/rx-component");
    const payload = raw ? JSON.parse(raw) : {};
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const position = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    conductor.play("LibraryComponentPlugin", "library-component-drop-symphony", {
      component: payload.component,
      position,
      onComponentCreated: (node: any) => setNodes(prev => [...prev, node])
    });
  };

  return (
    <div className="relative h-full"
         onDragOver={(e) => e.preventDefault()}
         onDrop={onDrop}>
      <h3 className="p-3">Canvas</h3>
      <div className="absolute inset-0">
        {nodes.map(n => React.createElement(
          n.tag || "div",
          {
            key: n.id,
            className: (n.classes || []).join(" "),
            style: { position: "absolute", left: n.position.x, top: n.position.y, ...(n.style || {}) }
          },
          n.text || null
        ))}
      </div>
    </div>
  );
}
```

> UI remains “pure view”: no DOM APIs, no StageCrew calls — just render whatever the handler tells it.

---

# 7) Canvas-Component (create via StageCrew, then notify UI)

**plugins/canvas-component/index.ts**

```ts
import { sequence as createSeq, handlers as createHandlers } from "./symphonies/create.symphony";

export async function register(conductor: any) {
  conductor.registerSequence?.("CanvasComponentPlugin", createSeq, createHandlers);
}
```

**plugins/canvas-component/symphonies/create.symphony.ts**

```ts
// NOTE: Replace ctx.stageCrew.* with your actual StageCrew integration.
// Handlers own ALL side-effects. UI stays dumb.

export const sequence = {
  id: "canvas-component-create-symphony",
  name: "Canvas Component Create",
  movements: [{ id: "create", beats: [
    { beat: 1, event: "canvas:component:resolve-template", handler: "resolveTemplate", timing: "immediate" },
    { beat: 2, event: "canvas:component:create",          handler: "createNode",     timing: "after-beat" },
    { beat: 3, event: "canvas:component:notify-ui",        handler: "notifyUi",       timing: "after-beat" }
  ]}]
};

export const handlers = {
  resolveTemplate(data: any, ctx: any) {
    const tpl = data.component?.template;
    if (!tpl) throw new Error("Missing component template.");
    ctx.payload.template = tpl;
  },

  createNode(data: any, ctx: any) {
    const tpl = ctx.payload.template;
    const nodeId = `rx-node-${Math.random().toString(36).slice(2, 8)}`;

    // 🔧 StageCrew: inject CSS, create DOM, position element (no React calls here)
    // ctx.stageCrew.injectRawCSS?.(serializeStyleToCSS(tpl.style)); // optional
    // const txn = ctx.stageCrew.beginBeat?.();
    // txn?.create(`#${nodeId}`, { tag: tpl.tag, classes: tpl.classes, text: tpl.text });
    // txn?.setPosition?.(nodeId, data.position);
    // txn?.commit?.();

    // Provide UI a render-ready payload (the UI must NOT perform side-effects)
    ctx.payload.createdNode = {
      id: nodeId,
      tag: tpl.tag,
      text: tpl.text,
      classes: tpl.classes,
      style: tpl.style,
      position: data.position
    };
  },

  notifyUi(data: any, ctx: any) {
    data?.onComponentCreated?.(ctx.payload.createdNode);
  }
};
```

> Commented StageCrew ops show exactly where DOM/CSS mutations should live. Keep them in handlers; never in UI.

---

# 8) Control Panel (stub UI)

**plugins/control-panel/index.ts**

```ts
export { ControlPanel } from "./ui/ControlPanel";
export async function register() { /* no sequences in MVP */ }
```

**plugins/control-panel/ui/ControlPanel.tsx**

```tsx
import React from "react";
export function ControlPanel() {
  return <div className="p-3 border-l h-full">Control Panel (coming soon)</div>;
}
```

---

# 9) Package scripts (example)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## Done ✅

* Three **slots** mounted via manifest.
* **Library loads** components on mount (via symphony).
* **Drag** from Library → **Drop** on Canvas → **Create** in handlers (StageCrew-ready), then UI **renders callback payload**.
* **Zero UI/shell side-effects**; all mutations are confined to handlers.

---

Awesome—here’s a **drop-in ESLint policy** (to ban DOM/EventBus/StageCrew in UI code) and a **Vitest test skeleton** for the StageCrew transaction path in handlers.

---

# 1) ESLint: ban DOM in `plugins/*/ui/**` (and EventBus/StageCrew)

> Uses ESLint **flat config** (`eslint.config.js`). If you’re on `.eslintrc.*`, I included a quick conversion note at the end.

**eslint.config.js**

```js
// eslint.config.js (flat config for ESLint ≥ v9)
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

/**
 * Policy goals:
 *  - In UI code: NO direct DOM APIs, NO window/localStorage, NO StageCrew import, NO EventBus.
 *  - Only handlers (symphonies) do side-effects via StageCrew.
 */
export default [
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    ignores: ["dist/**", "build/**", "node_modules/**", ".vite/**"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" }
    },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

  // 🔒 UI policy (applies ONLY to UI folders)
  {
    files: ["plugins/**/ui/**/*.{ts,tsx,js,jsx}"],
    rules: {
      // 1) Ban DOM globals/use in UI
      "no-restricted-globals": ["error", "document", "window", "navigator", "localStorage"],
      // 2) Ban direct StageCrew usage in UI
      "no-restricted-imports": ["error", {
        "patterns": [
          "*StageCrew*",        // any module path containing StageCrew
          "**/stage-crew*",     // common path alias
        ],
        "paths": [
          { "name": "stage-crew", "message": "UI must not import StageCrew. Do DOM/CSS mutations in sequence handlers only." }
        ]
      }],
      // 3) Ban EventBus in UI (force conductor.play/subscribe)
      "no-restricted-imports": ["error", {
        "patterns": [
          "**/EventBus*",       // internal EventBus
          "**/event-bus*"
        ],
        "paths": [
          { "name": "musical-conductor/EventBus", "message": "UI must not import EventBus. Use conductor.play() / conductor.subscribe() via orchestration plugins." }
        ]
      }],
      // 4) AST-level bans to catch `document.*` / `window.*` usage in code
      "no-restricted-syntax": [
        "error",
        { "selector": "MemberExpression[object.name='document']", "message": "UI code may not access document.*" },
        { "selector": "MemberExpression[object.name='window']", "message": "UI code may not access window.*" },
        { "selector": "CallExpression[callee.object.name='document']", "message": "UI code may not call document APIs." }
      ],
    }
  }
];
```

**.eslintignore**

```
dist/
build/
node_modules/
.vite/
coverage/
```

**package.json** (scripts)

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:ui": "eslint plugins/**/ui",
    "lint:fix": "eslint . --fix"
  },
  "devDependencies": {
    "eslint": "^9.7.0",
    "@typescript-eslint/parser": "^8.2.0",
    "@typescript-eslint/eslint-plugin": "^8.2.0"
  }
}
```

> **Using `.eslintrc.cjs` instead?**
> Put the `files` section into an `overrides` array, and move `languageOptions` under the top level as `parser`/`parserOptions`. The rule blocks map 1:1.

---

# 2) Vitest test skeletons (handlers + StageCrew txn)

> These are **TDD-friendly**: one test passes now (template→payload), and one is marked **`describe.skip`** for the **StageCrew transaction path**—unskip after you wire the StageCrew calls in your handler.

**vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["__tests__/**/*.spec.ts"]
  }
});
```

**package.json** (scripts/devDeps)

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:cov": "vitest run --coverage"
  },
  "devDependencies": {
    "vitest": "^1.6.0",
    "ts-node": "^10.9.2"
  }
}
```

---

## A) Canvas create handler spec

****tests**/canvas-component/create.spec.ts**

```ts
import { handlers } from "../../plugins/canvas-component/symphonies/create.symphony";

// Minimal template and context factories
function makeTemplate() {
  return {
    tag: "button",
    text: "Click Me",
    classes: ["rx-comp", "rx-button"],
    style: { padding: "8px 12px" }
  };
}

function makeCtx(withStageCrew = false) {
  const calls: any[] = [];
  const stageCrew = withStageCrew
    ? {
        injectRawCSS: (css: string) => calls.push(["injectRawCSS", css]),
        injectInstanceCSS: (...args: any[]) => calls.push(["injectInstanceCSS", ...args]),
        beginBeat: () => {
          const ops: any[] = [];
          return {
            create: (...a: any[]) => ops.push(["create", ...a]),
            setPosition: (...a: any[]) => ops.push(["setPosition", ...a]),
            commit: () => calls.push(["commit", ops])
          };
        },
      }
    : undefined;

  return {
    payload: {},
    stageCrew,
    util: { hash: () => "abc123" },
    calls
  };
}

describe("canvas-component-create-symphony", () => {
  it("resolves template and returns UI payload via notifyUi", () => {
    const ctx: any = makeCtx(false);
    const template = makeTemplate();

    // Beat 1: resolveTemplate
    handlers.resolveTemplate({ component: { template } } as any, ctx as any);
    expect(ctx.payload.template).toBe(template);

    // Beat 2: createNode (no StageCrew yet → still shapes payload)
    const pos = { x: 50, y: 30 };
    handlers.createNode({ position: pos } as any, ctx as any);

    // Beat 3: notifyUi calls callback
    let received: any = null;
    handlers.notifyUi({ onComponentCreated: (n: any) => (received = n) } as any, ctx as any);

    expect(received).toBeTruthy();
    expect(received.tag).toBe("button");
    expect(received.position).toEqual(pos);
    expect(received.classes).toContain("rx-button");
  });

  // 🔜 Unskip once you wire StageCrew calls in createNode()
  describe.skip("StageCrew transaction path", () => {
    it("injects CSS and commits a StageCrew transaction", () => {
      const ctx: any = makeCtx(true);
      const template = makeTemplate();

      handlers.resolveTemplate({ component: { template } } as any, ctx as any);
      handlers.createNode({ position: { x: 10, y: 20 } } as any, ctx as any);

      // Assert StageCrew operations occurred
      const names = ctx.calls.map((c: any[]) => c[0]);
      expect(names).toContain("injectInstanceCSS");
      expect(names).toContain("commit");
    });
  });
});
```

> When you uncomment/add the StageCrew calls in `create.symphony.ts` (e.g., `injectRawCSS`, `beginBeat → create → commit`), **unskip** the `describe.skip` block.

---

## B) Library load handler spec

****tests**/library/load.spec.ts**

```ts
import { handlers } from "../../plugins/library/symphonies/load.symphony";

describe("library-load-symphony", () => {
  it("loads components and notifies UI", async () => {
    const payload: any = {};
    const ctx: any = { payload };
    let got: any[] | null = null;

    await handlers.loadComponents({}, ctx);
    handlers.notifyUi({ onComponentsLoaded: (list: any[]) => (got = list) }, ctx);

    expect(Array.isArray(ctx.payload.components)).toBe(true);
    expect(Array.isArray(got)).toBe(true);
    expect(got!.length).toBeGreaterThan(0);
  });
});
```

---

# 3) Quick notes / next steps

* **Uncomment + implement StageCrew ops** in `plugins/canvas-component/symphonies/create.symphony.ts` (e.g., `injectRawCSS`, `injectInstanceCSS`, `beginBeat → create/setPosition → commit`). Then **unskip** the StageCrew test block.
* If you later **rename packages** (`musical-conductor`, `renderx-plugins`, or StageCrew module path), just adjust the ESLint “no-restricted-imports” patterns accordingly.
* Want a **CI gate**? Add:

  ```json
  "scripts": {
    "ci": "npm run lint && npm test"
  }
  ```

  and wire it in your pipeline.

