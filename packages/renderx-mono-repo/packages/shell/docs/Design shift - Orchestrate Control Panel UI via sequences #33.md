## Summary
Shift Control Panel UI orchestration from local React-only flows to explicit symphonies (JSON sequences + handlers). This keeps UI behavior observable, replayable, and consistent with the rest of the platform’s event/sequence architecture.

## Rationale
- Improve traceability: UI lifecycles become first-class sequences (like selection/update/classes/css today).
- Reduce hidden coupling: move implicit effects (hooks/reducers) into named beats.
- Better testability: sequence-level unit tests for UI flows (init, render, field change, validation, toggles).
- Consistency: align UI interactions with the symphony pattern used across the repo.

## Proposed new UI sequences (initial set)
1) control.panel.ui.init
   - Beats: ui:config:load → ui:resolver:init → ui:schemas:load → ui:observers:register → ui:ready:notify
2) control.panel.ui.render
   - Beats: ui:fields:generate → ui:sections:generate → ui:view:render
3) control.panel.ui.field.change
   - Beats: ui:field:prepare → ui:field:dispatch (forwards to canvas.component.update) → ui:dirty:set → ui:await:refresh
4) control.panel.ui.field.validate
   - Beats: ui:field:validate (SchemaResolverService.validateField) → ui:errors:merge → ui:view:update
5) control.panel.ui.section.toggle
   - Beats: ui:section:toggle → ui:view:update
6) Optional wrappers for classes/css UI intents
   - Ensure local registry updates are also reflected via sequences for parity.

These sequences should wrap existing behavior without changing user-visible outcomes. They primarily externalize orchestration.

## Impacted code paths (current)
- plugins/control-panel/ui/ControlPanel.tsx
- plugins/control-panel/hooks/useControlPanelState.ts
- plugins/control-panel/hooks/useControlPanelActions.ts
- plugins/control-panel/services/schema-resolver.service.ts
- plugins/control-panel/state/control-panel.reducer.ts
- plugins/control-panel/state/observer.store.ts
- plugins/control-panel/components/sections/* (PropertySection, PropertyFieldRenderer, ClassManager)
- public/json-sequences/control-panel/* (selection.show, update, classes.*, css.*)

## Implementation Plan (phased)
- Phase 1 (scaffolding)
  - Add new JSON sequences under public/json-sequences/control-panel/ui/*
  - Create corresponding handlers under plugins/control-panel/symphonies/ui/*
  - Keep existing flows intact; introduce sequences that call into existing hooks/services via a thin adapter layer.
- Phase 2 (integration)
  - Wire useControlPanelState and ControlPanel to trigger control.panel.ui.init and control.panel.ui.render at appropriate points (e.g., mount and on SET_SELECTED_ELEMENT).
  - Route handleAttributeChange through control.panel.ui.field.change (which forwards to canvas.component.update, then relies on control.panel.update to re-sync).
  - Introduce validation sequence usage from PropertyFieldRenderer.
  - Optionally wrap section toggle into a sequence, or emit a UI telemetry beat.
- Phase 3 (tests + cleanup)
  - Unit tests for new sequences and handlers.
  - Sequence tests to assert observer notifications and reducer updates remain correct.
  - Remove any dead code/duplication introduced by the orchestration layer.

## Acceptance Criteria
- New sequences exist and are documented (ui.init, ui.render, ui.field.change, ui.field.validate, ui.section.toggle).
- Control Panel renders and behaves identically before/after change.
- All existing selection/update/classes/css sequences continue to work.
- Unit/sequence tests cover the new flows; CI is green.
- ADR documenting the architecture shift is added under ./docs/adr or ./docs/wiki/adr and linked to this issue.

## Risks / Considerations
- Over-sequencing simple UI actions could add overhead; keep beats minimal and focused.
- Avoid double-render triggers; ensure ui.render is invoked at stable points (e.g., after SET_SELECTED_ELEMENT state commit or via a debounced dispatcher).
- Preserve performance; avoid excessive cross-calls between UI and symphonies.

## References (current behavior)
- Selection → UI observer: plugins/control-panel/symphonies/selection/selection.symphony.ts
- Update flow after attribute change: plugins/canvas-component/symphonies/update/update.stage-crew.ts and public/json-sequences/control-panel/update.json
- UI state & generation: plugins/control-panel/ui/ControlPanel.tsx, hooks/useSchemaResolver.ts, services/schema-resolver.service.ts
- Field rendering & actions: components/sections/PropertySection.tsx, PropertyFieldRenderer.tsx, hooks/useControlPanelActions.ts
- Classes/CSS flows: public/json-sequences/control-panel/classes.*.json, css.*.json, components/sections/ClassManager.tsx

## Tasks
- [ ] Create new UI sequences and handlers (ui.init, ui.render, ui.field.change, ui.field.validate, ui.section.toggle)
- [ ] Wire Control Panel to trigger ui.init/ui.render appropriately
- [ ] Route field changes/validation/toggles via sequences while maintaining current UX
- [ ] Add tests (unit + sequence) for new flows
- [ ] Add ADR for the architecture change (link to this issue)
- [ ] Update docs for control-panel scalable architecture
