# Authoring Plugin-Served Tests (Driver + Manifest)

Status: Draft (Phase 0)

This guide shows how a plugin owns and serves its E2E scenarios to the thin host.
Plugins publish a Test Manifest (JSON) and a Test Driver page that the host iframes.
The host runner is generic and never hard-codes plugin knowledge.

## Quick checklist

- [ ] Expose two endpoints:
  - [ ] `GET /test/manifest.json` — list of scenarios in the normalized format
  - [ ] `GET /test/driver.html` — page that loads the plugin and a small driver script
- [ ] Implement driver protocol (postMessage): `ack`, `readyPhase(0→1→2)`, `step`, `assert`, `teardown`
- [ ] Stabilize selectors with `data-testid` and prefer `stateSnapshot`-based asserts for brittle UIs
- [ ] (Optional) Author in Gherkin `.feature` files and compile → manifest.json at build-time
- [ ] Version your manifest with `testApiVersion` and declare `capabilities`

## Minimal file layout (plugin repo)

```
plugin-repo/
├─ public/
│  └─ test/
│     ├─ driver.html            # iframe target (loads driver.js)
│     └─ driver.js              # implements protocol and wires to your UI
├─ test/
│  ├─ manifest.json             # build output consumed by the host
│  ├─ features/                 # optional Gherkin authoring
│  │  └─ component.feature
│  ├─ steps/                    # step/asserter implementations (shareable)
│  │  └─ component.steps.ts
│  └─ build/gherkin-to-manifest.ts # optional transform
└─ package.json
```

## Test Manifest (normalized JSON)

Serve JSON at `/test/manifest.json`. Keep it small, stable, and versioned.

Example:

```
{
  "testApiVersion": "1.0.0",
  "plugin": { "id": "rx.library.button", "version": "2.5.0" },
  "driverUrl": "/test/driver.html",
  "capabilities": ["selectors", "stateSnapshot"],
  "scenarios": [
    {
      "id": "button-renders-default",
      "title": "Button renders with default props",
      "tags": ["render", "smoke"],
      "readiness": { "phases": [0,1,2], "timeoutMs": 6000 },
      "env": { "viewport": { "width": 1024, "height": 768 }, "theme": "light" },
      "steps": [
        { "type": "setProps", "payload": { "label": "Click me" } },
        { "type": "mount" }
      ],
      "asserts": [
        { "type": "selectorText", "selector": "[data-testid=btn-label]", "equals": "Click me" }
      ],
      "artifacts": { "screenshot": true, "snapshot": true }
    }
  ]
}
```

See `docs/testing/test-manifest.schema.md` for field descriptions.

## Driver protocol (postMessage)

Transport: `window.postMessage` from the iframe to the parent (host harness). All messages share:

- `channel: "rx.test"`
- `version: "1.0.0"`
- `type: string`
- `payload: object`

Required flow:

1) Host → Driver: `host:init { scenarioId, env, flags }`
2) Driver → Host: `driver:ack { driverVersion, capabilities }`
3) Driver → Host: `driver:readyPhase { phase: 0 }`, then `{ phase: 1 }`, then `{ phase: 2 }`
4) For each step/assert:
   - Host → Driver: `host:step { id, type, payload }`
   - Driver → Host: `driver:stepResult { id, status: "ok"|"fail", detail? }`
   - Host → Driver: `host:assert { id, type, payload }`
   - Driver → Host: `driver:assertResult { id, status, detail? }`
5) Teardown:
   - Host → Driver: `host:teardown`
   - Driver → Host: `driver:teardownResult { status: "ok" }`

Determinism: emit phases 0→1→2 once, in order. Honor the scenario `timeoutMs` or sensible defaults.

## Driver skeleton (vanilla JS)

