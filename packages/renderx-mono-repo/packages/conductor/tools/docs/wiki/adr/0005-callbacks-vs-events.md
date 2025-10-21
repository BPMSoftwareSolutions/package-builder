# ADR-0005 — Callbacks for initiating actions; events for cross-cutting progress

Status: Accepted
Date: 2025-08-09
Related Issue: (TBD)

## Context
Clients should not know plugin internals. Still, iterative operations need multi-consumer progress.

## Decision
- Use callbacks/return values for direct outcomes (e.g., onComponentsLoaded, onComponentCreated).
- Use Conductor-emitted domain events (via beats) for progress/telemetry.

## Consequences
- Pros: Encapsulation + scalability; UI stays thin.
- Cons: Requires defining progress beats or a shared symphony.

## Alternatives
- All callbacks (no events): harder for multiple observers.
- All events (no callbacks): noisy for simple request/response flows.

## Implementation Checklist
- Define or adopt a Progress.update symphony
- Update guides to show both patterns together

