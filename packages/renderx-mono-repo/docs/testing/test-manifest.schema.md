# Test Manifest Schema

Status: Active (Phase 6)

This document defines the JSON structure that plugins should serve at `/test/manifest.json` for the data-driven E2E runner.

## Top-level fields

- `testApiVersion` (string): Protocol version the manifest targets (e.g., `1.0.0`).
- `plugin` (object): `{ id: string, version: string }`.
- `driverUrl` (string): Relative URL to the plugin test driver page (e.g., `/test/driver.html`).
- `capabilities` (string[]): e.g., `selectors`, `stateSnapshot`, `screenshot`.
- `scenarios` (Scenario[]): Array of scenario definitions.

## Scenario

- `id` (string): Unique id per plugin.
- `title` (string): Human readable.
- `tags` (string[]): `smoke`, `render`, etc.
- `readiness` (object): `{ phases: number[] (e.g., [0,1,2]), timeoutMs?: number }`.
- `env` (object): Optional UI/env hints `{ viewport?: {width,height}, theme?: 'light'|'dark' }`.
- `steps` (Step[]): Normalized steps (see below).
- `asserts` (Assert[]): Normalized assertions.
- `artifacts` (object): `{ screenshot?: boolean, snapshot?: boolean }`.

## Step

- `type` (string): e.g., `mount`, `setProps`, `click`, `type`, `waitForEvent`.
- `payload` (any): Step-specific data.

## Assert

- `type` (string): e.g., `selectorText`, `selectorVisible`, `snapshotEquals`.
- `selector?` (string): CSS selector if applicable.
- Other keys per assertion type.

## Example Test Manifest

```json
{
  "testApiVersion": "1.0.0",
  "plugin": {
    "id": "my-plugin",
    "version": "1.0.0"
  },
  "driverUrl": "/test/driver.html",
  "capabilities": ["selectors", "stateSnapshot"],
  "scenarios": [
    {
      "id": "smoke-render",
      "title": "Plugin renders without errors",
      "tags": ["smoke"],
      "readiness": {
        "phases": [0, 1, 2],
        "timeoutMs": 8000
      },
      "env": {
        "theme": "dark"
      },
      "steps": [
        {
          "type": "mount",
          "payload": {}
        }
      ],
      "asserts": [
        {
          "type": "selectorVisible",
          "selector": "[data-testid='plugin-root']"
        }
      ],
      "artifacts": {
        "screenshot": true,
        "snapshot": true
      }
    }
  ]
}
```

## Notes

- Plugins may author `.feature` files and compile them into this manifest at build time.
- The host will validate `testApiVersion` and capabilities; incompatible manifests are skipped with a clear message.
- The test harness communicates with the driver via postMessage protocol (see `src/test-harness/protocol.ts`).

