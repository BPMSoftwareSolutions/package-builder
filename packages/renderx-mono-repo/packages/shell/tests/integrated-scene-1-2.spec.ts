import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const root = path.resolve('.');
const assetsDir = path.join(root, 'docs', 'digital-assets');
const integratedSvgPath = path.join(assetsDir, 'integrated_scene_1_2.svg');

describe('Integrated Scene 1+2 SVG', () => {
  it('exists and contains key elements/text from both scenes', () => {
    const svgStr = fs.readFileSync(integratedSvgPath, 'utf-8');
    const dom = new JSDOM(svgStr, { contentType: 'image/svg+xml' });
    const doc = dom.window.document;

    const rootSvg = doc.querySelector('svg');
    expect(rootSvg).toBeTruthy();
    expect(rootSvg!.getAttribute('viewBox')).toBe('0 0 1400 400');

    // Scenes present
    expect(doc.getElementById('scene-1')).toBeTruthy();
    expect(doc.getElementById('scene-2')).toBeTruthy();

    // Text content from scene 1
    const textContent = doc.documentElement.textContent || '';
    expect(textContent).toMatch(/EVENT BUS DEPOT/);
    expect(textContent).toMatch(/EVENT BUS/);

    // Text content from scene 2 signage
    expect(textContent).toMatch(/DEBUG LOGS AHEAD/);
    expect(textContent).toMatch(/REPLAY CACHE STOP/);
    expect(textContent).toMatch(/FEATURE FLAGS ON\/OFF/);
  });
});

