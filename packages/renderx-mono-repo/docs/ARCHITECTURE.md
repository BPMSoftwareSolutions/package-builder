# RenderX Mono-Repo Architecture

## Overview

The RenderX Mono-Repo consolidates all plugin packages into a unified workspace with strict boundary enforcement. This document describes the architecture, design principles, and implementation patterns.

## Design Principles

### 1. Bounded Contexts

Each package represents a bounded context with clear responsibilities:

- **Conductor**: Orchestration and plugin coordination
- **SDK**: Core plugin development interfaces
- **Shell**: Host application UI
- **Plugins**: Feature implementations
- **Contracts**: Shared interfaces and types

### 2. Dependency Constraints

Strict rules prevent architectural violations:

```
Plugins → Conductor ✅
Plugins → SDK ✅
Plugins → Contracts ✅
Plugins → Shell ❌
Plugins → Other Plugins ❌

Shell → Conductor ✅
Shell → SDK ✅
Shell → Contracts ✅
Shell → Plugins ❌

Conductor → Shell ❌
Conductor → Plugins ❌

SDK → Everything ❌
```

### 3. No Deep Imports

Each package exposes only public APIs:

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./types": "./dist/types.d.ts"
  }
}
```

## Package Structure

### Core Packages

#### Conductor (`packages/conductor`)
- Orchestration engine for plugin coordination
- Manages plugin lifecycle
- Handles event publishing and subscription
- No UI dependencies

#### SDK (`packages/sdk`)
- Core interfaces for plugin development
- Plugin base classes
- Manifest types
- No external dependencies

#### Host SDK (`packages/host-sdk`)
- Host application interfaces
- Plugin loading mechanisms
- Artifact management
- No UI dependencies

#### Manifest Tools (`packages/manifest-tools`)
- Manifest generation
- Validation utilities
- Integrity verification
- No UI dependencies

### Application Packages

#### Shell (`packages/shell`)
- Host application UI
- Plugin rendering
- User interactions
- Can depend on SDK, Conductor, Contracts

#### Contracts (`packages/contracts`)
- Shared interfaces
- Type definitions
- No implementations

#### Tooling (`packages/tooling`)
- Build utilities
- CLI tools
- Scripts
- No UI dependencies

### Plugin Packages

#### Canvas (`packages/plugins/canvas`)
- Canvas rendering plugin
- Drawing capabilities
- Depends on SDK, Conductor, Contracts

#### Components (`packages/plugins/components`)
- UI component library plugin
- Component definitions
- Depends on SDK, Conductor, Contracts

#### Control Panel (`packages/plugins/control-panel`)
- Configuration UI plugin
- Settings management
- Depends on SDK, Conductor, Contracts

#### Header (`packages/plugins/header`)
- Header UI plugin
- Navigation
- Depends on SDK, Conductor, Contracts

#### Library (`packages/plugins/library`)
- Asset library plugin
- Resource management
- Depends on SDK, Conductor, Contracts

## Boundary Enforcement

### ESLint Rules

Custom ESLint rules prevent illegal imports:

```javascript
// ❌ Illegal: Plugin importing shell internals
import { ShellInternal } from 'packages/shell/src/internal';

// ✅ Legal: Plugin using public API
import { ShellAPI } from '@renderx/shell';

// ❌ Illegal: Cross-plugin import
import { CanvasUtils } from '@renderx/plugins-canvas';

// ✅ Legal: Using shared contracts
import { PluginInterface } from '@renderx/contracts';
```

### TypeScript Project References

Each package has a `tsconfig.json` with:

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

This enables:
- Incremental builds
- Compile-time boundary checking
- Fast type checking

## Build System

### Turbo

Turbo orchestrates builds across packages:

```bash
# Build only affected packages
turbo run build --filter=[HEAD^]

# Run tests in parallel
turbo run test --parallel

# Generate artifacts
turbo run artifacts:build:integrity
```

### Workspace Configuration

`pnpm-workspace.yaml` defines the workspace:

```yaml
packages:
  - 'packages/*'
```

## Artifact Generation

### Manifests

Generated during build:

- `interaction-manifest.json` - Plugin interactions
- `topics-manifest.json` - Event topics
- `layout-manifest.json` - UI layout
- `plugin-manifest.json` - Plugin metadata

### Integrity Verification

`artifacts.integrity.json` contains SHA-256 hashes for all artifacts.

## CI/CD Integration

### Validation Steps

1. **Lint**: ESLint boundary rules
2. **Type Check**: TypeScript compilation
3. **Test**: Unit and integration tests
4. **Artifacts**: Generate and validate
5. **Build**: Production build

### Failure Conditions

- Boundary rule violations
- Type errors
- Test failures
- Artifact validation failures
- Deep imports detected

## Team Ownership

See `CODEOWNERS` for team assignments per context.

## Migration Path

Packages are migrated from external repositories:

1. Clone source repository
2. Copy source files to `packages/*/src`
3. Update imports to use workspace packages
4. Run tests and validation
5. Enable boundary rules

## Future Enhancements

- Automated dependency graph visualization
- Boundary rule auto-fixing
- Performance monitoring
- Artifact caching
- Distributed builds

