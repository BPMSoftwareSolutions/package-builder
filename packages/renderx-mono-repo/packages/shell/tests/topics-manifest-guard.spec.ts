import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function loadJson(p: string) {
  const raw = readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

describe('Topics manifest guardrails', () => {
  const root = process.cwd();
  const topicsPath = path.join(root, 'topics-manifest.json');
  const pluginManifestPath = path.join(root, 'public', 'plugins', 'plugin-manifest.json');
  const genScript = path.join(root, 'scripts', 'generate-topics-manifest.js');

  let topicsJson: any;
  let topics: Record<string, any> = {};
  let keys: string[] = [];

  beforeAll(() => {
    const res = spawnSync(process.execPath, [genScript], { stdio: 'inherit' });
    if (res.status !== 0) throw new Error('Failed to regenerate topics-manifest.json');
    topicsJson = loadJson(topicsPath);
    topics = topicsJson?.topics || {};
    keys = Object.keys(topics);
  });

  it('includes critical Control Panel topics with routes', () => {
    const required = [
      'control.panel.ui.init.requested',
      'control.panel.ui.render.requested',
      'control.panel.ui.field.change.requested',
      'control.panel.selection.show.requested',
    ];

    for (const k of required) {
      expect(keys, `topics-manifest contains ${k}`).toContain(k);
      const routes = Array.isArray(topics[k]?.routes) ? topics[k].routes : [];
      expect(routes.length, `${k} routes length`).toBeGreaterThan(0);
      // Control Panel routes should be handled by ControlPanelPlugin
      const pluginIds = routes.map((r: any) => r?.pluginId).filter(Boolean);
      expect(pluginIds, `${k} plugin ids`).toContain('ControlPanelPlugin');
    }
  });

  it('classifies canvas drag topics correctly (all drag topics have routes)', () => {
    // All drag topics should have routes with the updated plugin structure
    expect(keys).toContain('canvas.component.drag.start.requested');
    expect(keys).toContain('canvas.component.drag.end');  
    expect(keys).toContain('canvas.component.drag.move');
    
    const startRequestedRoutes = Array.isArray(topics['canvas.component.drag.start.requested']?.routes) ? topics['canvas.component.drag.start.requested'].routes.length : 0;
    const endRoutes = Array.isArray(topics['canvas.component.drag.end']?.routes) ? topics['canvas.component.drag.end'].routes.length : 0;
    const moveRoutes = Array.isArray(topics['canvas.component.drag.move']?.routes) ? topics['canvas.component.drag.move'].routes.length : 0;
    
    expect(startRequestedRoutes).toBeGreaterThan(0);
    expect(endRoutes).toBeGreaterThan(0);
    expect(moveRoutes).toBeGreaterThan(0);
  });

  it('classifies canvas resize topics correctly (start/end notify-only, move routed)', () => {
    // start/end notify-only
    expect(keys).toContain('canvas.component.resize.start');
    expect(keys).toContain('canvas.component.resize.end');
    expect(Array.isArray(topics['canvas.component.resize.start']?.routes) ? topics['canvas.component.resize.start'].routes.length : 0)
      .toBe(0);
    expect(Array.isArray(topics['canvas.component.resize.end']?.routes) ? topics['canvas.component.resize.end'].routes.length : 0)
      .toBe(0);

    // move is routed (matching drag pattern and interaction manifest)
    expect(keys).toContain('canvas.component.resize.move');
    const moveRoutes = Array.isArray(topics['canvas.component.resize.move']?.routes) ? topics['canvas.component.resize.move'].routes : [];
    expect(moveRoutes.length).toBeGreaterThan(0);
  });

  it('includes svg-node selection topics with backward compatibility aliases', () => {
    // Both canonical (with dots) and alias (with hyphen) versions should exist
    expect(keys).toContain('canvas.component.select.svg.node.requested');
    expect(keys).toContain('canvas.component.select.svg-node.requested');

    // Both should have routes to the same plugin
    const canonicalRoutes = Array.isArray(topics['canvas.component.select.svg.node.requested']?.routes) ? topics['canvas.component.select.svg.node.requested'].routes : [];
    const aliasRoutes = Array.isArray(topics['canvas.component.select.svg-node.requested']?.routes) ? topics['canvas.component.select.svg-node.requested'].routes : [];
    
    expect(canonicalRoutes.length).toBeGreaterThan(0);
    expect(aliasRoutes.length).toBeGreaterThan(0);
    
    // Both should route to CanvasComponentSvgNodeSelectionPlugin
    const canonicalPluginIds = canonicalRoutes.map((r: any) => r?.pluginId).filter(Boolean);
    const aliasPluginIds = aliasRoutes.map((r: any) => r?.pluginId).filter(Boolean);
    
    expect(canonicalPluginIds).toContain('CanvasComponentSvgNodeSelectionPlugin');
    expect(aliasPluginIds).toContain('CanvasComponentSvgNodeSelectionPlugin');
    
    // Alias should be marked as such in notes
    expect(topics['canvas.component.select.svg-node.requested']?.notes).toContain('compatibility alias');
  });

  it('plugin-manifest contains ControlPanelPlugin (source of truth for runtime)', () => {
    const candidates = [
      pluginManifestPath,
      path.join(root, 'catalog', 'json-plugins', '.generated', 'plugin-manifest.json'),
    ];
    let manifestFile: string | null = null;
    for (const p of candidates) { if (existsSync(p)) { manifestFile = p; break; } }
    if (!manifestFile) {
      // In CI test stage, public/ may not be populated; skip this assertion if no manifest found
      console.warn('[topics-guard] Skipping plugin-manifest check: no manifest file found in candidates');
      return;
    }
    const pluginManifest = loadJson(manifestFile);
    const ids: string[] = Array.isArray(pluginManifest?.plugins)
      ? pluginManifest.plugins.map((p: any) => p?.id).filter((s: any) => typeof s === 'string' && s.length)
      : [];
    expect(ids).toContain('ControlPanelPlugin');
  });
});

