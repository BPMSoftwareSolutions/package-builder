# Advanced Line Component: Implementation Strategy

## Summary

Introduce an optional, extensible "Advanced Line" capability (rotation, curvature, arrows, endpoint connectors) without destabilizing the existing standard line component path. All new behavior is additive, feature‑flag driven, and isolated from core creation & selection logic until validated.

## Current State

- Line JSON defines a simple resizable box (no special overlay / no svg children).
- Standard resize & selection overlays are used (box handles only).
- Legacy, unused line‑specific resize overlay + stage‑crew handlers exist but are not wired.
- No control panel fields for rotation / curvature / arrows / connectors.

## Objectives

1. Add advanced visual affordances: rotation, curved path, arrowheads, endpoint connectors.
2. Maintain backward compatibility (existing lines behave identically with feature flag OFF).
3. Minimize invasive edits to `create.stage-crew.ts` & shared overlays.
4. Provide clear extension seams (augmentation, overlay, sequences, recompute utility).
5. Supply test coverage & rollback strategy.

## Non‑Goals

- Replacing standard box resize immediately.
- Shipping a bespoke line overlay by default for all users.
- Implementing complex routing / graph logic (purely visual + direct manipulations phase).

## High‑Level Architecture

| Concern               | Strategy                                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------------------------------------------------------------------- |
| Feature gating        | Global feature flag `lineAdvanced` (config or environment).                                                                                    |
| SVG augmentation      | Post‑create augmentation function `enhanceLine(nodeId)` (adds `<line>`, `<path.curve>`, `<defs>` markers, connector nodes).                    |
| Overlay               | Dedicated overlay module created only when selecting an advanced line & flag ON. Reuses one overlay element (endpoint, curve, rotate handles). |
| Event model           | Colon style events: `canvas:line:manip:start                                                                                                   | move | end` (or reuse existing line resize sequence naming if we standardize). |
| Sequences             | Three JSON sequences mapping events to stage‑crew handlers: start, move, end. Move handler updates CSS vars + triggers recompute.              |
| State source of truth | CSS custom properties: `--x1 --y1 --x2 --y2 --curvature --rotation --arrowStart --arrowEnd --connectorStart --connectorEnd`                    |
| Recompute logic       | Pure function `recomputeLineSvg(el)` sets `<line>` coordinates, `<path>` cubic command, markers, connector positions.                          |
| Control Panel         | Adds advanced property editors dynamically when flag ON & element has `rx-line`.                                                               |
| Export / Import       | Persist CSS vars; augmentation replays when feature flag still ON (idempotent).                                                                |

## Phased Plan

### Phase 0 – Prep & Cleanup

- Remove (or mark deprecated) unused legacy line resize overlay & handlers.
- Introduce feature flag scaffolding.

### Phase 1 – Augmentation Module

- Add `plugins/canvas-component/symphonies/augment/augment.line.stage-crew.ts` exporting `enhanceLine(nodeId)`.
- Call from existing create sequence tail (flag guard) OR via a generic `canvas:component:created` hook if available.
- Tests: augmentation idempotency & DOM children snapshot.

### Phase 2 – Recompute Utility + CSS Vars

- Implement `recomputeLineSvg(el)`.
- Unit tests for cubic path & arrow marker toggling.

### Phase 3 – Overlay & Interaction

- Implement overlay creation + `attachAdvancedLineHandles(el)`.
- Emit `canvas:line:manip:*` events (colon style) OR adapt existing sequences if alignment chosen.
- JSON sequences + handlers to mutate CSS vars; call recompute each move.
- Tests: drag endpoint, curve, rotate -> CSS vars & DOM update.

### Phase 4 – Control Panel Integration

- Conditional property set: rotation (deg), curvature (number), arrowStart/arrowEnd (boolean), connectorStart/connectorEnd (boolean).
- Hook change events -> update vars -> recompute.

### Phase 5 – Export / Import Validation

- Ensure export includes CSS var styles or inline style attribute.
- Import triggers augmentation (if flag ON); verify visual parity in tests.

### Phase 6 – Performance & Regression

- Throttle recompute calls with rAF during move; final commit on end.
- Measure large-canvas no‑op cost (flag OFF) – should be zero beyond flag check.

### Phase 7 – Documentation & Adoption

- README section + migration notes.
- Provide toggle instructions and sample JSON snippet for advanced usage.

## Detailed Tasks

1. Add feature flag infra (`feature-flags.json` or similar) + runtime accessor.
2. Write augmentation module + tests.
3. Write recompute utility + tests (path math, markers on/off, connector positions).
4. Create overlay module (no coupling to generic overlay) + tests.
5. Define & add JSON sequences: `line.manip.start/move/end` (handlers: startLineManip, moveLineManip, endLineManip).
6. Implement handlers to update vars; call `recomputeLineSvg` (rAF throttle for move).
7. Integrate augmentation call post-create (flag guard) – zero behavior change when OFF.
8. Control Panel fields gating.
9. Export/import tests.
10. Remove legacy unused line resize code (or mark deprecated & schedule deletion after validation window).
11. Documentation & CHANGELOG entry.

## Acceptance Criteria

- Flag OFF: behavior identical to current main (snapshot equivalence & test pass).
- Flag ON + new line created: SVG augmented, straight line visible, markers & connectors hidden by default.
- Drag endpoint handle updates corresponding CSS vars and DOM elements in real time.
- Curvature handle adjusts path (cubic curve) smoothly; path toggles when curvature != 0 (or explicit curved mode decision).
- Rotation handle updates `--rotation` and visual transform (optional: apply transform on host or group wrapper).
- Arrow toggles add/remove `marker-start` / `marker-end` without layout shift.
- Connectors toggles show/hide endpoint circles.
- All manipulations export & import round‑trip with no data loss.
- No console errors, no measurable perf regression (baseline rAF frame cost unchanged when idle).

## Risks & Mitigations

| Risk                                 | Mitigation                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| Accidental regression in core create | Isolation via augmentation + feature flag.                                   |
| Overlay conflicts                    | Avoid modifying existing overlay; separate element & conditional attachment. |
| Path performance on rapid drag       | rAF throttle & simple math only (no layout thrash).                          |
| Inconsistent event naming            | Decide colon style early; map legacy if required.                            |
| Export missing vars                  | Explicit snapshot test verifying CSS var presence.                           |

## Rollback Strategy

- Disable feature flag: advanced overlay & augmentation never run; existing instances remain simple (SVG nodes absent). If already augmented nodes exist, they continue functioning (non-breaking) but can be cleaned with optional script.

## Open Questions

1. Should curvature auto-switch to curved mode when != 0 or require explicit toggle? (Proposed: auto-switch; store curvature=0 as straight.)
2. Rotation: apply transform to SVG (`transform: rotate(...)`) vs. recompute endpoints? (Proposed: CSS transform for simplicity.)
3. Persistence format: rely solely on CSS vars or also store structured props? (Proposed: CSS vars suffice.)
4. Marker styling: use currentColor or dedicated stroke color var? (Proposed: currentColor for theming.)

## Initial Label Suggestions

- `enhancement`
- `component:line`
- `planning`
- `area:canvas`

## Definition of Done (DOD)

- All acceptance criteria satisfied.
- Tests (unit + integration) passing & coverage for new modules >= 90% lines.
- Documentation updated.
- Legacy unused line resize code removed or deprecated notice + issue created for removal.
- Feature flag default OFF (can be enabled in experimental builds).

---

Generated as a planning artifact to drive incremental PRs.
