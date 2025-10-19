# RenderX Plugins Demo - Architecture Definition File (ADF)

## Overview

This document describes the Architecture Definition File (ADF) for the **RenderX Plugins Demo** repository. The ADF provides a comprehensive, machine-readable specification of the system's architecture, components, dependencies, and relationships.

**Repository**: https://github.com/BPMSoftwareSolutions/renderx-plugins-demo  
**Organization**: BPMSoftwareSolutions  
**License**: Apache-2.0  
**Status**: Active

---

## Architecture Summary

The RenderX Plugins Demo is a **thin-client host application** that showcases a modern plugin architecture. It demonstrates:

- **Manifest-driven plugin loading** - Plugins are discovered and loaded via JSON manifests
- **Orchestration via MusicalConductor** - Plugins coordinate through a sophisticated orchestration engine
- **Layered architecture** - Code organized into core, domain, UI, infrastructure, and vendor layers
- **Artifact integrity** - Cryptographic verification of synthesized artifacts
- **External plugin mode** - Host can run without plugin source code present

---

## C4 Model - Container Level

### 1. **RenderX Host Application**
- **Type**: Web Application (React)
- **Technology**: React 19, TypeScript, Vite
- **Responsibilities**:
  - Plugin system initialization
  - Manifest-driven plugin loading
  - UI slot management
  - Orchestration coordination
- **Health Score**: 0.85 | Test Coverage: 0.78%

### 2. **Plugin System**
- **Type**: Library
- **Technology**: TypeScript, Node.js
- **Key Packages**:
  - `@renderx-plugins/host-sdk` (1.0.4-rc.0)
  - `@renderx-plugins/manifest-tools` (0.1.2)
- **Responsibilities**:
  - Plugin interface definitions
  - Manifest schema validation
  - Plugin lifecycle management
  - Component catalog discovery
- **Health Score**: 0.88 | Test Coverage: 0.82%

### 3. **MusicalConductor Orchestration Engine**
- **Type**: Library
- **Technology**: TypeScript, Node.js
- **Package**: `musical-conductor` (1.4.5)
- **Responsibilities**:
  - Plugin coordination
  - Workflow orchestration
  - Event management
  - State synchronization
- **Health Score**: 0.90 | Test Coverage: 0.85%

### 4. **Example Plugins**
- **Type**: Library (React Components)
- **Technology**: React, TypeScript
- **Key Packages**:
  - `@renderx-plugins/canvas` (0.1.0-rc.3)
  - `@renderx-plugins/control-panel` (0.1.0-rc.9)
  - `@renderx-plugins/header` (0.1.1)
  - `@renderx-plugins/library` (1.0.3)
- **Responsibilities**:
  - UI panel extensions
  - Component rendering
  - Orchestration flow examples
  - Testing sandbox
- **Health Score**: 0.82 | Test Coverage: 0.75%

### 5. **UI Layer**
- **Type**: UI Component Library
- **Technology**: React 19, TypeScript, CSS
- **Directories**:
  - `src/core` - Core utilities
  - `src/domain` - Business logic
  - `src/ui` - UI components
  - `src/infrastructure` - External integrations
  - `src/vendor` - Third-party code
- **Health Score**: 0.84 | Test Coverage: 0.80%

### 6. **Artifact System**
- **Type**: Build System
- **Technology**: Node.js, Crypto
- **Responsibilities**:
  - Manifest generation
  - Artifact bundling
  - Integrity verification
  - Signature management
- **Health Score**: 0.86 | Test Coverage: 0.79%

---

## Component Relationships

```
Host App
  ├─ depends_on → Plugin System (SDK & interfaces)
  ├─ depends_on → MusicalConductor (orchestration)
  ├─ loads → Example Plugins
  └─ uses → UI Layer

Example Plugins
  ├─ implements → Plugin System interfaces
  └─ uses → MusicalConductor

Artifact System
  └─ generates → Plugin manifests
```

---

## Key Features

| Feature | Status | Phase | Description |
|---------|--------|-------|-------------|
| Manifest-Driven Loading | Active | Production | JSON-based plugin discovery |
| Plugin Orchestration | Active | Production | MusicalConductor coordination |
| UI Slot System | Active | Production | Manifest-driven panel slots |
| Artifact Integrity | Active | Beta | SHA-256 verification |
| External Plugin Mode | Active | Beta | Thin host without source code |
| Diagnostics Panel | Active | Production | Plugin discovery UI |
| Host SDK | Active | Release Candidate | Public API for authors |

---

## Build & Testing

### Build System
- **Tool**: Vite
- **Scripts**:
  - `npm run dev` - Development server
  - `npm run build` - Production build
  - `npm run pre:manifests` - Generate manifests

### Testing
- **Unit Tests**: Vitest with v8 coverage
- **E2E Tests**: Cypress
- **Integration Tests**: Vitest

### Artifacts
- `interaction-manifest.json` - Interaction definitions
- `topics-manifest.json` - Topic catalog
- `layout-manifest.json` - UI layout configuration
- `plugin-manifest.json` - Plugin metadata
- `artifacts.integrity.json` - Cryptographic hashes

---

## Active Refactoring

### Diagnostics Module (Issue #297)
- **Current Phase**: 4 (Complete) ✅
- **Target Phase**: 6
- **Completed**:
  - Phase 1: Type system centralization
  - Phase 2: Business logic extraction
  - Phase 3: Custom hooks extraction
  - Phase 4: Component extraction
- **Pending**:
  - Phase 5: Tree explorer modularization
  - Phase 6: Testing & documentation

---

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `HOST_ARTIFACTS_DIR` | Pre-built artifacts directory | null |
| `RENDERX_DISABLE_STARTUP_VALIDATION` | Skip validation summary | 0 |
| `RENDERX_DISABLE_INTEGRITY` | Skip integrity verification | 0 |
| `RENDERX_VALIDATION_STRICT` | Escalate warnings to errors | 0 |

---

## Dependencies

### Runtime
- React 19.1.1
- TypeScript 5.9.2
- MusicalConductor 1.4.5
- Lucide React 0.544.0

### Development
- Vite 7.1.3
- Vitest 3.2.4
- Cypress 15.2.0
- ESLint 9.33.0

---

## Metrics

- **Overall Health Score**: 0.85
- **Average Test Coverage**: 0.80%
- **Build Status**: Success
- **Last Updated**: 2025-10-19

---

## Related Resources

- **MusicalConductor**: https://github.com/BPMSoftwareSolutions/MusicalConductor
- **RenderX Plugins**: https://github.com/BPMSoftwareSolutions/renderx-plugins
- **Host SDK Migration**: docs/host-sdk/USING_HOST_SDK.md
- **Refactoring Strategy**: docs/refactoring/diagnostics-modularity-strategy.md

---

## Usage

The ADF can be used for:

1. **Architecture Documentation** - Understand system structure and relationships
2. **Dependency Analysis** - Track package versions and compatibility
3. **CI/CD Integration** - Validate architecture against policies
4. **Team Onboarding** - Quick reference for new contributors
5. **Compliance & Auditing** - Track health scores and test coverage
6. **Artifact Management** - Manage plugin manifests and integrity

---

## File Location

- **ADF File**: `renderx-plugins-demo-adf.json`
- **Documentation**: `RENDERX_PLUGINS_DEMO_ADF_DOCUMENTATION.md`

Both files should be stored in the repository root or in a dedicated `docs/architecture/` directory.

