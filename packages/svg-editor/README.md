# @bpm/svg-editor

Tiny SVG DOM manipulation helpers for UI

## Installation

```bash
npm install @bpm/svg-editor
```

## Usage

```typescript
import { setAttrs, translate } from '@bpm/svg-editor';

// Set multiple attributes at once
const rect = document.querySelector('#my-rect');
setAttrs(rect, { fill: 'red', width: 100, height: 50 });

// Or use a selector string
setAttrs('#my-rect', { stroke: 'blue', 'stroke-width': 2 });

// Apply translate transform
translate('#my-rect', 10, 20);
```

## API

### `setAttrs(target: SvgSelector, attrs: Record<string, string|number|boolean>): boolean`

Set multiple attributes on an SVG element.

- **target**: CSS selector string or SVG element
- **attrs**: Object with attribute key-value pairs
- **returns**: `true` if successful, `false` if element not found

### `translate(target: SvgSelector, x: number, y: number): boolean`

Apply a translate transform to an SVG element. Appends to existing transforms.

- **target**: CSS selector string or SVG element
- **x**: X offset
- **y**: Y offset
- **returns**: `true` if successful, `false` if element not found

### `SvgSelector`

Type alias for `string | SVGGraphicsElement`

## Keywords

svg, dom, ui

## License

MIT
