#!/usr/bin/env node

/**
 * Sync script to copy json-sequences/ to public/json-sequences/
 * Also copies sequences declared by installed renderx plugin packages.
 */

import { readdir, readFile, writeFile, mkdir, stat } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
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
const srcRoot = getArg('--srcRoot', rootDir);
const outPublic = getArg('--outPublic', join(rootDir, 'public'));

const sourceDir = join(srcRoot, "json-sequences");
const targetDir = join(outPublic, "json-sequences");

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
  }
}

async function copyFile(source, target) {
  const content = await readFile(source);
  await writeFile(target, content);
}

async function copyTreeWithBase(src, dst, baseLabel) {
  await ensureDir(dst);
  const entries = await readdir(src, { withFileTypes: true }).catch(() => []);
  for (const ent of entries) {
    const srcPath = join(src, ent.name);
    const dstPath = join(dst, ent.name);
    let isDir = ent.isDirectory();
    let isFile = ent.isFile();
    if (ent.isSymbolicLink && ent.isSymbolicLink()) {
      const s = await stat(srcPath).catch(()=>null);
      if (s) { isDir = s.isDirectory(); isFile = s.isFile(); }
    }
    if (isDir) {
      await copyTreeWithBase(srcPath, dstPath, baseLabel);
    } else if (isFile && ent.name.endsWith(".json")) {
      await copyFile(srcPath, dstPath);
      const rel = srcPath.replace(baseLabel + "\\", "").replace(baseLabel + "/", "");
      console.log(`  ✅ Copied ${rel}`);
    }
  }
}

async function discoverRenderxSequencePackages(nodeModulesDir) {
  let out = [];
  let scopes = [];
  try { scopes = await readdir(nodeModulesDir, { withFileTypes: true }); } catch {}
  for (const ent of scopes) {
    if (ent.name.startsWith('.')) continue;
    const isDirLike = ent.isDirectory() || (ent.isSymbolicLink && ent.isSymbolicLink());
    if (!isDirLike) continue;
    if (ent.name.startsWith('@')) {
      const scopePath = join(nodeModulesDir, ent.name);
      let scoped = [];
      try { scoped = await readdir(scopePath, { withFileTypes: true }); } catch {}
      for (const p of scoped) {
        const isPkgDirLike = p.isDirectory() || (p.isSymbolicLink && p.isSymbolicLink());
        if (!isPkgDirLike) continue;
        out.push(join(scopePath, p.name));
      }
    } else {
      out.push(join(nodeModulesDir, ent.name));
    }
  }
  const results = [];
  for (const pkgDir of out) {
    const pkgJsonPath = join(pkgDir, 'package.json');
    const exists = await stat(pkgJsonPath).catch(()=>null);
    if (!exists) continue;
    let pkgJson = null;
    try { pkgJson = JSON.parse(await readFile(pkgJsonPath, 'utf-8')); } catch { pkgJson = null; }
    if (!pkgJson) continue;
    const rx = pkgJson.renderx || null;
    const keywords = Array.isArray(pkgJson.keywords) ? pkgJson.keywords.map(String) : [];
    const isRenderx = !!rx || keywords.includes('renderx-plugin');
    if (!isRenderx) continue;
    const seqs = Array.isArray(rx?.sequences) ? rx.sequences : [];
    if (seqs.length === 0) continue;
    results.push({ pkgDir, pkgJson, sequences: seqs });
  }
  return results;
}

async function syncJsonSequences() {
  console.log("🔄 Syncing json-sequences/ to public/json-sequences/...");
  try {
    await ensureDir(targetDir);
    // Guardrail: prevent repo from carrying local library-component catalogs once externalized
    try {
      const localLibCompDir = join(sourceDir, 'library-component');
      const s = await stat(localLibCompDir).catch(() => null);
      if (s && s.isDirectory()) {
        console.error('❌ Detected local json-sequences/library-component in the host repo. This plugin\'s catalogs must come from @renderx-plugins/library-component. Please remove json-sequences/library-component/.');
        process.exit(1);
      }
    } catch {}

    // Copy repo-local sequences first
    await copyTreeWithBase(sourceDir, targetDir, sourceDir);

    // Then copy any package-provided sequences (declared via package.json renderx.sequences)
    const nodeModulesDir = join(rootDir, 'node_modules');
    const pkgs = await discoverRenderxSequencePackages(nodeModulesDir);
    for (const pkg of pkgs) {
      const pkgName = pkg.pkgJson?.name || pkg.pkgDir;
      for (const rel of pkg.sequences) {
        const seqRoot = join(pkg.pkgDir, rel);
        console.log(`📦 Including sequences from ${pkgName}/${rel}`);
        await copyTreeWithBase(seqRoot, targetDir, seqRoot);
      }
    }

    console.log("✨ Synced json-sequences catalogs");
  } catch (error) {
    console.error("❌ Failed to sync json-sequences:", error);
    process.exit(1);
  }
}

syncJsonSequences();
