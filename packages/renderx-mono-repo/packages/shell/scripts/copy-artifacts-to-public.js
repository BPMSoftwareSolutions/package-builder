#!/usr/bin/env node
// Copies pre-built artifact set into public/ (used in dev:artifacts mode)
import { cp, mkdir } from 'fs/promises';
import { join } from 'path';

const artifactsDir = process.env.ARTIFACTS_DIR || process.argv.slice(2)[0];
if (!artifactsDir) {
  console.error('Provide ARTIFACTS_DIR env or first arg path to artifacts directory');
  process.exit(1);
}
const target = join(process.cwd(), 'public');
await mkdir(target, { recursive: true });
await cp(artifactsDir, target, { recursive: true });
console.log('✅ Copied artifacts from', artifactsDir, 'to public/');
