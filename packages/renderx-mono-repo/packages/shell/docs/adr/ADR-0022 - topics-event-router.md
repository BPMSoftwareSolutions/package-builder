# ADR-00xx: JSON-driven Pub-Sub (Topics Manifest) and EventRouter

- Status: Proposed
- Date: 2025-08-28
- Issue: #53

## Context
Cross-symphony callbacks/forwarders introduced tight coupling across plugins and made drag/drop and component creation flows harder to evolve. We already use a JSON-driven interaction manifest for sequence routing.

## Decision
Introduce a JSON-driven topics manifest and an EventRouter runtime:
- Topics defined per plugin in `json-topics/*.json`
- Build step generates `topics-manifest.json` (also emitted to `public/`)
- EventRouter publishes topics with payloads, optionally validates payloads (feature-flagged), and routes to sequences via the manifest. It also supports local subscribers and optional perf guards (throttle/debounce).

Initial migration focuses on Library drop → Canvas create and drag move:
- `canvas.component.create.requested` → routes to Canvas create sequence
- `canvas.component.created` → notify-only topic
- `canvas.component.drag.move` → routes to Canvas drag sequence with throttle
- `canvas.component.drag.start` → notify-only topic

## Consequences
- UI and plugins can emit intent topics without embedding route knowledge.
- Forwarders are removed, reducing coupling and improving testability.
- Perf gains on drag via throttling configured in the manifest.
- ESLint rule enforces topic key correctness at publish sites.

## Alternatives Considered
- Keep callbacks and forwarders (status quo): retains coupling and harder to scale.
- Hard-code routes in code: counter to existing JSON-first architecture.

## Notes
- Feature flag `lint.topics.runtime-validate` can enable AJV validation in dev/test.
- Control Panel UI sequences were added as JSON to remove sequence-not-found warnings.

