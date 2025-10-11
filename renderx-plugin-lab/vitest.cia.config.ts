import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'CIA Tests',
    include: ['tests/unit/conductor.test.ts'],
    environment: 'node'
  }
});
