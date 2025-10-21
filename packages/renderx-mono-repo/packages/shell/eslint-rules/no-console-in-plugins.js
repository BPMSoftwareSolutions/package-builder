/**
 * ESLint rule to prevent direct console usage in plugin code
 * Plugin code should use ctx.logger instead of console for proper orchestration
 */

// Helper function to check if console usage is gated by a feature flag
function isConsoleGatedByFeatureFlag(node, _context) {
  // Look for parent IfStatement with isFlagEnabled test
  let parent = node.parent;
  while (parent) {
    if (parent.type === "IfStatement") {
      const test = parent.test;
      // Check for isFlagEnabled("...") pattern
      if (
        test &&
        test.type === "CallExpression" &&
        test.callee &&
        test.callee.name === "isFlagEnabled" &&
        test.arguments &&
        test.arguments[0] &&
        test.arguments[0].type === "Literal"
      ) {
        return true;
      }
    }
    parent = parent.parent;
  }
  return false;
}

const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent direct console usage in plugin code - use ctx.logger instead",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: "code",
    schema: [],
    messages: {
      noConsole:
        "Plugin sequence handlers must not use console.{{method}} - use ctx.logger.{{method}} instead for proper orchestration",
      noConsoleUI:
        "Plugin UI components should not use console.{{method}} - consider triggering a sequence via conductor.play() or removing the log statement",
    },
  },
  create(context) {
    const filename = context.getFilename();
    const isPluginFile =
      filename.includes("/plugins/") || filename.includes("\\plugins\\");

    if (!isPluginFile) {
      return {}; // Only apply to plugin files
    }

    // Determine if this is a sequence handler file (has ctx.logger access)
    const isSequenceHandler =
      filename.includes(".symphony.") ||
      filename.includes(".stage-crew.") ||
      filename.includes("/symphonies/");

    return {
      CallExpression(node) {
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.name === "console"
        ) {
          const method = node.callee.property.name;

          // Check if console usage is gated by feature flag
          const isFeatureFlagGated = isConsoleGatedByFeatureFlag(node, context);

          if (isSequenceHandler) {
            // Sequence handlers should use ctx.logger
            context.report({
              node,
              messageId: "noConsole",
              data: { method },
              fix(fixer) {
                // Auto-fix: replace console.method with ctx.logger?.method
                const sourceCode = context.getSourceCode();
                const consoleCall = sourceCode.getText(node.callee);
                const replacement = consoleCall.replace(
                  "console.",
                  "ctx.logger?."
                );

                return fixer.replaceText(node.callee, replacement);
              },
            });
          } else if (!isFeatureFlagGated) {
            // UI components should avoid console usage unless gated by feature flags
            context.report({
              node,
              messageId: "noConsoleUI",
              data: { method },
            });
          }
          // If feature flag gated, allow console usage in UI components
        }
      },
    };
  },
};

export default {
  rules: {
    "no-console-in-plugins": rule,
  },
};
