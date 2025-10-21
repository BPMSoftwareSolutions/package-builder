/**
 * ESLint rule: Forbid imports from src/** within plugins/**.
 * Message guides devs to use @renderx/host-sdk.
 */

export default {
  rules: {
    "no-host-internals-in-plugins": {
      meta: {
        type: "problem",
        docs: {
          description: "Plugins must not import host internals from src/**; use @renderx/host-sdk",
        },
        messages: {
          forbiddenImport:
            "Plugins must not import host internals ({{importPath}}). Import from @renderx/host-sdk instead.",
        },
        schema: [],
      },
      create(context) {
        const filename = context.getFilename?.() || "";
        const isPluginFile = /(^|\\|\/)plugins(\\|\/)/.test(filename);
        if (!isPluginFile) return {};

        return {
          ImportDeclaration(node) {
            const source = node.source && node.source.value;
            if (typeof source !== "string") return;
            if (
              source.startsWith("src/") ||
              source.startsWith("./src/") ||
              source.startsWith("../src/") ||
              source.includes("/src/") ||
              source.includes("\\src\\")
            ) {
              context.report({ node, messageId: "forbiddenImport", data: { importPath: source } });
            }
          },
        };
      },
    },
  },
};

