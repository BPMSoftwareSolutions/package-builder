# ADR-0007 — Cooperative cancellation through the Conductor

Status: Proposed
Date: 2025-08-09
Related Issue: (TBD)

## Context
Clients need to cancel long operations; JS cannot preempt running code — cancellation must be cooperative.

## Decision
- Add ConductorClient.cancel(requestId).
- Executors set `cancellationRequested` and short-circuit future beats.
- Handlers check cancellation via context and exit early; provide abortSignal for IO.
- Emit SEQUENCE_CANCEL_REQUESTED and SEQUENCE_CANCELLED (or domain equivalents).

## Consequences
- Pros: Clean UX; consistent logging and baton state.
- Cons: Requires handler cooperation and minor executor changes.

## Alternatives
- Throw errors for cancellation (noisy, less explicit).

## Implementation Checklist
- Add cancel() to ConductorClient and conductor implementation
- Track and check cancellation in executors
- Extend handler context with isCancelled()/abortSignal
- Docs: UI example for cancel button and progress HUD

