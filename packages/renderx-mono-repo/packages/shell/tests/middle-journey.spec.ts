import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const root = path.resolve('.');
const assetsDir = path.join(root, 'docs', 'digital-assets');
const mappingPath = path.join(assetsDir, 'middle_journey.mapping.json');
const integratedSvgPath = path.join(assetsDir, 'integrated_middle_journey.svg');

function getAttr(el: Element | null, name: string): string | null {
  return el ? el.getAttribute(name) : null;
}

describe('Middle Journey Scene', () => {
  it('matches mapping and contains bus, road, and roadside elements', () => {
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    expect(mapping.output.file).toBe('integrated_middle_journey.svg');

    const svgStr = fs.readFileSync(integratedSvgPath, 'utf-8');
    const dom = new JSDOM(svgStr, { contentType: 'image/svg+xml' });
    const doc = dom.window.document;

    const rootSvg = doc.querySelector('svg');
    expect(rootSvg).toBeTruthy();
    expect(getAttr(rootSvg, 'viewBox')).toBe('0 0 600 200');

    // Layers/elements
    expect(doc.getElementById('road-layer')).toBeTruthy();
    expect(doc.getElementById(mapping.elements.trafficLight.placement.id)).toBeTruthy();
    expect(doc.getElementById(mapping.elements.guardRails.placement.id)).toBeTruthy();
    // Updated signage set
    expect(doc.getElementById('street-sign-debug')).toBeTruthy();
    expect(doc.getElementById('street-sign-replay')).toBeTruthy();
    expect(doc.getElementById('street-sign-feature-flags')).toBeTruthy();

    // Bus layer placement
    const busLayer = doc.getElementById('bus-layer');
    expect(busLayer).toBeTruthy();
    const scale = mapping.bus.placement.scale;
    const translateY = mapping.bus.placement.computed.translateY;
    expect(getAttr(busLayer, 'transform')).toBe(`translate(0, ${translateY}) scale(${scale})`);

    // Animate path
    const anim = busLayer!.querySelector('animateTransform[type="translate"]');
    expect(anim).toBeTruthy();
    expect(getAttr(anim, 'values')).toBe(`${mapping.bus.horizontalPath.startX},0;${mapping.bus.horizontalPath.endX},0`);
    expect(getAttr(anim, 'dur')).toBe(mapping.bus.horizontalPath.duration);

    // Updated street sign texts
    const textContent = doc.documentElement.textContent || '';
    expect(textContent).toMatch(/DEBUG LOGS AHEAD/);
    expect(textContent).toMatch(/REPLAY CACHE STOP/);
    expect(textContent).toMatch(/FEATURE FLAGS ON\/OFF/);
  });
});

