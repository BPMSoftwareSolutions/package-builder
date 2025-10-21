/**
 * ESLint rule to validate that served sequence JSONs are mountable
 *
 * What it checks
 * - Scans all JSON files under public/json-sequences/ (and falls back to repo json-sequences/)
 * - For any file that declares a top-level `pluginId`, verifies that ID exists in the
 *   served plugin manifest (prefer the generated manifest; fall back to public/plugins)
 *
 * Rationale
 * - At runtime the thin host mounts sequences and plugin runtimes from served artifacts
 *   produced by plugins. If a sequence JSON references a pluginId not present in the
 *   served plugin-manifest, it cannot be mounted. Catch that at lint time.
 */

import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Validate that served sequence JSONs reference plugin IDs present in the served plugin manifest',
      category: 'Possible Errors',
      recommended: true,
    },
    schema: [],
    messages: {
      notMountable:
        "Served sequence '{{relPath}}' references pluginId '{{pluginId}}' which is not present in the served plugin-manifest.{{suggestion}}",
      parseError: "Error reading or parsing served sequence '{{relPath}}': {{error}}",
      manifestMissing: "No served plugin-manifest found at expected locations; cannot validate served sequences.",
    },
  },

  create(context) {
    // Run once per lint execution
    if (global.__renderxServedSequencesValidationRun) return {};
    global.__renderxServedSequencesValidationRun = true;

    const cwd = process.cwd();

    try {
      const pluginIds = loadServedManifestPluginIds(cwd);
      const moduleToIds = loadManifestIdsByModule(cwd);
      if ((!pluginIds || pluginIds.size === 0) && moduleToIds.size === 0) {
        // If there are served sequences but no manifest, report a single error; otherwise silently exit
        const servedDirs = getServedSequenceDirs(cwd);
        const hasAnySequences = servedDirs.some((dir) => hasJsonFiles(dir));
        if (hasAnySequences) {
          context.report({ loc: { line: 1, column: 0 }, messageId: 'manifestMissing' });
        }
        return {};
      }

      const servedDirs = getServedSequenceDirs(cwd);
      for (const dir of servedDirs) {
        if (!fs.existsSync(dir)) continue;
        const files = glob.sync('**/*.json', { cwd: dir, nodir: true });
        for (const rel of files) {
          const abs = path.join(dir, rel);
          try {
            const json = JSON.parse(fs.readFileSync(abs, 'utf8'));
            const pluginId = typeof json?.pluginId === 'string' ? json.pluginId : null;
            if (!pluginId) continue;

            // Determine the handlersPath (package) for this sequence via the sibling index.json
            const seqDir = path.dirname(abs);
            const handlersPath = getHandlersPathForSequence(seqDir, path.basename(abs));

            let allowed = false;
            let suggestionSource = [];

            if (handlersPath) {
              const manifestIdsForModule = moduleToIds.get(handlersPath) || new Set();
              const basePrefixes = Array.from(manifestIdsForModule).map((id) => id.replace(/Plugin$/, ""));
              const namespaces = derivePkgNamespaces(handlersPath);

              allowed =
                manifestIdsForModule.has(pluginId) ||
                isAllowedByPrefix(pluginId, basePrefixes) ||
                isAllowedByNamespace(pluginId, namespaces);

              suggestionSource = Array.from(manifestIdsForModule);
            } else {
              // Fallback: allow if matches any known manifest ID or namespace from any known module
              const allNamespaces = new Set();
              for (const mod of moduleToIds.keys()) {
                for (const ns of derivePkgNamespaces(mod)) allNamespaces.add(ns);
              }
              allowed = pluginIds.has(pluginId) || isAllowedByNamespace(pluginId, Array.from(allNamespaces));
              suggestionSource = Array.from(pluginIds);
            }

            if (!allowed) {
              const suggestion = findClosestMatch(pluginId, suggestionSource);
              context.report({
                loc: { line: 1, column: 0 },
                messageId: 'notMountable',
                data: {
                  relPath: toRepoRelative(cwd, abs),
                  pluginId,
                  suggestion: suggestion ? ` Did you mean '${suggestion}'?` : '',
                },
              });
            }
          } catch (e) {
            context.report({
              loc: { line: 1, column: 0 },
              messageId: 'parseError',
              data: { relPath: toRepoRelative(cwd, abs), error: e?.message || String(e) },
            });
          }
        }
      }
    } catch (error) {
      // Surface as a single error but do not crash ESLint
      context.report({
        loc: { line: 1, column: 0 },
        message: `validate-served-sequences-mountable failed: ${error.message}`,
      });
    }

    return {};
  },
};

