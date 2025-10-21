# ESLint rules for topic/handler consistency

This repository includes several custom ESLint rules to statically catch topic/handler and integration issues between the host and imported plugin packages.

New rules added for issue #142:

- handlers-path/valid-handlers-path (error)
  - Validates handlersPath in json-sequences/*/index.json entries
  - Disallows public/ paths; requires src/ modules to exist; otherwise the spec must be a resolvable package

- handler-exports/handler-export-exists (error)
  - For each sequence’s beats, verifies that every handler referenced exists (is exported) in the module pointed to by handlersPath

- json-import-attrs/consistent-json-import-attributes (warn)
  - Requires with { type: 'json' } on all JSON imports inside src/

Examples

- Bad (public path):
  import in json-sequences/*/index.json
  {
    "sequences": [
      { "file": "sequence.json", "handlersPath": "public/handlers" }
    ]
  }

- Bad (missing src module):
  {
    "sequences": [
      { "file": "sequence.json", "handlersPath": "src/missing/mod" }
    ]
  }

- Bad (missing handler export in module):
  beats reference a handler that is not exported from handlersPath.

- Bad (missing JSON attributes):
  import data from './something.json'; // should be: with { type: 'json' }

- Good:
  {
    "sequences": [
      { "file": "sequence.json", "handlersPath": "src/plugins/foo/handlers" }
    ]
  }
  // and all referenced handlers are exported in that module.
  // and JSON imports use: with { type: 'json' }

Configuration

The rules are enabled in eslint.config.js:

- "handlers-path/valid-handlers-path": "error"
- "handler-exports/handler-export-exists": "error"
- "json-import-attrs/consistent-json-import-attributes": "warn"

See __tests__/eslint-rules/*.spec.ts for comprehensive usage examples.

