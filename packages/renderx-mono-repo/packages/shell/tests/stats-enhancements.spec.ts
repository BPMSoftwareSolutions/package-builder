import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * TDD: Guardrails for the new enhanced stats wrapper and CSS.
 * We assert presence of a stats-enhanced wrapper in the test plugin loader markup
 * and matching CSS in global styles. Initially fails until implementation is added.
 */

describe('UI: test-plugin-loader stats enhancements', () => {
  const loaderPath = resolve(process.cwd(), 'src', 'test-plugin-loader.tsx');
  const cssPath = resolve(process.cwd(), 'src', 'global.css');

  it('adds a .stats-enhanced wrapper around the stats grid in test-plugin-loader.tsx', () => {
    const src = readFileSync(loaderPath, 'utf8');
    // Basic presence check – we dont parse JSX here due to node test env
    expect(src.includes('className="control-panel"')).toBe(true);
    expect(src.includes('className="stats-enhanced')).toBe(true);
  });

  it('defines base styles for .stats-enhanced in global.css', () => {
    const css = readFileSync(cssPath, 'utf8');
    // Minimal style guard: class exists and sets a background/border enhancements
    expect(css.includes('.stats-enhanced')).toBe(true);
    // At least one visual enhancement token should be present nearby
    expect(/\.stats-enhanced[\s\S]*background/i.test(css)).toBe(true);
  });

  it('replaces text stats with visual dashboard elements (progress rings/cards)', () => {
    const src = readFileSync(loaderPath, 'utf8');
    expect(src.includes('className="stats-dashboard"')).toBe(true);
    expect(src.includes('className="progress-ring"')).toBe(true);
  });

  it('defines base styles for the new dashboard selectors in global.css', () => {
    const css = readFileSync(cssPath, 'utf8');
    expect(css.includes('.stats-dashboard')).toBe(true);
    expect(css.includes('.metric-card')).toBe(true);
    expect(css.includes('.ring-blue')).toBe(true);
  });

});

