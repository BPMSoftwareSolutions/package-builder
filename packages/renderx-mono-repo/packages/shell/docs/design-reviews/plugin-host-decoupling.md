# Plugin Host Decoupling

**BPMSoftwareSolutions:** As a thin client, this application knows too much about its plugins. What would it look like to change that?

---

Based on my exploration of the codebase, the current application has significant knowledge about its plugins embedded throughout the architecture. Here's how the system currently works and what a "thin client" refactoring would look like:

## Current Architecture (Plugin-Aware)

The application currently knows about plugins in several ways:

1. **Hardcoded Dependencies**: package.json explicitly lists specific plugin packages
2. **Static Package Loaders**: PanelSlot.tsx and conductor.ts have hardcoded `packageLoaders` objects
3. **Global API Exposure**: main.tsx exposes specific plugin APIs on `window.RenderX`
4. **Build-time Manifest Generation**: Scripts like aggregate-plugins.js scan for plugins during build
5. **Slot-specific Knowledge**: Layout manifests and components reference specific slots like "library", "canvas", "controlPanel"

## Thin Client Refactoring

To make this a true thin client, the core application would only know about:

- **Plugin Registry Interface**: A generic way to discover and load plugins
- **Layout System**: Generic slot-based layout without hardcoded slot names
- **Event System**: Generic pub/sub without plugin-specific topics
- **Component Loading**: Dynamic component resolution without hardcoded imports

### Key Changes:

**1. Plugin Discovery via Registry**
```typescript
// Instead of hardcoded loaders, use a plugin registry
interface PluginRegistry {
  discover(): Promise<PluginDescriptor[]>;
  load(id: string): Promise<PluginModule>;
}

interface PluginDescriptor {
  id: string;
  capabilities: string[];
  ui?: { slots: string[]; component: string };
  runtime?: { entry: string };
}
```

**2. Dynamic Component Loading**
```typescript
// Replace hardcoded packageLoaders with dynamic loading
const pluginRegistry = new PluginRegistry();

function loadPluginComponent(slotName: string) {
  return pluginRegistry.discover().then(plugins => {
    const plugin = plugins.find(p => p.ui?.slots.includes(slotName));
    if (!plugin) return null;
    return pluginRegistry.load(plugin.id).then(mod => mod[plugin.ui!.component]);
  });
}
```

**3. Generic Layout System**
```json
// Layout manifest becomes purely structural
{
  "layout": {
    "grid": ["320px", "1fr", "360px"],
    "areas": [["left", "center", "right"]]
  },
  "slots": ["left", "center", "right"]
}
```

**4. Plugin-First Initialization**
```typescript
// Plugins register themselves instead of app knowing about them
async function initializePlugins() {
  const plugins = await pluginRegistry.discover();
  
  // Plugins register their capabilities
  for (const plugin of plugins) {
    if (plugin.runtime) {
      const runtime = await pluginRegistry.load(plugin.id);
      runtime.register?.(appContext);
    }
  }
}
```

**5. Capability-Based APIs**
```typescript
// Instead of exposing specific APIs, expose capability interfaces
window.RenderX = {
  capabilities: new CapabilityBroker(),
  events: new EventBus(),
  layout: new LayoutManager()
};
```

### Benefits of Thin Client Approach:

- **Plugin Independence**: Core app doesn't need updates when plugins change
- **Dynamic Loading**: Plugins can be loaded on-demand or conditionally
- **Better Separation**: Clear boundaries between core functionality and extensions
- **Scalability**: Easy to add/remove plugins without touching core code
- **Version Compatibility**: Plugins can evolve independently

### Migration Strategy:

1. **Phase 1**: Extract plugin loading into a registry pattern
2. **Phase 2**: Make layout system generic (slot names become dynamic)
3. **Phase 3**: Move from hardcoded APIs to capability-based interfaces
4. **Phase 4**: Remove build-time plugin knowledge, make discovery runtime-based

This would transform the application from a plugin-aware monolith into a true thin client that acts as a generic plugin host, knowing only about abstract concepts like "slots", "capabilities", and "events" rather than specific plugin implementations.

---

**BPMSoftwareSolutions:** How would the file structure look after the refactoring?

---

## Summary

The refactored structure transforms the application from a **plugin-aware monolith** to a **thin client plugin host**:

### Key Architectural Changes:

1. **Plugin Registry** replaces hardcoded loaders and manifests
2. **Capability Broker** replaces plugin-specific global APIs  
3. **Dynamic Loading** replaces static imports
4. **Self-Registering Plugins** replace build-time aggregation
5. **Generic Layout System** replaces hardcoded slot names

