#!/usr/bin/env node

/**
 * Generate per-plugin interaction catalogs under catalog/json-interactions/.generated
 * based on served plugin data (public/json-sequences + plugin-manifest).
 *
 * Strategy (Phase 1):
 * - Reuse derive-external-topics.js to build a single derived interactions catalog
 * - Split that catalog into per-group files using the first segment of the route key
 * - Choose the group's "plugin" field as the most frequent pluginId among its routes
 * - Write JSON files to catalog/json-interactions/.generated/<group>.json
 *
 * Notes:
 * - generate-interaction-manifest will read .generated catalogs and merge with any
 *   hand-authored json-interactions/*.json (generated should take precedence in order)
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateExternalInteractionsCatalog } from './derive-external-topics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true }).catch(() => {});
}

function groupRoutesByFirstSegment(routesObj) {
  const groups = new Map();
  for (const [route, def] of Object.entries(routesObj || {})) {
    const first = (route || '').split('.')[0] || 'misc';
    if (!groups.has(first)) groups.set(first, { routes: {}, pluginCounts: new Map() });
    const g = groups.get(first);
    g.routes[route] = def;
    const pid = def?.pluginId;
    if (pid) g.pluginCounts.set(pid, (g.pluginCounts.get(pid) || 0) + 1);
  }
  return groups;
}

function pickGroupPluginId(pluginCounts) {
  let best = null;
  let n = -1;
  for (const [pid, count] of pluginCounts.entries()) {
    if (count > n) { best = pid; n = count; }
  }
  return best || 'Plugin';
}

export async function generateJsonInteractionsFromPlugins() {
  const outDir = join(rootDir, 'catalog', 'json-interactions', '.generated');
  await ensureDir(outDir);

  const derived = await generateExternalInteractionsCatalog();
  const groups = groupRoutesByFirstSegment(derived?.routes || {});

  const written = [];
  for (const [group, { routes, pluginCounts }] of groups.entries()) {
    const pluginId = pickGroupPluginId(pluginCounts);
    const outPath = join(outDir, `${group}.json`);
    const json = { plugin: pluginId, routes };
    await fs.writeFile(outPath, JSON.stringify(json, null, 2) + '\n', 'utf-8');
    written.push(outPath);
  }

  return written;
}

async function main() {
  const files = await generateJsonInteractionsFromPlugins();
  console.log(`🧩 Generated ${files.length} interaction catalog(s) under catalog/json-interactions/.generated`);
}

// Run when executed directly
import { fileURLToPath as _fileURLToPath } from 'url';
const _isMain = _fileURLToPath(import.meta.url) === __filename;
if (_isMain) {
  main().catch((err) => {
    console.error('❌ Failed to generate json-interactions from plugins:', err);
    process.exit(1);
  });
}

