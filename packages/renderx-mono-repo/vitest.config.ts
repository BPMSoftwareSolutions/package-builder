import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Allow packages with no test files to pass
    passWithNoTests: true,
  },
});

