## External Plugin Migration Checklist → @renderx-plugins/host-sdk

This is the canonical, copy-pasteable checklist for migrating plugin repositories away from host internals (src/**) to the stable Host SDK package.

Related: ADR-0023, Issue #67

### Prerequisites
- Align Node/TypeScript/Vite versions with the host where possible
- Ensure your build supports ESM and TS path resolution

### 1) Install the Host SDK
- Monorepo/local dev: workspace provides packages/host-sdk
- External repo: add a dependency

```bash
npm install -D @renderx-plugins/host-sdk
```

### 2) Replace imports with SDK equivalents
Replace any imports from src/** with the SDK facade. Common mappings:

- useConductor → from "@renderx-plugins/host-sdk"
- EventRouter → from "@renderx-plugins/host-sdk"
- resolveInteraction → from "@renderx-plugins/host-sdk"
- isFlagEnabled, getFlagMeta → from "@renderx-plugins/host-sdk"
- getTagForType, computeTagFromJson, mapJsonComponentToTemplate → from "@renderx-plugins/host-sdk" (if used)

Before:
```ts
import { useConductor } from "../../../src/conductor";
import { EventRouter } from "../../../src/EventRouter";
import { resolveInteraction } from "../../../src/interactionManifest";
```
After:
```ts
import { useConductor, EventRouter, resolveInteraction } from "@renderx-plugins/host-sdk";
```

### 3) Eventing and routing
- Publish topics via EventRouter.publish(topic, payload, conductor)
- Or resolve interactions then call conductor.play()
- Do not bypass sequencing; conductor.play() is the required flow primitive

```ts
import { useConductor, EventRouter, resolveInteraction } from "@renderx-plugins/host-sdk";

const conductor = useConductor();
await EventRouter.publish("canvas.component.drag.move", { id, position }, conductor);

const r = resolveInteraction("control.panel.update");
await conductor.play(r.pluginId, r.sequenceId, payload);
```

### 4) UI vs Stage‑crew layering
- DOM/CSS manipulation is allowed only in stage‑crew handlers
- UI code should remain pure (rendering, props/state) and use template.cssVariables for drag ghost styling

### 5) Feature flags
- Read flags only via SDK helpers: isFlagEnabled(id), getFlagMeta(id)
- Flag IDs must exist in the central registry (enforced by lint)

### 6) PanelSlot module specifiers
- Prefer package names (e.g., "@org/canvas-plugin")
- URLs allowed in browser; tests should expect graceful fallback
- File-system paths ("/plugins/…") are tolerated during transition only

Example manifest entry:
```json
{ "slot": "canvas", "module": "@org/canvas-plugin", "export": "CanvasPage" }
```

### 7) Tests
- Route through EventRouter or conductor.play()
- If a test environment encounters URL module specifiers, assert graceful fallback (Node cannot import https URLs without a loader)

### 8) Lint policy (boundary + flags)
Add these to your plugin repo to enforce boundaries and flags via ESLint (flat config):

```js
// eslint.config.js
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import noHostInternalsInPlugins from "@renderx-plugins/host-sdk/eslint/no-host-internals-in-plugins.js"; // or copy the rule into your repo
import featureFlags from "@renderx-plugins/host-sdk/eslint/feature-flags.js"; // optional if not vendoring

export default [
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    ignores: ["dist/**","build/**","node_modules/**"],
    languageOptions: { parser: tsparser, parserOptions: { ecmaVersion: "latest", sourceType: "module" } },
    plugins: { "@typescript-eslint": tseslint },
  },
  {
    files: ["plugins/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-host-internals-in-plugins/no-host-internals-in-plugins": "error",
      "feature-flags/enforce-flag-ids": "error"
    },
    plugins: {
      "no-host-internals-in-plugins": noHostInternalsInPlugins,
      "feature-flags": featureFlags
    }
  }
];
```

If you are not consuming the rules from a package, you can copy the rule implementation from this repo: eslint-rules/no-host-internals-in-plugins.js

### 9) CI gate (example GitHub Actions)
Add a minimal workflow to block src/** imports in plugin repos:

```yaml
name: ci
on: [push, pull_request]
jobs:
  lint_and_test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm test
```

### 10) Copy‑pasteable task list
- [ ] Prereqs: align versions; confirm ESM build support
- [ ] Install: add dependency on @renderx-plugins/host-sdk
- [ ] Replace imports with SDK equivalents
  - [ ] useConductor
  - [ ] EventRouter
  - [ ] resolveInteraction
  - [ ] isFlagEnabled, getFlagMeta
  - [ ] getTagForType, computeTagFromJson, mapJsonComponentToTemplate (if used)
- [ ] Eventing/routing go through EventRouter.publish + conductor, or resolveInteraction + conductor.play
- [ ] Respect UI vs Stage‑crew layering (DOM/CSS only in handlers)
- [ ] Feature flags via SDK only
- [ ] PanelSlot specifiers: prefer package; allow URL in browser; keep path during transition
- [ ] Tests: route via conductor/EventRouter; handle URL imports gracefully in Node
- [ ] Lint: enable boundary rule at error; ensure zero violations
- [ ] CI: run lint in PRs to block src/** imports

### Optional: codemod/regex quick swap
Simple regex you can run in your editor to catch common cases:
- Find: `from\s+"\.{1,2}\/\.\.\/\.\.\/src\/([^"]+)"` → Replace: `from "@renderx-plugins/host-sdk"`
- And explicitly import the right symbols in each file as needed

For more detail, see: docs/host-sdk/USING_HOST_SDK.md and ADR-0023.

