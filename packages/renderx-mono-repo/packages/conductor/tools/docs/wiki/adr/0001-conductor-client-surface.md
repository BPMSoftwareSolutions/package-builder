# ADR-0001 — Narrow client API surface with ConductorClient

Status: Accepted
Date: 2025-08-09
Related Issue: #15

## Context

Client apps were importing the full MusicalConductor API, exposing internal/admin methods and risking architectural drift.

## Decision

Introduce a narrow ConductorClient interface and type initializeCommunicationSystem().conductor as ConductorClient so downstream apps see only the supported surface (play, subscribe/unsubscribe, status, registerCIAPlugins, limited introspection).

## Consequences

- Pros: Reduces misuse, clarifies support, stabilizes public contract.
- Cons: Tests/tooling may need internal access; provide separate internal types or direct imports.

## Alternatives

- Keep full API public (higher misuse risk).
- Hide by runtime proxy (complexity, minimal extra value over typing).

## Implementation Checklist

- Define modules/communication/sequences/api/ConductorClient.ts
- Export type from modules/communication/index.ts
- Initialize system with conductor typed as ConductorClient
- Update RenderX imports to use ConductorClient

## Notes

This is a compile-time narrowing; runtime object remains the same.
