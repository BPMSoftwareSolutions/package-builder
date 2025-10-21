import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const root = path.resolve('.');
const assetsDir = path.join(root, 'docs', 'digital-assets');
const mappingPath = path.join(assetsDir, 'scene4_transfer_hub.mapping.json');

describe('Scene 4: Transfer Hub (Conductor)', () => {
  it('matches mapping and contains hub + branching routes + animated bus', () => {
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    expect(mapping.scene.name).toBe('scene4_transfer_hub');
    expect(mapping.output.file).toBe('integrated_scene_4.svg');

    const svgStr = fs.readFileSync(path.join(assetsDir, mapping.output.file), 'utf-8');
    const dom = new JSDOM(svgStr, { contentType: 'image/svg+xml' });
    const doc = dom.window.document;

    const rootSvg = doc.querySelector('svg');
    expect(rootSvg).toBeTruthy();
    expect(rootSvg!.getAttribute('viewBox')).toBe('0 0 1200 400');

    // Hub and branches
    expect(doc.getElementById(mapping.hub.id)).toBeTruthy();
    for (const br of mapping.branches) {
      expect(doc.getElementById(br.id)).toBeTruthy();
    }

    // Bus placement and animation
    const busLayer = doc.getElementById(mapping.bus.id);
    expect(busLayer).toBeTruthy();
    expect(busLayer!.getAttribute('transform')).toBe(`translate(0, ${mapping.bus.placement.computed.translateY}) scale(${mapping.bus.placement.scale})`);
    const anim = busLayer!.querySelector('animateTransform[type="translate"]');
    expect(anim).toBeTruthy();
    expect(anim!.getAttribute('values')).toBe(`${mapping.bus.horizontalPath.startX},0;${mapping.bus.horizontalPath.endX},0`);
    expect(anim!.getAttribute('dur')).toBe(mapping.bus.horizontalPath.duration);

    // Text hints present
    const textContent = doc.documentElement.textContent || '';
    expect(textContent).toMatch(/CONDUCTOR \(HUB\)/);
    expect(textContent).toMatch(/SEQUENCE A/);
    expect(textContent).toMatch(/SEQUENCE B/);
  });
});

