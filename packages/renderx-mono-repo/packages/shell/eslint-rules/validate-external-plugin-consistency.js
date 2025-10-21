/**
 * ESLint rule to validate plugin ID consistency in external @renderx-plugins/* packages
 * Ensures sequence files reference plugin IDs that exist in the package manifest
 */

import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';

const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Validate plugin ID consistency between manifests and sequence files in external @renderx-plugins/* packages",
      category: "Possible Errors",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          packagePattern: {
            type: "string",
            default: "@renderx-plugins/*"
          },
          sequenceDirs: {
            type: "array",
            items: { type: "string" },
            default: ["json-sequences"]
          },
          manifestPath: {
            type: "string",
            default: "package.json"
          },
          manifestKey: {
            type: "string",
            default: "renderx.plugins"
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      pluginIdMismatch: "Plugin ID mismatch in {{packageName}}: Manifest defines '{{manifestId}}' but sequence file '{{filePath}}' references '{{sequenceId}}'",
      missingManifest: "Missing or invalid manifest in {{packageName}}: {{manifestPath}} not found or missing {{manifestKey}}",
      sequenceFileError: "Error reading sequence file {{filePath}} in {{packageName}}: {{error}}"
    },
  },

  create(context) {
    const _options = context.options[0] || {};
    const packagePattern = _options.packagePattern || "@renderx-plugins/*";
    const sequenceDirs = _options.sequenceDirs || ["json-sequences"];
    const manifestPath = _options.manifestPath || "package.json";
    const manifestKey = _options.manifestKey || "renderx.plugins";

    // Only run this rule once per lint run, not per file
    const cwd = process.cwd();

    // Use a global flag to ensure we only run validation once
    if (!global.__renderxPluginValidationRun) {
      global.__renderxPluginValidationRun = true;

      try {
        validateExternalPlugins(context, {
          packagePattern,
          sequenceDirs,
          manifestPath,
          manifestKey,
          cwd
        });
      } catch (error) {
        context.report({
          loc: { line: 1, column: 0 },
          message: `Error validating external plugins: ${error.message}`
        });
      }
    }

    return {};
  },
};

function validateExternalPlugins(context, config) {
  const { packagePattern, sequenceDirs, manifestPath, manifestKey, cwd } = config;

  // First, get the list of packages that are actually plugins from the plugin manifest
  const pluginPackages = getPluginPackagesFromManifest(cwd);

  // Discover all packages matching the pattern
  const allPackages = discoverPackages(cwd, packagePattern);

  // Filter to only validate packages that are listed in the plugin manifest
  const packagesToValidate = allPackages.filter(pkg => pluginPackages.has(pkg.name));

  for (const pkg of packagesToValidate) {
    try {
      // Skip packages that do not contain any sequence JSON files
      const hasSequences = packageHasSequences(pkg.path, sequenceDirs);
      if (!hasSequences) continue;

      const manifestPlugins = parseManifest(pkg.path, manifestPath, manifestKey);
      if (!manifestPlugins) {
        // If there are sequences but no manifest data, report missing manifest
        context.report({
          loc: { line: 1, column: 0 },
          messageId: "missingManifest",
          data: {
            packageName: pkg.name,
            manifestPath,
            manifestKey
          }
        });
        continue;
      }

      // Validate sequence files
      const mismatches = validateSequenceFiles(pkg, manifestPlugins, sequenceDirs, context);

      // Report mismatches
      for (const mismatch of mismatches) {
        context.report({
          loc: { line: 1, column: 0 },
          messageId: "pluginIdMismatch",
          data: {
            packageName: pkg.name,
            manifestId: mismatch.manifestId,
            filePath: mismatch.filePath,
            sequenceId: mismatch.sequenceId
          }
        });
      }
    } catch (error) {
      context.report({
        loc: { line: 1, column: 0 },
        message: `Error validating package ${pkg.name}: ${error.message}`
      });
    }
  }
}

function getPluginPackagesFromManifest(cwd) {
  const pluginPackages = new Set();

  // Try to read the plugin manifest to get the list of actual plugin packages
  const manifestPaths = [
    path.join(cwd, 'public', 'plugins', 'plugin-manifest.json'),
    path.join(cwd, 'catalog', 'json-plugins', '.generated', 'plugin-manifest.json'),
    path.join(cwd, 'plugin-manifest.json')
  ];

  for (const manifestPath of manifestPaths) {
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (manifest.plugins && Array.isArray(manifest.plugins)) {
          for (const plugin of manifest.plugins) {
            // Extract package name from runtime.module or ui.module
            const runtimeModule = plugin.runtime && plugin.runtime.module;
            const uiModule = plugin.ui && plugin.ui.module;

            if (runtimeModule && typeof runtimeModule === 'string' && runtimeModule.startsWith('@renderx-plugins/')) {
              pluginPackages.add(runtimeModule);
            }
            if (uiModule && typeof uiModule === 'string' && uiModule.startsWith('@renderx-plugins/') && uiModule !== runtimeModule) {
              pluginPackages.add(uiModule);
            }
          }
        }
        break; // Use the first manifest found
      } catch {
        // Continue to next manifest path
        continue;
      }
    }
  }

  return pluginPackages;
}

function discoverPackages(cwd, packagePattern) {
  const nodeModulesPath = path.join(cwd, 'node_modules');
  const pattern = path.join(packagePattern, 'package.json');

  try {
    const matches = glob.sync(pattern, { cwd: nodeModulesPath });

    return matches.map(match => {
      const packagePath = path.dirname(path.join(nodeModulesPath, match));
      const packageJsonPath = path.join(packagePath, 'package.json');

      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        return {
          name: packageJson.name,
          path: packagePath
        };
      }

      return null;
    }).filter(Boolean);
  } catch {
    // If glob fails (e.g., node_modules doesn't exist), return empty array
    return [];
  }

}

function derivePkgNamespaces(pkgName) {
  // Derive human-readable prefixes from package name, e.g.:
  // @renderx-plugins/canvas-component -> ["Canvas", "CanvasComponent"]
  try {
    const name = pkgName.split('/').pop() || pkgName; // canvas-component
    const parts = name.split('-'); // [canvas, component]
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const caps = parts.map(cap); // [Canvas, Component]
    const joined = caps.join(''); // CanvasComponent
    const bases = new Set([caps[0], joined]);
    return Array.from(bases);
  } catch {
    return [];
  }
}



function packageHasSequences(packagePath, sequenceDirs) {
  for (const dir of sequenceDirs) {
    const sequencesPath = path.join(packagePath, dir);
    if (fs.existsSync(sequencesPath)) {
      try {
        const files = glob.sync('**/*.json', { cwd: sequencesPath });
        if (files && files.length > 0) return true;
      } catch {
        // ignore unreadable dirs
      }
    }
  }
  return false;
}