function loadServedManifestPluginIds(cwd) {
  // Source of truth: generated aggregate first, then actually served public manifest
  const candidates = [
    path.join(cwd, 'catalog', 'json-plugins', '.generated', 'plugin-manifest.json'),
    path.join(cwd, 'public', 'plugins', 'plugin-manifest.json'),
  ];

  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    try {
      const json = JSON.parse(fs.readFileSync(p, 'utf8'));
      const ids = new Set(
        Array.isArray(json?.plugins) ? json.plugins.map((x) => x?.id).filter(Boolean) : []
      );
      if (ids.size > 0) return ids;
    } catch {
      // try next
    }
  }
  return new Set();
}

function getServedSequenceDirs(cwd) {
  // Validate what the runtime will actually load
  const dirs = [
    path.join(cwd, 'public', 'json-sequences'),
    path.join(cwd, 'json-sequences'), // fallback for local/dev before sync
  ];
  return dirs.filter((d) => fs.existsSync(d));
}

function hasJsonFiles(dir) {
  try {
    const files = glob.sync('**/*.json', { cwd: dir, nodir: true });
    return files && files.length > 0;
  } catch {
    return false;
  }
}

function toRepoRelative(cwd, abs) {
  return abs.replace(cwd + path.sep, '').replace(/\\/g, '/');
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


function loadManifestIdsByModule(cwd) {
  const candidates = [
    path.join(cwd, 'catalog', 'json-plugins', '.generated', 'plugin-manifest.json'),
    path.join(cwd, 'public', 'plugins', 'plugin-manifest.json'),
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
    } catch {
      // try next candidate
    }
  }
  return map;
}

function derivePkgNamespaces(pkgName) {
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

function isAllowedByPrefix(seqId, basePrefixes) {
  return basePrefixes.some((p) => seqId === p + 'Plugin' || (seqId.startsWith(p) && seqId.endsWith('Plugin')));
}

function isAllowedByNamespace(seqId, namespaces) {
  return (namespaces || []).some((ns) => seqId.startsWith(ns) && seqId.endsWith('Plugin'));
}

function getHandlersPathForSequence(seqDir, fileName) {
  try {
    const idx = path.join(seqDir, 'index.json');
    if (!fs.existsSync(idx)) return null;
    const idxJson = JSON.parse(fs.readFileSync(idx, 'utf8'));
    const sequences = Array.isArray(idxJson?.sequences) ? idxJson.sequences : [];
    // Try exact file match first
    const match = sequences.find((s) => s?.file === fileName && typeof s?.handlersPath === 'string');
    if (match) return normalizeHandlersPackage(match.handlersPath);
    // If entries share a common handlersPath, return that
    const firstWithHandlers = sequences.find((s) => typeof s?.handlersPath === 'string');
    return firstWithHandlers ? normalizeHandlersPackage(firstWithHandlers.handlersPath) : null;
  } catch {
    return null;
  }
}

function normalizeHandlersPackage(p) {
  if (!p || typeof p !== 'string') return null;
  const parts = p.split('/').filter(Boolean);
  if (p.startsWith('@')) {
    // @scope/name[/...]
    if (parts.length >= 2) return `@${parts[0]}/${parts[1]}`.replace(/^@@/, '@');
  }
  // name[/...]
  return parts.length >= 1 ? parts[0] : null;
}

export default {
  rules: {
    'validate-served-sequences-mountable': rule,
  },
};

