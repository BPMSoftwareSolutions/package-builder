#!/usr/bin/env node

// Copies JSON source catalogs from a configurable srcRoot (default: catalog/)
// into the repo root so Node-based tests and tools that read from
// process.cwd()/json-sequences and process.cwd()/json-components continue to work.
//
// - Copies all JSON files under srcRoot/json-sequences to json-sequences (same structure)
// - Copies all JSON files under srcRoot/json-components to json-components (same structure)

import { readdir, readFile, writeFile, mkdir, stat } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.findIndex((a) => a === name || a.startsWith(name + "="));
  if (i === -1) return def;
  const eq = args[i].indexOf("=");
  if (eq > -1) return args[i].slice(eq + 1);
  const nxt = args[i + 1];
  if (nxt && !nxt.startsWith("--")) return nxt;
  return def;
}

const srcRoot = getArg("--srcRoot", join(rootDir, "catalog"));

const catalogSequences = join(srcRoot, "json-sequences");
const catalogComponents = join(srcRoot, "json-components");
const rootSequences = join(rootDir, "json-sequences");
const rootComponents = join(rootDir, "json-components");

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (err) {
    if (err && err.code !== "EEXIST") throw err;
  }
}

async function copyJsonFile(src, dst) {
  // Only copy .json files
  if (!src.toLowerCase().endsWith(".json")) return;
  const buf = await readFile(src);
  await ensureDir(dirname(dst));
  await writeFile(dst, buf);
}

async function copyJsonTree(srcDir, dstDir) {
  const entries = await readdir(srcDir, { withFileTypes: true }).catch(
    () => []
  );
  for (const ent of entries) {
    if (ent.name.startsWith(".")) continue;
    const srcPath = join(srcDir, ent.name);
    const dstPath = join(dstDir, ent.name);
    let isDir = ent.isDirectory();
    let isFile = ent.isFile();
    // Handle symlinks by checking real stat
    if (ent.isSymbolicLink && ent.isSymbolicLink()) {
      const s = await stat(srcPath).catch(() => null);
      if (s) {
        isDir = s.isDirectory();
        isFile = s.isFile();
      }
    }
    if (isDir) {
      await copyJsonTree(srcPath, dstPath);
    } else if (isFile) {
      await copyJsonFile(srcPath, dstPath);
    }
  }
}

async function main() {
  try {
    console.log("🔄 Syncing JSON sources from catalog into repo root...");
    await ensureDir(rootSequences);
    await ensureDir(rootComponents);

    // Copy sequences (deep)
    await copyJsonTree(catalogSequences, rootSequences);

    // Copy components (deep to include nested json-topics)
    await copyJsonTree(catalogComponents, rootComponents);

    console.log(
      "✨ Synced JSON sources to repo root (json-sequences/, json-components/)"
    );
  } catch (err) {
    console.error("❌ Failed to sync JSON sources:", err);
    process.exit(1);
  }
}

main();