### Benefits:

- **Zero plugin knowledge** in core application code
- **Runtime plugin discovery** instead of build-time coupling
- **Capability-based APIs** instead of plugin-specific interfaces
- **Dynamic extensibility** without core application changes
- **Clear separation** between host and plugin responsibilities

The core application becomes a generic plugin container that only understands abstract concepts like "slots", "capabilities", and "events", while plugins are responsible for registering their own functionality.

---

**BPMSoftwareSolutions:** How would the file structure look after the refactoring? Provide ASCII sketches

---

Based on the current structure, here are ASCII sketches showing how the file structure would transform after refactoring to a thin client architecture:

## Current Structure (Plugin-Aware)

```
renderx-plugins-demo/
├── package.json                    # Hardcoded plugin deps
├── src/
│   ├── main.tsx                    # Exposes plugin APIs globally
│   ├── App.tsx                     # Knows about specific slots
│   ├── conductor.ts                # Hardcoded runtime loaders
│   ├── components/
│   │   └── PanelSlot.tsx           # Hardcoded packageLoaders
│   └── layout/
│       ├── LayoutEngine.tsx        # Slot-specific logic
│       └── SlotContainer.tsx
├── public/
│   ├── plugins/
│   │   └── plugin-manifest.json    # Static plugin registry
│   └── layout-manifest.json        # Hardcoded slot names
├── scripts/
│   ├── aggregate-plugins.js        # Build-time plugin discovery
│   ├── generate-*-manifest.js      # Static manifest generation
│   └── sync-plugins.js
└── json-*/                         # Plugin-specific configs
```

## After Refactoring (Thin Client)

```
renderx-plugins-demo/
├── package.json                    # Generic deps only
├── src/
│   ├── main.tsx                    # Generic host initialization
│   ├── App.tsx                     # Generic layout container
│   ├── plugins/                    # NEW: Plugin infrastructure
│   │   ├── PluginRegistry.ts       # Dynamic plugin discovery
│   │   ├── CapabilityBroker.ts     # Generic API broker
│   │   ├── DynamicLoader.ts        # Runtime component loading
│   │   └── types.ts                # Generic plugin interfaces
│   ├── components/
│   │   └── PanelSlot.tsx           # Generic slot resolver
│   └── layout/
│       ├── LayoutEngine.tsx        # Generic slot system
│       └── SlotContainer.tsx       # Unchanged
├── public/
│   ├── layout-manifest.json        # Generic slot definitions
│   └── plugins/                    # Runtime-discovered plugins
│       └── [dynamic manifests]     # Generated at runtime
├── scripts/
│   ├── discover-plugins.js         # NEW: Runtime discovery
│   └── generate-layout-manifest.js # Generic layout only
└── packages/                       # NEW: Plugin packages
    ├── renderx-plugin-canvas/
    │   ├── package.json            # Self-declaring capabilities
    │   ├── src/
    │   │   ├── index.ts            # Plugin registration
    │   │   ├── CanvasPage.tsx      # UI component
    │   │   └── capabilities.ts     # Declares what it provides
    │   └── renderx.json            # Capability manifest
    └── renderx-plugin-library/
        ├── package.json
        ├── src/
        │   ├── index.ts
        │   ├── LibraryPanel.tsx
        │   └── capabilities.ts
        └── renderx.json
```

## Detailed Plugin Infrastructure

```
src/plugins/
├── PluginRegistry.ts               # Discovers available plugins
├── CapabilityBroker.ts             # Routes capability requests
├── DynamicLoader.ts                # Loads components on-demand
├── types.ts                        # Generic plugin contracts
├── index.ts                        # Public plugin API
└── utils/
    ├── module-resolver.ts          # Handles import specifiers
    └── manifest-parser.ts          # Parses capability declarations
```

## Plugin Package Structure

```
packages/renderx-plugin-[name]/
├── package.json                    # Standard npm package
├── renderx.json                    # Plugin capability declaration
├── src/
│   ├── index.ts                    # Plugin bootstrap & registration
│   ├── components/                 # UI components
│   ├── handlers/                   # Event handlers
│   ├── capabilities.ts             # Capability implementations
│   └── types.ts                    # Plugin-specific types
├── dist/                           # Built artifacts
└── README.md                       # Plugin documentation
```

## Capability Declaration Example

```json
// packages/renderx-plugin-canvas/renderx.json
{
  "id": "canvas-plugin",
  "version": "1.0.0",
  "capabilities": {
    "ui.slots": ["canvas"],
    "events.topics": ["canvas.*"],
    "handlers.interactions": ["canvas.component.*"]
  },
  "components": {
    "CanvasPage": "./dist/components/CanvasPage.js"
  },
  "handlers": {
    "register": "./dist/index.js"
  }
}
```

