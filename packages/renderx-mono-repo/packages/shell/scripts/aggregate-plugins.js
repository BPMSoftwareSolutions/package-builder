#!/usr/bin/env node

/**
 * Aggregates plugin manifests from installed npm packages into a generated manifest
 * without mutating source json-plugins files. The generated file is written to:
 *   json-plugins/.generated/plugin-manifest.json
 *
 * Discovery rules:
 * - Scan node_modules for packages whose package.json includes keyword "renderx-plugin"
 *   or a top-level "renderx" field.
 * - A package may provide either:
 *    a) package.json { renderx: { manifest: "./dist/plugin-manifest.json", catalogDirs?: string[] } }
 *    b) package.json { renderx: { plugins: [...] } } inline entries
 *    c) Fallback: ./dist/plugin-manifest.json if present
 *
 * Merge strategy:
 * - Start from existing json-plugins/plugin-manifest.json (if present)
 * - Append external entries; de-duplicate by plugin id, preferring existing
 */

import { promises as fs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

async function readJson(p) {
  try {
    const txt = await fs.readFile(p, "utf-8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}
async function fileExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

function uniqueById(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const id = it && it.id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(it);
  }
  return out;
}

async function discoverPackages(nodeModulesDir) {
  const out = [];
  let dirs = [];
  try {
    dirs = await fs.readdir(nodeModulesDir);
  } catch {}
  for (const scopeOrPkg of dirs) {
    if (scopeOrPkg.startsWith(".")) continue;
    const scopePath = join(nodeModulesDir, scopeOrPkg);
    const stat = await fs.stat(scopePath).catch(() => null);
    if (!stat) continue;
    if (stat.isDirectory() && scopeOrPkg.startsWith("@")) {
      let scoped = [];
      try {
        scoped = await fs.readdir(scopePath);
      } catch {}
      for (const name of scoped) {
        const p = join(scopePath, name, "package.json");
        if (await fileExists(p)) out.push(join(scopePath, name));
      }
    } else if (stat.isDirectory()) {
      const p = join(scopePath, "package.json");
      if (await fileExists(p)) out.push(scopePath);
    }
  }
  return out;
}

async function loadPackageManifest(pkgDir) {
  const pkgJson = await readJson(join(pkgDir, "package.json"));
  if (!pkgJson) return null;
  const keywords = Array.isArray(pkgJson.keywords)
    ? pkgJson.keywords.map(String)
    : [];
  const hasKeyword = keywords.includes("renderx-plugin");
  const rx = pkgJson.renderx || null;
  if (!hasKeyword && !rx) return null;

  // Determine manifest content
  let fragment = null;
  if (rx && Array.isArray(rx.plugins)) {
    fragment = { plugins: rx.plugins };
  } else if (rx && typeof rx.manifest === "string") {
    fragment = await readJson(join(pkgDir, rx.manifest));
  } else {
    // fallback
    fragment = await readJson(join(pkgDir, "dist", "plugin-manifest.json"));
  }
  if (!fragment || !Array.isArray(fragment.plugins)) return null;

  return { pkgDir, pkgJson, renderx: rx, fragment };
}

async function aggregate() {
  const srcPluginsDir = join(rootDir, "catalog", "json-plugins");
  const generatedDir = join(srcPluginsDir, ".generated");
  const generatedOut = join(generatedDir, "plugin-manifest.json");
  await fs.mkdir(generatedDir, { recursive: true }).catch(() => {});

  // Start with existing repo-local manifest
  const base = (await readJson(
    join(srcPluginsDir, "plugin-manifest.json")
  )) || { plugins: [] };

  // Discover external packages
  const nodeModulesDir = join(rootDir, "node_modules");
  const candidates = await discoverPackages(nodeModulesDir);
  const external = [];
  for (const dir of candidates) {
    const info = await loadPackageManifest(dir).catch(() => null);
    if (info) external.push(info);
  }

  // Merge
  const merged = {
    plugins: uniqueById([
      ...(base.plugins || []),
      ...external.flatMap((e) => e.fragment.plugins || []),
    ]),
  };

  // Ensure external UI-only plugins also declare a runtime registration stub by default
  // Rationale: some conductors warn if sequences mount before the plugin id is known.
  // If a plugin entry lacks `runtime`, and its ui.module looks like a package specifier (bare or scoped),
  // inject a default runtime pointing to the same module's exported `register`.
  try {
    for (const p of merged.plugins) {
      const ui = p && p.ui;
      const hasRuntime = p && p.runtime && p.runtime.module && p.runtime.export;
      const mod = ui && typeof ui.module === "string" ? ui.module : "";
      const isBare =
        !!mod &&
        !mod.startsWith("/") &&
        !mod.startsWith(".") &&
        !mod.startsWith("http://") &&
        !mod.startsWith("https://");
      if (!hasRuntime && isBare) {
        p.runtime = { module: mod, export: "register" };
      }
    }
  } catch {}

  // If @renderx-plugins/control-panel is installed but not present in the manifest,
  // synthesize a ControlPanelPlugin entry that points to the package (UI + runtime).
  try {
    const hasCP = (merged.plugins || []).some(
      (p) => p && p.id === "ControlPanelPlugin"
    );
    if (!hasCP) {
      const cpPkg = join(
        rootDir,
        "node_modules",
        "@renderx-plugins",
        "control-panel",
        "package.json"
      );
      if (await fileExists(cpPkg)) {
        merged.plugins.push({
          id: "ControlPanelPlugin",
          ui: {
            slot: "controlPanel",
            module: "@renderx-plugins/control-panel",
            export: "ControlPanel",
          },
          runtime: {
            module: "@renderx-plugins/control-panel",
            export: "register",
          },
        });
      }
    }
  } catch {}

  await fs.writeFile(generatedOut, JSON.stringify(merged, null, 2));
  console.log(
    `🧩 Aggregated ${external.length} package(s); total plugins: ${merged.plugins.length}`
  );
  console.log(`   → ${generatedOut}`);
}

aggregate().catch((e) => {
  console.error("Aggregation failed:", e);
  process.exit(1);
});
