# RenderX Mono-Repo

Unified development environment for all RenderX plugin packages with strict boundary enforcement and artifact generation.

## 🎯 Overview

This mono-repo consolidates 10 npm packages into a single workspace:

- **Conductor**: Orchestration engine (`@renderx/conductor`)
- **SDK**: Core plugin development SDK (`@renderx/sdk`)
- **Manifest Tools**: Manifest generation and validation (`@renderx/manifest-tools`)
- **Host SDK**: Host application SDK (`@renderx/host-sdk`)
- **Shell**: Host application (`@renderx/shell`)
- **Contracts**: Shared interfaces (`@renderx/contracts`)
- **Tooling**: Build tools and CLI (`@renderx/tooling`)
- **Plugins**: 7 plugin implementations
  - Canvas (`@renderx/plugins-canvas`)
  - Canvas Component (`@renderx/plugins-canvas-component`)
  - Components (`@renderx/plugins-components`)
  - Control Panel (`@renderx/plugins-control-panel`)
  - Header (`@renderx/plugins-header`)
  - Library (`@renderx/plugins-library`)
  - Library Component (`@renderx/plugins-library-component`)

## 🏗️ Architecture

```
packages/renderx-mono-repo/
├── packages/
│   ├── conductor/              # Orchestration engine
│   ├── sdk/                    # Core SDK
│   ├── manifest-tools/         # Manifest tools
│   ├── host-sdk/               # Host SDK
│   ├── shell/                  # Host application
│   ├── contracts/              # Shared interfaces
│   ├── tooling/                # Build tools
│   └── plugins/
│       ├── canvas/
│       ├── canvas-component/
│       ├── components/
│       ├── control-panel/
│       ├── header/
│       ├── library/
│       └── library-component/
├── pnpm-workspace.yaml         # Workspace configuration
├── tsconfig.json               # TypeScript configuration
├── eslint.config.js            # ESLint with boundary rules
├── turbo.json                  # Turbo build configuration
├── renderx-adf.json            # Architectural Definition File
└── CODEOWNERS                  # Team ownership
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
pnpm install
```

### Development

```bash
# Start development servers for all packages
pnpm run dev

# Run linting
pnpm run lint

# Run type checking
pnpm run typecheck

# Run tests
pnpm run test

# Watch mode for tests
pnpm run test:watch
```

### Building

```bash
# Build all packages
pnpm run build

# Generate artifacts
pnpm run artifacts:build:integrity

# Validate artifacts
pnpm run artifacts:validate
```

## 📚 Boundary Enforcement

This mono-repo enforces strict architectural boundaries using:

1. **ESLint Module Boundaries**: Prevents illegal imports between contexts
2. **TypeScript Project References**: Compile-time boundary enforcement
3. **No Deep Imports Policy**: Only public APIs via `"exports"`
4. **CODEOWNERS**: Team ownership per bounded context

### Dependency Rules

- **Plugins** cannot import shell internals
- **Plugins** cannot import other plugins
- **Shell** cannot import plugin implementations
- **Conductor** cannot depend on UI
- **SDK** has no external dependencies

## 🎨 Artifacts

The mono-repo generates and validates artifacts:

- `interaction-manifest.json` - All interactions across plugins
- `topics-manifest.json` - All topics for event publishing
- `layout-manifest.json` - All slots and layout definitions
- `plugin-manifest.json` - Plugin metadata and entry points
- `artifacts.integrity.json` - SHA-256 hashes for integrity verification

## 📊 Architectural Definition File (ADF)

The `renderx-adf.json` file drives structure and validation:

- Defines all contexts and their boundaries
- Specifies dependency rules
- Configures artifact generation
- Drives CI/CD validation

## 👥 Team Ownership

See `CODEOWNERS` for team assignments per bounded context.

## 🧪 Testing

Each package has isolated unit tests:

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test -- --coverage
```

## 📖 Documentation

- `ARCHITECTURE.md` - Mono-repo structure and philosophy
- `CONTRIBUTING.md` - How to add new packages
- `BOUNDARIES.md` - Dependency rules and enforcement
- `PACKAGES.md` - Overview of each package
- `ORCHESTRATION.md` - Guide to symphonies, movements, beats
- `ARTIFACTS.md` - Artifact generation and integrity

## 🔗 Related Resources

- **Reference Implementation**: [renderx-plugins-demo](https://github.com/BPMSoftwareSolutions/renderx-plugins-demo)
- **Parent Issue**: [#130 - Create Dashboard Pages for 10 Flow Problems](https://github.com/BPMSoftwareSolutions/package-builder/issues/130)
- **Related Issue**: [#134 - Create RenderX Mono-Repo Package Structure](https://github.com/BPMSoftwareSolutions/package-builder/issues/134)

## 📝 License

Apache-2.0

