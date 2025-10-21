#!/usr/bin/env node

/**
 * Generate layout-manifest.json from json-layout/layout.json
 *
 * Sources:
 *  - json-layout/layout.json           → layout configuration
 *
 * Outputs:
 *  - layout-manifest.json         (repo root)
 *  - public/layout-manifest.json  (served to browser)
 */

import { promises as fs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Args
const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.findIndex((a) => a === name || a.startsWith(name + '='));
  if (i === -1) return def;
  const eq = args[i].indexOf('=');
  if (eq > -1) return args[i].slice(eq + 1);
  const nxt = args[i + 1];
  if (nxt && !nxt.startsWith('--')) return nxt;
  return def;
}
const srcRoot = getArg('--srcRoot', rootDir);
const outPublicDir = getArg('--outPublic', join(rootDir, 'public'));

async function readJsonSafe(path) {
  try {
    const txt = await fs.readFile(path, "utf-8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

async function main() {
  const layoutPath = join(srcRoot, "json-layout", "layout.json");
  const manifest = await readJsonSafe(layoutPath);

  if (!manifest) {
    console.error("❌ Failed to read json-layout/layout.json");
    process.exit(1);
  }

  // Ensure public directory exists
  const publicDir = outPublicDir;
  await fs.mkdir(publicDir, { recursive: true });

  const outRoot = join(srcRoot === rootDir ? rootDir : process.cwd(), "layout-manifest.json");
  const outPublic = join(publicDir, "layout-manifest.json");

  const jsonText = JSON.stringify(manifest, null, 2) + "\n";
  await fs.writeFile(outRoot, jsonText, "utf-8");
  await fs.writeFile(outPublic, jsonText, "utf-8");

  console.log("✅ layout-manifest.json generated");
}

// If executed as a script, run main(); when imported (tests), do nothing.
import { fileURLToPath as _fileURLToPath } from "url";
const _isMain = _fileURLToPath(import.meta.url) === __filename;
if (_isMain) {
  main().catch((err) => {
    console.error("❌ Failed to generate layout-manifest.json", err);
    process.exit(1);
  });
}
