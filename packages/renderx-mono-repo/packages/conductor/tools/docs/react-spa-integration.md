# 🎼 MusicalConductor React SPA Integration Guide

A comprehensive guide for integrating MusicalConductor into React single-page applications with plugin-based UI workflows.

## 🚨 Critical Architecture Notes

### ❌ DO NOT Import EventBus Directly

**NEVER** import or use EventBus directly in your application:

```typescript
// ❌ WRONG - This will break your application
import { EventBus } from "../modules/communication/EventBus";
```

**Why this is forbidden:**

- MusicalConductor does **NOT** export EventBus as part of its public API
- EventBus is an internal implementation detail
- Direct EventBus usage bypasses all orchestration, monitoring, and validation
- SPAValidator will detect and block direct EventBus usage

### ✅ Use MusicalConductor's Public API Only

```typescript
// ✅ CORRECT - Use the public MusicalConductor API
import { MusicalConductor } from "musical-conductor";

const conductor = MusicalConductor.getInstance();
conductor.play(pluginId, sequenceId, context); // Proper orchestration
// UI subscriptions are generally discouraged; prefer callback-first via play()
```

### 📦 Package Installation

MusicalConductor is distributed as an **npm package** that must be installed by client applications:

```bash
# Install MusicalConductor package
npm install musical-conductor

# Or with yarn
yarn add musical-conductor
```

## 🚀 Overview

This guide demonstrates how to use MusicalConductor to orchestrate complex UI workflows in a React SPA with the following components:

- **App Shell** - Main application container with theme management
- **Element Library** - Component library with draggable elements
- **Control Panel** - Dynamic property editor for selected components
- **Canvas** - Drop zone for components with positioning and layout
- **Canvas Element** - Dynamic components loaded from JSON definitions
- **Drag Preview** - Visual feedback during drag operations

## 🔄 Update (Aug 2025): Manifest‑Driven Panel Slot Plugin Architecture

This SPA guide predates our new thin‑shell pattern. We now render panels by slot using plugin‑provided UIs, loaded from a manifest and isolated with Suspense + ErrorBoundary. See ADR‑0014 for full details: tools/docs/wiki/adr/0014-manifest-driven-panel-slot-plugins.md

Key changes:

- Thin shell with PanelSlot per area (left/center/right)
- Plugin UI initiates workflows via conductor.play(..., { on… callbacks }), not broad UI subscriptions
- Suspense for loading; ErrorBoundary for safe fallback to legacy panels during migration
- Dev: dynamic import from /public/plugins; Prod: planned global export lookup

Example: Element Library panel (shell)

```tsx
// src/components/ElementLibrary.tsx
return (
  <ErrorBoundary fallback={<LegacyElementLibrary />}>
    <Suspense
      fallback={
        <div className="panel-slot-loading" data-slot="left">
          Loading left UI...
        </div>
      }
    >
      <PanelSlot slot="left" fallback={<LegacyElementLibrary />} />
    </Suspense>
  </ErrorBoundary>
);
```

Example: Control Panel (shell)

```tsx
// src/components/ControlPanel.tsx
return (
  <ErrorBoundary fallback={<LegacyControlPanel />}>
    <Suspense
      fallback={
        <div className="panel-slot-loading" data-slot="right">
          Loading right UI...
        </div>
      }
    >
      <PanelSlot slot="right" fallback={<LegacyControlPanel />} />
    </Suspense>
  </ErrorBoundary>
);
```

Manifest entry for plugin UI

```json
// public/plugins/manifest.json (excerpt)
{
  "plugins": [
    {
      "name": "Component Library Plugin",
      "path": "component-library-plugin/",
      "autoMount": true,

      "ui": { "slot": "left", "export": "LibraryPanel" }
    }
  ]
}
```

Plugin UI notes

- Access React via window.React and destructure used hooks explicitly:

```js
const React = (window && window.React) || null;
if (!React) return null;
const { useState, useEffect, useMemo } = React;
```

- Use conductor.play with callbacks instead of UI subscriptions:

```js
conductor.play("Component Library Plugin", "load-components-symphony", {
  source: "json-components",
  onComponentsLoaded: (items) => setComponents(items || []),
});
```

- Guard duplicate plays in React 18 StrictMode (e.g., window.**rx_library_played**)

The legacy sections below remain for reference; prefer the updated pattern above when building new panels/plugins.

## 🏗️ Application Architecture

````
React SPA
├── AppShell (Theme management)
├── ElementLibrary (Component catalog)

## 🔧 Thin Shell Setup and Initialization

1) Install dependencies

```bash
npm install musical-conductor react react-dom
````

2. Initialize the communication system (singleton) in ConductorService

```ts
// src/services/ConductorService.ts (excerpt)
import { MusicalConductor } from "musical-conductor";

