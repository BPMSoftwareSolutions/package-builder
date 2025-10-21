/**
 * ESLint rule: Forbid cross-plugin imports within plugins/**.
 * Example: a file under plugins/library/** may not import from plugins/control-panel/**.
 */
import path from "node:path";

export default {
  rules: {
    "no-cross-plugin-imports": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Plugins must not import code from other plugins. Extract shared code to the host SDK or a shared package.",
        },
        messages: {
          crossImport:
            "Cross-plugin import detected: {{importPath}}. Importing from other plugins is forbidden.",
        },
        schema: [],
      },
      create(context) {
        const filenameRaw = (context.getFilename?.() || "").replace(/\\/g, "/");
        const m = filenameRaw.match(/(^|\/)plugins\/([^\/]+)\//);
        if (!m) return {};
        const currentPlugin = m[2];

        // node:path imported at module scope for ESM compatibility

        function normalize(p) {
          return (p || "").replace(/\\/g, "/");
        }

        function resolvesToOtherPlugin(source) {
          if (typeof source !== "string" || !source) return false;
          const src = source.trim();

          // If it looks like an absolute or workspace path starting with plugins/
          if (src.startsWith("plugins/")) {
            const mm = src.match(/^plugins\/([^\/]+)\//);
            const other = mm && mm[1];
            return !!other && other !== currentPlugin;
          }

          // Relative import: resolve against the file path
          if (src.startsWith("./") || src.startsWith("../")) {
            try {
              const basedir = path.posix.dirname(filenameRaw);
              // Use posix join on a normalized base to avoid Windows backslash issues
              const resolved = normalize(path.posix.normalize(path.posix.join(basedir, src)));
              const mm = resolved.match(/(^|\/)plugins\/([^\/]+)\//);
              if (!mm) return false;
              const other = mm[2];
              return !!other && other !== currentPlugin;
            } catch {
              return false;
            }
          }

          // Bare specifiers (packages) are allowed here — enforced by other rules/policies
          return false;
        }

        return {
          ImportDeclaration(node) {
            const source = node.source && node.source.value;
            if (resolvesToOtherPlugin(source)) {
              context.report({
                node,
                messageId: "crossImport",
                data: { importPath: String(source) },
              });
            }
          },
        };
      },
    },
  },
};

