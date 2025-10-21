import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const root = path.resolve('.');
const assetsDir = path.join(root, 'docs', 'digital-assets');
const mappingPath = path.join(assetsDir, 'event_route.mapping.json');
const integratedSvgPath = path.join(assetsDir, 'integrated_event_route.svg');

function getAttr(el: Element | null, name: string): string | null {
  return el ? el.getAttribute(name) : null;
}

describe('Event Route One-Page Diagram', () => {
  it('matches mapping and contains all key layers/elements', () => {
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    expect(mapping.output.file).toBe('integrated_event_route.svg');

    const svgStr = fs.readFileSync(integratedSvgPath, 'utf-8');
    const dom = new JSDOM(svgStr, { contentType: 'image/svg+xml' });
    const doc = dom.window.document;

    const rootSvg = doc.querySelector('svg');
    expect(rootSvg).toBeTruthy();
    expect(getAttr(rootSvg, 'viewBox')).toBe('0 0 1600 400');

    // Depot, road, guard rails
    expect(doc.getElementById(mapping.layers.depot.id)).toBeTruthy();
    expect(doc.getElementById(mapping.layers.road.id)).toBeTruthy();
    expect(doc.getElementById(mapping.layers.guardRails.id)).toBeTruthy();

    // Traffic lights
    for (const t of mapping.layers.trafficLights) {
      expect(doc.getElementById(t.id)).toBeTruthy();
    }

    // Street signs
    for (const s of mapping.layers.streetSigns) {
      expect(doc.getElementById(s.id)).toBeTruthy();
    }

    // Stops layer + items
    const stopsLayer = doc.getElementById(mapping.layers.stops.id);
    expect(stopsLayer).toBeTruthy();

    // Transfer hub & school
    expect(doc.getElementById(mapping.layers.transferHub.id)).toBeTruthy();
    expect(doc.getElementById(mapping.layers.school.id)).toBeTruthy();

    // Bus layer transform
    const busLayer = doc.getElementById(mapping.bus.id);
    expect(busLayer).toBeTruthy();
    const scale = mapping.bus.placement.scale;
    const translateY = mapping.bus.placement.computed.translateY;
    expect(getAttr(busLayer, 'transform')).toBe(`translate(0, ${translateY}) scale(${scale})`);

    // Animate path
    const anim = busLayer!.querySelector('animateTransform[type="translate"]');
    expect(anim).toBeTruthy();
    expect(getAttr(anim, 'values')).toBe(`${mapping.bus.horizontalPath.startX},0;${mapping.bus.horizontalPath.endX},0`);
    expect(getAttr(anim, 'dur')).toBe(mapping.bus.horizontalPath.duration);
  });
});

