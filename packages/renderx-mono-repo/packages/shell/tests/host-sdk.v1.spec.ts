import { describe, it, expect } from 'vitest';

// TDD: Assert the v1 Host SDK public surface is available via root export.
// v1 exposes a centralized public-api under the package root.

describe('@renderx-plugins/host-sdk v1 adoption surface', () => {
  it('exposes core APIs from the root export', async () => {
    const sdk = await import('@renderx-plugins/host-sdk');
    // Conductor hook
    expect(typeof sdk.useConductor).toBe('function');
    // Events (EventRouter is an object facade)
    expect(typeof sdk.EventRouter).toBe('object');
    // Manifests
    expect(typeof sdk.resolveInteraction).toBe('function');
    // Flags
    expect(typeof sdk.isFlagEnabled).toBe('function');
    // Inventory
    expect(typeof sdk.listComponents).toBe('function');
    // CSS Registry
    expect(typeof sdk.hasClass).toBe('function');
  });
});

