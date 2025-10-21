# ESLint Rule: validate-external-plugin-consistency

## Overview

This ESLint rule validates plugin ID consistency between manifests and sequence files in external `@renderx-plugins/*` packages. It prevents runtime failures caused by plugin ID mismatches that can occur when sequence files reference incorrect plugin IDs.

## Background

External packages in the `@renderx-plugins/*` namespace may contain plugin manifests and sequence files. The manifest defines the available plugins with their IDs, while sequence files reference these plugins via `pluginId` fields. Mismatches between these can cause runtime failures that are difficult to detect during development.

## Rule Details

The rule performs the following validation:

1. **Package Discovery**: Scans `node_modules/@renderx-plugins/*` for packages
2. **Manifest Parsing**: Extracts plugin IDs from `package.json` under the `renderx.plugins[].id` path
3. **Sequence Validation**: Checks all JSON files in `json-sequences/` directories
4. **Consistency Check**: Ensures sequence `pluginId` fields match manifest plugin IDs

### What it detects

- Plugin ID mismatches between manifest and sequence files
- Missing or invalid package manifests
- Malformed sequence files
- References to non-existent plugin IDs

### What it allows

- Consistent plugin ID usage
- Valid package structures
- Well-formed sequence files

## Configuration

The rule accepts the following configuration options:

```json
{
  "rules": {
    "validate-external-plugin-consistency/validate-external-plugin-consistency": [
      "error",
      {
        "packagePattern": "@renderx-plugins/*",
        "sequenceDirs": ["json-sequences"],
        "manifestPath": "package.json",
        "manifestKey": "renderx.plugins"
      }
    ]
  }
}
```

### Configuration Options

- `packagePattern` (string): Glob pattern to match external packages. Default: `"@renderx-plugins/*"`
- `sequenceDirs` (array): Directory names to search for sequence files. Default: `["json-sequences"]`
- `manifestPath` (string): Path to the manifest file within each package. Default: `"package.json"`
- `manifestKey` (string): Dot-notation path to the plugins array in the manifest. Default: `"renderx.plugins"`

## Examples

### ✅ Correct Package Structure

**package.json:**
```json
{
  "name": "@renderx-plugins/library",
  "renderx": {
    "plugins": [
      { "id": "LibraryPlugin" }
    ]
  }
}
```

**json-sequences/library/drop.json:**
```json
{
  "pluginId": "LibraryPlugin",
  "id": "library-drop-sequence",
  "movements": [...]
}
```

### ❌ Incorrect - Plugin ID Mismatch

**package.json:**
```json
{
  "name": "@renderx-plugins/library",
  "renderx": {
    "plugins": [
      { "id": "LibraryPlugin" }
    ]
  }
}
```

**json-sequences/library/drop.json:**
```json
{
  "pluginId": "LibraryComponentPlugin",  // ❌ Wrong plugin ID
  "id": "library-drop-sequence",
  "movements": [...]
}
```

**Error Output:**
```
ESLint: validate-external-plugin-consistency

❌ Plugin ID mismatch in @renderx-plugins/library@0.1.0-rc.3:

   Manifest defines: "LibraryPlugin"
   But sequence files reference: "LibraryComponentPlugin"

   Affected files:
   - json-sequences/library/drop.json:2

   Fix: Update sequence files to use "LibraryPlugin"
```

### ❌ Incorrect - Missing Manifest

**Missing or invalid package.json:**
```json
{
  "name": "@renderx-plugins/library"
  // Missing renderx.plugins section
}
```

**Error Output:**
```
ESLint: validate-external-plugin-consistency

❌ Missing or invalid manifest in @renderx-plugins/library:
   package.json not found or missing renderx.plugins
```

## Error Messages

- `pluginIdMismatch`: Plugin ID mismatch between manifest and sequence files
- `missingManifest`: Missing or invalid package manifest
- `sequenceFileError`: Error reading or parsing sequence file

## When the Rule Runs

This rule runs once per ESLint execution (not per file) and scans all external packages in `node_modules`. It only reports errors and does not provide auto-fixes, as the fixes require manual updates to either the manifest or sequence files.

## Integration

The rule is automatically integrated into the project's ESLint configuration and will run during:

- Local development (`npm run lint`)
- CI/CD pipelines
- Pre-commit hooks
- IDE linting

## Troubleshooting

### Rule Not Running

If the rule doesn't seem to be executing:

1. Ensure `node_modules` exists and contains `@renderx-plugins/*` packages
2. Check that the packages have valid `package.json` files
3. Verify the ESLint configuration includes the rule

### False Positives

If you encounter false positives:

1. Check that `renderx.plugins` in `package.json` contains the correct plugin IDs
2. Ensure sequence files use the exact plugin IDs from the manifest
3. Verify that sequence files are valid JSON

### Performance Issues

The rule scans the file system and may be slow with many packages. In CI environments, consider:

1. Caching `node_modules` between runs
2. Running the rule only on dependency changes
3. Using the rule's configuration to limit the scan scope

## Related Rules

- `no-cross-plugin-imports`: Prevents invalid imports between plugins
- `validate-plugin-registration`: Ensures plugins are properly registered
- `require-plugin-manifest-fragment`: Validates plugin manifest structure