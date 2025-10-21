#!/usr/bin/env node
/**
 * Public API validator: ensures host-sdk only exports from approved allowlist.
 * Usage: node scripts/validate-public-api.js
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const sdkIndex = path.join(root, 'packages', 'host-sdk', 'public-api.ts');
const src = readFileSync(sdkIndex, 'utf-8');

// Allowed relative import roots inside public-api (no deep wildcards elsewhere)
const ALLOW = [
  '../../src/conductor',
  'musical-conductor',
  '../../src/EventRouter',
  '../../src/interactionManifest',
  '../../src/feature-flags/flags',
  '../../src/domain/mapping/component-mapper/mapper',
  '../../src/jsonComponent.mapper',
  './pluginManifest'
];

const importRegex = /export\s+(?:type\s+)?{?[^}]*}?\s*from\s*['"]([^'";]+)['"];?|export\s+\{[^}]+\}\s+from\s+['"]([^'"]+)['"]/g;
let m; const bad = [];
while ((m = importRegex.exec(src))) {
  const spec = m[1] || m[2];
  if (!spec) continue;
  if (!ALLOW.includes(spec)) bad.push(spec);
}
if (bad.length) {
  console.error('\n❌ Public API validation failed. Disallowed imports in public-api.ts:', bad.join(', '));
  process.exit(1);
}
console.log('✅ Public API validation passed.');