```
// public/test/driver.js
(function () {
  const CHANNEL = 'rx.test';
  const VERSION = '1.0.0';
  const originOk = () => true; // tighten with expected origin if known

  // Example plugin UI bootstrapping
  async function mountUI(props) {
    // TODO: mount your component/app under test here
  }

  function post(type, payload) {
    window.parent.postMessage({ channel: CHANNEL, version: VERSION, type, payload }, '*');
  }

  function ready(phase, detail) { post('driver:readyPhase', { phase, detail }); }

  window.addEventListener('message', async (event) => {
    if (!originOk()) return;
    const msg = event.data || {};
    if (msg.channel !== CHANNEL) return;

    try {
      if (msg.type === 'host:init') {
        // Mount UI for scenario
        await mountUI({});
        post('driver:ack', { driverVersion: '1.0.0', capabilities: ['selectors', 'stateSnapshot'] });
        ready(0);
        // Perform any async data/bootstrap for phase 1
        ready(1);
        // Final paint/idle ready
        ready(2);
      }

      if (msg.type === 'host:step') {
        const { id, type, payload } = msg.payload;
        // handle type: 'mount' | 'setProps' | 'click' | 'type' | ...
        post('driver:stepResult', { id, status: 'ok' });
      }

      if (msg.type === 'host:assert') {
        const { id, type, payload } = msg.payload;
        // Example: selectorText
        post('driver:assertResult', { id, status: 'ok' });
      }

      if (msg.type === 'host:teardown') {
        // Unmount/cleanup if needed
        post('driver:teardownResult', { status: 'ok' });
      }
    } catch (err) {
      // Convert to a structured error if desired
      if (msg.type === 'host:step') post('driver:stepResult', { id: msg.payload?.id, status: 'fail', detail: String(err) });
      if (msg.type === 'host:assert') post('driver:assertResult', { id: msg.payload?.id, status: 'fail', detail: String(err) });
    }
  });
})();
```

Driver page (loads the script and your plugin):

```
<!-- public/test/driver.html -->
<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"/><title>Plugin Test Driver</title></head>
  <body>
    <div id="app"></div>
    <script src="/test/driver.js"></script>
  </body>
</html>
```

## Best practices

- Deterministic readiness
  - Emit 0 when the shell is created, 1 after data/bootstrap is complete, 2 after first idle/paint.
  - Never emit out of order; never emit phases more than once.
- Selectors
  - Prefer `data-testid` on stable nodes; avoid text-based or deep structural selectors.
  - Suggested format: `data-testid="<pluginShort>-<component>-<semantic>"` (kebab-case), e.g., `lib-btn-label`.
- State snapshots
  - Provide a `stateSnapshot` capability to assert against structured state (props, view-model) rather than DOM.
  - Keep snapshot shape small and versioned `{ version, data }`.
- Steps and asserts
  - Keep step verbs minimal and reusable across scenarios: `mount`, `setProps`, `click`, `type`, `waitForSelector`, `waitForTopic`.
  - Map Gherkin steps 1:1 to normalized steps/asserts during build.
- Errors
  - Return structured `detail` (code, message, context) on failures to help CI triage.

## Optional: Gherkin → Manifest build

- Author `.feature` files:
  - Example:
    ```
    Feature: Button renders
      Scenario: Button renders with default props
        Given the button props:
          | label | Click me |
        When the component mounts
        Then I should see text "Click me" in "[data-testid=btn-label]"
    ```
- Build step transforms feature(s) → `test/manifest.json`:
  - Map `Given/When/Then` to `steps/asserts` with your step catalog.
  - Validate shapes against the schema before emitting.

## Local development

- Start your plugin dev server (e.g., http://localhost:6001) serving `/test/driver.html` and `/test/manifest.json`.
- In the host app, configure a dev proxy (Vite) so the driver and manifest are same-origin during development.
- Use the host harness page (e.g., `src/test-plugin-loading.html`) with query params:
  - `?driver=<encoded driverUrl>&scenario=<scenarioId>` to auto-init while debugging.

## Versioning & compatibility

- Manifest field `testApiVersion` must match the host runner supported range (e.g., `^1.0.0`).
- Driver responds to `host:init` with `{ driverVersion, capabilities }`; the host may skip scenarios if requirements aren’t met.

## FAQ

- Q: Can I trigger host-side screenshots?
  - A: Advertise `screenshot` capability; the host may take full-page or selector-targeted screenshots based on scenario `artifacts`.
- Q: How to handle cross-origin?
  - A: Prefer dev proxy to keep same-origin. If cross-origin is unavoidable, restrict `postMessage` target origins and verify `event.origin`.
