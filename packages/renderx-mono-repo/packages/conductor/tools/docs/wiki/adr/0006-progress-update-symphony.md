# ADR-0006 — Progress.update symphony for iterative operations

Status: Proposed
Date: 2025-08-09
Related Issue: (TBD)

## Context
Long-running operations need progress signals to the UI without leaking plugin internals.

## Decision
Create a shared progress symphony (e.g., Client.progress.update-symphony) with beats emitting:
- progress:initialized
- progress:updated
- progress:completed

Any sequence can call play("Client.progress.update-symphony", ...) at init/update/complete.

## Consequences
- Pros: Standardized progress channel; reusable across features.
- Cons: Requires client registration and UI subscription.

## Alternatives
- Per-plugin progress events (fragmented contracts).
- Callback-only progress (single-consumer only).

## Implementation Checklist
- Author progress symphony manifest and handlers
- Provide registerClientSequences() helper to register it
- UI: subscribe to progress:*; throttle rendering

