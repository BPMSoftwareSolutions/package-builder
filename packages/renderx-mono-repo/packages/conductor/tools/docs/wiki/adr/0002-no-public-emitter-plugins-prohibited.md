# ADR-0002 — No public emitter; plugins cannot emit directly

Status: Accepted
Date: 2025-08-09
Related Issue: (TBD)

## Context
Direct event emission by plugins bypasses Conductor sequencing, logging, and the Data Baton, violating SPA/CIA boundaries.

## Decision
- Conductor exposes no public emitter.
- Remove emit from plugin handler context.
- Only the Conductor emits events via beat/movement/sequence execution.

## Consequences
- Pros: Centralized orchestration, consistent logging/metrics, safer plugins.
- Cons: Plugins must request orchestration (play) for cross-cutting signals.

## Alternatives
- Allow limited emit with guardrails (still risks bypass and logging gaps).

## Implementation Checklist
- Remove handlerContext.emit in PluginManager
- Provide context.conductor with play() only (bound)
- Update docs/guides for plugin development

