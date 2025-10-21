import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

describe('repo hygiene: no hand-authored catalog/json-interactions/*.json (Phase 2)', () => {
  it('contains no non-generated interaction catalogs', () => {
    const base = path.join(process.cwd(), 'catalog', 'json-interactions');
    let offenders: string[] = [];
    try {
      const entries = readdirSync(base, { withFileTypes: true });
      for (const ent of entries) {
        if (ent.name === '.generated') continue;
        const p = path.join(base, ent.name);
        const isFile = (() => { try { return statSync(p).isFile(); } catch { return false; }})();
        if (isFile && ent.name.endsWith('.json')) offenders.push(ent.name);
      }
    } catch {
      // if dir absent, also fine
    }
    expect(offenders).toEqual([]);
  });
});

