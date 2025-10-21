# ADR-0019 — Single Source of Truth for Interaction Routing

Issue: #19

Status: Proposed

Context
- Today, interaction routing is duplicated in three places: src/interactionManifest.ts in-code defaults, interaction-manifest.json at repo root and under public/, and in various call sites. This duplication risks drift.
- We also load sequences from per-plugin JSON catalogs (json-sequences/*) but there is no canonical place where interaction keys map to (pluginId, sequenceId), nor a way for components to override routing.

Decision
- Introduce per-plugin default route catalogs under json-interactions/*.json. Each file exposes a `{ routes: { [interactionKey]: { pluginId, sequenceId } } }` object.
- Allow component-level overrides via routeOverrides within json-components/*.json (accepted at either integration.routeOverrides or top-level routeOverrides for convenience). Overrides take precedence over plugin defaults.
- Add a generator script scripts/generate-interaction-manifest.js that merges all catalogs + overrides into a single interaction-manifest.json written to project root and to public/ for browser fetch.
- Keep minimal hardcoded DEFAULT_ROUTES in src/interactionManifest.ts strictly as last-resort safety for tests/dev. At runtime, the generated manifest will be loaded first.

Consequences
- One authoritative source (generated interaction-manifest.json) reduces drift.
- Plugins can evolve routing independently by updating their json-interactions/* catalogs.
- Components can tailor routing (e.g., alternate create flow) without changing plugin code, by declaring overrides in their JSON.
- Build and dev flows run the generator so the app always serves an up-to-date manifest.

Implementation Notes
- New directory json-interactions/ with initial files for library, library-component, and canvas-component matching existing sequence ids.
- New script scripts/generate-interaction-manifest.js exporting buildInteractionManifest for tests and generating interaction-manifest.json files. Precedence: later sources win (component overrides last).
- Update package.json scripts: dev/build call a pre:manifests step running sync:json-components and manifest generation.
- Add unit test __tests__/interaction-manifest.spec.ts to validate merge/precedence logic.

Alternatives Considered
- Generating routing directly from json-sequences catalogs: rejected because a single plugin can define many sequences not all intended for external routing keys; the route catalog remains a simpler API surface.
- Removing in-code DEFAULT_ROUTES entirely: rejected to preserve test/dev resilience when manifest is absent.

Follow-ups
- Extend ESLint rule play-routing/no-hardcoded-play-ids to encourage use of resolveInteraction for all play routing.
- Optionally add a CI check to ensure public/interaction-manifest.json is in sync with the generated one.

