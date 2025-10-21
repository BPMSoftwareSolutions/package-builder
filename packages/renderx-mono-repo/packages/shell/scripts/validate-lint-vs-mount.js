#!/usr/bin/env node
/**
 * Validate ESLint served-sequences-mountable results against predicted mountable plugin IDs.
 * - Predicts mountable pluginIds by inspecting public/json-sequences/** and public/plugins/plugin-manifest.json
 * - Runs ESLint (JSON output) and compares any reported pluginIds with predicted mounted set
 */

import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';
import { spawnSync } from 'node:child_process';

const cwd = process.cwd();

function loadJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function getServedSequenceDirs(root) {
  const dirs = [
    path.join(root, 'public', 'json-sequences'),
    path.join(root, 'json-sequences'),
  ];
  return dirs.filter((d) => fs.existsSync(d));
}

function normalizeHandlersPackage(p) {
  if (!p || typeof p !== 'string') return null;
  const parts = p.split('/').filter(Boolean);
  if (p.startsWith('@')) {
    if (parts.length >= 2) return `@${parts[0]}/${parts[1]}`.replace(/^@@/, '@');
  }
  return parts.length >= 1 ? parts[0] : null;
}

function getHandlersPathForSequence(seqDir, fileName) {
  try {
    const idx = path.join(seqDir, 'index.json');
    if (!fs.existsSync(idx)) return null;
    const idxJson = JSON.parse(fs.readFileSync(idx, 'utf8'));
    const sequences = Array.isArray(idxJson?.sequences) ? idxJson.sequences : [];
    const match = sequences.find((s) => s?.file === fileName && typeof s?.handlersPath === 'string');
    if (match) return normalizeHandlersPackage(match.handlersPath);
    const firstWithHandlers = sequences.find((s) => typeof s?.handlersPath === 'string');
    return firstWithHandlers ? normalizeHandlersPackage(firstWithHandlers.handlersPath) : null;
  } catch { return null; }
}

function loadManifestIdsByModule(root) {
  const candidates = [
    path.join(root, 'catalog', 'json-plugins', '.generated', 'plugin-manifest.json'),
    path.join(root, 'public', 'plugins', 'plugin-manifest.json'),
  ];
  const map = new Map();
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    try {
      const json = JSON.parse(fs.readFileSync(p, 'utf8'));
      const items = Array.isArray(json?.plugins) ? json.plugins : [];
      for (const item of items) {
        const id = item?.id;
        const runtimeModule = item?.runtime?.module;
        const uiModule = item?.ui?.module;
        if (id && runtimeModule) {
          if (!map.has(runtimeModule)) map.set(runtimeModule, new Set());
          map.get(runtimeModule).add(id);
        }
        if (id && uiModule) {
          if (!map.has(uiModule)) map.set(uiModule, new Set());
          map.get(uiModule).add(id);
        }
      }
      if (map.size > 0) return map;
    } catch { /* try next */ }
  }
  return map;
}

function derivePkgNamespaces(pkgName) {
  try {
    const name = (pkgName || '').split('/').pop() || pkgName;
    const parts = String(name).split('-').filter(Boolean);
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const caps = parts.map(cap);
    const joined = caps.join('');
    const bases = new Set([caps[0], joined]);
    return Array.from(bases);
  } catch { return []; }
}

function isAllowedByPrefix(seqId, basePrefixes) {
  return (basePrefixes || []).some((p) => seqId === p + 'Plugin' || (seqId.startsWith(p) && seqId.endsWith('Plugin')));
}

function isAllowedByNamespace(seqId, namespaces) {
  return (namespaces || []).some((ns) => seqId.startsWith(ns) && seqId.endsWith('Plugin'));
}

function predictMountedPluginIds() {
  const moduleToIds = loadManifestIdsByModule(cwd);
  const out = new Set();
  const dirs = getServedSequenceDirs(cwd);
  for (const dir of dirs) {
    const files = glob.sync('**/*.json', { cwd: dir, nodir: true });
    for (const rel of files) {
      const abs = path.join(dir, rel);
      try {
        const json = loadJson(abs);
        const pluginId = typeof json?.pluginId === 'string' ? json.pluginId : null;
        if (!pluginId) continue;
        const seqDir = path.dirname(abs);
        const handlersPath = getHandlersPathForSequence(seqDir, path.basename(abs));
        if (!handlersPath) continue; // unknown package; skip prediction
        const manifestIdsForModule = moduleToIds.get(handlersPath) || new Set();
        const basePrefixes = Array.from(manifestIdsForModule).map((id) => id.replace(/Plugin$/, ''));
        const namespaces = derivePkgNamespaces(handlersPath);
        const allowed = manifestIdsForModule.has(pluginId) || isAllowedByPrefix(pluginId, basePrefixes) || isAllowedByNamespace(pluginId, namespaces);
        if (allowed) out.add(pluginId);
      } catch {}
    }
  }
  return out;
}

function runEslintJson() {
  const eslintPath = path.join(cwd, 'node_modules', 'eslint', 'bin', 'eslint.js');
  const r = spawnSync(process.execPath, [eslintPath, '.', '--format', 'json'], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (r.status == null) throw new Error('Failed to run eslint');
  const text = (r.stdout || '').trim() || '[]';
  let parsed = [];
  try { parsed = JSON.parse(text); } catch { parsed = []; }
  const ids = new Set();
  for (const file of parsed) {
    for (const msg of file.messages || []) {
      const m = /pluginId '([^']+)'/.exec(msg.message || '');
      if (m) ids.add(m[1]);
    }
  }
  return ids;
}

(async function main() {
  const predictedMounted = predictMountedPluginIds();
  const eslintIds = runEslintJson();
  const falsePositives = Array.from(predictedMounted).filter((id) => eslintIds.has(id));
  const onlyLinted = Array.from(eslintIds).filter((id) => !predictedMounted.has(id));

  console.log('Predicted mounted pluginIds:', predictedMounted.size);
  console.log('ESLint-reported pluginIds:', eslintIds.size);
  if (falsePositives.length) {
    console.error('❌ False positives (mounted but lint reported):', falsePositives);
    process.exitCode = 1;
  } else {
    console.log('✅ No false positives: mounted IDs not reported by lint');
  }
  if (onlyLinted.length) {
    console.log('ℹ️ Lint-only (not predicted mounted):', onlyLinted);
  } else {
    console.log('✅ No lint-only IDs (expected if all sequences are mountable)');
  }
})();

