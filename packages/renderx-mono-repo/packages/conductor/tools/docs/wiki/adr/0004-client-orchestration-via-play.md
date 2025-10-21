# ADR-0004 — Clients orchestrate via play(); startSequence hidden

Status: Accepted
Date: 2025-08-09
Related Issue: (TBD)

## Context
Clients should not bypass plugin routing or internal sequencing helpers.

## Decision
- Expose play(pluginId, sequenceId, context?, priority?).
- Hide startSequence/queue/admin APIs from client surface.

## Consequences
- Pros: Consistent orchestration, plugin-agnostic client code.
- Cons: Advanced clients must adapt to play.

## Alternatives
- Allow startSequence; add lint/docs (still risky).

## Implementation Checklist
- ConductorClient exposes play only
- Docs: replace startSequence examples with play

