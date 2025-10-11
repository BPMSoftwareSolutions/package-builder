import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'SPA Tests',
    include: ['tests/unit/spa-validator.test.ts'],
    environment: 'node'
  }
});
