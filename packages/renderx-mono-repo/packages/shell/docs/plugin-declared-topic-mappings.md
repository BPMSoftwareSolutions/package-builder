# Plugin-Declared Topic and Interaction Mappings

## Overview

The derive-external-topics.js system now supports fully data-driven topic and interaction generation. Plugins can declare their own transformation rules, eliminating hard-coded knowledge in the host system.

## Plugin Configuration Options

### 1. Explicit Topic Mapping

Plugins can declare exact topic names directly:

```json
{
  "pluginId": "HeaderPlugin",
  "sequenceId": "header-ui-theme-toggle-symphony",
  "topicMapping": {
    "canonical": "app.ui.theme.toggle.requested",
    "routeToBase": false
  },
  "movements": [...]
}
```

### 2. Interaction Route Mapping

Plugins can declare specific interaction routes:

```json
{
  "pluginId": "LibraryComponentPlugin", 
  "sequenceId": "library-component-container-drop-symphony",
  "interactionMapping": {
    "route": "library.container.drop"
  },
  "movements": [...]
}
```

### 3. Transformation Rules

Plugins can declare pattern-based transformations:

```json
{
  "pluginId": "CanvasComponentPlugin",
  "sequenceId": "canvas-component-drag-symphony",
  "topicTransform": {
    "patterns": [
      {
        "from": "\\.drag$",
        "to": ".drag.start",
        "flags": "g"
      }
    ],
    "routeToBase": "\\.(resize|drag)\\.move$"
  },
  "interactionTransform": {
    "patterns": [
      {
        "from": "\\.drag$", 
        "to": ".drag.move",
        "flags": "g"
      }
    ]
  },
  "movements": [...]
}
```

### 4. Beat Event Transformations

Plugins can normalize beat event naming:

```json
{
  "pluginId": "CanvasComponentPlugin",
  "beatEventTransforms": [
    {
      "pattern": "svg-node",
      "replacement": "svg.node",
      "flags": "g"
    }
  ],
  "movements": [...]
}
```

### 5. Backward Compatibility Aliases

Plugins can declare legacy aliases:

```json
{
  "pluginId": "CanvasComponentPlugin", 
  "topicAliases": [
    {
      "canonical": "canvas.component.select.svg.node.requested",
      "alias": "canvas.component.select.svg-node.requested"
    }
  ],
  "movements": [...]
}
```

## Complete Example: Canvas Component Plugin

Here's how the canvas component plugin could declare all its mappings:

```json
{
  "pluginId": "CanvasComponentPlugin",
  "sequenceId": "canvas-component-select-svg-node-symphony",
  "topicMapping": {
    "canonical": "canvas.component.select.svg.node.requested"
  },
  "interactionMapping": {
    "route": "canvas.component.select.svg.node"
  },
  "topicAliases": [
    {
      "canonical": "canvas.component.select.svg.node.requested",
      "alias": "canvas.component.select.svg-node.requested"
    }
  ],
  "beatEventTransforms": [
    {
      "pattern": "svg-node",
      "replacement": "svg.node"
    }
  ],
  "movements": [
    {
      "id": "select-svg-node",
      "beats": [
        {
          "event": "canvas:component:select:svg-node",
          "handler": "showSvgNodeOverlay"
        }
      ]
    }
  ]
}
```

## Benefits

### 🎯 **Plugin Autonomy**
- Plugins control their own topic naming and routing
- No central knowledge required in host system
- Plugins can evolve independently

### 🔄 **Backward Compatibility** 
- Explicit alias declarations preserve existing integrations
- Gradual migration path for legacy topic names
- Clear documentation of compatibility requirements

### 🛡️ **Type Safety**
- Explicit mappings eliminate naming convention guesswork
- Clear contracts between plugins and host
- Reduced chance of topic mismatches

### 📈 **Scalability**
- New plugins auto-discovered without host changes
- Complex transformation rules supported
- Plugin-specific business logic encapsulated

## Migration Strategy

### Phase 1: Fallback Support (Current)
- Data-driven system checks for plugin declarations first
- Falls back to default transformations if no declarations found
- Legacy svg-node aliases auto-generated temporarily

### Phase 2: Plugin Declaration (Recommended)
- Update external plugin packages with explicit mappings
- Remove hard-coded fallbacks gradually
- Add validation for required declarations

### Phase 3: Full Data-Driven (Future)
- All plugins require explicit topic declarations
- Host system becomes pure discovery/aggregation
- Zero hard-coded plugin knowledge

## Validation

The system validates that:
- Declared topic names are valid and unique
- Interaction routes don't conflict
- Alias targets exist
- Transform patterns are valid regex

## Error Handling

When plugin declarations are invalid:
- Warning logged with plugin and sequence details
- Falls back to default transformation
- Continues processing other plugins
- Reports configuration issues clearly