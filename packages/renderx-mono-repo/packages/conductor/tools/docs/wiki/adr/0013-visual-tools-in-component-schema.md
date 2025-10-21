# ADR-0013 — Visual Tools declared in component schema (ui.tools)

Status: Proposed
Date: 2025-08-09
Related Issue: #27

## Context

Different components have different interaction affordances and constraints (e.g., boxes with 8 resize handles, lines with 2 endpoints, polygons with N vertices). Hard-coding an overlay in the client app leads to special cases and leaks component knowledge. We want a thin client that renders a generic VisualTools layer driven by component data, while keeping orchestration via ConductorClient.

## Decision

- Extend component JSON with `ui.tools` configuration to declare visual tools and constraints (drag, resize, rotate, custom grips).
- Implement a generic `VisualTools` overlay in the client that renders handles/outlines from the config.
- Keep callback-first symphonies for behaviors; handlers read the component’s `ui.tools` to select strategies and apply constraints.
- Retain beats for sequencing/logging/Data Baton; UI does not need to subscribe for these flows.

### Example schema

- Box-like:
  - `resize: { enabled: true, handles: ["n","e","s","w","ne","nw","se","sw"], constraints: { min: { w, h }, max: { w, h }, aspect?: number, bounds?: "canvas" } }`
- Line:
  - `resize: { enabled: true, strategy: "line-endpoints", handles: ["start","end"], constraints: { snap?: { grid: 8 } } }`
- Drag:
  - `drag: { enabled: true, snap?: { grid: 8 }, bounds?: "canvas" }`

## Consequences

- Pros: Component-specific UX without bloating the app; consistent orchestration; easier to add new component types and tools.
- Cons: Requires a schema, a renderer, and strategy logic in handlers; more validation of input data.

## Alternatives

- Hard-code overlay/handles in the app per component type (tight coupling, higher maintenance).
- Plugin-specific overlays (inconsistent UX, duplicated logic).

## Implementation Checklist

- Define and document `ui.tools` schema (types + JSON examples).
- Add VisualTools React component to render handles/outlines from config.
- Canvas renders VisualTools for the selected element and wires pointer events to conductor.play with callbacks.
- Update Canvas resize symphony to support strategies: box (cardinal handles), line-endpoints, polygon-vertices (future).
- Apply constraints/snap/aspect/bounds in handlers; keep callbacks for UI updates.
- Convert 2 sample components: Button/Box (cardinal) and Line (endpoints).
- Write guide: tools/docs/wiki/guides/visual-tools.md referencing callbacks pattern.
- Tests: basic interactions (select, drag, resize box; resize line endpoints) in Playwright.
