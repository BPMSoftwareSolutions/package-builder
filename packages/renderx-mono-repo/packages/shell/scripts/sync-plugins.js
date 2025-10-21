#!/usr/bin/env node

/**
 * Sync script to copy json-plugins/ to public/plugins/
 */

import { readdir, readFile, writeFile, mkdir } from "fs/promises";
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
const srcRoot = getArg("--srcRoot", rootDir);
const outPublic = getArg("--outPublic", join(rootDir, "public"));

const sourceDir = join(srcRoot, "json-plugins");
const targetDir = join(outPublic, "plugins");

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

async function copyFileContent(target, content) {
  await writeFile(target, content);
}

async function syncPlugins() {
  console.log("🔄 Syncing json-plugins/ to public/plugins/...");
  try {
    await ensureDir(targetDir);

    // Always ensure plugin-manifest.json exists in public/plugins
    const targetManifestPath = join(targetDir, "plugin-manifest.json");
    let wroteManifest = false;
    // Prefer generated manifest from aggregate-plugins
    try {
      const generatedPath = join(
        sourceDir,
        ".generated",
        "plugin-manifest.json"
      );
      const content = await readFile(generatedPath);
      await copyFileContent(targetManifestPath, content);
      wroteManifest = true;
      console.log("  ✅ Copied plugin-manifest.json (generated)");
    } catch {}
    // Fallback to repo-local manifest if present
    if (!wroteManifest) {
      try {
        const fallbackPath = join(sourceDir, "plugin-manifest.json");
        const content = await readFile(fallbackPath);
        await copyFileContent(targetManifestPath, content);
        wroteManifest = true;
        console.log("  ✅ Copied plugin-manifest.json");
      } catch {}
    }
    // Last resort: create an empty manifest to unblock raw imports in tests
    if (!wroteManifest) {
      await copyFileContent(
        targetManifestPath,
        JSON.stringify({ plugins: [] }, null, 2)
      );
      console.log("  ⚠️ Created empty plugin-manifest.json (no sources found)");
    }

    // Copy any other JSON files from the source root (excluding plugin-manifest.json)
    let files = [];
    try {
      files = await readdir(sourceDir);
    } catch {}
    const jsonFiles = files.filter(
      (f) => f.endsWith(".json") && f !== "plugin-manifest.json"
    );

    for (const file of jsonFiles) {
      const sourcePath = join(sourceDir, file);
      const targetPath = join(targetDir, file);
      await copyFile(sourcePath, targetPath);
      console.log(`  ✅ Copied ${file}`);
    }

    console.log(`✨ Synced ${jsonFiles.length + 1} plugin manifest file(s)`);
  } catch (error) {
    console.error("❌ Failed to sync json-plugins:", error);
    process.exit(1);
  }
}

syncPlugins();