## Key Structural Changes

1. **Separation of Concerns**: Core app vs plugin system clearly separated
2. **Dynamic Discovery**: Plugins found at runtime, not build-time
3. **Capability-Based**: APIs defined by what plugins can do, not what they are
4. **Self-Registering**: Plugins declare their own capabilities and requirements
5. **Generic Loading**: Core app loads components without knowing plugin details
6. **Modular Packages**: Each plugin is a separate npm package with its own lifecycle

This architecture makes the core application a true "thin client" that acts as a generic plugin host, knowing only about abstract concepts like slots, capabilities, and events rather than specific plugin implementations.

---

**BPMSoftwareSolutions:** Where do all the json-* file structures go in the future state?

---

## Current json-* Structures → Future Locations

### **json-components/** → **packages/renderx-shared-components/**
```
packages/renderx-shared-components/
├── components/
│   ├── button.json
│   ├── container.json
│   ├── heading.json
│   ├── html.json
│   ├── image.json
│   ├── input.json
│   ├── line.json
│   ├── paragraph.json
│   └── svg.json
├── index.json          # Component registry
└── package.json        # Shared component library
```

**Why?** These are shared component definitions used across plugins. They become a separate npm package that plugins can depend on.

### **json-layout/** → **src/layout/config/**
```
src/layout/config/
├── layout.json         # Generic slot-based layout
└── responsive.json     # Layout variants
```

**Why?** Layout becomes purely structural and generic, not plugin-aware. The core app manages layout, plugins declare which slots they occupy.

### **json-plugins/** → **REMOVED** (Replaced by capability declarations)
```
# This directory is eliminated because:
# - Plugin manifests become renderx.json in each plugin package
# - Build-time aggregation is replaced by runtime discovery
# - Static plugin-manifest.json becomes dynamic
```

### **json-sequences/** → **packages/renderx-plugin-*/sequences/**
```
packages/renderx-plugin-canvas/sequences/
├── create.json
├── drag.json
├── export.json
├── resize.json
├── select.json
└── update.json

packages/renderx-plugin-control-panel/sequences/
├── css.create.json
├── css.edit.json
├── ui.init.json
├── ui.render.json
└── selection.show.json
```

**Why?** Sequences are plugin-specific behaviors, so they move into their respective plugin packages where they belong.

### **json-interactions/** → **packages/renderx-shared-interactions/**
```
packages/renderx-shared-interactions/
├── interactions/
│   ├── canvas-component.interactions.json
│   ├── control-panel.interactions.json
│   └── library.interactions.json
├── topics/
│   └── shared-topics.json
└── package.json
```

**Why?** Interaction patterns that are shared across plugins become a separate shared package, while plugin-specific interactions move to their respective packages.

## New Structure Overview

```
renderx-plugins-demo/
├── src/                          # Core thin client app
│   ├── layout/
│   │   └── config/              # Generic layout configs
│   └── plugins/                 # Plugin infrastructure
├── packages/                     # Plugin ecosystem
│   ├── renderx-shared-components/    # Shared component library
│   ├── renderx-shared-interactions/  # Shared interaction patterns
│   ├── renderx-plugin-canvas/        # Canvas plugin
│   │   ├── sequences/               # Canvas-specific sequences
│   │   ├── components/              # Canvas components
│   │   └── renderx.json             # Capability declaration
│   ├── renderx-plugin-control-panel/
│   │   ├── sequences/               # Control panel sequences
│   │   ├── handlers/                # Control panel handlers
│   │   └── renderx.json
│   └── renderx-plugin-library/
│       ├── components/
│       └── renderx.json
└── public/                        # Runtime resources only
    └── layout-manifest.json       # Generated at runtime
```

## Key Principles

1. **Plugin Ownership**: Each plugin package contains everything it needs
2. **Shared Resources**: Common components/interactions become separate packages
3. **Runtime Discovery**: No more build-time aggregation of plugin knowledge
4. **Capability Declaration**: Plugins declare what they provide via `renderx.json`
5. **Core App Isolation**: Core app only knows about generic concepts (slots, capabilities, events)

This restructuring eliminates the core application's knowledge of specific plugins while maintaining the functionality through a well-defined plugin ecosystem.

---

**BPMSoftwareSolutions:** Awesome. Now take a look at the existing plugins npm packages ("/node_modules/@renderx-plugins/"). Review their file structure. Show me how canvas-component would change in the future state. What would it's file structure look like?

---

