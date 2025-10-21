# ESLint Rule: sequences-in-json

## Overview

This ESLint rule enforces that sequence definitions are placed in JSON files instead of JavaScript/TypeScript files, in accordance with ADR-0014.

## Rule Details

According to ADR-0014, all sequences should be defined in JSON files organized per plugin, with TypeScript files only exporting handlers. This rule prevents the old pattern of exporting sequence objects from TypeScript files.

### What it detects

1. `export const sequence = { ... }` - Direct sequence exports
2. `export { sequence }` - Named sequence exports  
3. `export default { sequence: ... }` - Default exports containing sequences
4. Object literals with sequence-like structure (id, movements, beats) that are exported

### What it allows

- Handler exports: `export const handlers = { ... }`
- Non-sequence object exports
- Sequence-like objects that are not exported
- Files outside the `plugins/` directory
- Test files (`.spec.` or `.test.`)

## Examples

### ❌ Incorrect

```typescript
// plugins/my-plugin/my.symphony.ts
export const sequence = {
  id: "my-sequence",
  name: "My Sequence", 
  movements: [
    {
      id: "movement1",
      beats: [
        { beat: 1, event: "my:event", handler: "myHandler" }
      ]
    }
  ]
};
```

```typescript
// plugins/my-plugin/my.symphony.ts
const sequence = {
  id: "my-sequence",
  movements: [
    {
      id: "movement1", 
      beats: [
        { beat: 1, event: "my:event", handler: "myHandler" }
      ]
    }
  ]
};

export { sequence };
```

### ✅ Correct

```typescript
// plugins/my-plugin/my.symphony.ts
export const handlers = {
  myHandler(data: any, ctx: any) {
    // Handler implementation
    return { success: true };
  }
};
```

```json
// json-sequences/my-plugin/my-sequence.json
{
  "pluginId": "MyPlugin",
  "id": "my-sequence",
  "name": "My Sequence",
  "movements": [
    {
      "id": "movement1",
      "beats": [
        { "beat": 1, "event": "my:event", "handler": "myHandler" }
      ]
    }
  ]
}
```

## Migration Guide

1. Move sequence definitions from TypeScript files to JSON files in the `json-sequences/` directory
2. Update the plugin's `index.json` catalog to reference the new JSON sequence files
3. Keep only handler exports in TypeScript files
4. See ADR-0014 for complete migration instructions

## Configuration

This rule is automatically applied to:
- All `.ts`, `.tsx`, `.js`, `.jsx` files in the `plugins/` directory
- Excludes test files (containing `.spec.` or `.test.`)

The rule is configured as an error in the ESLint configuration:

```javascript
rules: {
  "sequences-json/sequences-in-json": "error"
}
```
