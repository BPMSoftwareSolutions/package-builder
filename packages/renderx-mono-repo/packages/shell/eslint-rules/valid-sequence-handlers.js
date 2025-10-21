/**
 * ESLint plugin: valid-sequence-handlers
 * - validate-handlers: ensure that handler names referenced in JSON sequences exist as exported functions
 */
import fs from "node:fs";
import path from "node:path";

function loadSequenceHandlers(context) {
  try {
    const cwd = context.getCwd?.() || process.cwd();
    const handlers = new Map(); // Map<handlerName, Set<sequenceFile>>

    // Scan json-sequences directories for handler references
    const jsonSeqDirs = [
      path.join(cwd, "json-sequences"),
      path.join(cwd, "public", "json-sequences"),
    ];

    for (const baseDir of jsonSeqDirs) {
      if (!fs.existsSync(baseDir)) continue;

      const pluginDirs = fs
        .readdirSync(baseDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      for (const pluginDir of pluginDirs) {
        const pluginPath = path.join(baseDir, pluginDir);
        const files = fs
          .readdirSync(pluginPath)
          .filter((f) => f.endsWith(".json") && f !== "index.json");

        for (const file of files) {
          try {
            const filePath = path.join(pluginPath, file);
            const content = fs.readFileSync(filePath, "utf8");
            const json = JSON.parse(content);

            // Extract handler names from movements.beats
            if (json.movements && Array.isArray(json.movements)) {
              for (const movement of json.movements) {
                if (movement.beats && Array.isArray(movement.beats)) {
                  for (const beat of movement.beats) {
                    if (beat.handler && typeof beat.handler === "string") {
                      if (!handlers.has(beat.handler)) {
                        handlers.set(beat.handler, new Set());
                      }
                      handlers.get(beat.handler).add(`${pluginDir}/${file}`);
                    }
                  }
                }
              }
            }
          } catch {
            // Skip malformed JSON files
          }
        }
      }
    }

    return handlers;
  } catch {
    return new Map();
  }
}

function getHandlersPathForSequence(context, sequenceFile) {
  try {
    const cwd = context.getCwd?.() || process.cwd();
    const [pluginDir] = sequenceFile.split("/");

    // Check index.json for handlersPath mapping
    const indexPaths = [
      path.join(cwd, "json-sequences", pluginDir, "index.json"),
      path.join(cwd, "public", "json-sequences", pluginDir, "index.json"),
    ];

    for (const indexPath of indexPaths) {
      if (fs.existsSync(indexPath)) {
        const indexContent = fs.readFileSync(indexPath, "utf8");
        const indexJson = JSON.parse(indexContent);

        if (indexJson.sequences && Array.isArray(indexJson.sequences)) {
          const fileName = sequenceFile.split("/")[1];
          const entry = indexJson.sequences.find(
            (seq) => seq.file === fileName
          );
          if (entry && entry.handlersPath) {
            return entry.handlersPath;
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

function checkHandlerExists(context, handlerName, handlersPath) {
  try {
    const cwd = context.getCwd?.() || process.cwd();
    let resolvedPath = handlersPath;

    // Convert absolute paths to relative for file system access
    if (resolvedPath.startsWith("/")) {
      resolvedPath = path.join(cwd, resolvedPath.slice(1));
    } else {
      resolvedPath = path.join(cwd, resolvedPath);
    }

    // Ensure .ts/.tsx extension
    if (!resolvedPath.match(/\.(ts|tsx)$/)) {
      resolvedPath += ".ts";
    }

    if (!fs.existsSync(resolvedPath)) {
      return false;
    }

    const content = fs.readFileSync(resolvedPath, "utf8");

    // Check for handler export patterns:
    // export function handlerName
    // export const handlerName
    // export { handlerName }
    // handlers = { handlerName, ... } (shorthand or full property)
    // export const handlers = { handlerName, ... }
    const patterns = [
      new RegExp(`export\\s+function\\s+${handlerName}\\s*\\(`, "m"),
      new RegExp(`export\\s+const\\s+${handlerName}\\s*[=:]`, "m"),
      new RegExp(`export\\s*{[^}]*\\b${handlerName}\\b[^}]*}`, "m"),
      new RegExp(
        `handlers\\s*[=:]\\s*{[\\s\\S]*?^\\s*${handlerName}\\s*,?[\\s\\S]*?}`,
        "m"
      ),
      new RegExp(
        `export\\s+const\\s+handlers\\s*=\\s*{[\\s\\S]*?^\\s*${handlerName}\\s*,?[\\s\\S]*?}`,
        "m"
      ),
    ];

    return patterns.some((pattern) => pattern.test(content));
  } catch {
    return false;
  }
}

const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure handler names in JSON sequences correspond to exported functions",
      category: "Possible Errors",
      recommended: true,
    },
    schema: [],
    messages: {
      missingHandler:
        "Handler '{{handlerName}}' referenced in sequence '{{sequenceFile}}' but not found in '{{handlersPath}}'",
      noHandlersPath:
        "Cannot find handlersPath for sequence '{{sequenceFile}}' - check json-sequences/{{pluginDir}}/index.json",
    },
  },

  create(context) {
    const filename = context.getFilename();

    // Feature flag gate: lint.sequence-handlers
    try {
      const cwd = context.getCwd?.() || process.cwd();
      const ffPath = path.join(cwd, "data", "feature-flags.json");
      const raw = fs.readFileSync(ffPath, "utf8");
      const flags = JSON.parse(raw) || {};
      const meta = flags["lint.sequence-handlers"];
      const enabled =
        !!meta && (meta.status === "on" || meta.status === "experiment");
      if (!enabled) return {};
    } catch {
      // If flags cannot be read, default to disabled to be safe
      return {};
    }

    // Only check TypeScript handler files in plugins directory
    if (
      !filename.match(/\.(ts|tsx)$/) ||
      !(filename.includes("plugins/") || filename.includes("plugins\\"))
    ) {
      return {};
    }

    // Skip test files
    if (filename.includes(".spec.") || filename.includes(".test.")) {
      return {};
    }

    const sequenceHandlers = loadSequenceHandlers(context);

    return {
      Program(node) {
        // Check if this file is referenced as a handlersPath
        const relativePath = path.relative(
          context.getCwd?.() || process.cwd(),
          filename
        );
        const normalizedPath = "/" + relativePath.replace(/\\/g, "/");

        // Find sequences that reference this file
        const referencingSequences = [];
        for (const [handlerName, sequenceFiles] of sequenceHandlers) {
          for (const sequenceFile of sequenceFiles) {
            const handlersPath = getHandlersPathForSequence(
              context,
              sequenceFile
            );
            if (
              handlersPath &&
              (handlersPath === normalizedPath || handlersPath === relativePath)
            ) {
              referencingSequences.push({
                handlerName,
                sequenceFile,
                handlersPath,
              });
            }
          }
        }

        // Check each referenced handler exists in this file
        for (const {
          handlerName,
          sequenceFile,
          handlersPath,
        } of referencingSequences) {
          if (!checkHandlerExists(context, handlerName, handlersPath)) {
            context.report({
              node,
              messageId: "missingHandler",
              data: {
                handlerName,
                sequenceFile,
                handlersPath: path.basename(handlersPath),
              },
            });
          }
        }
      },
    };
  },
};

export default {
  rules: {
    "validate-handlers": rule,
  },
};
