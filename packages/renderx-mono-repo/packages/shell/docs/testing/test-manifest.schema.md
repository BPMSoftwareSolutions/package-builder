# Test Manifest Schema (draft)

Status: Draft (Phase 0)

This document defines the minimal JSON structure that a plugin should serve at `/test/manifest.json` for the thin-host, data-driven E2E runner.

Top-level fields
- `testApiVersion` (string): Protocol version the manifest targets (e.g., `1.0.0`).
- `plugin` (object): `{ id: string, version: string }`.
- `driverUrl` (string): Relative URL to the plugin test driver page (e.g., `/test/driver.html`).
- `capabilities` (string[]): e.g., `selectors`, `stateSnapshot`, `screenshot`.
- `scenarios` (Scenario[]): Array of scenario definitions.

Scenario
- `id` (string): Unique id per plugin.
- `title` (string): Human readable.
- `tags` (string[]): `smoke`, `render`, etc.
- `readiness` (object): `{ phases: number[] (e.g., [0,1,2]), timeoutMs?: number }`.
- `env` (object): Optional UI/env hints `{ viewport?: {width,height}, theme?: 'light'|'dark' }`.
- `steps` (Step[]): Normalized steps (see below).
- `asserts` (Assert[]): Normalized assertions.
- `artifacts` (object): `{ screenshot?: boolean, snapshot?: boolean }`.

Step
- `type` (string): e.g., `mount`, `setProps`, `click`, `type`, `waitForEvent`.
- `payload` (any): Step-specific data.

Assert
- `type` (string): e.g., `selectorText`, `selectorVisible`, `snapshotEquals`.
- `selector?` (string): CSS selector if applicable.
- Other keys per assertion type.

Notes
- Plugins may author `.feature` files and compile them into this manifest at build time.
- The host will validate `testApiVersion` and capabilities; incompatible manifests are skipped with a clear message.
