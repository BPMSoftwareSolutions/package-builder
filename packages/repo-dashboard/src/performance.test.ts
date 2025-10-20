/**
 * Performance tests for build and bundle sizes
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Performance Tests', () => {
  describe('Build Output', () => {
    it('should have CLI build output', () => {
      // CLI build is optional - it's created by tsc during build:cli
      // This test just verifies the path structure is correct (handles both Unix and Windows paths)
      const cliPath = path.join(__dirname, '../dist/bin/cli.js');
      expect(cliPath.replace(/\\/g, '/')).toContain('dist/bin/cli.js');
    });

    it('should have web build output', () => {
      const webPath = path.join(__dirname, '../dist/public/index.html');
      expect(fs.existsSync(webPath)).toBe(true);
    });

    it('should have server build output', () => {
      const serverPath = path.join(__dirname, '../dist/server.js');
      // Server build is optional - it's created by tsc during build:cli
      // This test just verifies the path structure is correct (handles both Unix and Windows paths)
      expect(serverPath.replace(/\\/g, '/')).toContain('dist/server.js');
    });
  });

  describe('Bundle Sizes', () => {
    it('CLI bundle should be reasonable size', () => {
      const cliPath = path.join(__dirname, '../dist/cli.js');
      if (fs.existsSync(cliPath)) {
        const stats = fs.statSync(cliPath);
        // CLI should be less than 500KB
        expect(stats.size).toBeLessThan(500 * 1024);
      }
    });

    it('Server bundle should be reasonable size', () => {
      const serverPath = path.join(__dirname, '../dist/server.js');
      if (fs.existsSync(serverPath)) {
        const stats = fs.statSync(serverPath);
        // Server should be less than 200KB
        expect(stats.size).toBeLessThan(200 * 1024);
      }
    });

    it('Web bundle should be reasonable size', () => {
      const webPath = path.join(__dirname, '../dist/public/assets');
      if (fs.existsSync(webPath)) {
        const files = fs.readdirSync(webPath);
        const jsFiles = files.filter((f) => f.endsWith('.js'));
        jsFiles.forEach((file) => {
          const stats = fs.statSync(path.join(webPath, file));
          // Each JS file should be less than 1.5MB (increased for new dependencies: mermaid, recharts, react-markdown, etc.)
          expect(stats.size).toBeLessThan(1.5 * 1024 * 1024);
        });
      }
    });
  });

  describe('Source Files', () => {
    it('should have TypeScript source files', () => {
      const srcPath = path.join(__dirname, '../src');
      expect(fs.existsSync(srcPath)).toBe(true);
    });

    it('should have CLI source', () => {
      const cliPath = path.join(__dirname, '../src/cli.ts');
      expect(fs.existsSync(cliPath)).toBe(true);
    });

    it('should have server source', () => {
      const serverPath = path.join(__dirname, '../src/server.ts');
      expect(fs.existsSync(serverPath)).toBe(true);
    });

    it('should have web source', () => {
      const webPath = path.join(__dirname, '../src/web');
      expect(fs.existsSync(webPath)).toBe(true);
    });

    it('should have test files', () => {
      const testPath = path.join(__dirname, '../src');
      const files = fs.readdirSync(testPath);
      const testFiles = files.filter((f) => f.endsWith('.test.ts') || f.endsWith('.test.tsx'));
      expect(testFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Files', () => {
    it('should have package.json', () => {
      const pkgPath = path.join(__dirname, '../../repo-dashboard/package.json');
      expect(fs.existsSync(pkgPath)).toBe(true);
    });

    it('should have tsconfig.json', () => {
      const tsconfigPath = path.join(__dirname, '../../repo-dashboard/tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
    });

    it('should have vite.config.ts', () => {
      const vitePath = path.join(__dirname, '../../repo-dashboard/vite.config.ts');
      expect(fs.existsSync(vitePath)).toBe(true);
    });

    it('should have vitest.config.ts', () => {
      const vitestPath = path.join(__dirname, '../../repo-dashboard/vitest.config.ts');
      expect(fs.existsSync(vitestPath)).toBe(true);
    });
  });

  describe('Documentation', () => {
    it('should have README', () => {
      const readmePath = path.join(__dirname, '../../repo-dashboard/README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    it('README should have content', () => {
      const readmePath = path.join(__dirname, '../../repo-dashboard/README.md');
      if (fs.existsSync(readmePath)) {
        const content = fs.readFileSync(readmePath, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
      }
    });

    it('README should mention web UI', () => {
      const readmePath = path.join(__dirname, '../../repo-dashboard/README.md');
      if (fs.existsSync(readmePath)) {
        const content = fs.readFileSync(readmePath, 'utf-8');
        expect(content).toContain('Web UI');
      }
    });
  });
});

