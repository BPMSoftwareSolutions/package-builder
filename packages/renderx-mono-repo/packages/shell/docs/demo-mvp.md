Below is a concrete, minimal file layout plus the tiny bits of code you need for the MVP behavior:

* load components into the Library on startup
* drag a Library item to the Canvas and show it there

I’m keeping side‑effects inside sequence handlers (via StageCrew) and the UI “dumb” (callback‑first via `conductor.play`). This follows the manifest‑driven panel‑slot plugin pattern and the domain‑oriented structure already captured in your ADRs.    &#x20;

# File layout (three slots, domain‑oriented)

```
renderx-plugins-demo/
  plugins/
    app-shell/
      index.ts
      manifest.json                # maps slots → plugin UI exports (dev) 
    library/                       # UI for Library (Left slot)
      index.ts
      ui/panels/LibraryPanel.tsx   # thin UI, calls play() + uses callbacks
      symphonies/load.symphony.ts  # orchestrates component loading (no DOM)
    library-component/             # non-UI behaviors for Library items
      index.ts
      symphonies/drag.symphony.ts  # start/drag/leave (no DOM)
      symphonies/drop.symphony.ts  # forwards to Canvas create via play()
      features/drag/*              # (optional keep thin for MVP)
      features/drop/*
    canvas/                         # UI for Canvas (Center slot)
      index.ts
      ui/pages/CanvasPage.tsx      # pure view; onDrop → play(); onCreated → setState
    canvas-component/               # non-UI behaviors for Canvas components
      index.ts
      symphonies/create.symphony.ts
      features/create/
        create.concertmaster.ts     # orchestration helpers (data prep)
        create.arrangement.ts       # shape/validate data baton
        create.stage-crew.ts        # ALL DOM/CSS mutations happen here
        create.rehearsal.test.ts    # unit “txn intents” tests (later)
    control-panel/                  # UI for Control Panel (Right slot; can be stub)
      index.ts
      ui/panels/ControlPanel.tsx    # empty stub for now
```

Why this shape?

* Slots are resolved via a manifest and each slot UI is “thin”; the UI calls `conductor.play` and accepts results via callbacks (Suspense/ErrorBoundary in the shell).&#x20;
* No DOM/CSS writes in UI; all side‑effects happen inside sequence handlers via StageCrew transactions.&#x20;
* Library drop forwards to Canvas create entirely through symphonies, preserving callbacks.&#x20;

# Minimal manifest (three slots)

```json
// plugins/app-shell/manifest.json
{
  "ui": [
    { "slot": "left",   "export": "LibraryPanel" },
    { "slot": "center", "export": "CanvasPage" },
    { "slot": "right",  "export": "ControlPanel" }
  ]
}
```

(Your shell’s `<PanelSlot>` reads this and lazy‑mounts the plugin UI per ADR‑0014.)&#x20;

# 1) Library: load on startup + expose drag data

**Library UI (thin):**

```tsx
// plugins/library/ui/panels/LibraryPanel.tsx
import * as React from "react";
import { useConductor } from "@/app-shell/useConductor";

export function LibraryPanel() {
  const conductor = useConductor();
  const [items, setItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    // Orchestration-first: load items
    conductor.play("library", "library-load-symphony", {
      onComponentsLoaded: (components: any[]) => setItems(components)
    });
  }, [conductor]);

  return (
    <div className="rx-library">
      {items.map(comp => (
        <div
          key={comp.id}
          className="rx-lib-item"
          draggable
          onDragStart={(e) => {
            // Delegate behavior to sequence; UI just provides raw DOM data/ref
            conductor.play("library-component", "library-component-drag-symphony", {
              event: "library:component:drag:start",
              domEvent: e,
              component: comp
            });
          }}
        >
          {comp.title}
        </div>
      ))}
    </div>
  );
}
export const LibraryPanel as any; // ensure named export for manifest loader
```

**Library load symphony (no DOM effects):**

```ts
// plugins/library/symphonies/load.symphony.ts
export const sequence = {
  id: "library-load-symphony",
  name: "Library Load",
  movements: [
    { id: "init", beats: [
      { beat: 1, event: "library:components:load", handler: "loadComponents" },
      { beat: 2, event: "library:components:notify-ui", handler: "notifyUi" }
    ]}
  ]
};

export const handlers = {
  async loadComponents(data: any, ctx: any) {
    // e.g., fetch JSON catalog or use local static set for MVP
    const components = await ctx.resources.libraryCatalog.getAll();
    ctx.payload.components = components;
    return { ok: true };
  },
  notifyUi(data: any) {
    data.onComponentsLoaded?.(data._payload.components);
  }
};
```

# 2) Library → Canvas: drag/drop forwards to Canvas create

**Library component drag/drop symphonies (forward‑only orchestration):**

```ts
// plugins/library-component/symphonies/drag.symphony.ts
export const sequence = {
  id: "library-component-drag-symphony",
  name: "Library Component Drag",
  movements: [{ id: "drag", beats: [
    { beat: 1, event: "library:component:drag:start", handler: "onDragStart" }
  ]}]
};

export const handlers = {
  onDragStart(data: any) {
    // Put minimal info on the native DT; detailed work happens later
    data.domEvent.dataTransfer?.setData("application/rx-component",
      JSON.stringify({ component: data.component }));
    return { started: true };
  }
};
```

