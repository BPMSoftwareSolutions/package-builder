#!/usr/bin/env node

/**
 * Codemod: migrate plugin imports from host internals (src/**) to @renderx/host-sdk
 *
 * Usage:
 *   node scripts/codemods/migrate-imports-to-host-sdk.js                # default: scans plugins/**/*.{ts,tsx,js,jsx} and applies changes
 *   node scripts/codemods/migrate-imports-to-host-sdk.js --dry-run      # shows planned changes only
 *   node scripts/codemods/migrate-imports-to-host-sdk.js pathA pathB    # scan specific paths/files (dirs or files)
 *   node scripts/codemods/migrate-imports-to-host-sdk.js --backup       # write a .bak alongside each changed file
 *
 * Notes:
 * - We only rewrite imports that point at known public SDK surface equivalents:
 *   src/conductor, src/EventRouter, src/interactionManifest,
 *   src/feature-flags/flags, src/component-mapper/mapper, src/jsonComponent.mapper
 * - Other src/** imports are left untouched.
 */

import { promises as fs } from "fs";
import { stat, readdir } from "fs/promises";
import { join, extname } from "path";

const exts = new Set([".ts", ".tsx", ".js", ".jsx"]);
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const MAKE_BACKUP = args.includes("--backup");
const userPaths = args.filter((a) => !a.startsWith("--"));

const defaultRoots = userPaths.length ? userPaths : ["plugins"];

/** Known internal modules to map → @renderx/host-sdk */
const INTERNAL_MATCHERS = [
  /(^|\/)src\/conductor(\.|\/|$)/,
  /(^|\/)src\/EventRouter(\.|\/|$)/,
  /(^|\/)src\/interactionManifest(\.|\/|$)/,
  /(^|\/)src\/feature-flags\/flags(\.|\/|$)/,
  /(^|\/)src\/component-mapper\/mapper(\.|\/|$)/,
  /(^|\/)src\/jsonComponent\.mapper(\.|\/|$)/,
];

function shouldRewriteImport(source) {
  const norm = String(source).replace(/\\/g, "/");
  return INTERNAL_MATCHERS.some((rx) => rx.test(norm));
}

function rewriteImportsInText(text) {
  let changed = false;
  const importRe = /(import\s+[^;]*?from\s+["'])([^"']+)(["'];?)/g;
  const sideEffectRe = /(^|\n)(import\s+["'])([^"']+)(["'];?)/g; // import "...";

  const replaceFn = (_m, p1, src, p3) => {
    if (shouldRewriteImport(src)) {
      changed = true;
      return `${p1}@renderx/host-sdk${p3}`;
    }
    return _m;
  };

  // Named/default imports
  let out = text.replace(importRe, replaceFn);
  // Side-effect only imports
  out = out.replace(sideEffectRe, (m, lead, p2, src, p4) => {
    if (shouldRewriteImport(src)) {
      changed = true;
      return `${lead}${p2}@renderx/host-sdk${p4}`;
    }
    return m;
  });

  return { out, changed };
}

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (_) {
    return; // skip missing
  }
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      yield* walk(full);
    } else if (exts.has(extname(ent.name))) {
      yield full;
    }
  }
}

async function processFile(file) {
  try {
    const orig = await fs.readFile(file, "utf-8");
    const { out, changed } = rewriteImportsInText(orig);
    if (!changed) return { file, changed: false };

    if (DRY_RUN) {
      console.log(`[dry-run] Would update imports in: ${file}`);
      return { file, changed: true };
    }

    if (MAKE_BACKUP) {
      await fs.writeFile(file + ".bak", orig, "utf-8");
    }
    await fs.writeFile(file, out, "utf-8");
    console.log(`✔ Updated imports in: ${file}`);
    return { file, changed: true };
  } catch (err) {
    console.error(`✖ Failed to process ${file}:`, err?.message || err);
    return { file, changed: false, error: err };
  }
}

async function gatherTargets(paths) {
  const files = [];
  for (const p of paths) {
    try {
      const st = await stat(p);
      if (st.isDirectory()) {
        for await (const f of walk(p)) files.push(f);
      } else if (st.isFile() && exts.has(extname(p))) {
        files.push(p);
      }
    } catch {
      // ignore missing
    }
  }
  return files;
}

async function main() {
  const targets = await gatherTargets(defaultRoots);
  if (!targets.length) {
    console.log("No matching files found. Specify paths or run from repo root.");
    process.exit(0);
  }
  let changedCount = 0;
  for (const f of targets) {
    const res = await processFile(f);
    if (res.changed) changedCount++;
  }
  console.log(`\nDone. Files changed: ${changedCount}/${targets.length}${DRY_RUN ? " (dry-run)" : ""}.`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

