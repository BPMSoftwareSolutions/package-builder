# @renderx-plugins/host-sdk

Host SDK for RenderX plugins - provides conductor, event routing, component mapping, inventory management, and CSS registry APIs.

## Installation

```bash
npm install @renderx-plugins/host-sdk
```

## Usage

This SDK provides the core APIs that RenderX plugins use to interact with the host application:

### Conductor API

```typescript
import { useConductor } from '@renderx-plugins/host-sdk';

function MyPlugin() {
  const conductor = useConductor();

  // Play a sequence
  const result = await conductor.play('pluginId', 'sequenceId', data);
}
```

### Interaction Resolution

```typescript
import { resolveInteraction } from '@renderx-plugins/host-sdk';

// Resolve interaction to plugin/sequence IDs
const route = resolveInteraction('app.ui.theme.toggle');
// Returns: { pluginId: 'HeaderThemePlugin', sequenceId: 'header-ui-theme-toggle-symphony' }
```

### Component Mapping

```typescript
import { getTagForType, mapJsonComponentToTemplate } from '@renderx-plugins/host-sdk';

// Map component types to HTML tags
const tag = getTagForType('button'); // 'button'

// Convert JSON component to template
const template = mapJsonComponentToTemplate(jsonComponent);
```

### Feature Flags

```typescript
import { isFlagEnabled, getFlagMeta } from '@renderx-plugins/host-sdk';

// Check if feature is enabled
const enabled = isFlagEnabled('new-feature');

// Get flag metadata
const meta = getFlagMeta('new-feature');
```

### Plugin Manifest

```typescript
import { getPluginManifest } from '@renderx-plugins/host-sdk';

// Get plugin manifest data
const manifest = getPluginManifest();
```

### Inventory API

The Inventory API provides access to component inventory management for external plugins:

```typescript
import {
  listComponents,
  getComponentById,
  onInventoryChanged,
  Inventory
} from '@renderx-plugins/host-sdk';
import type { ComponentSummary, Component } from '@renderx-plugins/host-sdk';

// List all available components
const components: ComponentSummary[] = await listComponents();

// Get detailed component information
const component: Component | null = await getComponentById('my-component-id');

// Subscribe to inventory changes
const unsubscribe = onInventoryChanged((components: ComponentSummary[]) => {
  console.log('Inventory updated:', components);
});

// Unsubscribe when done
unsubscribe();

// Alternative: Use the convenience object
const components = await Inventory.listComponents();
const component = await Inventory.getComponentById('my-component-id');
```

### CSS Registry API

The CSS Registry API provides CSS class management capabilities:

```typescript
import {
  hasClass,
  createClass,
  updateClass,
  onCssChanged,
  CssRegistry
} from '@renderx-plugins/host-sdk';
import type { CssClassDef } from '@renderx-plugins/host-sdk';

// Check if a CSS class exists
const exists: boolean = await hasClass('my-custom-class');

// Create a new CSS class
const classDef: CssClassDef = {
  name: 'my-custom-class',
  rules: '.my-custom-class { color: blue; background: white; }',
  source: 'my-plugin',
  metadata: { version: '1.0' }
};
await createClass(classDef);

// Update an existing CSS class
await updateClass('my-custom-class', {
  name: 'my-custom-class',
  rules: '.my-custom-class { color: red; background: white; }'
});

// Subscribe to CSS changes
const unsubscribe = onCssChanged((classes: CssClassDef[]) => {
  console.log('CSS registry updated:', classes);
});

// Alternative: Use the convenience object
const exists = await CssRegistry.hasClass('my-class');
await CssRegistry.createClass(classDef);
```

### Config API

The Config API provides a simple key-value configuration service for plugins to access host-managed configuration:

```typescript
import { getConfigValue, hasConfigValue } from '@renderx-plugins/host-sdk';

// Get a configuration value
const apiKey = getConfigValue('API_KEY');
const apiUrl = getConfigValue('API_URL') || 'https://default.api.com';

// Check if a configuration key exists
if (hasConfigValue('API_KEY')) {
  const apiKey = getConfigValue('API_KEY');
  // Use the API key
}

// Example: Configure API client
const apiClient = {
  baseURL: getConfigValue('API_URL'),
  apiKey: getConfigValue('API_KEY'),
  timeout: parseInt(getConfigValue('API_TIMEOUT') || '5000'),
};
```

**Host Setup:**

The host application should initialize the config service during startup:

```typescript
import { initConfig } from '@renderx-plugins/host-sdk/core/environment/config';

// Initialize with environment variables (Vite pattern)
initConfig({
  API_KEY: import.meta.env.VITE_API_KEY,
  API_URL: import.meta.env.VITE_API_URL,
  FEATURE_FLAG: import.meta.env.VITE_FEATURE_FLAG,
});

// Or initialize with static values
initConfig({
  API_KEY: 'your-api-key',
  API_URL: 'https://api.example.com',
});
```

**Runtime Configuration:**

The host can also update configuration at runtime:

```typescript
import { setConfigValue, removeConfigValue } from '@renderx-plugins/host-sdk/core/environment/config';

// Update a config value
setConfigValue('API_KEY', 'new-api-key');

// Remove a config value
removeConfigValue('OLD_CONFIG');
```

**Key Features:**

- ✅ **Host-managed**: Configuration is controlled by the host application
- ✅ **Plugin-friendly**: Plugins access via simple SDK functions
- ✅ **Environment variable support**: Works seamlessly with Vite's `import.meta.env`
- ✅ **E2E/CI friendly**: Easy to inject secrets via environment variables
- ✅ **SSR-safe**: Returns `undefined` in Node.js environments
- ✅ **Type-safe**: Full TypeScript support

## Node.js/SSR Support

All APIs work seamlessly in Node.js environments with mock implementations. The facades automatically detect the environment and provide appropriate fallbacks:

```typescript
// Works in both browser and Node.js
const components = await listComponents(); // Returns empty array in Node.js
const hasMyClass = await hasClass('test'); // Returns false in Node.js

// Test utilities for Node.js environments
import { setMockInventory, setMockCssClass } from '@renderx-plugins/host-sdk';

// Set up mock data for testing
setMockInventory([{ id: 'test', name: 'Test Component' }]);
setMockCssClass({ name: 'test-class', rules: '.test-class { color: red; }' });
```

## Peer Dependencies

- `musical-conductor`: The orchestration engine
- `react`: React 18+ for hook-based APIs



## Host wiring (providers)

Quick start for providers:

```ts
import { setFeatureFlagsProvider, type FlagsProvider } from '@renderx-plugins/host-sdk';

const flags: FlagsProvider = {
  isFlagEnabled: (key) => false,
  getFlagMeta: (key) => ({ status: 'off', created: '2024-01-01' }),
  getAllFlags: () => ({})
};
setFeatureFlagsProvider(flags);
```

Optional providers (manifests/startup):

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

Bundler-safe subpath imports:

```ts
import { initInteractionManifest } from '@renderx-plugins/host-sdk/core/manifests/interactionManifest';
import { initTopicsManifest } from '@renderx-plugins/host-sdk/core/manifests/topicsManifest';
import { getPluginManifestStats } from '@renderx-plugins/host-sdk/core/startup/startupValidation';
```

See docs/host-wiring.md for details and guidance.

## Host primitives (advanced)

For host applications that want a thin shell, internal primitives are now available via subpath exports under `core/*`:

```typescript
import { initConductor } from '@renderx-plugins/host-sdk/core/conductor';
import { EventRouter } from '@renderx-plugins/host-sdk/core/events/EventRouter';
```

Notes:
- These APIs are intended for host integration and may assume a browser-like environment unless otherwise documented.
- JSON sequence/catalog loading paths are discovered at runtime; see `core/environment/env.ts` for `HOST_ARTIFACTS_DIR` discovery used outside the browser.

## License

MIT
