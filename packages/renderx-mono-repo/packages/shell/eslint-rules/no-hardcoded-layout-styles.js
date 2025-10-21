export default {
  rules: {
    "no-hardcoded-layout-styles": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow inline grid template styles outside src/layout/**",
        },
        schema: [],
        messages: {
          hardcoded:
            "Hardcoded layout style detected outside src/{layout,domain/layout}/** (issue #61).",
        },
      },
      create(context) {
        const filename = String(context.getFilename?.() || "");
        // Treat files under src/layout/**, src/domain/layout/** and src/App.* as allowed to define layout styles
        const isLayoutFile =
          filename.includes("/src/layout/") ||
          filename.includes("\\src\\layout\\") ||
          filename.includes("/src/domain/layout/") ||
          filename.includes("\\src\\domain\\layout\\");
        const isAppFallback =
          /([/\\])src\1App\.(t|j)sx?$/.test(filename) ||
          filename.endsWith("/src/App.tsx") ||
          filename.endsWith("\\src\\App.tsx") ||
          filename.endsWith("/src/App.jsx") ||
          filename.endsWith("\\src\\App.jsx");
        if (isLayoutFile || isAppFallback) return {};
        return {
          Property(node) {
            const key = node.key && node.key.name;
            if (
              key === "gridTemplateColumns" ||
              key === "gridTemplateAreas" ||
              key === "gridTemplateRows"
            ) {
              context.report({ node, messageId: "hardcoded" });
            }
          },
        };
      },
    },
  },
};
