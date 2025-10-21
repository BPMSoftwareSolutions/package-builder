#!/usr/bin/env node
/**
 * Hash artifact JSON files to produce an integrity descriptor.
 * Usage: node scripts/hash-artifacts.js <dir>
 */
import { createHash } from 'crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

const target = process.argv[2] || 'dist/artifacts';
const allowedExt = new Set(['.json']);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

const files = walk(target).filter(f => allowedExt.has(f.slice(f.lastIndexOf('.'))));
const manifest = { generated: new Date().toISOString(), files: {}, aggregate: '' };
const agg = createHash('sha256');
for (const f of files) {
  const rel = f.substring(target.length + 1).replace(/\\/g, '/');
  const buf = readFileSync(f);
  const h = sha256(buf);
  manifest.files[rel] = { hash: h, bytes: buf.length };
  agg.update(h);
}
manifest.aggregate = agg.digest('hex');

const outFile = join(target, 'artifacts.integrity.json');
writeFileSync(outFile, JSON.stringify(manifest, null, 2));
console.log('✅ Integrity file written:', outFile, 'files:', Object.keys(manifest.files).length);
