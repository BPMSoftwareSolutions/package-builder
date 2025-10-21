import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const root = path.resolve('.');
const assetsDir = path.join(root, 'docs', 'digital-assets');
const mappingPath = path.join(assetsDir, 'bus_depot.mapping.json');
const integratedSvgPath = path.join(assetsDir, 'integrated_bus_leaving_depot.svg');

function getAttr(el: Element | null, name: string): string | null {
  return el ? el.getAttribute(name) : null;
}

describe('Integrated Bus Leaving Depot SVG', () => {
  it('matches mapping and contains required structure', () => {
    // Load mapping
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    expect(mapping.integration.output.file).toBe('integrated_bus_leaving_depot.svg');

    // Load integrated SVG (should exist after implementation)
    const svgStr = fs.readFileSync(integratedSvgPath, 'utf-8');
    const dom = new JSDOM(svgStr, { contentType: 'image/svg+xml' });
    const doc = dom.window.document;

    const rootSvg = doc.querySelector('svg');
    expect(rootSvg).toBeTruthy();

    // ViewBox check
    const vb = getAttr(rootSvg, 'viewBox');
    expect(vb).toBe('0 0 800 400');

    // Depot layer present
    const depotLayer = doc.getElementById('depot-layer');
    expect(depotLayer).toBeTruthy();

    // Bus layer transform alignment based on mapping
    const busLayer = doc.getElementById('bus-layer');
    expect(busLayer).toBeTruthy();
    const translateY = mapping.integration.alignment.busTranslateY;
    expect(getAttr(busLayer, 'transform')).toBe(`translate(0, ${translateY})`);

    // Animate transform on bus (horizontal path)
    const anim = busLayer!.querySelector('animateTransform[type="translate"]');
    expect(anim).toBeTruthy();
    expect(getAttr(anim, 'values')).toBe(`${mapping.bus.horizontalPath.startX},0;${mapping.bus.horizontalPath.endX},0`);
    expect(getAttr(anim, 'dur')).toBe(mapping.bus.horizontalPath.duration);

    // Sanity: key text labels exist from both images
    // Note: text elements may be represented; check by textContent substring
    const textContent = doc.documentElement.textContent || '';
    expect(textContent).toMatch(/EVENT BUS DEPOT/);
    expect(textContent).toMatch(/EVENT BUS/);
  });
});

