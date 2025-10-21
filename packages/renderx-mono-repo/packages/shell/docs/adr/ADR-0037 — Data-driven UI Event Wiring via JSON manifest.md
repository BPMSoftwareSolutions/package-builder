# ADR-0037 — Data-driven UI Event Wiring via JSON manifest

Status: Accepted
Date: 2025-09-27
Related Issue: #270

Context
- App.tsx contained imperative DOM wiring for canvas deselect on click, Escape-to-deselect, and Delete-to-delete.
- The project is moving toward manifest-driven, plugin-first configuration to avoid hardcoded logic in the host UI.

Decision
- Introduce a JSON-driven manifest at src/core/manifests/uiEvents.json that declares UI event → topic mappings.
- Implement a generic wiring utility at src/ui/events/wiring.ts that:
  - Supports window vs selector targets
  - Applies simple guards (specific key, notClosestMatch selector check)
  - Attaches listeners immediately when possible and via MutationObserver otherwise
  - Publishes topics via EventRouter.publish with the global conductor
- Update App.tsx to call wireUiEvents(uiEvents.json) instead of imperative wiring.

Consequences
- Adding or adjusting event→topic bindings now happens via JSON without code changes.
- Unit tests added (tests/ui-event-wiring.spec.ts) to ensure mappings work as expected.
- Aligns with the broader architecture (see ADR-0019, ADR-0033, ADR-0034) by keeping the host thin and data-driven.

Alternatives Considered
- Keep imperative wiring in App.tsx (rejected: hard to extend, not data-driven).
- Push UI event manifests into plugin packages now (deferred: acceptable later; current scope is host-level wiring).

