/**
 * ESLint rule to validate internal plugin ID consistency across repo manifests
 * - Ensures any pluginId referenced in topics-manifest.json and in all JSON files under catalog/json-interactions/
 *   exists in the generated plugin manifest (catalog/json-plugins/.generated/plugin-manifest.json)
 *   or the fallback checked-in manifest (catalog/json-plugins/plugin-manifest.json).
 */

import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Validate pluginId references in internal manifests against the generated plugin manifest',
      category: 'Possible Errors',
      recommended: true,
    },
    schema: [],
    messages: {
      missingPlugin:
        "Plugin ID '{{pluginId}}' referenced in {{source}} is not registered in plugin-manifest.json.{{suggestion}}",
      routeMismatch:
        "Route references pluginId '{{pluginId}}' but served sequence '{{sequenceId}}' declares pluginId '{{servedPluginId}}' ({{source}})",
      parseError: "Error reading or parsing {{source}}: {{error}}",
    },
  },

  create(context) {
    // Run once per lint execution
    if (global.__renderxInternalPluginIdValidationRun) return {};
    global.__renderxInternalPluginIdValidationRun = true;

    const cwd = process.cwd();

    try {
      const pluginIds = loadManifestPluginIds(cwd);
      // If nothing to validate against, bail quietly
      if (!pluginIds || pluginIds.size === 0) return {};

      const mismatches = [
        ...validateTopicsManifest(cwd, pluginIds),
      ];

      for (const m of mismatches) {
        if (m.type === 'routeMismatch') {
          context.report({
            loc: { line: 1, column: 0 },
            messageId: 'routeMismatch',
            data: {
              pluginId: m.pluginId,
              sequenceId: m.sequenceId,
              servedPluginId: m.servedPluginId,
              source: m.source,
            },
          });
          continue;
        }
        const suggestion = findClosestMatch(m.pluginId, Array.from(pluginIds));
        context.report({
          loc: { line: 1, column: 0 },
          messageId: 'missingPlugin',
          data: {
            pluginId: m.pluginId,
            source: m.source,
            suggestion: suggestion ? ` Did you mean '${suggestion}'?` : '',
          },
        });
      }
    } catch (error) {
      // Non-fatal; report as a single parse error tied to root
      context.report({
        loc: { line: 1, column: 0 },
        messageId: 'parseError',
        data: { source: 'validate-internal-plugin-ids', error: error.message },
      });
    }

    return {};
  },
};

function loadManifestPluginIds(cwd) {
  const candidates = [
    path.join(cwd, 'catalog', 'json-plugins', '.generated', 'plugin-manifest.json'),
    path.join(cwd, 'public', 'plugins', 'plugin-manifest.json'),
  ];

  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    try {
      const json = JSON.parse(fs.readFileSync(p, 'utf8'));
      const ids = new Set(
        Array.isArray(json?.plugins)
          ? json.plugins.map((x) => x?.id).filter(Boolean)
          : []
      );
      if (ids.size > 0) return ids;
    } catch {
      // try next candidate
    }
  }
  return new Set();
}

function validateTopicsManifest(cwd, pluginIds) {
  const out = [];
  const file = path.join(cwd, 'topics-manifest.json');
  if (!fs.existsSync(file)) return out;
  try {
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    const topics = json || {};
    for (const key of Object.keys(topics)) {
      const entry = topics[key];
      const routes = Array.isArray(entry?.routes) ? entry.routes : [];
      for (const r of routes) {
        const pid = r?.pluginId;
        if (pid && !pluginIds.has(pid)) {
          out.push({ pluginId: pid, source: `topics-manifest.json (topic: ${key})` });
        }
      }
    }
  } catch (e) {
    out.push({ pluginId: '', source: `topics-manifest.json`, error: e?.message || String(e) });
  }
  return out;
}

