# ESLint Setup for Feature Coverage Enforcement

## Overview

This document describes the ESLint configuration and custom plugin that enforces test coverage for all features defined in `features.json`.

## Components

### 1. Custom ESLint Plugin: `eslint-plugin-feature-coverage`

**Location:** `eslint-plugin-feature-coverage/`

A custom ESLint plugin that validates JavaScript test files cover all frontend features in `features.json`.

**Files:**
- `index.js` - Plugin implementation
- `package.json` - Plugin metadata
- `README.md` - Plugin documentation

### 2. ESLint Configuration: `.eslintrc.js`

**Location:** `.eslintrc.js`

Main ESLint configuration that:
- Loads the custom plugin
- Configures code quality rules
- Enforces feature coverage in test files

### 3. Package Configuration: `package.json`

**Location:** `package.json`

Defines npm scripts for:
- Running tests
- Validating coverage
- Linting code
- CI/CD integration

### 4. Sample Test File: `static/app.test.js`

**Location:** `static/app.test.js`

Example JavaScript test file demonstrating:
- Test structure
- Feature coverage
- ESLint plugin validation

## Installation

### Prerequisites

- Node.js >= 14.0.0
- npm or yarn
- Python >= 3.11.0

### Setup Steps

1. **Install dependencies:**

```bash
cd packages/python-skill-builder
npm install
```

This will install:
- ESLint
- The custom `eslint-plugin-feature-coverage` (local plugin)

2. **Verify installation:**

```bash
npm run lint
```

## Usage

### Running ESLint

```bash
# Lint all JavaScript files
npm run lint

# Lint and auto-fix issues
npm run lint:fix

# Lint only test files
npm run lint:tests
```

### Running Tests with Coverage Validation

```bash
# Run Python tests with coverage validation
npm test

# Run Python tests with coverage report
npm run test:coverage

# Validate coverage against features.json
npm run validate:coverage
```

### Pre-commit Validation

```bash
# Run all validations (coverage + lint)
npm run precommit
```

### CI/CD Integration

```bash
# Run full CI pipeline
npm run ci
```

This runs:
1. `validate_coverage.py` - Validates Python test coverage
2. `pytest --cov` - Runs Python tests with coverage
3. `eslint` - Validates JavaScript code quality and test coverage

## How It Works

### Feature Coverage Validation Flow

1. **ESLint runs** on JavaScript files (triggered by `npm run lint`)
2. **Plugin loads** `features.json` from project root
3. **Plugin extracts** test function names from test files
4. **Plugin validates** each frontend feature has corresponding tests
5. **Plugin reports** missing tests as ESLint errors/warnings

### Test Naming Conventions

The plugin recognizes these patterns:

**Function Declarations:**
```javascript
function test_feature_name() { }
function test_view_feature_name() { }
function test_frontend_feature_name() { }
```

**Jest/Mocha Tests:**
```javascript
test('feature name', () => { });
it('feature name', () => { });
describe('feature name', () => { });
```

### Feature Matching

For a feature named "Approach Selector" in `features.json`, the plugin looks for:

- `test_approach_selector`
- `test_view_approach_selector`
- `test_frontend_approach_selector`
- Any test containing "approach" and "selector"

## Configuration

### Enforcement Levels

**Level 1: Warning (Development)**

`.eslintrc.js`:
```javascript
rules: {
  'feature-coverage/require-feature-tests': 'warn'
}
```

- Shows warnings during development
- Doesn't block commits
- Good for initial setup

**Level 2: Error (Production)**

`.eslintrc.js`:
```javascript
rules: {
  'feature-coverage/require-feature-tests': 'error'
}
```

- Blocks commits with missing tests
- Enforced in CI/CD
- Recommended for production

### Custom Configuration

```javascript
rules: {
  'feature-coverage/require-feature-tests': ['error', {
    featuresPath: './custom/path/features.json',
    ignorePatterns: ['deprecated_*', 'experimental_*']
  }]
}
```

## Integration with Python Validation

The ESLint plugin complements the Python `validate_coverage.py` script:

| Tool | Validates | Runs On | Enforcement |
|------|-----------|---------|-------------|
| `validate_coverage.py` | Python/Backend tests | Pre-commit, CI/CD | Blocking |
| `eslint-plugin-feature-coverage` | JavaScript/Frontend tests | Lint, CI/CD | Warning/Error |