export class ConductorService {
  private static instance: ConductorService;
  private conductor = MusicalConductor.getInstance();
  static getInstance() {
    return this.instance ?? (this.instance = new ConductorService());
  }

  async initialize() {
    // Registers sequences and mounts plugins from manifest
    await this.conductor.registerCIAPlugins();
    (window as any).renderxCommunicationSystem = { conductor: this.conductor };
  }

  getConductor() {
    return this.conductor;
  }
}
```

3. Use PanelSlot in the shell for each panel with Suspense + ErrorBoundary

```tsx
// src/components/AppContent.tsx (excerpt)
return (
  <div className="app-layout">
    <aside className="app-sidebar left">
      <ElementLibrary />
    </aside>
    <section className="app-canvas">
      <Canvas mode="editor" />
    </section>
    <aside className="app-sidebar right">
      <ControlPanel />
    </aside>
  </div>
);
```

- ElementLibrary:

```tsx
// Thin shell usage
<ErrorBoundary fallback={<LegacyElementLibrary />}>
  <Suspense
    fallback={
      <div className="panel-slot-loading" data-slot="left">
        Loading left UI...
      </div>
    }
  >
    <PanelSlot slot="left" fallback={<LegacyElementLibrary />} />
  </Suspense>
</ErrorBoundary>
```

- ControlPanel:

```tsx
<ErrorBoundary fallback={<LegacyControlPanel />}>
  <Suspense
    fallback={
      <div className="panel-slot-loading" data-slot="right">
        Loading right UI...
      </div>
    }
  >
    <PanelSlot slot="right" fallback={<LegacyControlPanel />} />
  </Suspense>
</ErrorBoundary>
```

Guidelines

- The shell never subscribes to domain events; initiate workflows via conductor.play from plugin UIs
- Prefer callback‑first (on… props in play payload) to update React state
- Keep legacy fallbacks until the corresponding plugin UI is ready

├── ControlPanel (Property editor)
├── Canvas (Layout container)
├── CanvasElement (Dynamic components)
└── DragPreview (Drag feedback)

MusicalConductor Plugins
├── AppShell.theme-symphony
├── ElementLibrary.load-components-symphony
├── Component.drag-symphony
├── ElementLibrary.component-drag-symphony
├── Canvas.drop-symphony
├── Canvas.move-symphony
├── Canvas.resize-symphony
├── Canvas.delete-symphony
└── Canvas.select-symphony

````

## 🎯 Plugin Naming Convention

Plugins follow the pattern: `[domain].[action]-symphony`

- `AppShell.theme-symphony` - Theme switching workflow
- `ElementLibrary.load-components-symphony` - Component loading workflow
- `Component.drag-symphony` - Generic component drag workflow
- `ElementLibrary.component-drag-symphony` - Library-specific drag workflow
- `Canvas.drop-symphony` - Canvas drop handling workflow
- `Canvas.move-symphony` - Canvas element repositioning workflow
- `Canvas.resize-symphony` - Canvas element resizing workflow
- `Canvas.delete-symphony` - Canvas element deletion workflow
- `Canvas.select-symphony` - Canvas element selection workflow

## 🔧 Setup and Initialization

### 1. Initialize MusicalConductor

```typescript
// src/services/ConductorService.ts
import { MusicalConductor } from "musical-conductor";

export class ConductorService {
  private static instance: ConductorService;
  private conductor: MusicalConductor;

  private constructor() {
    // MusicalConductor manages its own EventBus internally
    this.conductor = MusicalConductor.getInstance();
  }

  public static getInstance(): ConductorService {
    if (!ConductorService.instance) {
      ConductorService.instance = new ConductorService();
    }
    return ConductorService.instance;
  }

  public getConductor(): MusicalConductor {
    return this.conductor;
  }

  // Initialize all UI workflow plugins
  public async initializePlugins(): Promise<void> {
    await this.conductor.registerCIAPlugins();
    console.log("🎼 All UI workflow plugins loaded");
  }
}
````

### 2. React App Integration

```typescript
// src/App.tsx
import React, { useEffect, useState } from "react";
import { ConductorService } from "./services/ConductorService";
import { AppShell } from "./components/AppShell";
import { ElementLibrary } from "./components/ElementLibrary";
import { ControlPanel } from "./components/ControlPanel";
import { Canvas } from "./components/Canvas";
import { DragPreview } from "./components/DragPreview";

export const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const initializeConductor = async () => {
      const conductorService = ConductorService.getInstance();
      await conductorService.initializePlugins();
      setIsInitialized(true);
    };

    initializeConductor();
  }, []);

  if (!isInitialized) {
    return <div>Loading MusicalConductor...</div>;
  }

  return (
    <AppShell theme={theme} onThemeChange={setTheme}>
      <div className="app-layout">
        <ElementLibrary />
        <Canvas
          selectedElement={selectedElement}
          onElementSelect={setSelectedElement}
        />
        <ControlPanel selectedElement={selectedElement} />
      </div>
      <DragPreview />
    </AppShell>
  );
};
```

