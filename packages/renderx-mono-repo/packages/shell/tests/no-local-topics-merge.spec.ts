import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function loadJson(p: string) {
  const raw = readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

describe('No local json-topics merged', () => {
  const root = process.cwd();
  const script = path.join(root, 'scripts', 'generate-topics-manifest.js');
  const topicsPath = path.join(root, 'topics-manifest.json');

  beforeAll(() => {
    const res = spawnSync('node', [script], { stdio: 'inherit' });
    if (res.status !== 0) {
      throw new Error('Failed to regenerate topics-manifest.json');
    }
  });

  it('excludes known local-only test topics', () => {
    const topicsJson = loadJson(topicsPath);
    const topics = topicsJson?.topics || {};
    const keys = Object.keys(topics);
    // These come from catalog/json-components/json-topics/test.json and must NOT be present after removal
    expect(keys).not.toContain('test.route');
    expect(keys).not.toContain('test.notify');
  });
});

