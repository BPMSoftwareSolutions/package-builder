# ADR-0008 — Plugin handler context restrictions

Status: Accepted
Date: 2025-08-09
Related Issue: (TBD)

## Context
Handlers previously received an `emit` function, enabling bypass of orchestration.

## Decision
- Remove `emit` from handler context.
- Provide `logger`, `payload`, sequence config, and a minimal `conductor` exposing `play()` only.

## Consequences
- Pros: Enforces SPA/CIA; improves observability and traceability.
- Cons: Plugins must use play() for cross-cutting effects.

## Alternatives
- Keep emit with guardrails (rejected per ADR-0002).

## Implementation Checklist
- Update PluginManager to shape handler context accordingly
- Validate existing plugins use context.conductor.play fallback
- Docs: update plugin development guide

