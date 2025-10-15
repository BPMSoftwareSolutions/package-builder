/**
 * ESLint Configuration for Python Skill Builder (ESLint 9+ format)
 *
 * Enforces code quality and test coverage standards.
 */

export default [
  {
    // Global ignores
    ignores: [
      'node_modules/',
      'htmlcov/',
      '__pycache__/',
      '*.pyc',
      '.pytest_cache/',
      'eslint-plugin-feature-coverage/node_modules/'
    ]
  },
  {
    // Main configuration for all JS files
    files: ['static/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        // Node globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly'
      }
    },
    rules: {
      // Code Quality Rules
      'indent': ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'no-unused-vars': ['warn'],
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  },
  {
    // Stricter rules for test files
    files: ['**/*.test.js', '**/*.spec.js', '**/tests/**/*.js'],
    languageOptions: {
      globals: {
        // Test framework globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly'
      }
    },
    rules: {
      'no-console': 'off'
    }
  },
  {
    // Relaxed rules for configuration files
    files: ['eslint.config.js', '*.config.js', '.eslintrc.js'],
    rules: {
      'no-console': 'off'
    }
  }
];