function parseManifest(packagePath, manifestPath, manifestKey) {
  // 1) Prefer an internal generated manifest if present inside the package
  const generatedPath = path.join(packagePath, '.generated', 'plugin-manifest.json');
  if (fs.existsSync(generatedPath)) {
    try {
      const gen = JSON.parse(fs.readFileSync(generatedPath, 'utf8'));
      if (Array.isArray(gen.plugins)) {
        return new Set(gen.plugins.map(p => p.id).filter(Boolean));
      }
    } catch {
      // fallthrough
    }
  }

  // 2) Read package.json (default manifestPath)
  const pkgJsonPath = path.join(packagePath, manifestPath);
  let pkg = null;
  if (fs.existsSync(pkgJsonPath)) {
    try {
      pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    } catch {
      pkg = null;
    }
  }

  // 2a) Inline renderx.plugins in package.json
  if (pkg) {
    try {
      const inlinePlugins = getNestedProperty(pkg, manifestKey);
      if (Array.isArray(inlinePlugins)) {
        return new Set(inlinePlugins.map(p => p.id).filter(Boolean));
      }
    } catch {
      // ignore and try pointer
    }

    // 2b) Pointer: package.json { renderx: { manifest: "dist/plugin-manifest.json" } }
    try {
      const rx = pkg && pkg.renderx ? pkg.renderx : null;
      const pointer = rx && typeof rx.manifest === 'string' ? path.join(packagePath, rx.manifest) : null;
      if (pointer && fs.existsSync(pointer)) {
        const mf = JSON.parse(fs.readFileSync(pointer, 'utf8'));
        if (mf && Array.isArray(mf.plugins)) {
          return new Set(mf.plugins.map(p => p.id).filter(Boolean));
        }
      }
    } catch {
      // ignore and try fallback
    }
  }

  // 3) Fallback: dist/plugin-manifest.json at package root
  try {
    const distPath = path.join(packagePath, 'dist', 'plugin-manifest.json');
    if (fs.existsSync(distPath)) {
      const mf = JSON.parse(fs.readFileSync(distPath, 'utf8'));
      if (mf && Array.isArray(mf.plugins)) {
        return new Set(mf.plugins.map(p => p.id).filter(Boolean));
      }
    }
  } catch {
    // ignore
  }

  return null;
}

