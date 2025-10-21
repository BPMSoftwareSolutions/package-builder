export default {
  rules: {
    "consistent-json-import-attributes": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Enforce consistent use of import attributes for JSON imports in src/**/*.ts(x)",
        },
        schema: [],
        messages: {
          requireAttrs:
            "JSON import should include import attributes: with { type: 'json' }",
        },
      },
      create(context) {
        const filename = String(context.getFilename?.() || "");
        const inSrc = /([/\\])src\1/.test(filename);
        if (!inSrc) return {};

        function hasJsonAttr(node) {
          try {
            const containers = [node.importAttributes, node.attributes, node.assertions].filter(Boolean);
            for (const attrs of containers) {
              const props = attrs?.attributes || attrs; // parser variations
              if (Array.isArray(props)) {
                const hit = props.some((p) => {
                  const key = p.key?.name || p.key?.value;
                  const val = p.value?.value || p.value?.raw?.replace(/['"]/g, "");
                  return key === "type" && String(val) === "json";
                });
                if (hit) return true;
                continue;
              }
              // ObjectExpression-like
              const typeProp = props?.properties?.find?.((pr) => (pr.key?.name || pr.key?.value) === "type");
              const val = typeProp?.value?.value || typeProp?.value?.raw?.replace?.(/['"]/g, "");
              if (String(val) === "json") return true;
            }
            return false;
          } catch {
            return false;
          }
        }

        return {
          ImportDeclaration(node) {
            try {
              const src = node.source && node.source.value;
              if (!src || typeof src !== "string") return;
              if (!src.endsWith(".json")) return;
              if (!hasJsonAttr(node)) {
                context.report({ node, messageId: "requireAttrs" });
              }
            } catch {}
          },
        };
      },
    },
  },
};

