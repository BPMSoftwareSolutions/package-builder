export default {
  rules: {
    "require-root-shims-only": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Top-level src/* legacy entrypoints must be pure re-export shims to src/core/** or src/domain/** (Phase C guardrail)",
        },
        schema: [],
        messages: {
          notShim:
            "Top-level src/{{name}} must be a pure re-export shim (export ... from './core/**' or './domain/**'). Move implementation to src/core/** or src/domain/** and keep a shim here.",
        },
      },
      create(context) {
        const filename = String(context.getFilename?.() || "");
        // Normalize path separators
        const norm = filename.replace(/\\/g, "/");
        // Only inspect direct children of src/ with these basenames
        const shimNames = new Set([
          "EventRouter.ts",
          "conductor.ts",
          "interactionManifest.ts",
          "topicsManifest.ts",
          "startupValidation.ts",
          "env.ts",
          "jsonComponent.mapper.ts",
          "sanitizeHtml.ts",
        ]);
        const m = norm.match(/(^|\/)src\/([^\/]+)$/);
        if (!m) return {};
        const base = m[2];
        if (!shimNames.has(base)) return {};

        function isAllowedExport(node) {
          if (!node || (node.type !== "ExportAllDeclaration" && node.type !== "ExportNamedDeclaration")) return false;
          const src = node.source && node.source.value ? String(node.source.value) : "";
          return /^(\.{1,2}\/(core|domain)\/)/.test(src);
        }

        return {
          Program(node) {
            const body = node.body || [];
            // Allow empty file or only re-export declarations
            if (!body.length) return;
            const onlyExports = body.every(isAllowedExport);
            if (!onlyExports) {
              // report once at top
              context.report({ node, messageId: "notShim", data: { name: base } });
            }
          },
        };
      },
    },
  },
};

