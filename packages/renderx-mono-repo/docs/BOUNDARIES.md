# Boundary Enforcement Rules

This document describes the architectural boundaries and how they are enforced.

## Dependency Matrix

| From | To | Allowed | Reason |
|------|----|---------|---------| 
| Plugin | Shell | ❌ | Plugins are independent of UI |
| Plugin | Conductor | ✅ | Plugins use conductor for orchestration |
| Plugin | SDK | ✅ | Plugins implement SDK interfaces |
| Plugin | Contracts | ✅ | Plugins use shared contracts |
| Plugin | Other Plugins | ❌ | No cross-plugin dependencies |
| Shell | Conductor | ✅ | Shell uses conductor for orchestration |
| Shell | SDK | ✅ | Shell uses SDK interfaces |
| Shell | Contracts | ✅ | Shell uses shared contracts |
| Shell | Plugins | ❌ | Shell only uses public interfaces |
| Conductor | Shell | ❌ | Conductor is UI-independent |
| Conductor | SDK | ✅ | Conductor uses SDK interfaces |
| Conductor | Contracts | ✅ | Conductor uses shared contracts |
| SDK | Everything | ❌ | SDK has no external dependencies |
| Contracts | Everything | ❌ | Contracts are pure types |

## Enforcement Mechanisms

### 1. ESLint Rules

Custom ESLint rules prevent illegal imports at development time:

```javascript
// In eslint.config.js
{
  files: ['packages/plugins/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['packages/shell/*'],
            message: 'Plugins cannot import shell internals'
          }
        ]
      }
    ]
  }
}
```

### 2. TypeScript Project References

Each package declares its dependencies:

```json
{
  "compilerOptions": {
    "composite": true
  },
  "references": [
    { "path": "../sdk" },
    { "path": "../conductor" }
  ]
}
```

TypeScript enforces these at compile time.

### 3. Public API Exports

Each package exposes only public APIs:

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./types": "./dist/types.d.ts"
  }
}
```

Deep imports are prevented by:
- ESLint rules
- TypeScript configuration
- Package.json exports field

### 4. CI/CD Validation

GitHub Actions validates boundaries:

```yaml
- name: Lint boundaries
  run: pnpm run lint

- name: Type check
  run: pnpm run typecheck

- name: Validate artifacts
  run: pnpm run artifacts:validate
```

## Violation Examples

### ❌ Illegal: Plugin importing shell internals

```typescript
// packages/plugins/canvas/src/index.ts
import { ShellInternal } from 'packages/shell/src/internal';
// ESLint Error: Plugins cannot import shell internals
```

### ❌ Illegal: Cross-plugin import

```typescript
// packages/plugins/canvas/src/index.ts
import { LibraryUtils } from '@renderx/plugins-library';
// ESLint Error: Cross-plugin imports are not allowed
```

### ❌ Illegal: Shell importing plugin implementation

```typescript
// packages/shell/src/index.ts
import { CanvasImpl } from '@renderx/plugins-canvas/src/impl';
// ESLint Error: Shell cannot import plugin implementations
```

### ❌ Illegal: Deep import

```typescript
// packages/shell/src/index.ts
import { Utils } from '@renderx/sdk/src/utils';
// TypeScript Error: Cannot import from non-exported path
```

## Allowed Patterns

### ✅ Plugin using SDK

```typescript
// packages/plugins/canvas/src/index.ts
import { Plugin } from '@renderx/sdk';

export class CanvasPlugin extends Plugin {
  // Implementation
}
```

### ✅ Plugin using Conductor

```typescript
// packages/plugins/canvas/src/index.ts
import { Conductor } from '@renderx/conductor';

export class CanvasPlugin {
  constructor(private conductor: Conductor) {}
}
```

### ✅ Plugin using Contracts

```typescript
// packages/plugins/canvas/src/index.ts
import { PluginInterface } from '@renderx/contracts';

export class CanvasPlugin implements PluginInterface {
  // Implementation
}
```

### ✅ Shell using public APIs

```typescript
// packages/shell/src/index.ts
import { PluginLoader } from '@renderx/sdk';
import { Conductor } from '@renderx/conductor';

export class Shell {
  constructor(
    private loader: PluginLoader,
    private conductor: Conductor
  ) {}
}
```

## Fixing Violations

### Step 1: Identify the violation

```bash
pnpm run lint
# Error: Plugins cannot import shell internals
```

### Step 2: Understand the dependency

Why does the plugin need this functionality?

### Step 3: Extract to shared contract

If multiple packages need it, create a contract:

```typescript
// packages/contracts/src/index.ts
export interface SharedFunctionality {
  doSomething(): void;
}
```

### Step 4: Implement in appropriate package

Implement the contract in the package that owns the functionality.

### Step 5: Use through public API

```typescript
// packages/plugins/canvas/src/index.ts
import { SharedFunctionality } from '@renderx/contracts';

export class CanvasPlugin {
  constructor(private shared: SharedFunctionality) {}
}
```

## Monitoring

### Build Metrics

Track boundary violations:

```json
{
  "metrics": {
    "contextBoundaryViolations": 0,
    "buildGraphIntegrity": "pass",
    "packageConsistency": "synced"
  }
}
```

### CI/CD Reports

Each build reports:
- Lint violations
- Type errors
- Boundary violations
- Test failures

## Gradual Enforcement

### Phase 1: Warning

Rules are warnings during development:

```javascript
'no-restricted-imports': ['warn', { patterns: [...] }]
```

### Phase 2: Error

Rules become errors in CI:

```javascript
'no-restricted-imports': ['error', { patterns: [...] }]
```

### Phase 3: Automated Fixing

Tools automatically fix violations:

```bash
pnpm run lint -- --fix
```

## Questions?

See `ARCHITECTURE.md` for more details on the mono-repo structure.

