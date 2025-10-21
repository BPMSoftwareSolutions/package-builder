#!/usr/bin/env node
/**
 * CI precheck for @renderx package availability and manifest presence.
 * - Logs resolution for key packages (require.resolve and dynamic import)
 * - Lists node_modules/@renderx contents
 * - Verifies plugin manifest and sequence catalogs exist
 * - If dist/ exists, also verifies dist copies
 *
 * Fails fast (exit 1) if critical checks fail:
 * - cannot import @renderx/host-sdk
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
const resolvedHostSdk = safeResolve('@renderx/host-sdk');
const resolvedConductor = safeResolve('@renderx/conductor');
log('module resolution (require.resolve)', {
  '@renderx/host-sdk': resolvedHostSdk || 'NOT RESOLVED',
  '@renderx/conductor': resolvedConductor || 'NOT RESOLVED',
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
const importHostSdk = await tryImport('@renderx/host-sdk');
const importConductor = await tryImport('@renderx/conductor');
log('module import (dynamic)', {
  '@renderx/host-sdk': importHostSdk,
  '@renderx/conductor': importConductor,
});
if (!importHostSdk.startsWith('import OK')) {
  console.error('FATAL: cannot import @renderx/host-sdk');
  fail = true;
}

// 2) List @renderx directory contents if present
const orgDir = to('node_modules', '@renderx');
if (exists(orgDir)) {
  const entries = fs.readdirSync(orgDir, { withFileTypes: true }).map(d => (d.isDirectory() ? d.name + '/' : d.name));
  log('node_modules/@renderx', entries);
} else {
  log('node_modules/@renderx', 'directory not found');
}

// 3) Public artifacts presence
const publicManifest = to('public', 'plugins', 'plugin-manifest.json');
log('public artifacts', {
  'public/plugins/plugin-manifest.json': exists(publicManifest),
});

// 4) Dist artifacts presence (if built already)
const distDir = to('dist');
if (exists(distDir)) {
  const distAssetsDir = to('dist', 'assets');
  const assets = exists(distAssetsDir) ? fs.readdirSync(distAssetsDir).filter(f => /plugin-manifest-.*\.js$/.test(f)) : [];
  log('dist artifacts', {
    'dist/assets/plugin-manifest-*.js': assets,
  });
}

// 5) Test harness infrastructure
const testHarnessDir = to('src', 'test-harness');
const testPluginLoading = to('src', 'test-plugin-loading.html');
const testPluginLoader = to('src', 'test-plugin-loader.tsx');
log('test harness infrastructure', {
  'src/test-harness/': exists(testHarnessDir),
  'src/test-plugin-loading.html': exists(testPluginLoading),
  'src/test-plugin-loader.tsx': exists(testPluginLoader),
});

// 6) Cypress configuration
const cypressConfig = to('cypress.config.ts');
const cypressSupport = to('cypress', 'support', 'e2e.ts');
const cypressE2e = to('cypress', 'e2e');
log('cypress configuration', {
  'cypress.config.ts': exists(cypressConfig),
  'cypress/support/e2e.ts': exists(cypressSupport),
  'cypress/e2e/': exists(cypressE2e),
});

if (fail) process.exit(1);
console.log('\nCI precheck completed.');

