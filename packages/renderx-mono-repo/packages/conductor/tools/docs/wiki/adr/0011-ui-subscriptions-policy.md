# ADR-0011 — UI subscriptions policy

Status: Accepted
Date: 2025-08-09
Related Issue: (TBD)

## Context
Some UI subscriptions were no-ops because corresponding events were never emitted.

## Decision
- Subscribe only to domain events that are emitted via beats.
- Prefer callbacks for direct outcomes; use events for cross-cutting updates.
- Remove or avoid no-op subscriptions.

## Consequences
- Pros: Less confusion; less work in render cycle; clearer contracts.
- Cons: Requires aligning sequences and subscriptions.

## Alternatives
- Keep speculative subscriptions (noise and confusion).

## Implementation Checklist
- Audit current subscriptions; remove unused
- Align sequences to emit needed events or adjust subscriptions
- Update integration docs with examples