## 🎨 Component Examples

### AppShell with Theme Management

```typescript
// src/components/AppShell.tsx
import React, { useEffect } from "react";
import { ConductorService } from "../services/ConductorService";

interface AppShellProps {
  theme: string;
  onThemeChange: (theme: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  theme,
  onThemeChange,
  children,
}) => {
  const conductor = ConductorService.getInstance().getConductor();

  useEffect(() => {
    // Subscribe to theme change events
    const unsubscribe = conductor.subscribe("theme-changed", (event) => {
      onThemeChange(event.theme);
    });

    return unsubscribe;
  }, [conductor, onThemeChange]);

  const handleThemeToggle = () => {
    const targetTheme = theme === "light" ? "dark" : "light";

    // Execute theme change symphony with callback
    // pluginId comes from plugin-manifest.json, sequenceId from sequence definition
    conductor.play("AppShell", "theme-symphony", {
      currentTheme: theme,
      targetTheme,
      onThemeChange: onThemeChange, // Pass callback for React state update
    });
  };

  return (
    <div className={`app-shell theme-${theme}`}>
      <header className="app-header">
        <h1>React SPA with MusicalConductor</h1>
        <button onClick={handleThemeToggle}>
          Switch to {theme === "light" ? "Dark" : "Light"} Theme
        </button>
      </header>
      <main className="app-content">{children}</main>
    </div>
  );
};
```

### Element Library with Component Loading

```typescript
// src/components/ElementLibrary.tsx
import React, { useEffect, useState } from "react";
import { ConductorService } from "../services/ConductorService";

interface ComponentDefinition {
  id: string;
  name: string;
  type: string;
  icon: string;
  properties: Record<string, any>;
}

export const ElementLibrary: React.FC = () => {
  const [components, setComponents] = useState<ComponentDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const conductor = ConductorService.getInstance().getConductor();

  useEffect(() => {
    // Load components on mount
    loadComponents();

    // Subscribe to component library updates
    const unsubscribe = conductor.subscribe("components-loaded", (event) => {
      setComponents(event.components);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [conductor]);

  const loadComponents = () => {
    // Execute component loading symphony with callback
    // pluginId: "ElementLibrary" (from manifest), sequenceId: "load-components-symphony"
    conductor.play("ElementLibrary", "load-components-symphony", {
      source: "component-definitions.json",
      category: "ui-components",
      onComponentsLoaded: setComponents, // Pass callback for React state update
    });
  };

  const handleDragStart = (
    component: ComponentDefinition,
    event: React.DragEvent
  ) => {
    // Execute drag start symphony
    conductor.play("ElementLibrary", "component-drag-symphony", {
      component,
      dragEvent: event,
      source: "library",
    });
  };

  if (isLoading) {
    return <div className="element-library loading">Loading components...</div>;
  }

  return (
    <div className="element-library">
      <h3>Component Library</h3>
      <div className="component-grid">
        {components.map((component) => (
          <div
            key={component.id}
            className="component-item"
            draggable
            onDragStart={(e) => handleDragStart(component, e)}
          >
            <div className="component-icon">{component.icon}</div>
            <div className="component-name">{component.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Canvas with Drop, Move, Resize, Delete, and Select

```typescript
// src/components/Canvas.tsx
import React, { useEffect, useState, useRef } from "react";
import { ConductorService } from "../services/ConductorService";
import { CanvasElement } from "./CanvasElement";

interface CanvasProps {
  selectedElement: any;
  onElementSelect: (element: any) => void;
}

interface CanvasElementData {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  properties: Record<string, any>;
}