```ts
// plugins/library-component/symphonies/drop.symphony.ts
export const sequence = {
  id: "library-component-drop-symphony",
  name: "Library Component Drop",
  movements: [{ id: "drop", beats: [
    { beat: 1, event: "library:component:drop", handler: "forwardToCanvasCreate" }
  ]}]
};

export const handlers = {
  forwardToCanvasCreate(data: any, ctx: any) {
    // Forward to Canvas create, preserving UI callback
    ctx.conductor.play("canvas-component", "canvas-component-create-symphony", {
      component: data.component,
      position: data.position,
      onComponentCreated: data.onComponentCreated
    });
  }
};
```

The “drag → drop → forward” pattern is the recommended orchestration path before Canvas creation; the UI stays dumb, and callbacks carry results back. &#x20;

# 3) Canvas UI (pure view) + onDrop → play()

```tsx
// plugins/canvas/ui/pages/CanvasPage.tsx
import * as React from "react";
import { useConductor } from "@/app-shell/useConductor";

type Node = { id: string; classes: string; type: string; position: {x:number;y:number}, semanticTag?: string, innerText?: string };

export function CanvasPage() {
  const conductor = useConductor();
  const [nodes, setNodes] = React.useState<Node[]>([]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/rx-component");
    const payload = JSON.parse(raw || "{}");
    const position = { x: e.clientX, y: e.clientY };

    conductor.play("library-component", "library-component-drop-symphony", {
      component: payload.component,
      position,
      onComponentCreated: (node: Node) => setNodes(prev => [...prev, node])
    });
  };

  return (
    <div
      className="rx-canvas"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {nodes.map(n => {
        const Tag = (n.semanticTag as any) || "div";
        return <Tag key={n.id} id={n.id} className={n.classes}>{n.innerText}</Tag>;
      })}
    </div>
  );
}
export const CanvasPage as any;
```

Note: Canvas UI never writes DOM/CSS imperatively; it only renders what the handler says was created, per the “pure view” target state.&#x20;

# 4) Canvas create symphony (handlers do 100% of side‑effects)

```ts
// plugins/canvas-component/symphonies/create.symphony.ts
export const sequence = {
  id: "canvas-component-create-symphony",
  name: "Canvas Component Create",
  movements: [{ id: "create", beats: [
    { beat: 1, event: "canvas:component:create", handler: "createCanvasComponent" },
    { beat: 2, event: "canvas:component:creation:ui:notify", handler: "notifyUi" }
  ]}]
};

export const handlers = {
  createCanvasComponent(data: any, ctx: any) {
    const { component, position } = data;

    // Allocate identity
    const type = component.type || "div";
    const id = `rx-comp-${type}-${ctx.util.hash()}`
    const classes = `rx-node ${component.ui?.className || ""}`.trim();

    // Inject CSS (template + instance) and create DOM via StageCrew txn
    if (component.ui?.styles?.css) {
      ctx.stageCrew.injectRawCSS(component.ui.styles.css);
    }
    ctx.stageCrew.injectInstanceCSS(ctx, { id, position }, component.ui?.w || 120, component.ui?.h || 60);

    const txn = ctx.stageCrew.beginBeat();
    txn.create(`#${id}`, { tag: component.ui?.tag || "div", classes, text: component.ui?.text || "" });
    txn.commit();

    // Provide render-ready payload for the dumb Canvas UI
    return {
      created: true,
      id,
      cssClass: classes,
      type,
      position,
      semanticTag: component.ui?.tag || "div",
      innerText: component.ui?.text || ""
    };
  },

  notifyUi(data: any) {
    data.onComponentCreated?.({
      id: data.id,
      classes: data.cssClass,
      type: data.type,
      position: data.position,
      semanticTag: data.semanticTag,
      innerText: data.innerText
    });
  }
};
```

This exactly matches the “all side‑effects in handlers via StageCrew; UI only renders after callback” pattern. Beats 1 & 2 (`create` then `notify-ui`) are the recommended split. &#x20;

# MVP checklist (what to wire now)

* Panel slots: Left=Library, Center=Canvas, Right=Control Panel (stub) via manifest + `<PanelSlot>`.&#x20;
* Library:

  * `library-load-symphony` with `loadComponents` → `notifyUi` callback to fill the panel.
* Drag/Drop:

  * `library-component-drag-symphony` sets `dataTransfer`.
  * `library-component-drop-symphony` forwards to `canvas-component-create-symphony` via `conductor.play`, carrying `onComponentCreated`.&#x20;
* Canvas:

  * `CanvasPage` handles `onDrop` → calls `play('library-component','...drop...')` and appends node on callback; **no** DOM/CSS writes in the UI.&#x20;
* Create:

  * `canvas-component-create-symphony` Beat 1 injects CSS + StageCrew txn create; Beat 2 notifies UI.&#x20;
