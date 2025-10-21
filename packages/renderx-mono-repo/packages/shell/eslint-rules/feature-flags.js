/**
 * ESLint plugin: feature-flags
 * - enforce-flag-ids: require isFlagEnabled(...) to use a known, literal flag id from data/feature-flags.json
 */
import fs from "node:fs";
import path from "node:path";

function loadRegistry(context) {
  try {
    const cwd = context.getCwd?.() || process.cwd();
    const p = path.join(cwd, "data", "feature-flags.json");
    const raw = fs.readFileSync(p, "utf8");
    const json = JSON.parse(raw);
    return json || {};
  } catch {
    return {};
  }
}

const enforceFlagIdsRule = {
  meta: {
    type: "problem",
    docs: { description: "Require literal, known feature flag IDs when calling isFlagEnabled()" },
    schema: [],
    messages: {
      nonLiteralFlagId: "isFlagEnabled() requires a string literal flag id",
      unknownFlagId: "Unknown feature flag id '{{id}}'. Add it to data/feature-flags.json with metadata.",
    },
  },
  create(context) {
    const registry = loadRegistry(context);
    const known = new Set(Object.keys(registry));

    function checkCallExpression(node) {
      if (
        node.callee &&
        ((node.callee.type === "Identifier" && node.callee.name === "isFlagEnabled") ||
          (node.callee.type === "MemberExpression" && node.callee.property && node.callee.property.name === "isFlagEnabled"))
      ) {
        const arg = node.arguments && node.arguments[0];
        if (!arg || arg.type !== "Literal" || typeof arg.value !== "string") {
          context.report({ node: arg || node, messageId: "nonLiteralFlagId" });
          return;
        }
        const id = arg.value;
        if (!known.has(id)) {
          context.report({ node: arg, messageId: "unknownFlagId", data: { id } });
        }
      }
    }

    return {
      CallExpression: checkCallExpression,
    };
  },
};

export default {
  rules: {
    "enforce-flag-ids": enforceFlagIdsRule,
  },
};

