/**
 * ESLint plugin: require-plugin-manifest-fragment (#133)
 *
 * Enforce that external plugin packages (packages/*) contribute a plugin manifest fragment
 * so the host can aggregate them (see scripts/aggregate-plugins.js and docs/external-plugin-packaging.md).
 *
 * A qualifying package (keywords includes "renderx-plugin" or has a top-level `renderx` field)
 * must provide one of the following:
 *   - package.json { renderx: { plugins: [...] } }
 *   - package.json { renderx: { manifest: "./dist/plugin-manifest.json" } } (file must exist)
 *   - fallback: ./dist/plugin-manifest.json exists
 */

import fs from "node:fs";
import path from "node:path";

function isUnderPackages(filename) {
  const f = String(filename || "");
  return f.includes("/packages/") || f.includes("\\packages\\");
}

function findPackageRoot(startDir) {
  try {
    let dir = startDir;
    for (let i = 0; i < 10; i++) {
      const pkgPath = path.join(dir, "package.json");
      if (fs.existsSync(pkgPath)) return dir;
      const parent = path.dirname(dir);
      if (!parent || parent === dir) break;
      dir = parent;
    }
  } catch {}
  return null;
}

function readJson(p) {
  try {
    const txt = fs.readFileSync(p, "utf-8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

function hasManifestFragment(pkgRoot, pkgJson) {
  // renderx.plugins array present and non-empty
  const rx = pkgJson && pkgJson.renderx;
  if (rx && Array.isArray(rx.plugins) && rx.plugins.length > 0) return true;

  // renderx.manifest file path
  if (rx && typeof rx.manifest === "string") {
    const p = path.join(pkgRoot, rx.manifest);
    if (fs.existsSync(p)) return true;
  }

  // fallback dist/plugin-manifest.json
  const fallback = path.join(pkgRoot, "dist", "plugin-manifest.json");
  if (fs.existsSync(fallback)) return true;

  return false;
}

function hostScanEnabled() {
  try {
    const v = process.env.RENDERX_PLUGIN_MANIFEST_HOST_SCAN;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      if (s === '0' || s === 'false' || s === 'off') return false;
      if (s === '1' || s === 'true' || s === 'on') return true;
    }
    // Default: ENABLE host-scan when env is not set
    return true;
  } catch {
    // If env access throws (unlikely), default to enabled
    return true;
  }
}

function shouldScanNodeModules(filename) {
  const f = String(filename || "");
  const isAggregator = (
    f.endsWith("/scripts/aggregate-plugins.js") ||
    f.endsWith("\\scripts\\aggregate-plugins.js")
  );
  return isAggregator && hostScanEnabled();
}

function discoverNodeModulePluginDirs(nodeModulesDir) {
  const results = [];
  try {
    const entries = fs.readdirSync(nodeModulesDir, { withFileTypes: true });
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      if (ent.name.startsWith("@")) {
        const scopeDir = path.join(nodeModulesDir, ent.name);
        let scoped = [];
        try { scoped = fs.readdirSync(scopeDir, { withFileTypes: true }); } catch {}
        for (const s of scoped) {
          if (!s.isDirectory()) continue;
          const pkgDir = path.join(scopeDir, s.name);
          if (fs.existsSync(path.join(pkgDir, "package.json"))) results.push(pkgDir);
        }
      } else {
        const pkgDir = path.join(nodeModulesDir, ent.name);
        if (fs.existsSync(path.join(pkgDir, "package.json"))) results.push(pkgDir);
      }
    }
  } catch {}
  return results;
}

export default {
  rules: {
    "require-plugin-manifest-fragment": {
      meta: {
        type: "problem",
        docs: {
          description:
            "External plugin packages must contribute a plugin manifest fragment (issue #133)",
        },
        schema: [],
        messages: {
          missing:
            "This plugin package must contribute a plugin manifest fragment via package.json { renderx: { plugins: [...] } } or { renderx: { manifest: '<path>' } } or dist/plugin-manifest.json. See docs/external-plugin-packaging.md.",
        },
      },
      create(context) {
        const filename = context.getFilename?.() || "";

        // Mode A: package-local enforcement for monorepo packages/*
        if (isUnderPackages(filename)) {
          const pkgRoot = findPackageRoot(path.dirname(filename));
          if (!pkgRoot) return {};

          const pkgJson = readJson(path.join(pkgRoot, "package.json"));
          if (!pkgJson) return {};

          // Qualifying package: has keyword renderx-plugin OR a renderx field
          const keywords = Array.isArray(pkgJson.keywords)
            ? pkgJson.keywords.map(String)
            : [];
          const rx = pkgJson.renderx || null;
          const isPlugin = keywords.includes("renderx-plugin") || !!(rx && (Array.isArray(rx.plugins) || typeof rx.manifest === "string"));
          if (!isPlugin) return {};

          const hasFragment = hasManifestFragment(pkgRoot, pkgJson);

          return {
            Program(node) {
              if (!hasFragment) {
                context.report({ node, messageId: "missing" });
              }
            },
          };
        }

        // Mode B: host-level enforcement for installed external packages in node_modules
        if (shouldScanNodeModules(filename)) {
          const cwd = (context.getCwd && context.getCwd()) || process.cwd();
          const nodeModulesDir = path.join(cwd, "node_modules");
          const pkgDirs = discoverNodeModulePluginDirs(nodeModulesDir);
          const allow = new Set(
            String(process.env.RENDERX_PLUGIN_MANIFEST_ALLOW || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          );
          const offenders = [];
          for (const dir of pkgDirs) {
            const pkgJson = readJson(path.join(dir, "package.json"));
            if (!pkgJson) continue;
            const name = pkgJson.name || dir;
            if (allow.has(String(name))) continue;
            const keywords = Array.isArray(pkgJson.keywords)
              ? pkgJson.keywords.map(String)
              : [];
            const rx = pkgJson.renderx || null;
            const isPlugin = keywords.includes("renderx-plugin") || !!(rx && (Array.isArray(rx.plugins) || typeof rx.manifest === "string"));
            if (!isPlugin) continue;
            if (!hasManifestFragment(dir, pkgJson)) {
              offenders.push(name);
            }
          }
          return {
            Program(node) {
              for (const _ of offenders) {
                context.report({ node, messageId: "missing" });
              }
            },
          };
        }

        return {};
      },
    },
  },
};