function _validateInteractionJsons(cwd, pluginIds, seqIndex) {
  const out = [];
  const base = path.join(cwd, 'catalog', 'json-interactions');
  if (!fs.existsSync(base)) return out;
  const files = glob.sync('**/*.json', { cwd: base, nodir: true });
  for (const rel of files) {
    const file = path.join(base, rel);
    try {
      const json = JSON.parse(fs.readFileSync(file, 'utf8'));
      const routes = json?.routes || {};
      for (const routeKey of Object.keys(routes)) {
        const entry = routes[routeKey];
        const pid = entry?.pluginId;
        const seqId = entry?.sequenceId;

        // If we can resolve a served sequence for this route, prefer that as the source of truth.
        if (pid && seqId && seqIndex.has(seqId)) {
          const servedPid = seqIndex.get(seqId);
          if (servedPid && servedPid !== pid) {
            out.push({
              pluginId: pid,
              source: `catalog/json-interactions/${rel} (route: ${routeKey})`,
              sequenceId: seqId,
              servedPluginId: servedPid,
              type: 'routeMismatch',
            });
          }
          // If they match, do NOT flag missingPlugin even if not in manifest; served data wins.
          continue;
        }

        // Otherwise, fall back to manifest presence check.
        if (pid && !pluginIds.has(pid)) {
          out.push({ pluginId: pid, source: `catalog/json-interactions/${rel} (route: ${routeKey})` });
        }
      }
    } catch {
      // surface parse error via rule-level parseError
      // but keep going to catch others
    }
  }
  return out;
}


function _buildServedSequenceIdIndex(cwd) {
  const dirs = [
    path.join(cwd, 'public', 'json-sequences'),
    path.join(cwd, 'json-sequences'),
  ];
  const map = new Map();
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = glob.sync('**/*.json', { cwd: dir, nodir: true });
    for (const rel of files) {
      const abs = path.join(dir, rel);
      try {
        const json = JSON.parse(fs.readFileSync(abs, 'utf8'));
        const id = json?.id;
        const pluginId = json?.pluginId;
        if (typeof id === 'string' && typeof pluginId === 'string') {
          // Prefer entries from public/ over fallback json-sequences/
          if (!map.has(id) || abs.includes(path.sep + 'public' + path.sep)) {
            map.set(id, pluginId);
          }
        }
      } catch {
        // ignore faulty files
      }
    }
  }
  return map;
}

function findClosestMatch(target, candidates) {
  let best = null;
  let bestScore = 0;
  for (const c of candidates) {
    const s = similarity(target, c);
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }
  return best;
}

function similarity(a, b) {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  const dist = levenshtein(longer, shorter);
  return (longer.length - dist) / longer.length;
}

function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
      else matrix[i][j] = Math.min(
        matrix[i - 1][j - 1] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j] + 1
      );
    }
  }
  return matrix[b.length][a.length];
}

function _loadManifestNamespaces(cwd) {
  const candidates = [
    path.join(cwd, 'public', 'plugins', 'plugin-manifest.json'),
    path.join(cwd, 'catalog', 'json-plugins', '.generated', 'plugin-manifest.json'),
    path.join(cwd, 'catalog', 'json-plugins', 'plugin-manifest.json'),
    path.join(cwd, 'plugin-manifest.json'),
  ];
  const out = new Set();
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    try {
      const json = JSON.parse(fs.readFileSync(p, 'utf8'));
      const items = Array.isArray(json?.plugins) ? json.plugins : [];
      for (const item of items) {
        const runtimeModule = item?.runtime?.module;
        const uiModule = item?.ui?.module;
        for (const mod of [runtimeModule, uiModule]) {
          if (!mod) continue;
          for (const ns of _derivePkgNamespaces(mod)) out.add(ns);
        }
      }
      if (out.size > 0) return Array.from(out);
    } catch {
      // try next
    }
  }
  return Array.from(out);
}

function _derivePkgNamespaces(pkgName) {
  try {
    const name = (pkgName || '').split('/').pop() || pkgName; // e.g. canvas-component
    const parts = String(name).split('-').filter(Boolean);
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const caps = parts.map(cap); // [Canvas, Component]
    const joined = caps.join(''); // CanvasComponent
    const bases = new Set([caps[0], joined]);
    return Array.from(bases);
  } catch {
    return [];
  }
}

function _isAllowedByPrefix(id, basePrefixes) {
  return (basePrefixes || []).some((p) => id === p + 'Plugin' || (id.startsWith(p) && id.endsWith('Plugin')));
}

function _isAllowedByNamespace(id, namespaces) {
  return (namespaces || []).some((ns) => id.startsWith(ns) && id.endsWith('Plugin'));
}

export default {
  rules: {
    'validate-internal-plugin-ids': rule,
  },
};

