# Callbacks Pattern (Client API)

Goal: Keep the client decoupled from plugin internals. Use callbacks for direct outcomes initiated by the UI; reserve domain events (via beats) for multi-consumer updates.

- Client initiates via ConductorClient.play()
- Handlers invoke callbacks from the play() context
- Beats are still defined for sequencing/logging/Data Baton

## When to use
- Selection overlays (show/hide)
- Dragging (frequent position updates)
- Resizing (frequent box updates)
- Any request/response style operation where the caller is the sole consumer

## Selection (onSelectionChange)
```ts
// React
conductor.play(
  "Canvas.component-select-symphony",
  "Canvas.component-select-symphony",
  { elementId, onSelectionChange: (id: string | null) => setSelectedId(id) }
);

// Plugin
export const sequence = {
  id: "Canvas.component-select-symphony",
  name: "Canvas Component Selection Symphony",
  movements: [{ id: "selection", beats: [
    { beat: 1, event: "canvas:selection:show", handler: "handleSelect" },
    { beat: 2, event: "canvas:selection:hide", handler: "handleFinalize" },
  ]}]
};
export const handlers = {
  handleSelect: ({ elementId, onSelectionChange }) => { onSelectionChange?.(elementId); return { elementId }; },
  handleFinalize: ({ elementId, onSelectionChange }) => { if (elementId == null) onSelectionChange?.(null); return { elementId: elementId ?? null }; },
};
```

## Drag (onDragUpdate, onDragEnd)
```ts
// React
conductor.play("Canvas.component-drag-symphony","Canvas.component-drag-symphony",{
  action: "start", elementId, origin,
  onDragUpdate: ({ elementId, position }) => setPos(elementId, position),
  onDragEnd: () => {/* optional */},
});
// on move
conductor.play("Canvas.component-drag-symphony","Canvas.component-drag-symphony",{
  action: "move", elementId, delta,
  onDragUpdate: ({ elementId, position }) => setPos(elementId, position),
});

// Plugin
export const sequence = { id: "Canvas.component-drag-symphony", name: "Canvas Component Drag Symphony",
  movements: [{ id: "drag", beats: [
    { beat: 1, event: "canvas:element:drag:start", handler: "handleDragStart" },
    { beat: 2, event: "canvas:element:moved",      handler: "handleDragMove" },
    { beat: 3, event: "canvas:element:drag:end",   handler: "handleDragEnd" },
  ]}]
};
export const handlers = {
  handleDragStart: ({ elementId, origin }) => ({ drag: { elementId, origin } }),
  handleDragMove: ({ elementId, delta, onDragUpdate }, ctx) => {
    const o = ctx.payload.drag?.origin || { x: 0, y: 0 };
    const position = { x: o.x + (delta?.dx || 0), y: o.y + (delta?.dy || 0) };
    onDragUpdate?.({ elementId, position });
    return { elementId, position };
  },
  handleDragEnd: ({ onDragEnd }) => { onDragEnd?.(); return {}; },
};
```

## Resize (onResizeUpdate, onResizeEnd)
```ts
// React
conductor.play("Canvas.component-resize-symphony","Canvas.component-resize-symphony",{
  action: "start", elementId, handle, start,
  onResizeUpdate: ({ elementId, box }) => setBox(elementId, box),
});
// on move
conductor.play("Canvas.component-resize-symphony","Canvas.component-resize-symphony",{
  action: "move", elementId, handle, delta,
  onResizeUpdate: ({ elementId, box }) => setBox(elementId, box),
});

// Plugin
export const sequence = { id: "Canvas.component-resize-symphony", name: "Canvas Component Resize Symphony",
  movements: [{ id: "resize", beats: [
    { beat: 1, event: "canvas:element:resize:start", handler: "handleResizeStart" },
    { beat: 2, event: "canvas:element:resized",       handler: "handleResizeMove" },
    { beat: 3, event: "canvas:element:resize:end",    handler: "handleResizeEnd" },
  ]}]
};
export const handlers = {
  handleResizeStart: ({ elementId, handle, start }) => ({ resize: { elementId, handle, start } }),
  handleResizeMove: ({ elementId, handle, delta, onResizeUpdate }, ctx) => {
    const startBox = ctx.payload.resize?.startBox || ctx.payload.resize?.start || { x: 0, y: 0, w: 0, h: 0 };
    const box = computeResize(startBox, delta, handle);
    onResizeUpdate?.({ elementId, box });
    return { elementId, box };
  },
  handleResizeEnd: ({ onResizeEnd }) => { onResizeEnd?.(); return {}; },
};
```

## Tips
- Throttle frequent callbacks (~16ms) to avoid excess renders
- Include requestId in debug logs to correlate with progress HUDs
- You can mix in domain events later (via beats) for analytics/HUD without breaking callbacks

