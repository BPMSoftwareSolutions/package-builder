import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

/**
 * Ensures our "served sequences mountability" lint has no false positives vs predicted mounted IDs
 * This acts as a guard that our ESLint checks are aligned with plugin-served artifacts.
 */
describe('ESLint mountability vs predicted mounted IDs', () => {
  it('reports no false positives', { timeout: 30000 }, () => {
    const script = path.join(process.cwd(), 'scripts', 'validate-lint-vs-mount.js');
    const r = spawnSync(process.execPath, [script], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    // Script exits with code 1 if false positives found
    const code = r.status ?? 1;
    if (code !== 0) {
      const out = (r.stdout || '') + '\n' + (r.stderr || '');
      console.error(out);
    }
    expect(code).toBe(0);
  });
});

