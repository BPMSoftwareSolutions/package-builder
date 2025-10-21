# ADR-0032 — Phase C: Finalize src reorg and guardrails

Status: Accepted
Date: 2025-09-18
Related: #178, ADR-0014, ADR-0021, ADR-0022, ADR-0026–0031

## Context
Phase B moved implementation into domain-first/core folders and introduced transitional shims. Phase C completes the consolidation by:
- Converging on canonical modules under src/core/** and src/domain/**
- Keeping root-level src/* legacy entrypoints as pure re-export shims
- Adding lint guardrails to avoid backsliding and to prepare for shim removal

## Decision
1) Canonical locations
- Core/runtime infrastructure lives under src/core/**
- Domain libraries and host features live under src/domain/**
- UI components under src/ui/**

2) Root shims
- The following root modules are shims ONLY (no logic):
  - src/EventRouter.ts → ./core/events/EventRouter
  - src/conductor.ts → ./core/conductor
  - src/interactionManifest.ts → ./core/manifests/interactionManifest
  - src/topicsManifest.ts → ./core/manifests/topicsManifest
  - src/startupValidation.ts → ./core/startup/startupValidation
  - src/env.ts → ./core/environment/env
  - src/jsonComponent.mapper.ts → ./domain/components/json/jsonComponent.mapper
  - src/sanitizeHtml.ts → ./domain/css/sanitizeHtml

3) Guardrails (ESLint)
- Introduce rule: root-shims-only/require-root-shims-only (error)
- Enforces that the above root files are pure re-export shims that target ./core/** or ./domain/**

4) Deprecation and removal
- These shims are temporary and will be removed after one deprecation window (one release). Consumers must import from src/core/** or src/domain/** directly.

## Consequences
- Eliminates dual-path imports and Vite duplicate static/dynamic import warnings
- Stabilizes imports for plugins and host packages
- Enables future removal of shims without search-and-replace churn

## Implementation notes
- Updated root modules to re-export shims
- Added ESLint rule and unit tests
- Verified build, lint, and test (169 passed | 1 skipped)

## Migration guide
- Replace any imports from src/* legacy modules with their canonical src/core/** or src/domain/** equivalents
- After the deprecation window, the root shims will be removed

