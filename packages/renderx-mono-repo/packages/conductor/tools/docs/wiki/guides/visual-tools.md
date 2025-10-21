# Visual Tools schema and rendering

This guide describes declaring visual tools in component JSON and rendering them in the client.

## Schema (ui.tools)
- drag: { enabled: boolean, snap?: { grid?: number }, bounds?: "canvas" }
- resize: { enabled: boolean, handles?: string[], strategy?: "box" | "line-endpoints" | "polygon-vertices", constraints?: { min?: { w?: number, h?: number }, max?: { w?: number, h?: number }, aspect?: number } }

Defaults
- Box-like components: 8 handles (nw,n,ne,e,se,s,sw,w)
- Components may override handles, e.g., Button: ["e","s","se"]

## Rendering
- Canvas selects element.componentData.ui.tools (if present) and passes to VisualTools
- VisualTools renders handles and calls play("Canvas.component-resize-symphony", ...) with tools and callbacks

## Handlers
- Resize symphony reads tools.resize.strategy/constraints
- Applies constraints and computes box using strategy-specific logic
- Calls onResizeUpdate({ elementId, box }) for UI update

See also: guides/callbacks-pattern.md