export const Canvas: React.FC<CanvasProps> = ({
  selectedElement,
  onElementSelect,
}) => {
  const [elements, setElements] = useState<CanvasElementData[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const conductor = ConductorService.getInstance().getConductor();

  useEffect(() => {
    // Subscribe to sequence completion events for monitoring
    const unsubscribeSequenceCompleted = conductor.subscribe(
      "sequence-completed",
      (event) => {
        console.log(`🎼 Canvas sequence completed: ${event.sequenceName}`);
        // Optional: Handle sequence completion for monitoring/debugging
      }
    );

    return () => {
      unsubscribeSequenceCompleted();
    };
  }, [conductor]);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dropPosition = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    // Execute drop symphony with callback
    conductor.play("Canvas", "drop-symphony", {
      dropPosition,
      dragEvent: event,
      canvasRect: rect,
      onElementAdded: (element) => setElements((prev) => [...prev, element]),
    });
  };

  const handleElementSelect = (element: CanvasElementData) => {
    onElementSelect(element);

    // Execute select symphony
    conductor.play("Canvas", "select-symphony", {
      element,
      previousSelection: selectedElement,
    });
  };

  const handleElementMove = (
    elementId: string,
    newPosition: { x: number; y: number }
  ) => {
    // Execute move symphony
    conductor.play("Canvas", "move-symphony", {
      elementId,
      newPosition,
      oldPosition: elements.find((el) => el.id === elementId)?.position,
    });
  };

  const handleElementResize = (
    elementId: string,
    newSize: { width: number; height: number }
  ) => {
    // Execute resize symphony
    conductor.play("Canvas", "resize-symphony", {
      elementId,
      newSize,
      oldSize: elements.find((el) => el.id === elementId)?.size,
    });
  };

  const handleElementDelete = (elementId: string) => {
    // Execute delete symphony
    conductor.play("Canvas", "delete-symphony", {
      elementId,
      element: elements.find((el) => el.id === elementId),
    });
  };

  return (
    <div
      ref={canvasRef}
      className="canvas"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h3>Canvas</h3>
      <div className="canvas-content">
        {elements.map((element) => (
          <CanvasElement
            key={element.id}
            element={element}
            isSelected={selectedElement?.id === element.id}
            onSelect={() => handleElementSelect(element)}
            onMove={(newPosition) => handleElementMove(element.id, newPosition)}
            onResize={(newSize) => handleElementResize(element.id, newSize)}
            onDelete={() => handleElementDelete(element.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

### Canvas Element with Dynamic Component Loading

```typescript
// src/components/CanvasElement.tsx
import React, { useState, useRef, useEffect } from "react";

interface CanvasElementProps {
  element: {
    id: string;
    type: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    properties: Record<string, any>;
  };
  isSelected: boolean;
  onSelect: () => void;
  onMove: (position: { x: number; y: number }) => void;
  onResize: (size: { width: number; height: number }) => void;
  onDelete: () => void;
}

export const CanvasElement: React.FC<CanvasElementProps> = ({
  element,
  isSelected,
  onSelect,
  onMove,
  onResize,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.target === elementRef.current) {
      setIsDragging(true);
      setDragStart({
        x: event.clientX - element.position.x,
        y: event.clientY - element.position.y,
      });
      onSelect();
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y,
      };
      onMove(newPosition);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart]);

  const handleResizeStart = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsResizing(true);
    onSelect();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Delete" && isSelected) {
      onDelete();
    }
  };

  // Render dynamic component based on type
  const renderComponent = () => {
    switch (element.type) {
      case "button":
        return (
          <button style={element.properties.style}>
            {element.properties.text || "Button"}
          </button>
        );
      case "text":
        return (
          <div style={element.properties.style}>
            {element.properties.content || "Text Element"}
          </div>
        );
      case "image":
        return (
          <img
            src={element.properties.src}
            alt={element.properties.alt}
            style={element.properties.style}
          />
        );
      default:
        return <div>Unknown Component</div>;
    }
  };

  return (
    <div
      ref={elementRef}
      className={`canvas-element ${isSelected ? "selected" : ""}`}
      style={{
        position: "absolute",
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {renderComponent()}

      {isSelected && (
        <>
          {/* Selection handles */}
          <div className="selection-handles">
            <div className="handle top-left" />
            <div className="handle top-right" />
            <div className="handle bottom-left" />
            <div
              className="handle bottom-right"
              onMouseDown={handleResizeStart}
            />
          </div>

          {/* Delete button */}
          <button className="delete-button" onClick={onDelete}>
            ×
          </button>
        </>
      )}
    </div>
  );
};
```

### Control Panel and Drag Preview

```typescript
// src/components/ControlPanel.tsx
import React, { useEffect, useState } from "react";
import { ConductorService } from "../services/ConductorService";

interface ControlPanelProps {
  selectedElement: any;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedElement,
}) => {
  const [properties, setProperties] = useState<Record<string, any>>({});
  const conductor = ConductorService.getInstance().getConductor();

  useEffect(() => {
    if (selectedElement) {
      setProperties(selectedElement.properties || {});
    } else {
      setProperties({});
    }
  }, [selectedElement]);

  const handlePropertyChange = (key: string, value: any) => {
    const newProperties = { ...properties, [key]: value };
    setProperties(newProperties);

    // Execute property update symphony
    conductor.play("ControlPanel", "property-update-symphony", {
      elementId: selectedElement.id,
      property: key,
      value,
      oldValue: properties[key],
    });
  };

  if (!selectedElement) {
    return (
      <div className="control-panel">
        <h3>Properties</h3>
        <p>Select an element to edit properties</p>
      </div>
    );
  }

  return (
    <div className="control-panel">
      <h3>Properties - {selectedElement.type}</h3>
      <div className="property-editor">
        {Object.entries(properties).map(([key, value]) => (
          <div key={key} className="property-field">
            <label>{key}:</label>
            <input
              type="text"
              value={value}
              onChange={(e) => handlePropertyChange(key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// src/components/DragPreview.tsx
import React, { useEffect, useState } from "react";
import { ConductorService } from "../services/ConductorService";

export const DragPreview: React.FC = () => {
  const [dragData, setDragData] = useState<any>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const conductor = ConductorService.getInstance().getConductor();

  useEffect(() => {
    const unsubscribeDragStart = conductor.subscribe(
      "drag-started",
      (event) => {
        setDragData(event.component);
      }
    );

    const unsubscribeDragMove = conductor.subscribe("drag-moved", (event) => {
      setPosition({ x: event.x, y: event.y });
    });

    const unsubscribeDragEnd = conductor.subscribe("drag-ended", () => {
      setDragData(null);
    });

    return () => {
      unsubscribeDragStart();
      unsubscribeDragMove();
      unsubscribeDragEnd();
    };
  }, [conductor]);

  if (!dragData) return null;

  return (
    <div
      className="drag-preview"
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      <div className="preview-content">
        {dragData.icon} {dragData.name}
      </div>
    </div>
  );
};
```

## 🔌 Plugin Examples

### Understanding Plugin Structure

**Important**: The `pluginId` used in `conductor.play(pluginId, sequenceId, ...)` comes from the plugin's entry in `plugin-manifest.json`, not from the sequence definition.

**Plugin Manifest Example** (`plugin-manifest.json`):

```json
{
  "plugins": [
    {
      "id": "AppShell",
      "name": "Application Shell Plugin",
      "version": "1.0.0",
      "file": "AppShell.theme-symphony.js",
      "sequences": ["theme-symphony"]
    },
    {
      "id": "ElementLibrary",
      "name": "Element Library Plugin",
      "version": "1.0.0",
      "file": "ElementLibrary.load-components-symphony.js",
      "sequences": ["load-components-symphony"]
    }
  ]
}
```

### AppShell Theme Symphony Plugin

```typescript
// plugins/AppShell.theme-symphony.ts
export const sequence = {
  id: "theme-symphony",
  name: "Theme Management Symphony No. 1",
  description:
    "Orchestrates theme switching with smooth transitions and persistence",
  version: "1.0.0",
  key: "C Major",
  tempo: 120,
  timeSignature: "4/4",
  category: "ui-operations",
  movements: [
    {
      id: "theme-transition",
      name: "Theme Transition Allegro",
      description:
        "Handle theme switching workflow with validation and application",
      beats: [
        {
          beat: 1,
          event: "theme:validation:start",
          title: "Theme Validation",
          description: "Validate the target theme against available options",
          handler: "validateTheme",
          dynamics: "forte",
          timing: "immediate",
        },
        {
          beat: 2,
          event: "theme:application:start",
          title: "Theme Application",
          description: "Apply the new theme to the application DOM",
          handler: "applyTheme",
          dynamics: "forte",
          timing: "synchronized",
        },
        {
          beat: 3,
          event: "theme:persistence:start",
          title: "Theme Persistence",
          description: "Save theme preference to localStorage",
          handler: "persistTheme",
          dynamics: "mezzo-forte",
          timing: "delayed",
        },
        {
          beat: 4,
          event: "theme:notification:start",
          title: "Theme Notification",
          description: "Notify React components of theme change",
          handler: "notifyThemeChange",
          dynamics: "mezzo-forte",
          timing: "synchronized",
        },
      ],
    },
  ],
  events: {
    triggers: ["theme:change:request"],
    emits: [
      "theme:validation:start",
      "theme:application:start",
      "theme:persistence:start",
      "theme:notification:start",
      "theme:change:complete",
    ],
  },
  configuration: {
    availableThemes: ["light", "dark", "auto"],
    transitionDuration: 300,
    persistToStorage: true,
    enableSystemTheme: true,
  },
};

export const handlers = {
  validateTheme: (data: any, context: any) => {
    const { targetTheme } = context;
    const { availableThemes } = context.sequence.configuration;

    if (!availableThemes.includes(targetTheme)) {
      throw new Error(
        `Invalid theme: ${targetTheme}. Available: ${availableThemes.join(
          ", "
        )}`
      );
    }

    console.log(`🎨 Theme validation passed: ${targetTheme}`);
    return { validated: true, theme: targetTheme };
  },

  applyTheme: (data: any, context: any) => {
    const { targetTheme } = context;
    const { transitionDuration } = context.sequence.configuration;

    // Apply theme to document root with transition
    document.documentElement.setAttribute("data-theme", targetTheme);
    document.body.className = `theme-${targetTheme}`;
    document.documentElement.style.setProperty(
      "--theme-transition-duration",
      `${transitionDuration}ms`
    );

    console.log(`🎨 Theme applied: ${targetTheme}`);
    return { applied: true, theme: targetTheme };
  },

  persistTheme: (data: any, context: any) => {
    const { theme } = context.payload; // From previous beat via data baton
    const { persistToStorage } = context.sequence.configuration;

    if (!persistToStorage) {
      console.log(`🎨 Theme persistence disabled`);
      return { persisted: false, reason: "disabled", theme };
    }

    try {
      localStorage.setItem("app-theme", theme);
      console.log(`🎨 Theme persisted: ${theme}`);
      return { persisted: true, theme };
    } catch (error) {
      console.warn("Failed to persist theme:", error);
      return { persisted: false, error: error.message, theme };
    }
  },

  notifyThemeChange: (data: any, context: any) => {
    const { theme } = context.payload; // From data baton

    // Update React components through callback mechanism
    if (context.onThemeChange) {
      context.onThemeChange(theme);
    }

    // ❌ DO NOT DO THIS - EventBus is not accessible in plugins
    // context.eventBus.emit("theme:change:complete", { theme });

    // ✅ CORRECT - Use conductor.play() to trigger completion sequence
    // or rely on React callback for state updates

    console.log(`📢 Theme change notification sent: ${theme}`);
    return { notified: true, theme };
  },
};
```

### ElementLibrary Component Loading Symphony Plugin

```typescript
// plugins/ElementLibrary.load-components-symphony.ts
export const sequence = {
  id: "load-components-symphony",
  name: "Component Library Loading Symphony No. 2",
  description:
    "Orchestrates loading and validation of component definitions from JSON sources",
  version: "1.0.0",
  key: "D Major",
  tempo: 140,
  timeSignature: "4/4",
  category: "data-operations",
  movements: [
    {
      id: "component-loading",
      name: "Component Loading Moderato",
      description: "Load, validate, and prepare component definitions",
      beats: [
        {
          beat: 1,
          event: "components:fetch:start",
          title: "Component Fetch",
          description: "Load component definitions from JSON source",
          handler: "fetchComponentDefinitions",
          dynamics: "forte",
          timing: "immediate",
        },
        {
          beat: 2,
          event: "components:validation:start",
          title: "Component Validation",
          description: "Validate component structure and required properties",
          handler: "validateComponents",
          dynamics: "mezzo-forte",
          timing: "synchronized",
        },
        {
          beat: 3,
          event: "components:preparation:start",
          title: "Component Preparation",
          description: "Prepare components for library display",
          handler: "prepareComponents",
          dynamics: "mezzo-forte",
          timing: "synchronized",
        },
        {
          beat: 4,
          event: "components:notification:start",
          title: "Component Notification",
          description: "Notify React components that library is ready",
          handler: "notifyComponentsLoaded",
          dynamics: "forte",
          timing: "delayed",
        },
      ],
    },
  ],
  events: {
    triggers: ["components:load:request"],
    emits: [
      "components:fetch:start",
      "components:validation:start",
      "components:preparation:start",
      "components:notification:start",
      "components:load:complete",
    ],
  },
  configuration: {
    requiredFields: ["id", "name", "type", "icon"],
    maxComponents: 100,
    enableValidation: true,
    sortBy: "name",
    filterCategories: ["ui-components", "layout", "forms"],
  },
};

export const handlers = {
  fetchComponentDefinitions: async (data: any, context: any) => {
    const { source } = context;

    try {
      const response = await fetch(`/api/components/${source}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const components = await response.json();
      console.log(
        `📚 Fetched ${components.length} component definitions from ${source}`
      );
      return { components, loaded: true, source };
    } catch (error) {
      console.error("Failed to fetch components:", error);
      throw error;
    }
  },

  validateComponents: (data: any, context: any) => {
    const { components } = context.payload;
    const { requiredFields, maxComponents, enableValidation } =
      context.sequence.configuration;

    if (!enableValidation) {
      console.log(`📚 Component validation disabled`);
      return {
        validComponents: components,
        validationPassed: true,
        skipped: true,
      };
    }

    const validComponents = components
      .filter((component: any) => {
        return requiredFields.every((field) => component[field]);
      })
      .slice(0, maxComponents); // Limit to maxComponents

    console.log(
      `✅ Validated ${validComponents.length}/${components.length} components`
    );
    return {
      validComponents,
      validationPassed: true,
      filtered: components.length - validComponents.length,
    };
  },

  prepareComponents: (data: any, context: any) => {
    const { validComponents } = context.payload;
    const { sortBy, filterCategories } = context.sequence.configuration;

    // Filter by categories if specified
    let preparedComponents = validComponents;
    if (filterCategories.length > 0) {
      preparedComponents = validComponents.filter((component: any) =>
        filterCategories.includes(component.category)
      );
    }

    // Sort components
    preparedComponents.sort((a: any, b: any) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "type") return a.type.localeCompare(b.type);
      return 0;
    });

    console.log(
      `🎨 Prepared ${preparedComponents.length} components for display`
    );
    return { preparedComponents, prepared: true };
  },

  notifyComponentsLoaded: (data: any, context: any) => {
    const { preparedComponents } = context.payload;

    // Update React components through callback mechanism
    if (context.onComponentsLoaded) {
      context.onComponentsLoaded(preparedComponents);
    }

    // ❌ DO NOT DO THIS - EventBus is not accessible in plugins
    // context.eventBus.emit("components:load:complete", { components });

    // ✅ CORRECT - Use conductor.play() to trigger completion sequence
    // or rely on React callback for state updates

    console.log(
      `📚 Component library loaded and notified: ${preparedComponents.length} components`
    );
    return { notified: true, count: preparedComponents.length };
  },
};
```

### Canvas Drop Symphony Plugin

```typescript
// plugins/Canvas.drop-symphony.ts
export const sequence = {
  id: "drop-symphony",
  name: "Canvas Drop Symphony No. 3",
  description:
    "Orchestrates component drops onto canvas with validation and positioning",
  version: "1.0.0",
  key: "E Major",
  tempo: 160,
  timeSignature: "4/4",
  category: "canvas-operations",
  movements: [
    {
      id: "drop-handling",
      name: "Drop Handling Vivace",
      description:
        "Process component drop with validation and element creation",
      beats: [
        {
          beat: 1,
          event: "canvas:drop:validation:start",
          title: "Drop Validation",
          description: "Validate drop position and component data",
          handler: "validateDrop",
          dynamics: "forte",
          timing: "immediate",
        },
        {
          beat: 2,
          event: "canvas:element:creation:start",
          title: "Element Creation",
          description: "Create new canvas element from dropped component",
          handler: "createElement",
          dynamics: "forte",
          timing: "synchronized",
        },
        {
          beat: 3,
          event: "canvas:element:positioning:start",
          title: "Element Positioning",
          description: "Position element on canvas with snap-to-grid",
          handler: "positionElement",
          dynamics: "mezzo-forte",
          timing: "synchronized",
        },
        {
          beat: 4,
          event: "canvas:element:notification:start",
          title: "Element Notification",
          description: "Notify React components of new canvas element",
          handler: "notifyElementAdded",
          dynamics: "mezzo-forte",
          timing: "delayed",
        },
      ],
    },
  ],
  events: {
    triggers: ["canvas:drop:request"],
    emits: [
      "canvas:drop:validation:start",
      "canvas:element:creation:start",
      "canvas:element:positioning:start",
      "canvas:element:notification:start",
      "canvas:element:added:complete",
    ],
  },
  configuration: {
    snapToGrid: true,
    gridSize: 10,
    minElementSize: { width: 50, height: 30 },
    maxElementSize: { width: 500, height: 400 },
    defaultElementSize: { width: 100, height: 50 },
    enableCollisionDetection: true,
    canvasMargin: 20,
  },
};

export const handlers = {
  "validate-drop": (data: any, context: any) => {
    const { dropPosition, canvasRect } = context;

    // Validate drop position is within canvas bounds
    if (
      dropPosition.x < 0 ||
      dropPosition.y < 0 ||
      dropPosition.x > canvasRect.width ||
      dropPosition.y > canvasRect.height
    ) {
      throw new Error("Drop position is outside canvas bounds");
    }

    console.log(
      `📍 Drop validated at position: ${dropPosition.x}, ${dropPosition.y}`
    );
    return { validated: true, position: dropPosition };
  },

  "create-element": (data: any, context: any) => {
    const { dropPosition, dragEvent } = context;

    // Get component data from drag event
    const componentData = JSON.parse(
      dragEvent.dataTransfer.getData("application/json")
    );

    const newElement = {
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: componentData.type,
      position: dropPosition,
      size: { width: 100, height: 50 }, // Default size
      properties: { ...componentData.properties },
    };

    console.log(`🎯 Created canvas element: ${newElement.id}`);
    return { element: newElement, created: true };
  },

  "emit-added": (data: any, context: any) => {
    const { element } = context.payload;

    // Update React components through callback mechanism
    if (context.onElementAdded) {
      context.onElementAdded(element);
    }

    console.log(`✨ Element added to canvas: ${element.id}`);
    return { emitted: true, elementId: element.id };
  },
};
```

## 🏗️ Architectural Principles

### ✅ Correct: Sequence-to-Sequence Communication

MusicalConductor uses **sequence orchestration** for all inter-component communication. Plugins should never directly emit events or access the EventBus.

```typescript
// ✅ CORRECT: Use conductor.play() to trigger other sequences
export const handlers = {
  "theme-apply": (data: any, context: any) => {
    // Apply theme changes
    document.documentElement.setAttribute("data-theme", context.targetTheme);

    // Trigger notification sequence through conductor.play()
    context.conductor.play(
      "AppShell",
      "theme-notify-symphony",
      {
        theme: context.targetTheme,
        source: "theme-apply",
      },
      "CHAINED"
    );

    return { applied: true };
  },
};
```

### ❌ Incorrect: Direct Event Emission

```typescript
// ❌ WRONG: Direct event emission bypasses orchestration
context.eventBus.emit("theme-changed", { theme });
context.conductor.emitEvent("theme-changed", { theme }); // This method doesn't exist
```

### 🔄 React State Updates

Use **callback patterns** to update React state from within sequences:

```typescript
// In React component
conductor.play("ElementLibrary", "load-components-symphony", {
  source: "components.json",
  onComponentsLoaded: setComponents, // Pass React state setter as callback
});

// In plugin handler
export const handlers = {
  "emit-loaded": (data: any, context: any) => {
    const { validComponents } = context.payload;

    // Update React state through callback
    if (context.onComponentsLoaded) {
      context.onComponentsLoaded(validComponents);
    }

    return { emitted: true };
  },
};
```

## 🎼 Usage Patterns

### Event-Driven Workflows

```typescript
// Subscribe to multiple related events
const conductor = ConductorService.getInstance().getConductor();

// Theme workflow
conductor.subscribe("theme-*", (event) => {
  console.log("Theme event:", event.type, event);
});

// Canvas workflow
conductor.subscribe("element-*", (event) => {
  console.log("Canvas event:", event.type, event);

  // Update UI state based on canvas changes
  if (event.type === "element-added") {
    updateCanvasState(event.element);
  }
});
```

### Chained Workflows

```typescript
// Execute multiple symphonies in sequence
const executeComplexWorkflow = async () => {
  // Load components first
  await conductor.play("ElementLibrary", "load-components-symphony", {
    source: "ui-components.json",
  });

  // Then apply theme
  conductor.play(
    "AppShell",
    "theme-symphony",
    {
      targetTheme: "dark",
    },
    "CHAINED"
  ); // Execute after previous completes
};
```

## 🚀 Getting Started

1. **Install MusicalConductor Package**

   ```bash
   # Install the MusicalConductor package
   npm install musical-conductor

   # Install React dependencies
   npm install react react-dom
   npm install -D @types/react @types/react-dom
   ```

2. **Create Plugin Directory Structure**

   ```bash
   mkdir -p src/plugins
   mkdir -p public/plugins
   ```

3. **Create Plugin Manifest**

   ```json
   // public/plugins/plugin-manifest.json
   {
     "plugins": [
       {
         "id": "AppShell",
         "name": "Application Shell Plugin",
         "version": "1.0.0",
         "file": "AppShell.theme-symphony.js",
         "sequences": ["theme-symphony"]
       }
     ]
   }
   ```

4. **Add Plugin Files**

   - Copy the plugin examples above into the `src/plugins/` directory
   - Each plugin should export `sequence` and `handlers`
   - Build plugins to `public/plugins/` for runtime loading

5. **Initialize in Your App**

   ```typescript
   import { MusicalConductor } from "musical-conductor";

   const conductor = MusicalConductor.getInstance();
   await conductor.registerCIAPlugins(); // Loads from plugin-manifest.json
   ```

6. **Start Building**
   - Use the component examples as starting points
   - Create custom plugins for your specific workflows
   - Use `conductor.subscribe()` for event listening
   - **Never import or use EventBus directly**

## 📚 Additional Resources

- [MusicalConductor API Reference](../README.md)
- [Plugin Development Guide](./plugin-development.md)
- [Event System Documentation](./events.md)

---

**Happy Orchestrating!** 🎼✨
