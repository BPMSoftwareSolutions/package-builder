# Python Skill Builder Test Suite

Comprehensive test suite for the Python Skill Builder application, ensuring all features listed in `features.json` are properly tested.

## Test Structure

```
tests/
├── __init__.py              # Test package initialization
├── conftest.py              # Pytest fixtures and configuration
├── validate_coverage.py     # Script to validate test coverage against features.json
├── test_sandbox.py          # Sandbox validation tests
├── test_grading.py          # Grading engine tests
└── test_api.py              # API endpoint integration tests
```

## Running Tests

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run All Tests

```bash
pytest
```

### Run Specific Test File

```bash
pytest tests/test_sandbox.py
pytest tests/test_grading.py
pytest tests/test_api.py
```

### Run with Coverage

```bash
pytest --cov=. --cov-report=term --cov-report=html
```

This will generate:
- Terminal coverage report
- HTML coverage report in `htmlcov/` directory

### Validate Test Coverage Against features.json

```bash
python tests/validate_coverage.py
```

This script ensures that all features listed in `features.json` have corresponding tests.

## Test Categories

### 1. Sandbox Tests (`test_sandbox.py`)

Tests the AST-based code execution sandbox:
- **AST Validation**: Blocks dangerous operations (imports, file I/O)
- **Safe Builtins**: Provides safe built-in functions and types
- **Namespace Isolation**: Ensures user code cannot access test namespace

### 2. Grading Tests (`test_grading.py`)

Tests the code grading engine:
- **Single-Approach Grading**: Basic grading functionality
- **Multi-Approach Grading**: Approach-specific test routing
- **Pattern Detection**: Source code pattern analysis
- **Error Handling**: Syntax and runtime error handling

### 3. API Tests (`test_api.py`)

Integration tests for Flask API endpoints:
- **GET /api/modules**: List all training modules
- **GET /api/modules/<id>**: Get specific module with workshops
- **POST /api/grade**: Submit and grade user code

## Coverage Requirements

- **Minimum Coverage**: 80%
- **Critical Features**: Must have 100% coverage
  - Code persistence
  - Progress tracking
  - Sandbox security
  - Grading correctness
  - API endpoints

## CI/CD Integration

### GitHub Actions

The test suite runs automatically on:
- Every pull request affecting `packages/python-skill-builder/`
- Every push to `main` branch

Workflow: `.github/workflows/test-coverage-validation.yml`

### Pre-commit Hooks

Install pre-commit hooks to run tests before committing:

```bash
pip install pre-commit
pre-commit install
```

Configuration: `.pre-commit-config.yaml`

## Test Fixtures

Common fixtures are defined in `conftest.py`:

- `app`: Flask application instance
- `client`: Flask test client
- `features`: Loaded features.json data
- `api_endpoints`: API endpoint definitions
- `sandbox_features`: Sandbox feature definitions
- `grading_features`: Grading feature definitions
- `sample_user_code`: Sample valid user code
- `sample_test_code`: Sample test harness code
- `module_data`: Module index data

## Writing New Tests

When adding new features:

1. **Update features.json** with the new feature and test cases
2. **Write tests** following the naming convention:
   - API endpoints: `test_{method}_api_{path}`
   - Sandbox features: `test_sandbox_{feature_name}`
   - Grading features: `test_grading_{feature_name}`
3. **Run validate_coverage.py** to ensure all features are tested
4. **Verify coverage** meets the 80% threshold

## Debugging Tests

### Run with verbose output

```bash
pytest -v
```

### Run specific test

```bash
pytest tests/test_sandbox.py::TestSandboxASTValidation::test_sandbox_ast_validation_blocks_import
```

### Show print statements

```bash
pytest -s
```

### Stop on first failure

```bash
pytest -x
```

## Known Issues

See `features.json` → `knownIssues` section for current known issues and their reproduction steps.

## Related Documentation

- [features.json](../features.json) - Complete feature inventory
- [README.md](../README.md) - Main application documentation
- [GitHub Issue #26](https://github.com/BPMSoftwareSolutions/package-builder/issues/26) - Test suite implementation