## Current canvas-component Plugin Structure

Based on the npm package analysis, here's the current structure:

```
@renderx-plugins/canvas-component/
├── package.json              # Contains "renderx" field with plugin declarations
├── dist/
│   ├── index.js             # Main registration export
│   ├── chunk-*.js           # Built code chunks
│   └── symphonies/          # Sequence handlers
│       ├── augment/
│       ├── create/
│       ├── drag/
│       ├── export/
│       ├── import/
│       ├── line-advanced/
│       ├── resize/
│       ├── resize-line/
│       ├── select/
│       └── update/
├── json-sequences/
│   └── canvas-component/    # Sequence definitions
│       ├── create.json
│       ├── drag.json
│       ├── export.json
│       ├── import.json
│       ├── line.manip.end.json
│       ├── resize.end.json
│       ├── select.json
│       ├── update.json
│       └── ... (20+ sequence files)
└── README.md
```

## Future Thin Client canvas-component Structure

```
packages/renderx-plugin-canvas-component/
├── package.json                    # Standard npm package (no renderx field)
├── renderx.json                    # NEW: Capability declaration
├── src/
│   ├── index.ts                    # Plugin bootstrap & registration
│   ├── components/                 # UI components (if any)
│   ├── handlers/                   # Event handlers
│   ├── sequences/                  # Sequence definitions (moved from json-sequences)
│   │   ├── create.json
│   │   ├── drag.json
│   │   ├── export.json
│   │   ├── import.json
│   │   ├── line-manip-end.json
│   │   ├── resize-end.json
│   │   ├── select.json
│   │   ├── update.json
│   │   └── index.json
│   ├── capabilities.ts             # Capability implementations
│   └── types.ts                    # Plugin-specific types
├── dist/                           # Built artifacts
│   ├── index.js
│   ├── components/
│   ├── handlers/
│   └── sequences/                  # Built sequence handlers
├── __tests__/                      # Plugin tests
├── README.md                       # Plugin documentation
└── tsconfig.json                   # TypeScript config
```

## Key Changes Explained

### 1. **renderx.json** (New Capability Declaration)
```json
{
  "id": "canvas-component-plugin",
  "version": "1.0.0",
  "capabilities": {
    "events.topics": ["canvas.component.*"],
    "handlers.interactions": ["canvas.component.create", "canvas.component.drag", "canvas.component.resize"],
    "sequences.provided": ["canvas-component"]
  },
  "components": {},
  "handlers": {
    "register": "./dist/index.js"
  },
  "sequences": {
    "canvas-component": "./dist/sequences/"
  },
  "dependencies": {
    "slots": [],
    "capabilities": ["canvas"]
  }
}
```

### 2. **Self-Contained Sequences**
- Moved from `json-sequences/canvas-component/` to `src/sequences/`
- Sequences become part of the plugin package itself
- No external references needed

### 3. **Plugin Bootstrap** (`src/index.ts`)
```typescript
import { PluginRegistry } from '@renderx/core';
import { registerSequences } from './handlers';
import * as capabilities from './capabilities';

export function register() {
  // Register with the plugin system
  PluginRegistry.register({
    id: 'canvas-component-plugin',
    capabilities,
    handlers: registerSequences
  });
}

// Auto-register in browser environments
if (typeof window !== 'undefined') {
  register();
}
```

### 4. **Capability Implementation** (`src/capabilities.ts`)
```typescript
export const canvasComponentCapabilities = {
  // Define what this plugin provides
  interactions: ['create', 'drag', 'resize', 'select', 'update'],
  events: ['canvas.component.*'],
  
  // Methods that other plugins can call
  createComponent: async (type: string, config: any) => { /* ... */ },
  updateComponent: async (id: string, updates: any) => { /* ... */ },
  deleteComponent: async (id: string) => { /* ... */ }
};
```

### 5. **Package Structure Benefits**

- **Self-Contained**: Everything the plugin needs is in one package
- **Clear Dependencies**: Explicitly declares what capabilities it needs/provides
- **Runtime Registration**: No build-time knowledge required
- **Version Independence**: Can evolve without core app changes
- **Testable**: Each plugin can be tested in isolation

### 6. **Migration Path**

The current `canvas-component` would become `renderx-plugin-canvas-component` in the packages directory, with:

- `renderx` field removed from package.json
- `renderx.json` added for capability declaration  
- Sequences moved from json-sequences to `src/sequences/`
- Source code restructured for self-registration
- All dependencies and capabilities explicitly declared

This transformation makes each plugin a complete, self-describing package that the thin client can discover and load dynamically without any prior knowledge of what plugins exist.