Together, they ensure **100% feature coverage** across the entire application.

## Troubleshooting

### Issue: Plugin not loading

**Error:**
```
Definition for rule 'feature-coverage/require-feature-tests' was not found
```

**Solution:**
1. Verify plugin is installed: `npm list eslint-plugin-feature-coverage`
2. Check `.eslintrc.js` has correct plugin name
3. Run `npm install` to reinstall dependencies

### Issue: False positives (tests exist but plugin reports missing)

**Possible causes:**
1. Test naming doesn't match expected patterns
2. Test file not recognized (missing `.test.` or `.spec.` in filename)
3. Feature name in `features.json` doesn't match test name

**Solution:**
1. Check test naming conventions
2. Rename test file to include `.test.` or `.spec.`
3. Update feature name or test name to match

### Issue: features.json not found

**Error:**
```
Could not find features.json file
```

**Solution:**
1. Verify `features.json` exists in project root
2. Check file permissions
3. Configure custom path in `.eslintrc.js`

## Examples

### Example 1: Adding a New Feature

1. **Add feature to `features.json`:**

```json
{
  "features": {
    "frontend": {
      "views": {
        "features": [
          {
            "name": "Dark Mode Toggle",
            "testCases": [
              "Shows toggle button",
              "Switches to dark mode on click",
              "Persists preference in localStorage"
            ]
          }
        ]
      }
    }
  }
}
```

2. **Run ESLint - it will report missing test:**

```bash
npm run lint
```

Output:
```
Feature "Frontend View: Dark Mode Toggle" has no corresponding test. Expected test: test_dark_mode_toggle
```

3. **Add test to `static/app.test.js`:**

```javascript
describe('Dark Mode Toggle', () => {
  test('shows toggle button', () => {
    const toggle = document.getElementById('dark-mode-toggle');
    expect(toggle).toBeTruthy();
  });

  test('switches to dark mode on click', () => {
    // Test implementation
  });

  test('persists preference in localStorage', () => {
    // Test implementation
  });
});
```

4. **Run ESLint again - test is now recognized:**

```bash
npm run lint
```

Output:
```
✓ No ESLint errors
```

### Example 2: CI/CD Integration

**GitHub Actions workflow** (already created in `.github/workflows/test-coverage-validation.yml`):

```yaml
- name: Install Node dependencies
  run: |
    cd packages/python-skill-builder
    npm install

- name: Run ESLint
  run: |
    cd packages/python-skill-builder
    npm run lint

- name: Validate coverage
  run: |
    cd packages/python-skill-builder
    npm run validate:coverage
```

## Best Practices

1. **Write tests before features** - TDD approach ensures coverage
2. **Use descriptive test names** - Makes feature matching easier
3. **Group related tests** - Use `describe()` blocks for organization
4. **Run lint before commit** - Catch issues early
5. **Keep features.json updated** - Single source of truth for features

## Maintenance

### Updating the Plugin

1. Edit `eslint-plugin-feature-coverage/index.js`
2. Test changes: `npm run lint`
3. Update version in `eslint-plugin-feature-coverage/package.json`
4. Document changes in `eslint-plugin-feature-coverage/README.md`

### Adding New Feature Categories

To validate new feature categories (e.g., "API Integration"):

1. Update `features.json` with new category
2. Add validation logic to `eslint-plugin-feature-coverage/index.js`
3. Update test naming conventions in documentation

## Resources

- [ESLint Plugin Documentation](https://eslint.org/docs/latest/extend/plugins)
- [ESLint Rules API](https://eslint.org/docs/latest/extend/custom-rules)
- [features.json Schema](./features.json)
- [Python Coverage Validation](./tests/validate_coverage.py)

## Support

For issues or questions:
1. Check this documentation
2. Review `eslint-plugin-feature-coverage/README.md`
3. Run `npm run lint -- --debug` for verbose output
4. Check GitHub Issues

## Summary

The ESLint setup provides:
- ✅ Automated feature coverage validation
- ✅ Custom plugin for JavaScript tests
- ✅ Integration with Python validation
- ✅ CI/CD enforcement
- ✅ Developer-friendly warnings
- ✅ Comprehensive documentation

This ensures **no feature goes untested** in the Python Skill Builder application.

