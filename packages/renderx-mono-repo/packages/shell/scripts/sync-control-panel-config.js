#!/usr/bin/env node

/**
 * Copy the Control Panel schema JSON from the package source to public/plugins/
 * so the UI can fetch it at runtime: /plugins/control-panel/config/control-panel.schema.json
 */

import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function copyFile(src, dest) {
  const buf = await readFile(src);
  await writeFile(dest, buf);
}

async function findFirstExisting(paths) {
  for (const p of paths) {
    try {
      await access(p);
      return p;
    } catch {
      // continue
    }
  }
  return null;
}

async function main() {
  const candidates = [
    // Prefer installed package (externalized)
    join(rootDir, 'node_modules', '@renderx-plugins', 'control-panel', 'src', 'config', 'control-panel.schema.json'),
    join(rootDir, 'node_modules', '@renderx-plugins', 'control-panel', 'config', 'control-panel.schema.json'),
    join(rootDir, 'node_modules', '@renderx-plugins', 'control-panel', 'dist', 'config', 'control-panel.schema.json'),
    // Fallback: local workspace package (during transition)
    join(rootDir, 'packages', 'control-panel', 'src', 'config', 'control-panel.schema.json'),
  ];

  const outDir = join(rootDir, 'public', 'plugins', 'control-panel', 'config');
  const dest = join(outDir, 'control-panel.schema.json');
  try {
    console.log('🔄 Syncing Control Panel schema to public/plugins/control-panel/config ...');
    await ensureDir(outDir);
    const src = await findFirstExisting(candidates);
    if (!src) {
      // If a schema already exists at the destination (from a prior sync/commit), keep it
      try {
        await access(dest);
        console.log('  ℹ️ Schema already present at destination; keeping existing file');
        return;
      } catch {
        console.warn('  ⚠️ Schema source not found in node_modules; destination missing too. Falling back to default.');
        // Write a tiny default schema to keep runtime working; UI will fallback further if needed
        await ensureDir(outDir);
        await writeFile(dest, JSON.stringify({ version: '1.0.0', sections: [] }, null, 2));
        console.log('  ✅ Wrote minimal default control-panel.schema.json');
        return;
      }
    }
    await copyFile(src, dest);
    console.log('  ✅ Copied control-panel.schema.json');
  } catch (err) {
    console.error('❌ Failed to sync Control Panel schema:', err?.message || err);
    process.exit(1);
  }
}

main();

