#!/usr/bin/env node
/**
 * Show repository statistics
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';

async function countFiles(dir, extensions = []) {
  let count = 0;
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      count += await countFiles(path, extensions);
    } else if (entry.isFile()) {
      if (extensions.length === 0 || extensions.some(ext => entry.name.endsWith(ext))) {
        count++;
      }
    }
  }

  return count;
}

async function showStats() {
  console.log('📊 RenderX Plugin Lab Statistics\n');

  const tsFiles = await countFiles('src', ['.ts', '.tsx']);
  const testFiles = await countFiles('tests', ['.ts', '.test.ts']);
  const pluginDirs = await readdir('plugins');

  console.log(`  TypeScript files: ${tsFiles}`);
  console.log(`  Test files: ${testFiles}`);
  console.log(`  Plugins: ${pluginDirs.length}`);
  console.log('');
}

showStats().catch(console.error);
