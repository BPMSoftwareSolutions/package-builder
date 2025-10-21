# ADR-0012 — Data Baton traceability and logging

Status: Accepted
Date: 2025-08-09
Related Issue: (TBD)

## Context
We want end-to-end visibility of data passed between beats to debug discrepancies.

## Decision
- Maintain a Data Baton updated by the Conductor; attach to each beat event emission.
- Provide read-only baton in event payloads; avoid exposing mutators to clients.
- Log per-beat with timestamps; optionally capture to files in E2E tests.

## Consequences
- Pros: Better debugging; reproducibility in tests; audit trail.
- Cons: Slight overhead; must avoid leaking sensitive data.

## Alternatives
- Ad-hoc logging (inconsistent, harder to trace).

## Implementation Checklist
- Ensure baton updates are centralized in Conductor
- Include baton snapshot in emitted event payloads
- Document redaction practices for sensitive fields

