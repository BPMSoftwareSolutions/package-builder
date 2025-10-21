# E2E Testing Guide

## Overview

The RenderX Mono-Repo uses Cypress for end-to-end testing with a plugin-served, data-driven approach via the Test Harness infrastructure.

## Test Harness Architecture

The test harness (`src/test-harness/`) provides:

- **Protocol**: Message-based communication between host and driver via postMessage
- **Types**: Shared TypeScript interfaces for test scenarios, steps, and assertions
- **Harness API**: `window.TestHarness` - the main entry point for E2E tests

### Key Components

1. **harness.ts**: Main test harness implementation
   - Manages iframe lifecycle
   - Handles postMessage protocol
   - Provides API for steps, asserts, snapshots

2. **protocol.ts**: Message protocol definition
   - Channel: `rx.test`
   - Version: `1.0.0`
   - Message types for host-to-driver and driver-to-host communication

3. **types.ts**: TypeScript interfaces
   - `TestHarnessAPI`: Main interface
   - `TestManifest`: Plugin test manifest structure
   - `TestScenario`: Individual test scenario
   - `Step`, `Assert`: Test operations

4. **test-plugin-loading.html**: Test harness page
   - Loads test infrastructure
   - Provides UI for test execution
   - Displays logs and results

5. **test-plugin-loader.tsx**: React component for test UI
   - Displays test controls
   - Shows system logs
   - Manages test state

## Running E2E Tests

### Local Development

```bash
cd packages/renderx-mono-repo

# Start dev server
pnpm run dev

# In another terminal, run Cypress
pnpm run test:e2e

# Or run in headless mode
pnpm run test:e2e:headless
```

### CI/CD Pipeline

E2E tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

See `.github/workflows/ci.yml` for full pipeline configuration.

## Writing E2E Tests

### Test Manifest

Plugins should serve a test manifest at `/test/manifest.json`:

```json
{
  "testApiVersion": "1.0.0",
  "plugin": { "id": "my-plugin", "version": "1.0.0" },
  "driverUrl": "/test/driver.html",
  "capabilities": ["selectors", "stateSnapshot"],
  "scenarios": [
    {
      "id": "smoke-test",
      "title": "Plugin renders",
      "tags": ["smoke"],
      "readiness": { "phases": [0, 1, 2], "timeoutMs": 8000 },
      "steps": [{ "type": "mount", "payload": {} }],
      "asserts": [{ "type": "selectorVisible", "selector": "[data-testid='root']" }]
    }
  ]
}
```

### Cypress Specs

Cypress specs are in `cypress/e2e/`:

- `00-startup-plugins-loaded.cy.ts`: Verifies all plugins load at startup
- `generic-plugin-runner.cy.ts`: Runs scenarios from test manifests

### Custom Commands

Use `cy.waitForRenderXReady()` to wait for app readiness:

```typescript
cy.waitForRenderXReady({
  minPlugins: 5,
  minMounted: 3,
  minRoutes: 10,
  minTopics: 20,
  eventTimeoutMs: 30000,
  requiredPluginIds: ['plugin-a', 'plugin-b']
});
```

## Test Artifacts

Test artifacts are stored in:
- `cypress/artifacts/logs/`: Test execution logs
- `cypress/artifacts/snapshots/`: State snapshots
- `.logs/`: Startup logs (CI)

## Troubleshooting

### Tests Timeout

- Increase `eventTimeoutMs` in test configuration
- Check browser console for errors
- Verify plugins are loading correctly

### Plugin Not Found

- Verify plugin manifest is served at `/plugins/plugin-manifest.json`
- Check plugin registration in conductor
- Review startup logs in `.logs/`

### Harness Not Available

- Ensure `src/test-harness/harness.ts` is loaded
- Check browser console for script errors
- Verify `window.TestHarness` is defined

## Performance Considerations

- Tests run in parallel by default (configurable in `cypress.config.ts`)
- Each test scenario runs in isolation
- Artifacts are cleaned up after test runs
- Coverage reports are generated for unit tests

## CI/CD Integration

The CI pipeline includes:

1. **Lint & Unit Tests** (multi-version Node: 18.x, 20.x)
2. **E2E Tests** (Cypress)
3. **CI Precheck** (plugin availability verification)
4. **Quality Gates** (all checks must pass)

See `.github/workflows/ci.yml` for details.

