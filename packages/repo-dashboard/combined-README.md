# Combined README - BPMSoftwareSolutions

Generated on: 2025-10-19

## Table of Contents

- [renderx-plugin-lab](#renderx-plugin-lab)
- [renderx-plugin-library-component](#renderx-plugin-library-component)
- [renderx-plugin-header](#renderx-plugin-header)
- [renderx-plugin-library](#renderx-plugin-library)
- [renderx-host-sdk](#renderx-host-sdk)
- [renderx-plugins-demo](#renderx-plugins-demo)
- [renderx-plugin-canvas](#renderx-plugin-canvas)
- [renderx-plugin-canvas-component](#renderx-plugin-canvas-component)
- [renderx-plugins-digital-assets](#renderx-plugins-digital-assets)
- [renderx-plugin-control-panel](#renderx-plugin-control-panel)
- [renderx-plugin-components](#renderx-plugin-components)
- [renderx-plugin-manifest-tools](#renderx-plugin-manifest-tools)
- [renderx-plugins](#renderx-plugins)

---

## renderx-plugin-lab

**Description**: A lab for testing a renderx plugin in isolation

**Repository**: https://github.com/BPMSoftwareSolutions/renderx-plugin-lab

### README Content

# RenderX Plugin Lab 🧪

**Experimental environment for RenderX plugins, Host SDK, and Thin Host architecture**

This repository serves as the **innovation lab** for RenderX's Conductor Integration Architecture (CIA) and Symphonic Plugin Architecture (SPA) systems.

---

## 🎯 Purpose

The RenderX Plugin Lab is a dedicated space for:

- **Creating** new RenderX plugins
- **Testing** plugin orchestration and communication
- **Validating** CIA and SPA compliance
- **Experimenting** with Thin Host implementations
- **Developing** AI-powered enhancements

---

## 🏗️ Architecture

### Thin Host
A minimal host implementation that provides:
- Plugin mounting points
- Lifecycle management
- Event coordination

### Conductor (CIA)
The orchestration layer that handles:
- Plugin communication
- Dependency management
- Event routing

### Plugins (SPA)
Standardized plugin system with:
- Type-safe interfaces
- Manifest validation
- Modular architecture

---

## 📁 Repository Structure

```
renderx-plugin-lab/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── host/
│   │   └── thin-host.tsx          # Thin Host implementation
│   ├── orchestration/
│   │   └── conductor-setup.ts     # Conductor configuration
│   └── validators/
│       └── spa-validator.ts       # SPA validation logic
├── plugins/
│   ├── library-panel/             # Library panel plugin
│   ├── control-panel/             # Control panel plugin
│   ├── canvas-ui/                 # Canvas UI plugin
│   └── example-ai-enhancement/    # AI enhancement example
├── docs/
│   ├── architecture-overview.md   # Architecture documentation
│   ├── canvas-files.md           # Canvas file format
│   ├── ai-enhancements.md        # AI enhancement guide
│   └── cia-spa-guide.md          # CIA/SPA reference
├── tests/
│   ├── unit/                     # Unit tests
│   └── e2e/                      # End-to-end tests
└── scripts/
    ├── simulateCanvas.js         # Canvas simulation
    └── showStats.js              # Repository statistics
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/BPMSoftwareSolutions/renderx-plugin-lab.git
cd renderx-plugin-lab

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run CIA tests
npm run test:cia

# Run SPA tests
npm run test:spa

# Simulate canvas operations
npm run simulate:canvas

# Show repository statistics
npm run stats
```

---

## 🧩 Creating a Plugin

### 1. Create Plugin Directory

```bash
mkdir -p plugins/my-plugin
```

### 2. Create Manifest

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "type": "panel",
  "exports": ["MyPanel"]
}
```

### 3. Implement Plugin

```typescript
export const MyPanel = () => {
  return <div>My Plugin Panel</div>;
};
```

### 4. Register with Conductor

```typescript
import { createConductor } from './src/orchestration/conductor-setup';

const conductor = createConductor({
  plugins: ['my-plugin'],
  mode: 'development'
});

await conductor.play();
```

---

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### CIA Validation

```bash
npm run test:cia
```

### SPA Validation

```bash
npm run test:spa
```

---

## 📚 Documentation

- [Architecture Overview](docs/architecture-overview.md)
- [Canvas Files](docs/canvas-files.md)
- [AI Enhancements](docs/ai-enhancements.md)
- [CIA & SPA Guide](docs/cia-spa-guide.md)

---

## 🎭 Plugin Types

### Panel Plugins
UI panels that provide specific functionality:
- Library Panel: Asset management
- Control Panel: Settings and controls

### Canvas Plugins
Direct canvas manipulation:
- Canvas UI: Drawing and editing tools

### Enhancement Plugins
AI-powered features:
- Auto-layout
- Style suggestions
- Content generation

---

## 🔧 Configuration

### Vite Configuration

The lab uses Vite for fast development and building. Configuration can be customized in `vite.config.ts`.

### TypeScript Configuration

TypeScript settings are in `tsconfig.json`. The configuration is optimized for React and modern JavaScript features.

---

## 🤝 Contributing

This is an experimental lab. Feel free to:
- Create new plugins
- Improve existing implementations
- Add tests and documentation
- Experiment with new architectures

---

## 📝 License

MIT

---

## 🔗 Related Projects

- [package-builder](https://github.com/BPMSoftwareSolutions/package-builder) - AI-assisted package builder
- [RenderX](https://github.com/BPMSoftwareSolutions/renderx) - Main RenderX platform

---

## 📞 Support

For questions and support, please open an issue in this repository.

---

**Built with ❤️ by BPM Software Solutions**


---

## renderx-plugin-library-component

**Description**: A plugin for RenderX that provides a reusable library component, enabling modular UI development and integration within RenderX-powered applications. This package offers standardized interfaces, customizable features, and seamless compatibility with the RenderX plugin ecosystem, making it easy to extend and maintain complex UI workflows.

**Repository**: https://github.com/BPMSoftwareSolutions/renderx-plugin-library-component

### README Content

# @renderx-plugins/library-component

Runtime package that registers the Library Component drag/drop sequences for RenderX.

- Entry: `src/index.ts`
- Export: `register(conductor)`
- Sequences: `drag`, `drop`, `container-drop`
- Types: bundled `.d.ts` (tsup dts)
- Peer dependency: `@renderx-plugins/host-sdk`
- **NEW**: Ships with bundled json-sequences and advertises them via `renderx.sequences` metadata

> Note: This is a pre-release (0.1.0-rc.1). API surface is stable for current host usage, but may have minor breaking changes prior to 1.0.

## Install

```bash
npm install @renderx-plugins/library-component @renderx-plugins/host-sdk
# or
pnpm add @renderx-plugins/library-component @renderx-plugins/host-sdk
# or
yarn add @renderx-plugins/library-component @renderx-plugins/host-sdk
```

## Usage

```ts
import { register as registerLibraryComponent } from '@renderx-plugins/library-component';
// Your application should provide a Musical Conductor instance
import { conductor } from '@renderx-plugins/host-sdk';

registerLibraryComponent(conductor);
```

This call registers the library-component sequences so your app can:
- start a drag with a preview ghost (no setDragImage fallbacks included)
- drop components onto the canvas (root or container drops)

## Auto-Discovery

As of v0.1.0-rc.1, this package includes its own json-sequences and advertises them via `package.json` metadata:

```json
{
  "renderx": {
    "sequences": ["json-sequences"]
  },
  "files": ["dist", "src", "json-sequences"]
}
```

The host can now auto-discover and load sequences from this package without needing them to be copied to the host repository.

## Events

Handlers publish standard Host SDK events (abbrev.):
- `canvas.component.create.requested` — emitted on drop with component payload

## Requirements
- Node 18+
- RenderX Host SDK `@renderx-plugins/host-sdk` (declared as peer dep)

## License
MIT


---

## renderx-plugin-header

**Description**: A header plugin for RenderX, providing customizable header UI components, theme toggling, and integration with the RenderX host application. Designed for easy installation as an npm package and seamless dynamic loading via the RenderX plugin manifest. Includes support for sequence-driven interactions and full TypeScript/ESM compatibility.

**Repository**: https://github.com/BPMSoftwareSolutions/renderx-plugin-header

### README Content

# RenderX Plugin Header

[![npm version](https://badge.fury.io/js/renderx-plugin-header.svg)](https://badge.fury.io/js/renderx-plugin-header)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A customizable header UI plugin for RenderX, providing flexible header components, theme toggling, and seamless integration with the RenderX host application. Designed for easy installation as an npm package and dynamic loading via the RenderX plugin manifest system.

## Features

- 🎨 **Customizable Header Components** - Flexible and themeable header UI elements
- 🌓 **Theme Toggle Support** - Built-in dark/light theme switching
- 🔌 **Plugin Architecture** - Seamless integration with RenderX host applications
- 📦 **NPM Package** - Easy installation and dependency management
- 🔄 **Dynamic Loading** - Runtime plugin loading via manifest configuration
- 📱 **Responsive Design** - Mobile-friendly header components
- 🎯 **TypeScript Support** - Full TypeScript definitions and ESM compatibility
- 🔄 **Sequence-Driven Interactions** - Support for complex UI workflows

## Installation

Install the plugin via npm:

```bash
npm install renderx-plugin-header
```

Or with yarn:

```bash
yarn add renderx-plugin-header
```

## Usage

### Basic Usage

```javascript
import { HeaderTitle, HeaderControls, HeaderThemeToggle } from 'renderx-plugin-header';

// Basic header setup
function App() {
  return (
    <div className="app">
      <header className="app-header">
        <HeaderTitle title="My Application" />
        <HeaderControls>
          <HeaderThemeToggle />
        </HeaderControls>
      </header>
      {/* Your app content */}
    </div>
  );
}
```

### Advanced Configuration

```javascript
import { 
  HeaderTitle, 
  HeaderControls, 
  HeaderThemeToggle,
  HeaderNavigation 
} from 'renderx-plugin-header';

function AppHeader() {
  const handleThemeChange = (theme) => {
    console.log('Theme changed to:', theme);
  };

  return (
    <header className="custom-header">
      <HeaderTitle 
        title="RenderX Application"
        subtitle="Plugin Demo"
        logoUrl="/assets/logo.png"
      />
      
      <HeaderNavigation
        items={[
          { label: 'Home', href: '/' },
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact' }
        ]}
      />
      
      <HeaderControls>
        <HeaderThemeToggle 
          onThemeChange={handleThemeChange}
          defaultTheme="light"
        />
      </HeaderControls>
    </header>
  );
}
```

## RenderX Host Integration

### Plugin Manifest Configuration

Add the header plugin to your RenderX application's plugin manifest:

```json
{
  "plugins": [
    {
      "name": "renderx-plugin-header",
      "version": "^1.0.0",
      "type": "ui-component",
      "entryPoint": "dist/index.js",
      "manifest": {
        "components": [
          "HeaderTitle",
          "HeaderControls", 
          "HeaderThemeToggle",
          "HeaderNavigation"
        ],
        "styles": "dist/styles.css",
        "dependencies": []
      },
      "loadStrategy": "eager",
      "scope": "global"
    }
  ]
}
```

### Dynamic Plugin Loading

```javascript
// In your RenderX host application
import { loadPlugin } from 'renderx-core';

async function initializeHeaderPlugin() {
  try {
    const headerPlugin = await loadPlugin('renderx-plugin-header');
    
    // Register plugin components with RenderX
    headerPlugin.register({
      container: document.getElementById('header-container'),
      config: {
        theme: 'auto',
        showNavigation: true,
        enableThemeToggle: true
      }
    });
    
    console.log('Header plugin loaded successfully');
  } catch (error) {
    console.error('Failed to load header plugin:', error);
  }
}
```

### Integration with RenderX Context

```javascript
import { useRenderXContext } from 'renderx-core';
import { HeaderTitle, HeaderThemeToggle } from 'renderx-plugin-header';

function IntegratedHeader() {
  const { theme, updateTheme, appConfig } = useRenderXContext();
  
  return (
    <header>
      <HeaderTitle title={appConfig.title} />
      <HeaderThemeToggle 
        currentTheme={theme}
        onThemeChange={updateTheme}
      />
    </header>
  );
}
```

## Available Components

### HeaderTitle

A customizable title component for your application header.

```javascript
<HeaderTitle 
  title="Application Name"
  subtitle="Optional subtitle"
  logoUrl="/path/to/logo.png"
  onClick={() => navigate('/home')}
/>
```

**Props:**
- `title` (string, required) - The main title text
- `subtitle` (string, optional) - Secondary text below the title
- `logoUrl` (string, optional) - URL to logo image
- `onClick` (function, optional) - Click handler for the title

### HeaderControls

A container component for header action items and controls.

```javascript
<HeaderControls 
  align="right"
  spacing="medium"
>
  {/* Your control components */}
</HeaderControls>
```

**Props:**
- `align` (string, optional) - Alignment: 'left', 'center', 'right'
- `spacing` (string, optional) - Spacing between items: 'small', 'medium', 'large'
- `children` (ReactNode) - Control components to render

### HeaderThemeToggle

A theme switching toggle button with support for light, dark, and auto modes.

```javascript
<HeaderThemeToggle 
  defaultTheme="auto"
  onThemeChange={(theme) => console.log(theme)}
  showLabel={true}
/>
```

**Props:**
- `defaultTheme` (string, optional) - Initial theme: 'light', 'dark', 'auto'
- `onThemeChange` (function, optional) - Callback when theme changes
- `showLabel` (boolean, optional) - Whether to show theme label text

### HeaderNavigation

A navigation component for header menu items.

```javascript
<HeaderNavigation 
  items={[
    { label: 'Home', href: '/', active: true },
    { label: 'About', href: '/about' },
    { label: 'Services', children: [...] }
  ]}
  orientation="horizontal"
/>
```

**Props:**
- `items` (array, required) - Navigation items with label, href, and optional children
- `orientation` (string, optional) - Layout: 'horizontal', 'vertical'
- `onNavigate` (function, optional) - Custom navigation handler

## Styling and Theming

The plugin includes CSS custom properties for easy theming:

```css
:root {
  --header-bg-color: #ffffff;
  --header-text-color: #333333;
  --header-border-color: #e1e5e9;
  --header-height: 60px;
  --header-padding: 0 1rem;
}

[data-theme="dark"] {
  --header-bg-color: #1a1a1a;
  --header-text-color: #ffffff;
  --header-border-color: #333333;
}
```

Import the base styles in your application:

```javascript
import 'renderx-plugin-header/dist/styles.css';
```

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
   ```bash
   git clone https://github.com/BPMSoftwareSolutions/renderx-plugin-header.git
   cd renderx-plugin-header
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make your changes and commit**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Run tests and linting**
   ```bash
   npm run test
   npm run lint
   ```

6. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build the plugin
npm run build

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

## Testing

The plugin includes comprehensive test coverage using Jest and React Testing Library.

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test HeaderTitle.test.js
```

### Test Structure

```
tests/
├── components/
│   ├── HeaderTitle.test.js
│   ├── HeaderControls.test.js
│   ├── HeaderThemeToggle.test.js
│   └── HeaderNavigation.test.js
├── integration/
│   ├── renderx-integration.test.js
│   └── plugin-loading.test.js
└── utils/
    └── test-helpers.js
```

### Writing Tests

When contributing, please include tests for new features:

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { HeaderThemeToggle } from '../src/components/HeaderThemeToggle';

describe('HeaderThemeToggle', () => {
  it('should toggle theme on click', () => {
    const onThemeChange = jest.fn();
    render(<HeaderThemeToggle onThemeChange={onThemeChange} />);
    
    const toggleButton = screen.getByRole('button', { name: /theme/i });
    fireEvent.click(toggleButton);
    
    expect(onThemeChange).toHaveBeenCalledWith('dark');
  });
});
```

## Plugin Manifest Integration

For seamless integration with RenderX applications, use the following manifest configuration:

### Complete Manifest Example

```json
{
  "name": "my-renderx-app",
  "version": "1.0.0",
  "plugins": [
    {
      "name": "renderx-plugin-header",
      "version": "^1.0.0",
      "type": "ui-component",
      "entryPoint": "dist/index.js",
      "manifest": {
        "components": [
          {
            "name": "HeaderTitle",
            "export": "HeaderTitle",
            "type": "react-component"
          },
          {
            "name": "HeaderControls",
            "export": "HeaderControls", 
            "type": "react-component"
          },
          {
            "name": "HeaderThemeToggle",
            "export": "HeaderThemeToggle",
            "type": "react-component"
          },
          {
            "name": "HeaderNavigation",
            "export": "HeaderNavigation",
            "type": "react-component"
          }
        ],
        "styles": [
          "dist/styles.css"
        ],
        "dependencies": {
          "react": "^18.0.0",
          "react-dom": "^18.0.0"
        }
      },
      "loadStrategy": "eager",
      "scope": "global",
      "config": {
        "theme": {
          "default": "auto",
          "variants": ["light", "dark", "auto"]
        },
        "features": {
          "navigation": true,
          "themeToggle": true,
          "responsive": true
        }
      }
    }
  ]
}
```

### Conditional Loading

```json
{
  "plugins": [
    {
      "name": "renderx-plugin-header",
      "loadConditions": {
        "environment": ["production", "development"],
        "features": ["header", "navigation"],
        "viewport": {
          "minWidth": 768
        }
      }
    }
  ]
}
```

## API Reference

For detailed API documentation, visit our [API Reference](https://bpmsoftwaresolutions.github.io/renderx-plugin-header/api).

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://bpmsoftwaresolutions.github.io/renderx-plugin-header)
- 🐛 [Issue Tracker](https://github.com/BPMSoftwareSolutions/renderx-plugin-header/issues)
- 💬 [Discussions](https://github.com/BPMSoftwareSolutions/renderx-plugin-header/discussions)
- 📧 [Email Support](mailto:support@bpmsoftwaresolutions.com)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.


---

## renderx-plugin-library

**Description**: A portable, externalized component library plugin for the RenderX platform. This package provides a manifest-driven UI panel for discovering, previewing, and interacting with host-managed inventory of JSON components.

**Repository**: https://github.com/BPMSoftwareSolutions/renderx-plugin-library

### README Content

# renderx-plugin-library
A portable, externalized component library plugin for the RenderX platform. This package provides a manifest-driven UI panel for discovering, previewing, and interacting with host-managed inventory of JSON components.


---

## renderx-host-sdk

**Description**: Core SDK for RenderX host applications. Provides APIs, types, and utilities for plugin integration, UI orchestration, sequence management, and communication between host and plugins. Designed for extensible, modular, and scalable web applications using the RenderX platform.

**Repository**: https://github.com/BPMSoftwareSolutions/renderx-host-sdk

### README Content

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


---

## renderx-plugins-demo

**Description**: RenderX Plugins Demo A thin-client host application showcasing the RenderX plugin architecture. This demo provides a lightweight shell with manifest-driven panel slots, orchestrated entirely through the MusicalConductor engine.

**Repository**: https://github.com/BPMSoftwareSolutions/renderx-plugins-demo

### README Content

# RenderX Plugins Demo

A **thin-client host application** showcasing the RenderX plugin architecture. This demo provides a lightweight shell with manifest-driven plugin loading and orchestrated via the MusicalConductor engine.

## Overview

This repository contains:

- A minimal host app that initializes the RenderX plugin system.
- Example plugins serving as a sandbox for testing orchestration flows, UI extension, and manifest-driven panel slots.

## Related Resources

Check out these supporting projects for more detail on the underlying architecture:

- **MusicalConductor** — the orchestration engine powering plugin coordination (symphonies, movements, beats):
  https://github.com/BPMSoftwareSolutions/MusicalConductor/blob/main/README.md

- **renderx-plugins** — core utilities, base interfaces, and manifest schema for RenderX-compatible plugins:
  https://github.com/BPMSoftwareSolutions/renderx-plugins/blob/main/README.md

## 🚧 Active Refactoring Zones

Some parts of the codebase are under active refactoring for improved modularity, scalability, and maintainability. These zones have special markers and guidance for contributors.

### Diagnostics Module (Issue #297)

**Status**: Phase 4 Complete ✅ | Phases 5-6 Pending ⏳

**Files Under Refactoring**:
- `src/ui/diagnostics/DiagnosticsPanel.tsx` (383 lines → target: <200 lines)
- `src/ui/PluginTreeExplorer.tsx` (810 lines → target: <200 lines)

**What's Complete**:
- ✅ Phase 1: Type system centralized in `src/ui/diagnostics/types/`
- ✅ Phase 2: Business logic extracted to `src/ui/diagnostics/services/`
- ✅ Phase 3: Custom hooks extracted to `src/ui/diagnostics/hooks/`
- ✅ Phase 4: Components extracted to `src/ui/diagnostics/components/`

**What's Coming**:
- ⏳ Phase 5: Tree explorer modularization (extract to `src/ui/diagnostics/tree/`)
- ⏳ Phase 6: Testing & documentation

**For Contributors & AI Agents**:

When working in these refactoring zones:

1. **Read First**: `src/ui/diagnostics/REFACTORING.md` - Contains detailed guidance
2. **Use Existing Structure**:
   - ✅ Import types from `src/ui/diagnostics/types/`
   - ✅ Use services from `src/ui/diagnostics/services/`
   - ✅ Use hooks from `src/ui/diagnostics/hooks/`
   - ✅ Use components from `src/ui/diagnostics/components/`
3. **Avoid Anti-Patterns**:
   - ❌ Don't add inline type definitions
   - ❌ Don't add data fetching logic to components
   - ❌ Don't add new useState hooks (use existing custom hooks)
   - ❌ Don't add complex nested components (extract to components/)
   - ❌ Don't modify tree structure yet (Phase 5 will handle tree refactoring)

**Reference Documents**:
- [Refactoring Strategy](docs/refactoring/diagnostics-modularity-strategy.md)
- [Progress Summary](docs/refactoring/PROGRESS-SUMMARY.md)
- [Before & After Comparison](docs/refactoring/diagnostics-before-after.md)
- [Module-Specific Guidance](src/ui/diagnostics/REFACTORING.md)

**Related Issues**:
- [#297 - Refactor Diagnostics Panel](https://github.com/BPMSoftwareSolutions/renderx-plugins-demo/issues/297)
- [#302 - Add Refactoring Zone Markers](https://github.com/BPMSoftwareSolutions/renderx-plugins-demo/issues/302)
- [#283 - Deep Hierarchical Navigation](https://github.com/BPMSoftwareSolutions/renderx-plugins-demo/issues/283)

---

## Getting Started

1. Clone this repository:

   ```bash
   git clone https://github.com/BPMSoftwareSolutions/renderx-plugins-demo.git
   cd renderx-plugins-demo
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Launch the host application:

   ```bash
   npm start
   ```

4. Interact with the example plugins via the UI or white-box exploring the code.

## Example Plugins

| Plugin Name      | Purpose                                           |
| ---------------- | ------------------------------------------------- |
| **SamplePanel**  | Adds a plugin UI panel via a manifest-driven slot |
| **CanvasWidget** | Demonstrates a rendering component plugin         |

## Development Workflow

- To add a new plugin:

### Artifact Mode (External Plugins Repo)

Phase 1 introduces an artifact consumption mode so the thin host can run without plugin source code present.

Artifacts directory expected structure:

```
interaction-manifest.json
topics-manifest.json
layout-manifest.json (optional)
plugin-manifest.json (inside plugins/)
json-components/*
json-sequences/*
json-interactions/* (optional if already merged)
json-topics/*
plugins/plugin-manifest.json
```

Generate locally:

```
node scripts/build-artifacts.js --srcRoot=. --outDir=dist/artifacts
```

Run host pointing at artifacts:

```
set ARTIFACTS_DIR=dist\artifacts
npm run dev:artifacts
```

Or (PowerShell inline):

```
$env:ARTIFACTS_DIR="dist/artifacts"; npm run dev:artifacts
```

Script / CLI flags (all accept `--srcRoot` and `--outPublic` where applicable):

| Script                                     | Purpose                          | Key Flags                             |
| ------------------------------------------ | -------------------------------- | ------------------------------------- |
| `scripts/generate-interaction-manifest.js` | Builds interaction-manifest.json | `--srcRoot`, `--outPublic`            |
| `scripts/generate-topics-manifest.js`      | Builds topics-manifest.json      | `--srcRoot`, `--outPublic`            |
| `scripts/generate-layout-manifest.js`      | Copies layout manifest           | `--srcRoot`, `--outPublic`            |
| `scripts/sync-json-components.js`          | Copies component JSON; discovers node_modules packages declaring `renderx.components` (prefers package over local) | `--srcRoot`, `--outPublic`            |
| `scripts/sync-json-sequences.js`           | Copies sequence catalogs         | `--srcRoot`, `--outPublic`            |
| `scripts/sync-plugins.js`                  | Copies plugin manifest(s)        | `--srcRoot`, `--outPublic`            |
| `scripts/build-artifacts.js`               | Full artifact bundle             | `--srcRoot`, `--outDir`               |
| `scripts/copy-artifacts-to-public.js`      | Consume existing artifacts       | `ARTIFACTS_DIR` env or first arg path |


> Note: The host now consumes component catalogs from external packages. Any package in node_modules with a package.json field `renderx.components: ["<dir>"]` will be discovered and copied into `public/json-components/`. If the same file exists both in a package and in the local `catalog/json-components/`, the package version wins to avoid duplication.

On startup the host logs a summary like:

```
🧪 Startup validation: { routes: 35, topics: 36, plugins: 6 }
```

Disable this validation (e.g. noisy integration tests) with:

```
set RENDERX_DISABLE_STARTUP_VALIDATION=1
```

or PowerShell:

```
$env:RENDERX_DISABLE_STARTUP_VALIDATION="1"; npm start
```

### Host SDK Surface (additions)

New helper exports (stable path `@renderx/host-sdk`):

| Export                         | Purpose                                                   |
| ------------------------------ | --------------------------------------------------------- |
| `getPluginManifest()`          | Async fetch + cache plugin manifest for discovery tooling |
| `getCachedPluginManifest()`    | Returns last fetched manifest or null                     |
| `getAllFlags()`                | Snapshot of all feature flags                             |
| `getUsageLog()`                | In-memory usage log (dev/test diagnostics)                |
| `setFlagOverride(id, enabled)` | Test-only override (do not use in prod code paths)        |
| `clearFlagOverrides()`         | Clear all overrides                                       |

These complement existing exports like `useConductor`, `resolveInteraction`, and mapping helpers.

## Artifact Integrity (Phase 2)

Phase 2 adds cryptographic integrity coverage for the synthesized artifact set so the thin host (or any consuming service) can detect tampering, drift, or partial deployments.

### What Gets Hashed

The integrity file (`artifacts.integrity.json`) contains a SHA-256 hash per core artifact plus an aggregate hash:

```
{
  "files": {
    "interaction-manifest.json": "<sha256>",
    "topics-manifest.json": "<sha256>",
    "layout-manifest.json": "<sha256|omitted if absent>",
    "manifest-set.json": "<sha256>"
  },
  "aggregate": "<sha256 of the sorted 'fileName:hash' lines>"
}
```

Only files that directly influence routing / orchestration are covered right now; sequence & component JSON can be added later once the surface stabilizes.

### Generating Integrity Data

Integrated build (preferred):

```
npm run artifacts:build:integrity
```

Equivalent manual invocation:

```
node scripts/build-artifacts.js --srcRoot=. --outDir=dist/artifacts --integrity
```

Legacy / standalone hash script (will produce a similar structure if artifacts already exist):

```
npm run artifacts:hash
```

### Runtime Verification

On host startup, if `ARTIFACTS_DIR` is set and `artifacts.integrity.json` is present, the host recomputes SHA-256 digests in the browser (using `crypto.subtle`) and compares them. A mismatch logs an error with the first differing file and aborts early in dev (subject to future policy decisions for production).

Disable integrity verification (e.g. for experimentation) with:

```
set RENDERX_DISABLE_INTEGRITY=1
```

PowerShell:

```
$env:RENDERX_DISABLE_INTEGRITY="1"; npm start
```

### CI Hook

CI invokes the integrity build to ensure the hashing path stays green. A failure surfaces as a normal test failure.

### Planned Extensions

| Planned               | Description                                                                |
| --------------------- | -------------------------------------------------------------------------- |
| Signature layer       | Aggregate hash signed with private key for provenance                      |
| Expanded coverage     | Include sequence & component JSON catalogs in integrity file               |
| Public API hash       | Detect accidental breaking changes to `@renderx/host-sdk`                  |
| External lint roots   | Use `RENDERX_PLUGINS_SRC` so ESLint rules work with detached plugin repo   |
| Strict validator mode | CI flag to treat heuristic plugin coverage warnings as errors              |
| Artifact packaging    | Tarball bundling of artifacts for external distribution (`artifacts:pack`) |

## Environment Variables (Quick Reference)

| Variable                             | Purpose                                                                             | Typical Usage                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `HOST_ARTIFACTS_DIR`                 | (Preferred) Points host at pre-built artifacts directory (supersedes ARTIFACTS_DIR) | `set HOST_ARTIFACTS_DIR=..\\renderx-artifacts` then `npm run dev`            |
| `ARTIFACTS_DIR`                      | Legacy alias for HOST_ARTIFACTS_DIR                                                 | `set ARTIFACTS_DIR=dist\\artifacts` then `npm run dev:artifacts`             |
| `RENDERX_DISABLE_STARTUP_VALIDATION` | Skip plugin & manifest count summary                                                | Silence noisy CI / perf runs                                                 |
| `RENDERX_DISABLE_INTEGRITY`          | Skip integrity verification even if file present                                    | Local debugging of partially edited artifacts                                |
| `RENDERX_PLUGINS_SRC` (planned)      | External plugins source root for lint rules                                         | Future Phase 2+ feature                                                      |
| `RENDERX_VALIDATION_STRICT`          | Escalate artifact validator warnings to errors                                      | `set RENDERX_VALIDATION_STRICT=1 && npm run artifacts:validate`              |
| `RENDERX_SEQUENCE_COVERAGE_ALLOW`    | Comma list of plugin IDs allowed to lack sequences (heuristic suppression)          | `set RENDERX_SEQUENCE_COVERAGE_ALLOW=HeaderTitlePlugin,HeaderControlsPlugin` |
| `PACK_VERSION`                       | Override version used by pack-artifacts                                             | `set PACK_VERSION=0.2.0 && npm run artifacts:pack`                           |
| `RENDERX_REQUIRE_SIGNATURE`          | Enforce signature presence & verification                                           | `set RENDERX_REQUIRE_SIGNATURE=1`                                            |

- Create a plugin folder under `plugins/`
- Update the host manifest to include your plugin’s metadata and entry point
- Restart the host to see it in action

- To test orchestration:

  - Create a plugin that registers into the conductor’s flow
  - Use `conductor.play()` to orchestrate actions across plugins

## Layout and Slots

- To add a new slot using the layout-manifest path, see:
  - docs/layout/ADD-A-SLOT.md

## Host SDK Migration (for external plugin authors)

See the canonical checklist and guidance here:

- docs/host-sdk/USING_HOST_SDK.md
- docs/host-sdk/EXTERNAL_PLUGIN_MIGRATION_CHECKLIST.md

## License

Specify your preferred license here (e.g., MIT).

---

### Source Layout Refactor (#171)

The codebase was reorganized into layered folders (`core/`, `domain/`, `ui/`, `infrastructure/`, `vendor/`). See `docs/design-reviews/NEW_STRUCTURE.md` for mapping and migration notes.


---

## renderx-plugin-canvas

**Description**: Canvas plugin providing the host-facing CanvasPage component and a future‑proof async register() hook. Minimal surface; sequences deferred to other plugins. Designed for fast embedding and gradual extension.

**Repository**: https://github.com/BPMSoftwareSolutions/renderx-plugin-canvas

### README Content

# @renderx-plugins/canvas

Core visual workspace surface for RenderX. The Canvas plugin supplies the host‑embeddable React page (`CanvasPage`) that: (1) exposes a drop surface for library components/containers, (2) renders a lightweight header with zoom + mode toggles + import/export affordances, and (3) reserves an isolated DOM mount (`#rx-canvas`) where Stage‑Crew (the orchestration/runtime layer) paints actual component instances. UI chrome stays intentionally “dumb” – all authoritative state flows through the host conductor + event / interaction routing.

## Why It Exists
Design / interaction tooling tends to blend structural UI (panels, headers, grids) with runtime mutation logic. We separate them: this plugin owns only the visual shell & user gestures (drag, drop, zoom, mode switches, export buttons). Mutation, persistence, selection resolution, export pipelines, and performance heuristics live in specialized handler / symphony plugins (e.g. `@renderx-plugins/canvas-component`). This keeps the Canvas surface stable and cheap to re-render while letting interaction logic evolve independently.

## Key Capabilities
| Capability | Summary | Implementation Notes |
| ---------- | ------- | -------------------- |
| Drop Surface | Accepts components & containers via HTML5 drag/drop | Normalizes drop coordinates; forwards to library drop interactions (topic: `library.*.drop.requested`). |
| Mode Switching | Select / Move / Draw placeholders | Local React state only; hooks for future behavior wiring. |
| Zoom Controls | +/- controls 25–200% | Pure UI state today; future: broadcast zoom to stage crew. |
| Export Triggers | Generic export + GIF / MP4 (when element selected) | Resolves interactions: `canvas.component.export*` sequences. |
| Import Trigger | Launches import flow | Publishes topic `canvas.component.import.requested`. |
| Selection Awareness | Enables export buttons only when something is selected | Subscribes to `canvas.component.selection.changed` via `EventRouter`. |
| Grid & Visual Hints | Background micro‑grid + drop indicator | Pure CSS; no layout coupling. |
| StageCrew Mount | Dedicated `<div id="rx-canvas"/>` | Runtime injects managed DOM nodes; Canvas never queries them. |

## Architectural Principles
1. Event / Interaction Boundary: Canvas never mutates domain state directly; it publishes topics or plays resolved interaction sequences.
2. Stateless Shell: Persistent model state (components, selection) is external; Canvas reacts to events (e.g. selection changed).
3. Performance Hygiene: Drag/drop delegates high‑frequency work to handler plugins that implement coalescing; Canvas only initiates.
4. Testability: Core user gestures are funneled into small functions (e.g. `onDropForTest`) enabling deterministic unit tests.
5. Forward Compatibility: A minimal async `register()` hook allows future initialization (feature flags, preloading) without a breaking API change.

## High-Level Flow (Drop → Render)
1. User drags a library item over `CanvasPage`.
2. `onDropForTest` extracts the serialized component + computes normalized coordinates (container‑aware).
3. Publishes `library.component.drop.requested` (or container variant) with callbacks for drag lifecycle + selection.
4. Library / component orchestration sequence materializes the component and instructs Stage‑Crew to render into `#rx-canvas`.
5. Separate selection / drag handlers emit events the Canvas header listens to for enabling exports.

## Public Surface
```ts
import { CanvasPage, register } from '@renderx-plugins/canvas';
```
`CanvasPage` – React component (no props required) that assumes a `ConductorProvider` (or equivalent) higher in the tree supplying `useConductor()`.

`register()` – async, currently no‑op, reserved for deferred initialization (preloading fonts, feature flag hydration, etc.). Safe to call multiple times.

## Integration Example
```tsx
import React from 'react';
import { CanvasPage, register } from '@renderx-plugins/canvas';

export function AppShell() {
	React.useEffect(() => { register(); }, []);
	return <CanvasPage />;
}
```

## Feature Roadmap (Indicative)
- Live zoom propagation to runtime render layer.
- Keyboard shortcuts for mode switching & zoom.
- Inline marquee selection overlay (delegated to interaction plugin but visually hosted here).
- Configurable grid density + snap toggles.
- Lazy hydration of export buttons based on capability discovery.

## Separation From `@renderx-plugins/canvas-component`
`canvas` = visual shell & user affordances.
`canvas-component` = high-frequency interaction handlers (drag, resize, select, export pipelines, performance gating).

This split ensures: smaller bundle for host embedding, clearer performance boundaries, and independent versioning of heavy logic.


## Contributing
To contribute, modify UI elements in the `src/ui/` directory, run `npm run dev` to start the development server, and test drag/drop and export features in your local environment. Add or adjust corresponding interaction tests under the root test suites as needed.

## Testing Notes
The component favors event publication over internal state, so unit tests assert on emitted topics / interaction invocations rather than DOM mutation. Use `onDropForTest` to simulate pointer operations without constructing full DragEvent objects.

## License
Follows root project license (TBD upon extraction).

---
Minimal surface, strong boundaries, future‑proof initialization – the Canvas plugin is the stable anchor for richer interaction layers above it.


---

## renderx-plugin-canvas-component

**Description**: Interaction layer for Canvas components: optimized drag, create, resize, select, update, and export handlers with event coalescing and routing to the Control Panel via EventRouter or direct sequence resolution. Ships idempotent register() and granular subpath exports for tree-shaking.

**Repository**: https://github.com/BPMSoftwareSolutions/renderx-plugin-canvas-component

### README Content

# @renderx-plugins/canvas-component

High‑frequency interaction & manipulation layer for the RenderX Canvas. Whereas `@renderx-plugins/canvas` owns the visual shell, this plugin implements (or will house) the performance‑sensitive handlers and symphonies that mutate component state, coordinate selection, and broker export / import lifecycles.

## Introduction
Modern design tooling demands responsive drag, resize, selection, and export pipelines without blocking UI rendering. This plugin concentrates those concerns into isolated, testable handler collections ("symphonies"), each describing a cohesive interaction domain (drag, create, resize, select, update, import/export, etc.). By centralizing the mutation + routing logic here we keep the Canvas surface lean and allow targeted optimization (rAF batching, microtask bursts, threshold gating) where it matters.

## Core Features & Capabilities
| Domain | Capabilities | Performance / Reliability Techniques |
| ------ | ------------ | ------------------------------------- |
| Drag & Move | Start / move / end events; position coalescing; Control Panel sync | rAF or microtask coalescing, threshold gating for first move, topic publish with fallback interaction routing |
| Create | Component & container instantiation at drop coordinates | Normalized coordinate math; callbacks for lifecycle (onCreated, drag continuation) |
| Selection | Primary element tracking, selection change broadcast | EventRouter topic `canvas.component.selection.changed`; idempotent register to avoid duplicate listeners |
| Resize | Placeholder (planned) for edge/corner handles & aspect constraints | Will reuse drag coalescing primitives; snap grid awareness roadmap |
| Update | Generic component property mutation flows | Batched routing to minimize conductor.play invocations |
| Export (SVG→GIF / MP4) | Trigger animated or static exports for selected element | Interaction resolution (`canvas.component.export*`) with element existence validation |
| Import | Declarative `.ui` (or future format) ingestion | Topic `canvas.component.import.requested` enabling pluggable parsers |
| Performance Profiling Hooks | Optional debug + perf flags (`perf.cp.*`) | Feature flag gating; deferred Control Panel rerender scheduling |

## Architectural Highlights
1. Topic First, Interaction Fallback: Publish to `EventRouter`; fallback to direct `resolveInteraction()` ensuring resilience if routing plugin order changes.
2. Idempotent Registration: `register(conductor)` sets a private sentinel; safe for multiple calls by host bootstraps or hot reload.
3. Coalesced High-Frequency Paths: Drag + update streams batch into animation frames (or microtasks) reducing layout thrash & CP churn.
4. Test Determinism: In `NODE_ENV=test` coalescing shortcuts are disabled for predictable unit specs.
5. Deferred Rendering: Post-drag control panel rendering may be delayed based on performance flags to smooth heavy layouts.

## Public Surface
```ts
import { register } from '@renderx-plugins/canvas-component';
// After migration:
import { handlers as dragHandlers } from '@renderx-plugins/canvas-component/symphonies/drag';
```
Local (staging) name: `@renderx-plugins/canvas-component-local`.

### `register(conductor)`
Sets `_canvasComponentRegistered` on the conductor to avoid duplicate subscription / mounting logic. Currently defers sequence mounting to JSON catalogs (keeping boot cost low).

## Drag Interaction Deep Dive (Example)
The drag symphony:
- Publishes lightweight topics for start / move / end (`canvas.component.drag.*`).
- Falls back to direct interaction play if the router is unavailable.
- Caches resolved interaction routes to avoid repeating expensive resolution during high‑frequency movement.
- Applies microtask‑first flush for the first update, then rAF scheduling to balance latency vs. paint timing.
- Channels Control Panel update requests through a single coalesced dispatch per frame.

## Extending With a New Symphony
1. Create `src/symphonies/<name>/<name>.symphony.ts`.
2. Export a stable `handlers` object (pure functions where possible).
3. Add any sequence definitions to JSON catalogs (if runtime mounted) or route keys consumed by other plugins.
4. Expose via subpath export (`./symphonies/*`).
5. Add focused tests (happy path + high‑frequency stress scenario).

## Event & Interaction Keys (Representative)
| Purpose | Topic / Interaction Key |
| ------- | ----------------------- |
| Drag start notification | `canvas.component.drag.start` |
| Drag move stream | `canvas.component.drag.move` |
| Drag end notification | `canvas.component.drag.end` |
| Selection changed | `canvas.component.selection.changed` |
| Component drop request | `library.component.drop.requested` |
| Container drop request | `library.container.drop.requested` |
| Export (generic) | `canvas.component.export` (resolved) |
| Export GIF | `canvas.component.export.gif` |
| Export MP4 | `canvas.component.export.mp4` |
| Import request | `canvas.component.import.requested` |

## Performance Flags (Illustrative)
| Flag | Effect |
| ---- | ------ |
| `perf.cp.debug` | Enables verbose console diagnostics for drag lifecycle. |
| `perf.cp.render.dedupe` | Allows deferred Control Panel rerender after drag end. |
| `perf.microtaskFirstUpdate` (planned) | Toggle microtask-first coalescing strategy. |

## Source Layout (During Extraction)
`src/symphonies/*` currently re-exports legacy implementations from `plugins/canvas-component/*`. Each will be inlined here so the package becomes self-contained.

## Roadmap
- Inline all legacy handler code (remove deep relative exports).
- Add resize + rotate symphonies.
- Introduce snapping grid & alignment guides (consumer opt-in events).
- Structured telemetry hooks (duration, frame skip counts, coalescing stats).
- Tree-shakable feature flags via build-time conditionals.

## Contributing (Local)
1. Implement or adjust a handler in the `src/symphonies` directory or other relevant source files.
2. Run `npm run build` to build the package.
3. Execute tests: `npm test`.
4. Run lint checks: `npm run lint`.
5. For development, use: `npm run dev`.
6. Measure latency (add temporary perf logs if needed under `perf.cp.debug`).

## Testing Strategy
Write unit tests that assert:
- Correct topic publication order & payload shape.
- Coalescing (only one CP update per frame) when simulating multiple rapid move calls.
- Fallback path to direct interaction play when `EventRouter.publish` throws.
- Deterministic behavior in test mode (no async scheduling side-effects).

## License
Inherits root project license (clarify on extraction / publish).

---
Purpose-built for performance, resilience, and incremental evolution—this interaction layer lets the Canvas stay visually simple while complex orchestration scales independently.


---

## renderx-plugins-digital-assets

**Description**: Digital assets (SVGs, images, movies) for RenderX

**Repository**: https://github.com/BPMSoftwareSolutions/renderx-plugins-digital-assets

### README Content

# renderx-plugins-digital-assets
Digital assets (SVGs, images, movies) for RenderX


## JSON-driven SVG Generator
Automates composition of integrated SVG elements from the JSON spec at `assets/plugin-architecture/plugin-integration-slides.json`.

- Generate all slide element SVGs:
  - `node scripts/generate-integrated-svgs.js --all`
- Generate for a specific slide:
  - `node scripts/generate-integrated-svgs.js --slide slide-01-manifest`
- Filter to a specific element within a slide:
  - `node scripts/generate-integrated-svgs.js --slide slide-01-manifest --element plugin-manifest`
- Dry run and verbose:
  - `node scripts/generate-integrated-svgs.js --slide slide-01-manifest --dry-run --verbose`

Notes
- Non-destructive: manages only the `<g id="sub-elements">` group in parent SVGs and ensures root namespaces.
- Idempotent: running repeatedly yields no diff.
- Added npm script: `npm run build:svgs`.

Externalized element specs
- Elements can reference external JSON via `spec`, e.g. `"spec": "specs/slide-01-manifest/plugin-manifest.json"`.
- External specs are deep-merged with inline element data; inline values override spec values when keys overlap (e.g., compose overrides).
- Default spec root: `assets/plugin-architecture/specs` (override with `--spec-root`).

Validation and resolver flags
- `--validate-only`: resolve refs and validate files/anchors without writing SVGs
- `--strict`: with validate-only, exit non-zero if any issues are found
- `--no-resolve-refs`: disable spec resolution (on by default)
- `--spec-root <dir>`: set alternate spec root

Examples
- Validate slide 01 only: `node scripts/generate-integrated-svgs.js --slide slide-01-manifest --validate-only --strict -v`
- Generate with refs resolved for a single element: `node scripts/generate-integrated-svgs.js --slide slide-01-manifest --element plugin-manifest`


Related tests
- `tests/generator.injector.test.js` verifies href composition, injection, namespaces, and idempotency.


---

## renderx-plugin-control-panel

**Description**: A React-based control panel UI library for the RenderX plugin ecosystem that provides dynamic property editing, CSS class management, and real-time component configuration capabilities.

**Repository**: https://github.com/BPMSoftwareSolutions/renderx-plugin-control-panel

### README Content

# @renderx-plugins/control-panel

A React-based control panel UI library for the RenderX plugin ecosystem that provides dynamic property editing, CSS class management, and real-time component configuration capabilities.

## Key Features

- **Dynamic Property Editing**: Schema-driven UI generation for editing component properties in real-time
- **CSS Class Management**: Built-in tools for creating, editing, and applying CSS classes to selected elements
- **Configurable Schema**: Runtime configuration via JSON schema with fallback defaults
- **Plugin Architecture**: Seamless integration with the RenderX plugin system via sequences and event handlers
- **Theme Integration**: CSS artifact generation with theme variable support for consistent styling
- **TypeScript Support**: Full TypeScript definitions for type-safe integration

## Usage

The control panel automatically generates property editing interfaces based on JSON schemas and provides a complete UI for managing element properties, classes, and styling within RenderX-powered applications.

**Topics**: `react`, `ui-library`, `control-panel`, `property-editor`, `css-management`, `plugin-system`, `typescript`, `schema-driven`, `renderx`

## Runtime configuration schema

- Source file: `src/config/control-panel.schema.json`
- Build sync: `scripts/sync-control-panel-config.js` copies the schema into the host's public folder during `pre:manifests`.
- Runtime location (fetched by the UI): `/plugins/control-panel/config/control-panel.schema.json`
- Fallback: If the file is absent, the UI falls back to a small built-in default via `useSchemaResolver`.

### Customize the Control Panel schema

1) Edit `packages/control-panel/src/config/control-panel.schema.json`.
2) Run `npm run pre:manifests` or any build that invokes it (e.g., `npm test`).
3) The schema will be published to `public/plugins/control-panel/config/control-panel.schema.json`.

## CSS artifact used by tests

The package emits `dist/index.css`. A repo test (`__tests__/ui/panels.theme.spec.ts`) asserts panel CSS uses theme variables by reading:
- `node_modules/@renderx-plugins/library/dist/ui/LibraryPanel.css`, and
- `packages/control-panel/dist/index.css` (this package)

Ensure `tsup` runs before tests (it does as part of the repo test setup) so `dist/index.css` exists.
---
This package is designed to be externalized from larger RenderX plugin demo projects and can be used independently in any React application requiring dynamic UI configuration capabilities.


---

## renderx-plugin-components

**Description**: JSON component definitions for RenderX-based hosts. This package publishes a catalog of components (as JSON) that thin hosts can serve and plugins can consume without coupling.

**Repository**: https://github.com/BPMSoftwareSolutions/renderx-plugin-components

### README Content

# @renderx-plugins/components

JSON component definitions for RenderX-based hosts. This package publishes a catalog of components (as JSON) that thin hosts can serve and plugins can consume without coupling.

## What is this?

- A versioned set of JSON component files (button.json, image.json, etc.)
- An index.json listing all component files (contract used by hosts)
- A package.json `renderx.components` declaration so hosts can auto-discover the assets

## Install

```bash
npm install @renderx-plugins/components
```

## How hosts consume these components

1) Discovery and copy (dev/build):
   - Hosts scan `node_modules` for packages with `renderx.components`
   - Hosts copy the declared folders to `/public/json-components`
2) Runtime (browser):
   - Host fetches `/json-components/index.json`
   - Then fetches each file listed there

## Package contract

- `index.json` must enumerate all component files:
```json
{
  "version": "1.0.0",
  "components": ["button.json","input.json","image.json"]
}
```

- Each component JSON includes stable metadata (keep additive; breaking changes require a major bump):
```json
{
  "id": "button",
  "metadata": { "name": "Button" },
  "template": { "type": "html", "markup": "<button>Click</button>" }
}
```

- `package.json` must declare the component folders so hosts can discover them:
```json
{
  "name": "@renderx-plugins/components",
  "version": "0.1.0",
  "renderx": { "components": ["json-components"] }
}
```

## Repository layout

- `json-components/` — component files (one `<type>.json` per component)
- `json-components/index.json` — list of component files (single source of truth)
- `tests/` — unit tests and schema checks (Vitest recommended)

## Versioning policy

- Patch: fixes to existing component JSON (no schema/ID changes)
- Minor: add new components or additive fields
- Major: remove/rename components, change IDs, or breaking schema changes

## Validation & testing

- Include JSON Schema and tests to validate each component file
- Ensure `index.json` lists every component file and has no stale entries

## Publishing

```bash
npm version <patch|minor|major>
npm publish --access public
```

## Why a separate package?

- Decouples the thin host from component data
- Enforces clean boundaries and consistency across hosts
- Enables reuse and independent versioning of component catalogs

## License

MIT


---

## renderx-plugin-manifest-tools

**Description**: Manifest tools for renderx plugins

**Repository**: https://github.com/BPMSoftwareSolutions/renderx-plugin-manifest-tools

### README Content

# @renderx-plugins/manifest-tools

Shared builders and types for RenderX plugin manifests.  
Extracted from the [renderx-plugins-demo](https://github.com/BPMSoftwareSolutions/renderx-plugins-demo) project for standalone use in thin client hosts and plugin pipelines.

## Features

- **Pure ESM utilities** for building and validating manifest JSONs.
- **Build interaction manifests** from plugin route catalogs and component-level overrides.
- **Build topics manifests** from topic catalogs, supporting payload schemas, visibility, and correlation keys.
- **Type definitions** for manifest shapes (InteractionManifest, TopicsManifest, LayoutManifest).

## Usage

Install via npm:

```sh
npm install @renderx-plugins/manifest-tools
```

Import and use in Node scripts or build pipelines:

```js
import { buildInteractionManifest, buildTopicsManifest } from '@renderx-plugins/manifest-tools';

// Example: Build interaction manifest
const manifest = buildInteractionManifest(pluginCatalogs, componentOverrides);

// Example: Build topics manifest
const topics = buildTopicsManifest(topicCatalogs);
```

## API

### `buildInteractionManifest(catalogs, componentOverrideMaps)`

- Merges route catalogs and component overrides into a single manifest.
- Returns `{ version, routes }`.

### `buildTopicsManifest(catalogs)`

- Aggregates topic definitions from catalogs.
- Returns `{ version, topics }`.

### Types

- `InteractionManifest`
- `TopicsManifest`
- `LayoutManifest`

## Typical Workflow

1. **Aggregate plugin route catalogs** and component overrides.
2. **Generate interaction-manifest.json** for host orchestration.
3. **Generate topics-manifest.json** for event routing and validation.
4. **Integrate with RenderX thin client** or plugin build scripts.

## Example Integration

See [scripts/generate-interaction-manifest.js](https://github.com/BPMSoftwareSolutions/renderx-plugins-demo/blob/main/scripts/generate-interaction-manifest.js) for usage in a build pipeline.

## Publishing & Consumption

- Published as an ESM npm package.
- Used by thin hosts to build and validate plugin manifests.
- Supports artifact integrity workflows (see RenderX docs for details).

## License

MIT


---

## renderx-plugins

**Description**: RenderX Plugins — Official plugin repository for the RenderX platform, implementing the manifest-driven panel-slot-plugin architecture (ADR-0014). Includes all orchestrated UI and behavior plugins built for RenderX, bundled with a generated manifest for seamless consumption by the RenderX core.

**Repository**: https://github.com/BPMSoftwareSolutions/renderx-plugins

### README Content

topics-manifest.json
## RenderX Plugins & Artifact Repository

Purpose-built repository containing raw JSON component/sequence/topic/layout/plugin definitions and build tooling that emits portable, signed artifact bundles consumable by the thin host.

### Scope (What Lives Here)
Included:
- `json-components/`, `json-sequences/`, `json-interactions/`, `json-topics/`, `json-layout/`, `json-plugins/`
- `plugins/` (UI/runtime plugin code if any compile-time steps needed)
- Build + governance scripts: `scripts/build-artifacts.js`, `validate-artifacts.js`, `verify-artifact-signature.js`, `pack-artifacts.js`, `hash-public-api.js`
- Shared schema + manifest builders: `packages/schema-contract`, `packages/manifest-tools`

Excluded (resides in thin host repo):
- Host runtime loader, conductor wiring, React shell, feature flag runtime
- Host SDK public API surface & runtime validation logic

---
### Quick Start
```
npm install
npm run artifacts:build        # build + integrity hash
npm run artifacts:validate     # structural + coverage heuristics
npm run artifacts:build:signed # build + integrity + signature
npm run artifacts:verify:signature
npm run artifacts:pack         # creates dist/packages/*.tar.gz
```
Strict mode (fail on warnings):
```
RENDERX_VALIDATION_STRICT=1 npm run artifacts:validate:strict
```

### Output Structure (dist/artifacts)
```
interaction-manifest.json
topics-manifest.json
layout-manifest.json (optional)
manifest-set.json
artifacts.integrity.json
artifacts.signature.json (if --sign used)
plugins/plugin-manifest.json
json-components/* (raw copies)
json-sequences/*  (raw copies)
...
```

### Key Commands
| Command | Purpose |
|---------|---------|
| `artifacts:build` | Build artifacts + integrity file |
| `artifacts:build:signed` | Build + integrity + Ed25519 signature (ephemeral or provided keys) |
| `artifacts:validate` | Schema consistency + plugin sequence coverage heuristic |
| `artifacts:validate:strict` | Same + escalate warnings to error |
| `artifacts:verify:signature` | Verify signature over integrity file |
| `public-api:hash` | Generate or refresh public API baseline (if exporting SDK bits here) |
| `public-api:check` | Compare against baseline (CI guard) |
| `artifacts:pack` | Tarball packaging (hash-friendly distribution) |
| `artifacts:ci` | End-to-end pipeline (signed build → strict validate → verify signature → API check → pack) |

### Environment Variables
| Var | Effect | Notes |
|-----|--------|-------|
| `RENDERX_VALIDATION_STRICT=1` | Escalate validator warnings to failures | Use in CI |
| `RENDERX_SEQUENCE_COVERAGE_ALLOW=PluginA,PluginB` | Suppress missing sequence heuristic | Pure UI / header plugins |
| `RENDERX_SIGNING_PRIVATE_PEM` / `RENDERX_SIGNING_PUBLIC_PEM` | Provide Ed25519 key pair for signing | Private key only in CI secret store |
| `RENDERX_REQUIRE_SIGNATURE=1` | Force signature presence & verification | Pair with host consumption pipeline |
| `PACK_VERSION=0.2.0` | Override version embedded in packaged tar name | Release promotion |

### Signing Flow
1. Provide PEM env vars in CI OR allow dev mode ephemeral key (auto-generated note file).
2. Run `npm run artifacts:build:signed`.
3. Verify with `npm run artifacts:verify:signature` (fails if tampered).

### CI Workflow (Recommended)
1. Checkout
2. `npm ci`
3. `npm run artifacts:build:signed`
4. `npm run artifacts:validate:strict`
5. `npm run artifacts:verify:signature`
6. `npm run public-api:check` (optional if baseline managed here)
7. `npm run artifacts:pack`
8. Upload `dist/artifacts/` + `dist/packages/*.tar.gz` (or publish)

### Consuming From Thin Host
In host pipeline:
1. Download artifact bundle (or unpack tar) to a path.
2. Set `HOST_ARTIFACTS_DIR=/path/to/artifacts` before host build/start.
3. Enable enforcement: `RENDERX_REQUIRE_SIGNATURE=1` for provenance.

### Schema & Versioning
`packages/schema-contract` centralizes `ARTIFACT_SCHEMA_VERSION`. Increment when breaking manifest shape; keep host & plugins in lockstep.

### Public API Governance (Optional Here)
If this repo later ships build-time utilities consumed by third parties, maintain `public-api.hash.json` via `public-api:hash` / `public-api:check` to catch accidental exports drift.

### Troubleshooting
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `ERR_UNKNOWN_FILE_EXTENSION .ts` | Script importing TS directly | Use JS shims or compile first |
| Validation warning: coverage | Plugin lacks sequences (heuristic) | Add to allowlist or supply sequence |
| Signature verify fails | Integrity file modified post-sign | Rebuild & resign; check CI order |
| Packed tar missing files | Ran pack before build | Run `artifacts:build` first |

### Roadmap (Future Enhancements)
- Extended integrity coverage to raw JSON catalogs
- Reproducible build diff (determinism check)
- API diff report (pretty output) for baseline changes
- Multi-artifact set version negotiation (future host feature)

### License
Add chosen license (e.g. MIT) here.

---
This repository intentionally excludes host runtime concerns; its only contract with the host is the artifact directory + optional signature. Keep changes small, additive, and schema-version any breaking manifest adjustments.


---

