import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

// Integration guard: the generator should create .generated catalogs from served data
// Relies on pretest having synced public/json-sequences from plugins

describe('json-interactions generator (Phase 1, .generated)', () => {
  it('generates per-plugin catalogs under catalog/json-interactions/.generated', () => {
    const script = path.join(process.cwd(), 'scripts', 'generate-json-interactions-from-plugins.js');
    const r = spawnSync(process.execPath, [script], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (r.status !== 0) {
      // helpful output if it fails
      console.error((r.stdout || '') + '\n' + (r.stderr || ''));
    }
    expect(r.status).toBe(0);

    const outDir = path.join(process.cwd(), 'catalog', 'json-interactions', '.generated');
    const libPath = path.join(outDir, 'library.json');
    expect(existsSync(libPath)).toBe(true);

    const json = JSON.parse(readFileSync(libPath, 'utf8'));
    expect(json).toBeTruthy();
    expect(json.routes && typeof json.routes === 'object').toBe(true);

    // Should include at least the core library load route derived from served sequences
    expect(Object.keys(json.routes)).toEqual(expect.arrayContaining(['library.load']));
  });
});

