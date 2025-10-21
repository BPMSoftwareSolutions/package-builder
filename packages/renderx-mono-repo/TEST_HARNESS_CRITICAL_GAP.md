# CRITICAL GAP: Test Harness Infrastructure NOT Migrated

**Status**: ⚠️ CRITICAL - Blocks E2E Testing  
**Date**: October 21, 2025  
**Impact**: Entire plugin-served E2E testing strategy is blocked

## Summary

The test harness infrastructure from `renderx-plugins-demo` was **NOT migrated** to the mono-repo. This is a **critical gap** that must be addressed before any E2E testing can be performed.

## What is the Test Harness?

The test harness is a sophisticated framework for plugin-served, data-driven E2E testing (ADR-0033). It enables:

- **Plugin-Served Tests**: Each plugin provides its own test scenarios via `/test/manifest.json`
- **Data-Driven E2E**: Tests are defined as JSON data (steps, asserts, scenarios)
- **Generic Runner**: Single Cypress spec discovers and runs all plugin tests
- **Artifact Collection**: Screenshots, logs, snapshots collected per scenario
- **Thin Host**: Host remains unaware of plugin internals

## Missing Components

### 1. Test Harness Core (src/test-harness/)
```
src/test-harness/
├── harness.ts          ← TestHarnessAPI implementation
├── types.ts            ← TestManifest, TestScenario, Step, Assert types
├── protocol.ts         ← postMessage protocol envelope
└── index.ts            ← Exports
```

**What it does**:
- Implements `window.TestHarness` API
- Manages iframe communication via postMessage
- Handles step execution and assertions
- Collects logs and snapshots
- Enforces timeouts and error handling

### 2. Test Plugin Loading Page (src/test-plugin-loading.html)
- Harness page that loads plugins for testing
- Registers `window.TestHarness` API
- Loads test-plugin-loader.tsx
- Provides isolated test environment

### 3. Test Plugin Loader (src/test-plugin-loader.tsx)
- React component that loads plugins
- Initializes conductor and manifests
- Provides diagnostics UI
- Manages plugin lifecycle for testing

### 4. ADR-0033 Documentation
- Architecture Decision Record for plugin-served E2E
- Defines roles and responsibilities
- Documents protocol and types
- Provides migration plan

## Impact of Missing Test Harness

### Cannot Do
- ❌ Run data-driven E2E tests
- ❌ Verify plugin startup
- ❌ Run generic plugin runner
- ❌ Collect test artifacts
- ❌ Implement plugin-served test scenarios
- ❌ Test plugin interactions
- ❌ Verify end-to-end workflows

### Quality Loss
- ❌ No integration testing
- ❌ No plugin compatibility verification
- ❌ No end-to-end quality validation
- ❌ Cannot catch plugin interaction bugs

## How Test Harness Works

### Architecture
```
┌─────────────────────────┐
│  Cypress Generic Runner │
│  (generic-plugin-runner.cy.ts)
└────────────┬────────────┘
             │ discovers plugins
             ▼
┌─────────────────────────┐
│  Plugin Registry (JSON) │
│  [plugin baseUrls]      │
└─────────────────────────┘

For each plugin:
┌──────────────────────────┐
│  Host Harness Page       │
│  test-plugin-loading.html│
│  window.TestHarness API  │
└────────────┬─────────────┘
             │ loads via iframe
             ▼
┌──────────────────────────┐
│  Plugin Test Driver Page │
│  /test/driver.html       │
│  (plugin-provided)       │
└──────────────────────────┘
```

### Test Manifest Format
```json
{
  "testApiVersion": "1.0.0",
  "plugin": { "id": "canvas", "version": "1.0.0" },
  "driverUrl": "/test/driver.html",
  "scenarios": [
    {
      "id": "startup",
      "title": "Plugin loads successfully",
      "steps": [
        { "type": "mount" }
      ],
      "asserts": [
        { "type": "selectorExists", "selector": "[data-testid=canvas]" }
      ]
    }
  ]
}
```

## Migration Path (Phase 6, Task 0)

### Steps
1. Copy `src/test-harness/` from renderx-plugins-demo
2. Copy `src/test-plugin-loading.html`
3. Copy `src/test-plugin-loader.tsx`
4. Update import paths (@renderx-plugins/* → @renderx/*)
5. Update conductor initialization for mono-repo
6. Verify TestHarnessAPI is accessible
7. Test harness page loads correctly
8. Verify postMessage protocol works

### Estimated Time
2 hours

### Acceptance Criteria
- ✅ test-harness/ directory present
- ✅ test-plugin-loading.html accessible
- ✅ window.TestHarness API available
- ✅ postMessage protocol functional
- ✅ No import path errors

## Dependencies

**Blocks**:
- Task 1: Cypress Configuration
- Task 2: E2E Test Specs
- Task 3: CI/CD Pipeline
- Task 5: Test Manifest Framework

**Depends On**:
- Phase 5 completion (code migration)

## References

- **ADR-0033**: Plugin-Served, Data-Driven E2E for Thin Host
- **Source**: temp-repos/renderx-plugins-demo/src/test-harness/
- **GitHub Issue**: #150 (Phase 6: Quality Gates & E2E Testing)

## Action Items

- [ ] Migrate test-harness/ directory
- [ ] Migrate test-plugin-loading.html
- [ ] Migrate test-plugin-loader.tsx
- [ ] Update import paths
- [ ] Verify TestHarnessAPI works
- [ ] Document test manifest usage
- [ ] Create example test manifests

## Timeline

**Phase 6, Task 0**: 2 hours  
**Must complete before**: Task 1 (Cypress Configuration)

---

**Document Created**: October 21, 2025  
**Status**: ⚠️ CRITICAL - Action Required  
**Related Issue**: #150 - Phase 6: Quality Gates & E2E Testing

