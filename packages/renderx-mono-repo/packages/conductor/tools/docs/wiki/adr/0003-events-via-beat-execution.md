# ADR-0003 — Domain events emitted via beat execution only

Status: Accepted
Date: 2025-08-09
Related Issue: (TBD)

## Context
We need domain events for UI updates and observability, but they must carry baton context and be sequenced.

## Decision
Emit domain events exclusively through Beat/Movement/Sequence executors. Beats define `event` and handlers return payloads; Conductor attaches baton and emits.

## Consequences
- Pros: Traceability, ordering, correlation via requestId, consistent logging.
- Cons: Requires defining beats for intended signals.

## Alternatives
- Mixed model with plugin emits (rejected per ADR-0002).

## Implementation Checklist
- Ensure BeatExecutor emits beat.event with contextual payload
- Document beat event naming conventions
- Verify app subscriptions use emitted names

