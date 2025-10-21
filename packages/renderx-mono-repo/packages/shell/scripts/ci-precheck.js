#!/usr/bin/env node
/**
 * CI precheck for @renderx-plugins availability and manifest presence.
 * - Logs resolution for key packages (require.resolve and dynamic import)
 * - Lists node_modules/@renderx-plugins contents
 * - Verifies public plugin manifest and header sequence catalogs exist
 * - If dist/ exists, also verifies dist copies
 *
 * Fails fast (exit 1) if critical checks fail:
 * - cannot import @renderx-plugins/header
 */

import fs from 'fs';
import path from 'path';
import url from 'url';
import { createRequire } from 'module';

const cwd = process.cwd();
const to = (...p) => path.join(cwd, ...p);
const exists = (p) => fs.existsSync(p);

function log(title, obj) {
  const pad = '-'.repeat(title.length);
  console.log(`\n${title}\n${pad}`);
  if (typeof obj === 'string') console.log(obj);
  else console.log(JSON.stringify(obj, null, 2));
}

let fail = false;

const requireFromHere = createRequire(import.meta.url);
const requireFromCwd = createRequire(url.pathToFileURL(path.join(cwd, 'package.json')));
function safeResolve(id) {
  // Try resolving from script location first, then from repo root
  try { return requireFromHere.resolve(id); } catch {}
  try { return requireFromCwd.resolve(id); } catch {}
  return null;
}

// 1) Resolve key packages (require.resolve)
const resolvedHeader = safeResolve('@renderx-plugins/header');
const resolvedHostSdk = safeResolve('@renderx-plugins/host-sdk');
log('module resolution (require.resolve)', {
  '@renderx-plugins/header': resolvedHeader || 'NOT RESOLVED',
  '@renderx-plugins/host-sdk': resolvedHostSdk || 'NOT RESOLVED',
});

// 1b) Try dynamic import to validate ESM importability
async function tryImport(id) {
  try {
    await import(id);
    return 'import OK';
  } catch (e) {
    return 'import FAILED: ' + (e?.message || e);
  }
}
const importHeader = await tryImport('@renderx-plugins/header');
const importHost = await tryImport('@renderx-plugins/host-sdk');
log('module import (dynamic)', {
  '@renderx-plugins/header': importHeader,
  '@renderx-plugins/host-sdk': importHost,
});
if (!importHeader.startsWith('import OK')) {
  console.error('FATAL: cannot import @renderx-plugins/header');
  fail = true;
}

// 2) List @renderx-plugins directory contents if present
const orgDir = to('node_modules', '@renderx-plugins');
if (exists(orgDir)) {
  const entries = fs.readdirSync(orgDir, { withFileTypes: true }).map(d => (d.isDirectory() ? d.name + '/' : d.name));
  log('node_modules/@renderx-plugins', entries);
} else {
  log('node_modules/@renderx-plugins', 'directory not found');
}

// 3) Public artifacts presence
const publicManifest = to('public', 'plugins', 'plugin-manifest.json');
const publicHeaderIndex = to('public', 'json-sequences', 'header', 'index.json');
log('public artifacts', {
  'public/plugins/plugin-manifest.json': exists(publicManifest),
  'public/json-sequences/header/index.json': exists(publicHeaderIndex),
});

// 4) Dist artifacts presence (if built already)
const distDir = to('dist');
if (exists(distDir)) {
  const distHeaderDir = to('dist', 'json-sequences', 'header');
  const distAssetsDir = to('dist', 'assets');
  const distHasHeader = exists(distHeaderDir) ? fs.readdirSync(distHeaderDir) : [];
  const assets = exists(distAssetsDir) ? fs.readdirSync(distAssetsDir).filter(f => /plugin-manifest-.*\.js$/.test(f)) : [];
  log('dist artifacts', {
    'dist/json-sequences/header/*': distHasHeader,
    'dist/assets/plugin-manifest-*.js': assets,
  });
}

if (fail) process.exit(1);
console.log('\nCI precheck completed.');

