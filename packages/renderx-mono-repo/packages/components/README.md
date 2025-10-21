# @renderx-plugins/components

JSON component definitions for RenderX-based hosts. This package publishes a catalog of components (as JSON) that thin hosts can serve and plugins can consume without coupling.

## What is this?

- A versioned set of JSON component files (button.json, image.json, etc.)
- An index.json listing all component files (contract used by hosts)
- A package.json `renderx.components` declaration so hosts can auto-discover the assets

## Install

```bash
npm install @renderx-plugins/components
```

## How hosts consume these components

1) Discovery and copy (dev/build):
   - Hosts scan `node_modules` for packages with `renderx.components`
   - Hosts copy the declared folders to `/public/json-components`
2) Runtime (browser):
   - Host fetches `/json-components/index.json`
   - Then fetches each file listed there

## Package contract

- `index.json` must enumerate all component files:
```json
{
  "version": "1.0.0",
  "components": ["button.json","input.json","image.json"]
}
```

- Each component JSON includes stable metadata (keep additive; breaking changes require a major bump):
```json
{
  "id": "button",
  "metadata": { "name": "Button" },
  "template": { "type": "html", "markup": "<button>Click</button>" }
}
```

- `package.json` must declare the component folders so hosts can discover them:
```json
{
  "name": "@renderx-plugins/components",
  "version": "0.1.0",
  "renderx": { "components": ["json-components"] }
}
```

## Repository layout

- `json-components/` — component files (one `<type>.json` per component)
- `json-components/index.json` — list of component files (single source of truth)
- `tests/` — unit tests and schema checks (Vitest recommended)

## Versioning policy

- Patch: fixes to existing component JSON (no schema/ID changes)
- Minor: add new components or additive fields
- Major: remove/rename components, change IDs, or breaking schema changes

## Validation & testing

- Include JSON Schema and tests to validate each component file
- Ensure `index.json` lists every component file and has no stale entries

## Publishing

### Prerequisites

1. **NPM Account**: Ensure you have an npm account and are logged in:
   ```bash
   npm login
   ```

2. **NPM Token**: For automated publishing, set up an NPM_TOKEN secret in GitHub repository settings.

3. **Permissions**: Ensure you have publish permissions for the `@renderx-plugins` scope.

### Manual Publishing

1. **Validate the package**:
   ```bash
   npm run validate
   ```

2. **Update version and publish**:
   ```bash
   # For patch releases (bug fixes)
   npm version patch

   # For minor releases (new components, additive changes)
   npm version minor

   # For major releases (breaking changes)
   npm version major
   ```

3. **Publish to npm**:
   ```bash
   npm publish --access public
   ```

### Automated Publishing (Recommended)

The repository includes GitHub Actions for automated publishing:

1. **Create a version tag**:
   ```bash
   npm version patch  # or minor/major
   git push origin main --tags
   ```

2. **GitHub Actions will automatically**:
   - Validate the package structure
   - Publish to npm with public access
   - Create a GitHub release

### Pre-publish Validation

The package includes automatic validation that runs before publishing:

- ✅ Validates all JSON files are properly formatted
- ✅ Ensures `index.json` lists all component files
- ✅ Checks for stale entries in the index
- ✅ Validates component structure (id, metadata, template fields)

### Publishing Checklist

Before publishing a new version:

- [ ] All component JSON files are valid
- [ ] `index.json` is updated with new components
- [ ] Version follows semantic versioning
- [ ] README is updated if needed
- [ ] All tests pass (if applicable)

## Contributing

### Adding New Components

1. **Create the component JSON file** in `json-components/`:
   ```json
   {
     "id": "my-component",
     "metadata": {
       "name": "My Component",
       "description": "Description of the component"
     },
     "template": {
       "type": "html",
       "markup": "<div>Component markup</div>"
     }
   }
   ```

2. **Update `json-components/index.json`** to include the new component:
   ```json
   {
     "components": [
       "existing-component.json",
       "my-component.json"
     ]
   }
   ```

3. **Validate your changes**:
   ```bash
   npm run validate
   ```

4. **Test locally** by installing the package in a test project.

### Component Guidelines

- **IDs must be unique** and follow kebab-case naming
- **Keep changes additive** when possible (avoid breaking changes)
- **Include meaningful metadata** (name, description, category if applicable)
- **Test your components** in a real RenderX host before publishing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-component`
3. Make your changes and validate: `npm run validate`
4. Commit your changes: `git commit -m "feat: add new component"`
5. Push to your fork: `git push origin feature/new-component`
6. Create a Pull Request

## Why a separate package?

- Decouples the thin host from component data
- Enforces clean boundaries and consistency across hosts
- Enables reuse and independent versioning of component catalogs

## License

Apache-2.0
