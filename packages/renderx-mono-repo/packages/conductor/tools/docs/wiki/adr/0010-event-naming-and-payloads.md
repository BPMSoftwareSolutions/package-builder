# ADR-0010 — Event naming and payload conventions

Status: Accepted
Date: 2025-08-09
Related Issue: (TBD)

## Context
Consistent domain events prevent UI coupling to plugin internals and simplify observability.

## Decision
- Use colon-delimited domain names (e.g., canvas:component:created, components:load:progress).
- Include `requestId` and relevant fields (progress, total, percent) when applicable.
- Conductor attaches Data Baton metadata; events are emitted via beats.

## Consequences
- Pros: Stable contracts; easy correlation; cleaner subscriptions.
- Cons: Requires aligning existing sequences/UI.

## Alternatives
- Ad-hoc event names per plugin (fragmented, inconsistent).

## Implementation Checklist
- Document naming rules and payload schema
- Align existing sequences and UI subscriptions
- Add lint/docs examples for common domains

