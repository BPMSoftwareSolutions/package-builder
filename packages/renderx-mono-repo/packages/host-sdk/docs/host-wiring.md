# Host wiring: providers and safe imports

This guide shows how a thin host should wire feature flags and (optionally) provide manifest/startup data while keeping browser builds safe.

## Feature flags provider

Wire a provider during app startup.

```ts
import { setFeatureFlagsProvider, type FlagsProvider } from '@renderx-plugins/host-sdk';

const provider: FlagsProvider = {
  isFlagEnabled: (key) => /* your logic */ false,
  getFlagMeta: (key) => ({ status: 'off', created: '2024-01-01' }),
  getAllFlags: () => ({})
};

setFeatureFlagsProvider(provider);
```

The SDK delegates in this order:
- test overrides → provider (SSR-safe) → window.RenderX.featureFlags → built-in defaults

## Manifests and startup (optional providers)

The SDK ships with browser-safe loaders that use `fetch('/...')` in the browser and `getArtifactsDir()` + fs in Node/SSR. If you prefer to fully control data sources, you can inject providers.

```ts
import {
  setInteractionManifestProvider,
  setTopicsManifestProvider,
  setStartupStatsProvider,
} from '@renderx-plugins/host-sdk';

setInteractionManifestProvider({
  resolveInteraction: (key) => ({ pluginId: 'MyPlugin', sequenceId: key + '-symphony' })
});

setTopicsManifestProvider({
  getTopicDef: (key) => ({ routes: [{ pluginId: 'MyPlugin', sequenceId: key + '-symphony' }] })
});

setStartupStatsProvider({
  async getPluginManifestStats() { return { pluginCount: 0 }; }
});
```

## Subpath imports: stable patterns

Use these imports from your Vite/Rollup/Webpack apps:

```ts
import { initInteractionManifest } from '@renderx-plugins/host-sdk/core/manifests/interactionManifest';
import { initTopicsManifest } from '@renderx-plugins/host-sdk/core/manifests/topicsManifest';
import { getPluginManifestStats } from '@renderx-plugins/host-sdk/core/startup/startupValidation';
```

These subpaths are covered by a CI smoke test (Vite build on Linux) to prevent publish-time misconfigurations.

## Do not import JSON from node_modules

Avoid patterns like `import '../../../some.json?raw'` from inside node_modules. The SDK does not rely on raw JSON imports; it uses `fetch` in the browser and `artifactsDir` + `fs` in Node/SSR paths where appropriate.

