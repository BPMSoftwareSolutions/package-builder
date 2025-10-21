# Data-Driven Lifecycle Topics

## Overview

The topics manifest generation is now fully data-driven, allowing plugins to declare their own lifecycle and notification topics instead of relying on host-side pattern matching.

## Migration from Hard-Coded to Data-Driven

### Before (Host-Driven)
```javascript
// Host made assumptions about what topics plugins need
if (baseTopic.includes('create')) {
  // Generate canvas.component.created
}
if (baseTopic.includes('drag')) {
  // Generate canvas.component.drag.end  
}
```

### After (Plugin-Driven)
```json
{
  "pluginId": "CanvasComponentPlugin",
  "id": "canvas-component-create-symphony", 
  "lifecycleTopics": [
    {
      "name": "canvas.component.created",
      "notes": "Fired when component creation completes",
      "type": "notify-only"
    }
  ]
}
```

## Sequence Schema Extensions

### `lifecycleTopics` (Array)
Declares topics that are part of the sequence's lifecycle:

```json
"lifecycleTopics": [
  {
    "name": "canvas.component.drag.started",
    "notes": "Drag operation begins", 
    "type": "notify-only",
    "routed": false
  },
  {
    "name": "canvas.component.drag.completed",
    "notes": "Drag operation completes successfully",
    "type": "notify-only" 
  }
]
```

### `notificationTopics` (Array)
Declares general notification topics (always notify-only):

```json
"notificationTopics": [
  {
    "name": "canvas.component.selection.changed",
    "notes": "Component selection state changed"
  },
  {
    "name": "canvas.component.inventory.updated", 
    "notes": "Component inventory was modified"
  }
]
```

## Topic Types

- **`notify-only`**: Empty routes array, allows EventRouter publishing without triggering sequences
- **`routed`**: Has routes pointing to sequences, triggers sequence execution when published to

## Backward Compatibility

The system maintains backward compatibility by applying conventional patterns when topics are not explicitly declared:

1. **`.requested` sequences** → Auto-generate `.started`, `.completed`, `.failed` lifecycle topics
2. **`create` sequences** → Auto-generate `.created` notification topic  
3. **`drag` sequences** → Auto-generate `.end` lifecycle topic
4. **`select` sequences** → Auto-generate `.selection.changed` notification topic

## Migration Strategy

1. **Phase 1**: Existing sequences continue working with conventional patterns
2. **Phase 2**: Plugin authors add explicit `lifecycleTopics` and `notificationTopics` declarations
3. **Phase 3**: Conventional patterns are deprecated and eventually removed

## Benefits

✅ **Plugin Autonomy**: Plugins declare their own topic requirements  
✅ **Reduced Coupling**: Host doesn't need intimate knowledge of plugin patterns  
✅ **Flexibility**: Plugins can define custom lifecycle patterns  
✅ **Self-Documenting**: Topic declarations serve as API documentation  
✅ **Validation**: Explicit declarations enable better validation and tooling  

## Example: Canvas Component Create Sequence

```json
{
  "pluginId": "CanvasComponentPlugin",
  "id": "canvas-component-create-symphony",
  "name": "Canvas Component Create",
  "movements": [...],
  "lifecycleTopics": [
    {
      "name": "canvas.component.create.started",
      "notes": "Creation process begins"
    },
    {
      "name": "canvas.component.create.completed", 
      "notes": "Creation completed successfully"
    },
    {
      "name": "canvas.component.create.failed",
      "notes": "Creation failed with error"
    }
  ],
  "notificationTopics": [
    {
      "name": "canvas.component.created",
      "notes": "New component was created and added to canvas"
    },
    {
      "name": "canvas.component.inventory.updated",
      "notes": "Component inventory state changed"
    }
  ]
}
```

This approach ensures the **thin host principle** while giving plugins complete control over their topic surface area.