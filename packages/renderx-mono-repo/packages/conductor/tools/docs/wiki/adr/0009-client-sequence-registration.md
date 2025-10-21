# ADR-0009 — Client sequence registration

Status: Proposed
Date: 2025-08-09
Related Issue: (TBD)

## Context
UI components need to participate in orchestration (e.g., progress symphony) without widening client API excessively.

## Decision
Prefer a helper (registerClientSequences()) that validates manifests and registers sequences under a namespaced ID (e.g., Client.*). Avoid exposing full registry admin on ConductorClient.

## Consequences
- Pros: Minimal client surface; predictable IDs; safer manifests.
- Cons: Adds a small helper API to the package.

## Alternatives
- Expose registerSequence/unregisterSequence on ConductorClient.

## Implementation Checklist
- Implement registerClientSequences(manifests) in communication package
- Validate schema and prevent unsafe context exposure
- Document usage in SPA integration guide

