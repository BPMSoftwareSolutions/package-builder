#!/usr/bin/env node

/**
 * Generate interaction-manifest.json from per-plugin route catalogs
 * and component-level overrides.
 *
 * Sources:
 *  - json-interactions/*.json           → per-plugin default route catalogs
 *  - json-components/*.json            → optional component-level overrides under integration.routeOverrides or top-level routeOverrides
 *
 * Outputs:
 *  - interaction-manifest.json         (repo root)
 *  - public/interaction-manifest.json  (served to browser)
 */

import { promises as fs } from "fs";
import { readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { buildInteractionManifest } from "@renderx-plugins/manifest-tools";
import { generateExternalInteractionsCatalog } from "./derive-external-topics.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Allow overriding source root (where json-* live) and output public dir
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

// Using shared builder from manifest-tools

async function readJsonSafe(path) {
  try {
    const txt = await fs.readFile(path, "utf-8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

async function readPluginCatalogs() {
  const _localDir = join(srcRoot, "json-interactions");
  const genDir = join(srcRoot, "json-interactions", ".generated");
  async function readDirSafe(dir) {
    try {
      const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
      const catalogs = [];
      for (const f of files) {
        const json = await readJsonSafe(join(dir, f));
        if (json) catalogs.push(json);
      }
      return catalogs;
    } catch {
      return [];
    }
  }
  const generated = await readDirSafe(genDir);
  // Phase 2: only use generated catalogs; host-authored catalogs are removed
  return [...generated];
}

function extractOverridesFromComponentJson(json) {
  return (
    json?.integration?.routeOverrides ||
    json?.routeOverrides ||
    json?.integration?.interactions?.routeOverrides ||
    {}
  );
}

async function readComponentOverrides() {
  const dir = join(srcRoot, "json-components");
  try {
    const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
    const overrides = [];
    for (const f of files) {
      const json = await readJsonSafe(join(dir, f));
      if (json) overrides.push(extractOverridesFromComponentJson(json));
    }
    return overrides;
  } catch {
    return [];
  }
}

async function main() {
  const localCatalogs = await readPluginCatalogs();
  const externalCatalog = await generateExternalInteractionsCatalog();
  const componentOverrides = await readComponentOverrides();

  // Merge local and derived external catalogs
  const allCatalogs = [...localCatalogs, externalCatalog];
  const manifest = buildInteractionManifest(allCatalogs, componentOverrides);

  const outRoot = join(srcRoot === rootDir ? rootDir : process.cwd(), "interaction-manifest.json");
  await fs.mkdir(outPublicDir, { recursive: true });
  const outPublic = join(outPublicDir, "interaction-manifest.json");

  const jsonText = JSON.stringify(manifest, null, 2) + "\n";
  await fs.writeFile(outRoot, jsonText, "utf-8");
  await fs.writeFile(outPublic, jsonText, "utf-8");

  console.log(
    "✅ interaction-manifest.json generated:",
    Object.keys(manifest.routes).length,
    "routes"
  );
}

// If executed as a script, run main(); when imported (tests), do nothing.
// Use a cross-platform check that works on Windows and POSIX
import { fileURLToPath as _fileURLToPath } from "url";
const _isMain = _fileURLToPath(import.meta.url) === __filename;
if (_isMain) {
  main().catch((err) => {
    console.error("❌ Failed to generate interaction-manifest.json", err);
    process.exit(1);
  });
}