function validateSequenceFiles(pkg, manifestPlugins, sequenceDirs, context) {
  const mismatches = [];

  // Allow sub-plugin IDs that share the base prefix of a declared plugin ID
  const basePrefixes = Array.from(manifestPlugins).map((id) => id.replace(/Plugin$/, ""));
  const pkgNamespaces = derivePkgNamespaces(pkg.name);

  const isAllowedByPrefix = (seqId) =>
    basePrefixes.some((p) => seqId === p + "Plugin" || (seqId.startsWith(p) && seqId.endsWith("Plugin")));

  const isAllowedByNamespace = (seqId) =>
    pkgNamespaces.some((ns) => seqId.startsWith(ns) && seqId.endsWith("Plugin"));

  for (const sequenceDir of sequenceDirs) {
    const sequencesPath = path.join(pkg.path, sequenceDir);

    if (!fs.existsSync(sequencesPath)) {
      continue;
    }

    try {
      const sequenceFiles = glob.sync('**/*.json', { cwd: sequencesPath });

      for (const file of sequenceFiles) {
        const filePath = path.join(sequencesPath, file);

        try {
          const sequence = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          if (sequence.pluginId && !manifestPlugins.has(sequence.pluginId)) {
            // If not explicitly present, accept sub-IDs by declared base or package namespace
            if (!isAllowedByPrefix(sequence.pluginId) && !isAllowedByNamespace(sequence.pluginId)) {
              const closestMatch = findClosestMatch(sequence.pluginId, Array.from(manifestPlugins));
              mismatches.push({
                filePath: path.relative(pkg.path, filePath),
                sequenceId: sequence.pluginId,
                manifestId: closestMatch || Array.from(manifestPlugins)[0]
              });
            }
          }
        } catch (parseError) {
          context.report({
            loc: { line: 1, column: 0 },
            messageId: "sequenceFileError",
            data: {
              filePath: path.relative(pkg.path, filePath),
              packageName: pkg.name,
              error: parseError.message
            }
          });
        }
      }
    } catch {
      // Skip directories that can't be read
      continue;
    }
  }

  return mismatches;
}

function getNestedProperty(obj, path) {
  return path.split('.').reduce((current, key) => (current ? current[key] : undefined), obj);
}

function findClosestMatch(target, candidates) {
  // Simple string similarity - could be enhanced with a proper library
  let bestMatch = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = calculateSimilarity(target, candidate);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

export default {
  rules: {
    "validate-external-plugin-consistency": rule
  }
};