export default {
  rules: {
    "require-manifest-validation": {
      meta: {
        type: "problem",
        docs: { description: "Require validateLayoutManifest(manifest) to be called in concrete LayoutEngine implementation (domain or legacy)" },
        schema: [],
        messages: {
          required: "validateLayoutManifest(manifest) must be called in LayoutEngine before use (issue #61)."
        }
      },
      create(context) {
        const filename = context.getFilename?.() || "";
        // Accept either legacy root location or new domain location
        const isLayoutEngineFile = /\/src\/(layout|domain\/layout)\/LayoutEngine\.(t|j)sx?$/.test(filename);
        if (!isLayoutEngineFile) return {};

        const source = context.sourceCode.getText();
        // Treat pure re-export shim (Phase B transitional) as exempt so we can relocate implementation first.
        const isPureReExportShim = /export\s+\*\s+from\s+['"].+LayoutEngine['"];?\s*$/.test(source) && !/validateLayoutManifest/.test(source);
        if (isPureReExportShim) return {};

        let sawValidateCall = false;
        return {
          CallExpression(node) {
            // Cheaper than full resolver: look for identifier name validateLayoutManifest
            if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'validateLayoutManifest') {
              sawValidateCall = true;
            }
          },
          'Program:exit'() {
            if (!sawValidateCall) {
              context.report({ loc: { line: 1, column: 0 }, messageId: "required" });
            }
          }
        };
      }
    }
  }
};

