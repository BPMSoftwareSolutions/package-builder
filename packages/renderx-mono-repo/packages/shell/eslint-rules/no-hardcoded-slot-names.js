export default {
  rules: {
    "no-hardcoded-slot-names": {
      meta: {
        type: "problem",
        docs: { description: "Disallow hardcoded slot name unions; use string + manifest" },
        schema: [],
        messages: {
          hardcoded: "Hardcoded slot names detected. Use string + manifest resolution (issue #61)."
        }
      },
      create(context) {
        return {
          TSUnionType(node) {
            const text = context.sourceCode.getText(node);
            if (text.includes("'library'") && text.includes("'canvas'") && text.includes("'controlPanel'")) {
              context.report({ node, messageId: "hardcoded" });
            }
          }
        };
      }
    }
  }
};

