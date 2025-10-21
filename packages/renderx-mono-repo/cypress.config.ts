import { defineConfig } from 'cypress';

const isCI = process.env.CI === 'true' || process.env.CI === '1';
const baseUrl = isCI ? 'http://localhost:4173' : 'http://localhost:5173';

export default defineConfig({
  e2e: {
    baseUrl,
    specPattern: 'cypress/e2e/**/*.cy.{ts,js,tsx,jsx}',
    supportFile: 'cypress/support/e2e.ts',
    chromeWebSecurity: false,
    defaultCommandTimeout: 15000,
    requestTimeout: 15000,
    video: true,
    retries: isCI ? 1 : 0,
    env: {
      includeTags: '',
      excludeTags: '',
      requireCapabilities: '', // comma-separated
      minTestApiVersion: '1.0.0',
      maxTestApiVersion: '1.x',
      artifactsDir: 'cypress/artifacts'
    },
    setupNodeEvents(on, config) {
      on('task', {
        async writeArtifact(args) {
          const filePath = args && args.filePath;
          const content = args && args.content;
          try {
            const fs = await import('node:fs');
            const path = await import('node:path');
            const full = path.resolve(process.cwd(), filePath);
            fs.mkdirSync(path.dirname(full), { recursive: true });
            fs.writeFileSync(full, typeof content === 'string' ? content : JSON.stringify(content, null, 2), 'utf8');
            return true;
          } catch (e) {
            console.error('writeArtifact failed', e);
            return false;
          }
        },
      });
      return config;
    },
  },
});

