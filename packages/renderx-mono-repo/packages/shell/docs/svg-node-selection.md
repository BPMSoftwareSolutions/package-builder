# SVG Sub-node Selection and Customization

This document describes the SVG sub-node selection and customization feature that allows users to click on individual SVG elements within an SVG component to select and customize their attributes.

## Overview

The feature enables:
1. **Click-to-select**: Clicking on any child element within an SVG component selects that specific sub-node
2. **Visual feedback**: Selected sub-nodes are highlighted with an overlay positioned precisely over the clicked shape
3. **Attribute customization**: A Control Panel inspector allows editing common SVG attributes like color, size, and position
4. **Live updates**: Changes are applied immediately to the DOM and reflected in the canvas

## Architecture

### Path Model

The system uses a **slash-separated, element-only child index path** to identify SVG sub-nodes:
- Format: `"0/1/2"` represents the path from SVG root to target element
- Only element children are counted (text nodes, comments ignored)
- Example: `"0/1/0"` means first child of second child of first child

### Topics and Events

#### New Topics

- **`canvas.component.update.svg-node.requested`**
  - Payload: `{ id: string, path: string, attribute: string, value: any }`
  - Routes to: `CanvasComponentSvgNodeUpdatePlugin/canvas-component-update-svg-node-symphony`
  - Purpose: Update a specific attribute on an SVG sub-node

#### Existing Topics (Enhanced)

- **`canvas.component.select.svg-node.requested`** - Now also triggered by canvas clicks
- **`canvas.component.select.svg-node.changed`** - Syncs Control Panel with canvas selection

### Components

#### Canvas Components

1. **`attachSvgNodeClick()`** in `create.interactions.stage-crew.ts`
   - Attaches click event listeners to SVG elements during creation
   - Derives element path from clicked target to SVG root
   - Publishes selection requests with computed path

2. **`updateSvgNodeAttribute()`** in `update.svg-node.stage-crew.ts`
   - Safely updates SVG sub-node attributes with whitelist validation
   - Traverses DOM using path to locate target element
   - Applies attribute changes and triggers Control Panel refresh

#### Control Panel Components

1. **`SvgNodeInspector`** field renderer
   - Adaptive UI based on selected node type (rect, circle, generic)
   - Reads current attributes from DOM element
   - Publishes update requests on user changes

## Supported Elements and Attributes

### Rect Elements
- **Position**: `x`, `y`
- **Size**: `width`, `height`
- **Styling**: `fill`, `stroke`, `stroke-width`, `opacity`

### Circle Elements
- **Position**: `cx`, `cy`
- **Size**: `r`
- **Styling**: `fill`, `stroke`, `stroke-width`, `opacity`

### Generic Elements
- **Styling**: `fill`, `stroke`, `stroke-width`, `opacity`

### Security

All attribute updates are validated against a whitelist to prevent:
- XSS attacks through script injection
- Unsafe DOM manipulation
- Unintended side effects

Allowed attributes include common SVG styling and positioning attributes only.

## Usage

### For Users

1. **Select a sub-node**: Click on any shape within an SVG component
2. **View selection**: The clicked element is highlighted with an overlay
3. **Customize attributes**: Use the SVG Node Inspector in the Control Panel
4. **See live updates**: Changes are applied immediately to the canvas

### For Developers

#### Adding New Supported Attributes

1. Add the attribute to `ALLOWED_SVG_ATTRIBUTES` in `update.svg-node.stage-crew.ts`
2. Update the `SvgNodeInspector` component to include UI for the new attribute
3. Add appropriate validation and type handling

#### Extending to New Element Types

1. Add precise overlay positioning logic in `showSvgNodeOverlay()` for the new element type
2. Update `getAttributesForNodeType()` in `SvgNodeInspector` to include element-specific attributes
3. Add tests for the new element type

## Implementation Details

### Click Event Flow

1. User clicks on SVG sub-element
2. `attachSvgNodeClick` handler captures the event
3. Path is derived from target element to SVG root
4. `canvas.component.select.svg-node.requested` is published
5. `showSvgNodeOverlay` positions overlay over the selected element
6. `canvas.component.select.svg-node.changed` notifies Control Panel
7. `SvgNodeInspector` updates to show element-specific attributes

### Update Event Flow

1. User changes attribute in Control Panel
2. `SvgNodeInspector` publishes `canvas.component.update.svg-node.requested`
3. `updateSvgNodeAttribute` validates and applies the change
4. `refreshControlPanel` triggers Control Panel refresh
5. Changes are reflected in both canvas and Control Panel

### Path Derivation Algorithm

```typescript
function derivePath(rootSvg: Element, targetEl: Element): string {
  const path: number[] = [];
  let current = targetEl;
  
  while (current && current !== rootSvg) {
    const parent = current.parentElement;
    if (!parent) break;
    
    const elementChildren = Array.from(parent.children);
    const index = elementChildren.indexOf(current);
    
    if (index >= 0) {
      path.unshift(index);
    }
    
    current = parent;
  }
  
  return path.join("/");
}
```

## Testing

The feature includes comprehensive unit tests covering:
- Click-to-select functionality and path derivation
- Attribute update validation and security
- Control Panel integration
- Error handling for invalid paths and attributes

Tests are located in:
- `__tests__/canvas-component/svg-node-click-select.spec.ts`
- `__tests__/canvas-component/svg-node-update.spec.ts`

## Future Enhancements

Potential improvements for future versions:
- Direct manipulation (drag/resize) of sub-nodes
- Support for more SVG element types (path, polygon, etc.)
- Undo/redo functionality for sub-node changes
- Keyboard shortcuts for sub-node selection
- Copy/paste attributes between sub-nodes
