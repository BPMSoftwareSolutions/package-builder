#!/usr/bin/env node
/**
 * pb-move.ts
 * Moves a scaffolded package from working area to packages/ directory
 */

import { rename, access, mkdir } from 'fs/promises';
import { join } from 'path';
import { parseArgs } from 'util';

async function movePackage(name: string) {
  const sourceDir = join(process.cwd(), name);
  const targetDir = join(process.cwd(), 'packages', name);

  console.log(`📦 Moving package: ${name}`);
  console.log(`   From: ${sourceDir}`);
  console.log(`   To: ${targetDir}`);

  // Check if source exists
  try {
    await access(sourceDir);
  } catch {
    console.error(`❌ Error: Source directory not found: ${sourceDir}`);
    console.error(`   Did you run pb-scaffold.ts first?`);
    process.exit(1);
  }

  // Ensure packages directory exists
  await mkdir(join(process.cwd(), 'packages'), { recursive: true });

  // Check if target already exists
  try {
    await access(targetDir);
    console.error(`❌ Error: Target directory already exists: ${targetDir}`);
    console.error(`   Remove it first or choose a different name`);
    process.exit(1);
  } catch {
    // Target doesn't exist, which is what we want
  }

  // Move the directory
  await rename(sourceDir, targetDir);

  console.log(`✅ Package moved successfully to: ${targetDir}`);
  console.log(`\nNext steps:`);
  console.log(`  1. cd packages/${name}`);
  console.log(`  2. npm install`);
  console.log(`  3. npm test`);
  console.log(`  4. npm run build`);
}

// Parse CLI arguments
const { positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true
});

const name = positionals[0];
if (!name) {
  console.error('❌ Error: Package name is required');
  console.error('Usage: node scripts/pb-move.ts <name>');
  process.exit(1);
}

movePackage(name).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

