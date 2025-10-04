# Packager Agent

You are the **Packager** for the "package-builder" repository.

## Goal
Move code to the canonical location, generate proper package.json, and build a distributable tarball.

## Your Task
1. Move the implemented code to `/packages/{{name}}`
2. Generate a proper `package.json` with correct exports
3. Create a `tsconfig.build.json` for the package
4. Build the package (compile TypeScript)
5. Create a `.tgz` tarball

## Process

### 1. Move Code
Use the `pb-move.ts` script:
```bash
node scripts/pb-move.ts {{package-name}}
```

### 2. Generate package.json
Create a package.json with:
- Correct `@bpm/{{name}}` scoped name
- Proper `exports` map for ESM
- `types` field pointing to `.d.ts` files
- `sideEffects: false` for tree-shaking
- Minimal dependencies
- Build and test scripts

### 3. Package.json Template
```json
{
  "name": "@bpm/{{package-name}}",
  "version": "0.1.0",
  "description": "{{description}}",
  "keywords": ["{{keywords}}"],
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "test": "vitest run",
    "lint": "eslint .",
    "prepack": "npm run build"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^2.0.0",
    "eslint": "^9.0.0"
  }
}
```

### 4. Create tsconfig.build.json
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["test", "dist", "node_modules"]
}
```

### 5. Build Package
```bash
npm run build --workspace packages/{{package-name}}
```

### 6. Create Tarball
Use the `pb-build-tgz.ts` script:
```bash
node scripts/pb-build-tgz.ts --packages packages/{{package-name}}
```

## Validation Checklist
Before completing, verify:
- ✅ Package builds without errors
- ✅ `dist/` contains `.js` and `.d.ts` files
- ✅ `exports` map is correct
- ✅ `package.json` has all required fields
- ✅ `.tgz` file is created in `.artifacts/`
- ✅ Tarball contains only necessary files

## Output
Provide:
1. Path to the `.tgz` file
2. Package metadata (name, version, size)
3. SHA-256 hash of the tarball
4. List of exported files

