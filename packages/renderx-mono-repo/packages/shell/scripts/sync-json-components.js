#!/usr/bin/env node

/**
 * Sync component JSON catalogs to public/json-components/.
 * Enhancements:
 *  - Discovers node_modules packages that declare `renderx.components` in their package.json
 *    and copies their component trees first
 *  - Then (for transition) copies any repo-local catalog/json-components files that were not
 *    already provided by a package (prefer package to avoid duplication)
 */

import { readdir, readFile, writeFile, mkdir, stat } from 'fs/promises';
import { join, dirname, resolve, sep } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.findIndex(a => a === name || a.startsWith(name + '='));
  if (i === -1) return def;
  const eq = args[i].indexOf('=');
  if (eq > -1) return args[i].slice(eq + 1);
  const nxt = args[i + 1];
  if (nxt && !nxt.startsWith('--')) return nxt;
  return def;
}
const srcRoot = getArg('--srcRoot', join(rootDir, 'catalog'));
const outPublic = getArg('--outPublic', join(rootDir, 'public'));

const localComponentsDir = join(srcRoot, 'json-components');
const targetDir = join(outPublic, 'json-components');
const nodeModulesDir = join(rootDir, 'node_modules');

async function ensureDir(dir) {
  try { await mkdir(dir, { recursive: true }); } catch (err) { if (err.code !== 'EEXIST') throw err; }
}

async function copyFile(source, target) {
  const content = await readFile(source);
  await ensureDir(dirname(target));
  await writeFile(target, content);
}

async function safeJsonRead(p) {
  try { return JSON.parse(await readFile(p, 'utf-8')); } catch { return null; }
}

async function existsDir(p) {
  try { return (await stat(p)).isDirectory(); } catch { return false; }
}

async function listJsonFiles(dir) {
  try {
    const files = await readdir(dir);
    return files.filter(f => f.toLowerCase().endsWith('.json')).map(f => join(dir, f));
  } catch { return []; }
}

async function discoverComponentPackageDirs() {
  const results = [];
  if (!(await existsDir(nodeModulesDir))) return results;

  // Helper to process a single package directory path
  async function processPackage(pkgDir) {
    const pkgJson = await safeJsonRead(join(pkgDir, 'package.json'));
    const components = pkgJson?.renderx?.components;
    if (Array.isArray(components) && components.length) {
      for (const rel of components) {
        const abs = resolve(pkgDir, rel);
        if (await existsDir(abs)) results.push(abs);
      }
    }
  }

  // Scan node_modules root
  const top = await readdir(nodeModulesDir).catch(() => []);
  for (const name of top) {
    if (name.startsWith('.')) continue;
    const p = join(nodeModulesDir, name);
    const isDir = await existsDir(p);
    if (!isDir) continue;
    if (name.startsWith('@')) {
      // Scoped packages
      const scoped = await readdir(p).catch(() => []);
      for (const sub of scoped) {
        const subPath = join(p, sub);
        if (await existsDir(subPath)) await processPackage(subPath);
      }
    } else {
      await processPackage(p);
    }
  }
  return results;
}

async function syncJsonComponents() {
  console.log('🔄 Syncing component catalogs to public/json-components ...');

  try {
    await ensureDir(targetDir);

    const already = new Set();

    // 1) Copy from discovered packages (preferred)
    const pkgDirs = await discoverComponentPackageDirs();
    if (pkgDirs.length) console.log(`  📦 Found ${pkgDirs.length} package component dir(s)`);
    for (const dir of pkgDirs) {
      const files = await listJsonFiles(dir);
      for (const abs of files) {
        const fileName = abs.split(sep).pop();
        if (!fileName) continue;
        const out = join(targetDir, fileName);
        await copyFile(abs, out);
        already.add(fileName);
        console.log(`  ✅ [pkg] ${fileName}`);
      }
    }

    // 2) Copy from local catalog/json-components for files not already provided
    const localFiles = await listJsonFiles(localComponentsDir);
    let localCopied = 0;
    for (const abs of localFiles) {
      const fileName = abs.split(sep).pop();
      if (!fileName || already.has(fileName)) continue; // prefer package
      const out = join(targetDir, fileName);
      await copyFile(abs, out);
      localCopied++;
      console.log(`  ↪️  [local] ${fileName}`);
    }

    console.log(`✨ Sync complete. Packages: ${already.size} file(s), Local added: ${localCopied} file(s)`);
  } catch (error) {
    console.error('❌ Failed to sync json-components:', error);
    process.exit(1);
  }
}

syncJsonComponents();
