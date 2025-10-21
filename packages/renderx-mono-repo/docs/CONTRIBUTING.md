# Contributing to RenderX Mono-Repo

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/BPMSoftwareSolutions/package-builder.git
cd packages/renderx-mono-repo

# Install dependencies
pnpm install

# Verify setup
pnpm run lint
pnpm run typecheck
pnpm run test
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feat/your-feature-name
```

### 2. Make Changes

Edit files in the appropriate package:

```
packages/plugins/canvas/src/
packages/sdk/src/
packages/conductor/src/
```

### 3. Run Validation

```bash
# Lint
pnpm run lint

# Type check
pnpm run typecheck

# Test
pnpm run test

# Build
pnpm run build
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat(#123): add new feature"
```

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests
- `refactor:` Code refactoring
- `chore:` Build, dependencies

### 5. Push and Create PR

```bash
git push origin feat/your-feature-name
```

Create a pull request on GitHub.

## Adding a New Package

### 1. Create Package Directory

```bash
mkdir -p packages/new-package/src
```

### 2. Create package.json

```json
{
  "name": "@renderx/new-package",
  "version": "1.0.0",
  "description": "Description",
  "type": "module",
  "exports": {
    ".": "./dist/index.js",
    "./types": "./dist/types.d.ts"
  },
  "scripts": {
    "build": "tsc",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "vitest": "^3.0.0"
  }
}
```

### 3. Create tsconfig.json

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "references": [
    { "path": "../sdk" }
  ]
}
```

### 4. Create Source Files

```bash
mkdir -p packages/new-package/src
touch packages/new-package/src/index.ts
```

### 5. Update Root tsconfig.json

Add reference to `renderx-mono-repo/tsconfig.json`:

```json
{
  "references": [
    { "path": "packages/new-package" }
  ]
}
```

### 6. Update renderx-adf.json

Add context definition:

```json
{
  "contexts": [
    {
      "id": "new-package",
      "path": "packages/new-package",
      "scope": "new-scope",
      "team": "team-name"
    }
  ]
}
```

### 7. Update CODEOWNERS

```
/packages/new-package/ @BPMSoftwareSolutions/team-name
```

## Code Style

### TypeScript

- Use strict mode
- Avoid `any` types
- Use interfaces for public APIs
- Document public functions

### Naming Conventions

- Classes: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.ts`

### Imports

```typescript
// ✅ Good: Absolute imports
import { Plugin } from '@renderx/sdk';
import { Conductor } from '@renderx/conductor';

// ❌ Bad: Relative imports
import { Plugin } from '../../../sdk/src/plugin';
```

## Testing

### Unit Tests

```typescript
// packages/sdk/src/plugin.test.ts
import { describe, it, expect } from 'vitest';
import { Plugin } from './plugin';

describe('Plugin', () => {
  it('should initialize', () => {
    const plugin = new Plugin();
    expect(plugin).toBeDefined();
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test -- --coverage
```

### Coverage Requirements

- Minimum 80% coverage
- All public APIs must be tested
- Integration tests for cross-package interactions

## Documentation

### Code Comments

```typescript
/**
 * Loads a plugin from the manifest.
 * @param manifest - The plugin manifest
 * @returns The loaded plugin instance
 * @throws {Error} If the manifest is invalid
 */
export function loadPlugin(manifest: PluginManifest): Plugin {
  // Implementation
}
```

### README Files

Each package should have a README:

```markdown
# @renderx/package-name

Description of the package.

## Installation

```bash
pnpm add @renderx/package-name
```

## Usage

```typescript
import { Something } from '@renderx/package-name';
```

## API

### Something

Description...
```

## Boundary Rules

### Before Committing

Verify you haven't violated boundaries:

```bash
# Check for illegal imports
pnpm run lint

# Verify types
pnpm run typecheck

# Run tests
pnpm run test
```

### Common Violations

- ❌ Plugin importing shell internals
- ❌ Cross-plugin imports
- ❌ Deep imports (not through exports)
- ❌ Shell importing plugin implementations

See `BOUNDARIES.md` for details.

## Pull Request Process

1. **Create PR** with descriptive title
2. **Link Issue** - Reference the GitHub issue
3. **Run Checks** - Ensure all CI checks pass
4. **Request Review** - Ask team members to review
5. **Address Feedback** - Make requested changes
6. **Merge** - Squash and merge to main

### PR Template

```markdown
## Description

Brief description of changes.

## Related Issue

Fixes #123

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing

- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing done

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

## Questions?

- See `ARCHITECTURE.md` for architecture details
- See `BOUNDARIES.md` for boundary rules
- See `PACKAGES.md` for package descriptions
- Ask in GitHub discussions or issues

