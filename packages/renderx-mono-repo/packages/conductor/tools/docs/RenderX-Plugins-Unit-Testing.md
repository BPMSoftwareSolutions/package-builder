# RenderX CIA Plugins – Unit Testing Strategy

This strategy defines how we unit-test RenderX plugins that are loaded via the CIA (Conductor Integration Architecture) plugin system and follow SPA principles.

## Goals
- Validate plugin sequences (structure and registration readiness)
- Verify handler behavior in isolation with deterministic inputs/outputs
- Enforce SPA/CIA rules through existing validators (no direct EventBus access in plugins)
- Keep tests fast and independent of the Vite dev server or Playwright

## Test Types
- Sequence validation: Ensure each plugin's `sequence` passes core registry validation (id, name, movements, beats)
- Handler unit tests: Call exported `handlers` directly with a controlled `context`:
  - Provide `context.payload` to accumulate results
  - Provide `context.sequence` so handlers can read configuration
  - Provide a minimal `context.logger` capturing `info/warn/error`
  - Provide optional `context.onComponentsLoaded` callback for notification handlers
- Manifest-driven mounting and cross-plugin wiring are covered by integration/E2E tests. Unit tests remain black-box at the handler level.

## Test Environment
- Jest with jsdom (already configured in repo)
- No network: Mock `global.fetch` for handlers that fetch assets
- Use existing MusicalConductor utilities when needed (EventBus, SequenceRegistry) for sequence validation

## File Layout
- tests/unit/renderx/plugins/<plugin-name>.test.ts

## Patterns
- Import plugin modules directly from RenderX/public/plugins/.../index.js (they are ESM bundles used by the app)
- Prefer dynamic `import()` to avoid resolver edge cases
- Keep each test resilient to minor changes in plugin internals by focusing on public exports: `sequence`, `handlers`

## Running
- npm run test:unit (root) – executes Jest unit tests
- For a focused run: npx jest tests/unit/renderx/plugins --runInBand

## Example Checklist per Plugin
- Sequence shape passes `SequenceRegistry.register()` (no throw)
- Core handler happy-path behavior
- Edge cases: missing/invalid input, empty arrays, disabled validation/config flags
- Notification callbacks invoked with expected payload
- No direct reliance on DOM or browser APIs beyond what’s mocked

## Notes
- Architectural enforcement (SPAValidator) is exercised primarily at runtime/integration; unit tests should avoid testing internal enforcement wiring and instead keep focus on plugin correctness.

