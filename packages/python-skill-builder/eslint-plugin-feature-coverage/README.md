# eslint-plugin-feature-coverage

ESLint plugin to ensure all features in `features.json` have corresponding tests.

## Overview

This plugin validates that JavaScript test files cover all frontend features defined in `features.json`. It's part of the test coverage enforcement strategy for the Python Skill Builder application.

## Installation

This is a local plugin, so no installation is needed. It's automatically loaded by ESLint when configured in `.eslintrc.js`.

## Usage

Add the plugin to your `.eslintrc.js`:

```javascript
module.exports = {
  plugins: ['feature-coverage'],
  rules: {
    'feature-coverage/require-feature-tests': 'error'
  }
};
```

## Rule: `require-feature-tests`

Ensures all features in `features.json` have corresponding tests.

### How It Works

1. Loads `features.json` from the project root
2. Extracts test function names from JavaScript test files
3. Validates that each frontend feature has at least one corresponding test
4. Reports missing tests as ESLint errors

### Supported Test Patterns

The plugin recognizes these test naming patterns:

- `test_feature_name()` - Function declarations
- `test('feature name', ...)` - Jest/Mocha test calls
- `it('feature name', ...)` - Jest/Mocha it calls
- `describe('feature name', ...)` - Test suites

### Feature Matching

The plugin checks for tests matching these patterns:

**For Views:**
- `test_<feature_name>`
- `test_view_<feature_name>`
- `test_frontend_<feature_name>`

**For Progress Tracking:**
- `test_<feature_name>`
- `test_progress_<feature_name>`
- `test_tracking_<feature_name>`

**For Navigation:**
- `test_<feature_name>`
- `test_navigation_<feature_name>`
- `test_nav_<feature_name>`

### Configuration Options

```javascript
{
  'feature-coverage/require-feature-tests': ['error', {
    featuresPath: './features.json',  // Optional: custom path to features.json
    ignorePatterns: ['deprecated_*']  // Optional: feature patterns to ignore
  }]
}
```

### Example

Given this feature in `features.json`:

```json
{
  "features": {
    "frontend": {
      "views": {
        "features": [
          {
            "name": "Approach Selector",
            "testCases": [
              "Shows selector for multi-approach workshops",
              "Hides selector for single-approach workshops"
            ]
          }
        ]
      }
    }
  }
}
```

The plugin expects to find a test like:

```javascript
// ✅ Valid - matches pattern
test('approach selector shows for multi-approach workshops', () => {
  // test implementation
});

// ✅ Valid - matches pattern
function test_approach_selector() {
  // test implementation
}

// ❌ Invalid - no test found
// ESLint will report: Feature "Frontend View: Approach Selector" has no corresponding test
```

## Error Messages

### `missingTest`

```
Feature "Frontend View: Approach Selector" in features.json has no corresponding test. Expected test: test_approach_selector
```

**Fix:** Add a test function that matches the expected pattern.

### `noFeaturesFile`

```
Could not find features.json file
```

**Fix:** Ensure `features.json` exists in the project root or configure `featuresPath` option.

### `testFileSummary`

```
5 frontend features are missing tests. Run validate_coverage.py for details.
```

**Fix:** Run `python tests/validate_coverage.py` to see detailed list of missing tests.

## Integration with validate_coverage.py

This ESLint plugin complements the Python `validate_coverage.py` script:

- **ESLint plugin**: Validates JavaScript/frontend test coverage (runs during development/linting)
- **validate_coverage.py**: Validates Python/backend test coverage (runs in pre-commit hooks and CI/CD)

Together, they ensure comprehensive test coverage across the entire application.

## Enforcement Levels

### Level 1: Local Development (Warning)
```javascript
{
  'feature-coverage/require-feature-tests': 'warn'
}
```
Shows warnings but doesn't block commits.

### Level 2: CI/CD (Error)
```javascript
{
  'feature-coverage/require-feature-tests': 'error'
}
```
Blocks commits and PRs if tests are missing.

## Troubleshooting

### Plugin not loading

Ensure the plugin path is correct in `.eslintrc.js`:

```javascript
module.exports = {
  plugins: ['./eslint-plugin-feature-coverage'],
  // ...
};
```

### False positives

If the plugin reports missing tests that actually exist, check:

1. Test naming matches expected patterns
2. Test file is recognized (contains `.test.` or `.spec.` in filename)
3. Feature name in `features.json` matches test name

### Performance

The plugin only runs on test files (files containing `.test.` or `.spec.`), so it has minimal impact on linting performance.

## Development

To modify the plugin:

1. Edit `index.js`
2. Run ESLint on test files to see changes
3. Test with: `npm run lint`

## License

MIT

