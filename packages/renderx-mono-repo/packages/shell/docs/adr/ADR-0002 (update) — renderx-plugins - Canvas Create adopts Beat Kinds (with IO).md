# ADR-0002 (update) — renderx-plugins: Canvas Create adopts Beat Kinds (with IO)

**Change summary:** Insert an **IO beat** to persist/register instance metadata (e.g., node registry, undo snapshot, cache of template) before DOM creation.

## Updated sequence: Canvas Create

```ts
export const sequence = {
  id: "canvas-component-create-symphony",
  movements: [{
    id: "create",
    beats: [
      { beat: 1, event: "canvas:component:resolve-template", handler: "resolveTemplate", kind: "pure" },
      { beat: 2, event: "canvas:component:register-instance", handler: "registerInstance", kind: "io" },      // NEW
      { beat: 3, event: "canvas:component:create",            handler: "createNode",       kind: "stage-crew" },
      { beat: 4, event: "canvas:component:notify-ui",         handler: "notifyUi",         kind: "pure" }
    ]
  }]
};
```

### Handlers layout & files

```
plugins/canvas-component/symphonies/
  create.arrangement.ts     // resolveTemplate (pure)
  create.io.ts              // registerInstance (io)  ← new
  create.stage-crew.ts      // createNode (stage-crew)
  create.notify.ts          // notifyUi (pure)
  create.symphony.ts        // sequence + handlers export
```

**`create.arrangement.ts` (pure)**

```ts
export const resolveTemplate = (data: any, ctx: any) => {
  const tpl = data.component?.template;
  if (!tpl) throw new Error("Missing component template.");
  ctx.payload.template = tpl;
  ctx.payload.nodeId = `rx-node-${Math.random().toString(36).slice(2, 8)}`;
};
```

**`create.io.ts` (io)**

```ts
export const registerInstance = async (data: any, ctx: any) => {
  const { nodeId, template } = ctx.payload;
  // Examples of IO responsibilities:
  // - persist node metadata to a KV/registry
  // - write undo snapshot / change journal
  // - cache template/style blob for quick rehydrate
  await ctx.io.kv.put(nodeId, {
    type: template.tag,
    classes: template.classes,
    style: template.style,
    createdAt: Date.now()
  });
  // (optional) await ctx.io.cache.put(`tpl:${template.tag}`, template);
};
```

**`create.stage-crew.ts` (stage-crew)**

```ts
export const createNode = (data: any, ctx: any) => {
  const tpl = ctx.payload.template;
  const id = ctx.payload.nodeId;
  const txn = ctx.stageCrew.beginBeat();

  // Optional CSS injection
  // ctx.stageCrew.injectRawCSS(serializeStyleToCSS(tpl.style));

  txn.create(`#${id}`, { tag: tpl.tag, classes: tpl.classes, text: tpl.text });
  txn.setPosition?.(id, data.position);
  txn.commit();

  ctx.payload.createdNode = { id, tag: tpl.tag, text: tpl.text, classes: tpl.classes, style: tpl.style, position: data.position };
};
```

**`create.notify.ts` (pure)**

```ts
export const notifyUi = (data: any, ctx: any) => {
  data?.onComponentCreated?.(ctx.payload.createdNode);
};
```

**`create.symphony.ts`**

```ts
import { resolveTemplate } from "./create.arrangement";
import { registerInstance } from "./create.io";
import { createNode } from "./create.stage-crew";
import { notifyUi } from "./create.notify";

export const sequence = /* sequence object above */;
export const handlers = { resolveTemplate, registerInstance, createNode, notifyUi };
```

---

## Library Load example with API + IO (pattern)

Use `api` to fetch, then `io` to cache, then notify UI:

```ts
export const sequence = {
  id: "library-load-symphony",
  movements: [{
    id: "load",
    beats: [
      { beat: 1, event: "library:components:fetch",  handler: "fetchComponents",  kind: "api" },
      { beat: 2, event: "library:components:cache",  handler: "cacheComponents",  kind: "io"  },
      { beat: 3, event: "library:components:notify", handler: "notifyUi",         kind: "pure"}
    ]
  }]
};
```

---

## Validator & lint updates (delta)

* CIA static rule:

  * `kind:"io"` → handler file must match `/\.io\.(t|j)sx?$/`.
  * `*.io.ts` files must not import StageCrew or DOM APIs.
* UI lint stays the same (UI cannot import DOM/StageCrew/**IO**/**API**). Add IO/API packages to the “no-restricted-imports” list for UI folders if needed.

---

## Test skeleton additions (Vitest)

Add a simple IO unit test to assert IO calls happen **only** in `io` beats.

**`__tests__/canvas-component/create.io.spec.ts`**

```ts
import { registerInstance } from "../../plugins/canvas-component/symphonies/create.io";

function makeCtx() {
  const ops: any[] = [];
  return {
    payload: { nodeId: "rx-node-abc123", template: { tag: "button", classes: ["rx-button"], style: {} } },
    io: {
      kv: { put: async (...a: any[]) => ops.push(["kv.put", ...a]) },
      cache: { put: async (...a: any[]) => ops.push(["cache.put", ...a]) }
    },
    _ops: ops
  };
}

it("persists node metadata to KV/cache", async () => {
  const ctx: any = makeCtx();
  await registerInstance({}, ctx);
  const names = ctx._ops.map(x => x[0]);
  expect(names).toContain("kv.put");
});
```

And a guard test (ensures `io` is not available in `pure` beats once Conductor guards are in):

```ts
it("throws when IO is accessed in a pure beat", () => {
  const ctx: any = { io: new Proxy({}, { get(){ throw new Error("IO not available in this beat"); }}) };
  expect(() => ctx.io.kv.put("k","v")).toThrow();
});
```

