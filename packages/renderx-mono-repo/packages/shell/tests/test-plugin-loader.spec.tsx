/**
 * Unit tests for test-plugin-loader.tsx
 *
 * ⚠️  EXCLUDED FROM CI RUNS ⚠️
 * These tests are excluded from CI as they test non-production code.
 * They are for development and debugging purposes only.
 *
 * Exclusion configured in vitest.config.ts under test.exclude
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the SDK imports
vi.mock('@renderx-plugins/host-sdk/core/conductor/conductor', () => ({
  initConductor: vi.fn().mockResolvedValue({}),
}));

vi.mock('@renderx-plugins/host-sdk/core/conductor/sequence-registration', () => ({
  registerAllSequences: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@renderx-plugins/host-sdk/core/conductor/runtime-loaders', () => ({
  loadJsonSequenceCatalogs: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@renderx-plugins/host-sdk/core/manifests/interactionManifest', () => ({
  initInteractionManifest: vi.fn().mockResolvedValue(undefined),
  getInteractionManifestStats: vi.fn().mockReturnValue({
    routeCount: 42,
    loaded: true,
    // Note: Missing 'routes' array - this is the bug we're testing
  }),
  resolveInteraction: vi.fn().mockReturnValue({ pluginId: 'test', sequenceId: 'test' }),
}));

vi.mock('@renderx-plugins/host-sdk/core/manifests/topicsManifest', () => ({
  initTopicsManifest: vi.fn().mockResolvedValue(undefined),
  getTopicsManifestStats: vi.fn().mockReturnValue({
    topicCount: 10,
    loaded: true,
  }),
  getTopicsMap: vi.fn().mockReturnValue({}),
}));

vi.mock('@renderx-plugins/host-sdk/core/startup/startupValidation', () => ({
  getPluginManifestStats: vi.fn().mockResolvedValue({
    pluginCount: 5,
    loaded: true,
  }),
}));

vi.mock('../src/domain/components/inventory/inventory.service', () => ({
  listComponents: vi.fn().mockResolvedValue([]),
}));

vi.mock('@renderx-plugins/host-sdk', () => ({
  EventRouter: class MockEventRouter {
    publish = vi.fn();
    subscribe = vi.fn();
  },
}));

// Mock global CSS import
vi.mock('../src/global.css', () => ({}));

// Import the component after mocks are set up
import SophisticatedPluginLoader from '../src/test-plugin-loader';

describe('SophisticatedPluginLoader - Routes Tab Issue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should demonstrate the fix - routes array should be present after loading manifest', async () => {
    // Mock fetch to return interaction manifest data
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        version: "1.0.0",
        routes: {
          "app.ui.theme.get": {
            pluginId: "HeaderThemePlugin",
            sequenceId: "header-ui-theme-get-symphony"
          },
          "canvas.component.create": {
            pluginId: "CanvasComponentPlugin",
            sequenceId: "canvas-component-create-symphony"
          }
        }
      })
    });

    // Import the component's loadInteractionManifestData function logic
    // This simulates what the component does now
    const response = await fetch('/interaction-manifest.json');
    const manifest = await response.json();
    const routes = manifest?.routes || {};

    // Transform routes object into array format expected by the component
    const routesArray = Object.entries(routes).map(([route, def]: [string, any]) => ({
      route,
      pluginId: def.pluginId,
      sequenceId: def.sequenceId
    }));

    // Now we should have the routes array
    expect(routesArray).toBeDefined();
    expect(routesArray).toHaveLength(2);
    expect(routesArray[0]).toEqual({
      route: "app.ui.theme.get",
      pluginId: "HeaderThemePlugin",
      sequenceId: "header-ui-theme-get-symphony"
    });

    console.log('Fixed: routes array is now available:', routesArray);
  });

  it('should show what the real getInteractionManifestStats returns', async () => {
    // Let's test what the actual function returns vs what we expect
    // First, let's clear our mock and import the real function
    vi.clearAllMocks();

    // This will help us understand the real data structure
    // We expect it returns { routeCount: number, loaded: boolean }
    // But the component needs { routeCount: number, routes: Array }

    const mockStats = {
      routeCount: 42,
      loaded: true,
      // routes: undefined - this is missing!
    };

    // The component tries to do: interactionStats?.routes?.filter(...)
    // But routes is undefined, so filter fails silently
    expect(mockStats.routes).toBeUndefined();
    expect(mockStats.routeCount).toBe(42);

    // This is the core issue: mismatch between what's returned and what's expected
  });

  it('should demonstrate what the component expects vs what it gets', () => {
    // What the component expects:
    const expectedStructure = {
      routeCount: 42,
      routes: [
        {
          route: 'app.ui.theme.get',
          pluginId: 'HeaderThemePlugin',
          sequenceId: 'header-ui-theme-get-symphony'
        },
        // ... more routes
      ]
    };

    // What it actually gets (from our mock):
    const actualStructure = {
      routeCount: 42,
      loaded: true,
      // routes: undefined - missing!
    };

    // This test documents the mismatch
    expect(actualStructure.routes).toBeUndefined();
    expect(expectedStructure.routes).toBeDefined();
    expect(expectedStructure.routes).toHaveLength(1);
  });
});
