/**
 * ESLint Configuration for Python Skill Builder
 * 
 * Enforces code quality and test coverage standards.
 */

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    'feature-coverage'
  ],
  rules: {
    // Code Quality Rules
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['warn'],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    
    // Feature Coverage Enforcement
    // Level 1: Warning during development
    // Change to 'error' to block commits
    'feature-coverage/require-feature-tests': 'warn'
  },
  overrides: [
    {
      // Stricter rules for test files
      files: ['**/*.test.js', '**/*.spec.js', '**/tests/**/*.js'],
      env: {
        jest: true,
        mocha: true
      },
      rules: {
        // Enforce feature coverage in test files
        'feature-coverage/require-feature-tests': 'error',
        'no-console': 'off'
      }
    },
    {
      // Relaxed rules for configuration files
      files: ['.eslintrc.js', '*.config.js'],
      rules: {
        'no-console': 'off'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'htmlcov/',
    '__pycache__/',
    '*.pyc',
    '.pytest_cache/',
    'eslint-plugin-feature-coverage/node_modules/'
  ]
};

