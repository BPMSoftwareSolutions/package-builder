import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['dist', 'node_modules', 'coverage', 'public', '**/*.d.ts', '.artifacts']
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        setImmediate: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
        clearImmediate: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        React: 'readonly'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'off',
      'no-console': 'off'
    }
  },
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    rules: {
      ...config.rules,
      '@typescript-eslint/no-explicit-any': 'off'
    }
  })),
  {
    files: ['packages/plugins/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['packages/shell/*', '!packages/shell/src/public/*'],
              message: 'Plugins cannot import shell internals. Use only public interfaces.'
            },
            {
              group: ['packages/plugins/*/src/*'],
              message: 'Cross-plugin imports are not allowed. Use shared contracts instead.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['packages/shell/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['packages/plugins/*'],
              message: 'Shell cannot import plugin implementations. Use only public interfaces.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['packages/conductor/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['packages/shell/*'],
              message: 'Conductor cannot depend on UI shell.'
            }
          ]
        }
      ]
    }
  }
];

