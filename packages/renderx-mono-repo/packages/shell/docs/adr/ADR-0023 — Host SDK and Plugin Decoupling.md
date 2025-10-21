# ADR-0023 — Host SDK and Plugin Decoupling (PanelSlot/EventRouter/flags)

Issue: #63

Status: Accepted (phase 1 complete)

Acceptance notes:

- Implemented local @renderx/host-sdk package (workspaces) re-exporting: useConductor, EventRouter, resolveInteraction, isFlagEnabled, getFlagMeta
- Added ESLint boundary rule (warn): plugins/** cannot import from src/**
- Migrated Library, Canvas, Control Panel plugin imports to SDK
- Enhanced PanelSlot to accept package and URL specifiers; added tests
- Added public/plugins/plugin-manifest.example.json to illustrate package/URL entries
- All tests pass locally; lint shows only pre-existing layout-style errors (issue #61)

## Context

- Plugins currently import host internals directly (e.g., src/conductor, src/EventRouter, src/interactionManifest, feature flags), creating tight coupling.
- PanelSlot and the host assume plugins live under /plugins in the same repo/build. plugin-manifest.json uses repo-relative module paths (e.g., "/plugins/canvas/index.ts").
- Refactors to PanelSlot or src internals ripple into plugins, violating the thin-shell goal: thin clients know nothing about the plugins they load; plugins know nothing about host internals.
- We need clear API boundaries so plugins can evolve and be distributed independently, supported by single-source-of-truth manifests for routing and topics.

## Decision

- Introduce a versioned Host SDK package (e.g., @renderx/host-sdk) that exposes a stable API surface for plugin authors:
  - useConductor() and relevant types (ConductorClient)
  - EventRouter.publish/subscribe (optional topic typing)
  - Interaction resolution (resolveInteraction or equivalent)
  - Feature flag helpers (isFlagEnabled, getFlagMeta)
- Adjust PanelSlot to load plugin UIs via package specifiers (e.g., "@org/canvas-plugin") or approved remote URLs, not only repo-relative paths. Keep current "/plugins/..." support during a transition window.
- Enforce boundaries with lint rules:
  - Forbid ../../src/** imports from any file in plugins/**
  - Allow imports only from @renderx/host-sdk plus plugin-local modules/data
- Keep topics- and interaction-manifests as the single sources of truth, generated from per-plugin catalogs at build/startup.
- Prefer a monorepo-with-packages structure (short term) or separate repos (long term). Plugins depend on @renderx/host-sdk semver instead of src internals.

## Consequences

- Refactoring PanelSlot or host internals won’t break plugins; the SDK boundary provides stability.
- Plugins become portable and distributable (npm packages, approved URLs, or module federation later).
- Build/test flows incorporate SDK resolution and manifest generation consistently.
- Migration effort required: codemods for import paths, manifest updates, and boundary lint adoption.

## Implementation Notes

- Create packages/host-sdk:
  - Thin façade over existing internals with minimal, typed API surface
  - Semver; publish to npm or consume locally initially
- PanelSlot changes:
  - Accept module specifiers (package name or URL) alongside current path-based modules
  - Continue lazy dynamic import with graceful error rendering
- Lint rules:
  - New rule forbidding ../../src/** from plugins/**
  - CI enforces rule; start as warning, then escalate to error
- Manifests:
  - Continue generating topics-manifest.json and interaction-manifest.json from catalogs
  - Serve to browser (public/) and provide Node/test fallback
- Migration Plan (phased):
  1. Introduce @renderx/host-sdk and boundary lint (warning)
  2. Migrate Library plugin to SDK imports (reference implementation)
  3. Migrate remaining plugins
  4. Switch lint to error
  5. Deprecate and later remove path-based plugin-manifest entries

## Alternatives Considered

- Stronger layering within a single repo without an SDK: rejected (still brittle across refactors and blocks independent distribution).
- Module federation as the primary mechanism: deferred; compatible, but heavier to bootstrap. SDK is a simpler starting point.
- Keep plugin-manifest file-system paths indefinitely: rejected for portability; acceptable during a transition window only.

## Follow-ups

- ADR: Plugin distribution strategy (package vs. URL vs. module federation) and SDK versioning policy.
- CI: SDK compatibility checks to ensure host changes don’t break the public SDK surface.
- DX: Codemods for import-path migration and examples/docs for plugin authors.

## Sample before/after imports for plugins

Before:

```
import { useConductor } from "../../../src/conductor";
import { EventRouter } from "../../../src/EventRouter";
import { resolveInteraction } from "../../../src/interactionManifest";
```

After:

```
import { useConductor, EventRouter, resolveInteraction } from "@renderx/host-sdk";
```

See also: docs/host-sdk/USING_HOST_SDK.md

## Manifest example (transition to package specifiers)

Before:

```
{ "slot": "canvas", "module": "/plugins/canvas/index.ts", "export": "CanvasPage" }
```

After:

```
{ "slot": "canvas", "module": "@org/canvas-plugin", "export": "CanvasPage" }
```
