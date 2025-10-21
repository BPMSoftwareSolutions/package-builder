export default {
  rules: {
    "no-layout-logic-in-components": {
      meta: {
        type: "problem",
        docs: { description: "Disallow layout computation outside src/layout/**" },
        schema: [],
        messages: {
          move: "Layout logic must live in src/layout/** (issue #61)."
        }
      },
      create(context) {
        const filename = context.getFilename?.() || "";
        const isLayoutFile = /\/src\/layout\//.test(filename);
        return isLayoutFile ? {} : {
          CallExpression(node) {
            // naive detection of join on grid arrays in components
            const callee = node.callee;
            const src = context.sourceCode.getText(node);
            if (/grid|columns|areas/.test(src) && callee && callee.property && callee.property.name === 'join') {
              context.report({ node, messageId: "move" });
            }
          }
        };
      }
    }
  }
};

