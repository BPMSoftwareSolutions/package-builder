/**
 * ESLint plugin: topics-keys
 * - valid-topics: ensure EventRouter.publish("<topic>") uses a known topic from topics-manifest.json
 */
import fs from "node:fs";
import path from "node:path";

function loadManifestTopics(context) {
  try {
    const cwd = context.getCwd?.() || process.cwd();

    const publicManifest = path.join(cwd, "public", "topics-manifest.json");
    const rootManifest = path.join(cwd, "topics-manifest.json");

    let raw = "";
    if (fs.existsSync(publicManifest)) raw = fs.readFileSync(publicManifest, "utf8");
    else raw = fs.readFileSync(rootManifest, "utf8");

    const json = JSON.parse(raw);
    const topics = json?.topics || {};
    return new Set(Object.keys(topics));
  } catch {
    return new Set();
  }
}

const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Validate that EventRouter.publish('<topic>') uses a known topic from the topics manifest",
      recommended: true,
    },
    schema: [],
    messages: {
      nonLiteralTopic: "EventRouter.publish() requires a string literal topic",
      unknownTopic: "Unknown topic '{{key}}' in EventRouter.publish().",
    },
  },

  create(context) {
    const filename = context.getFilename();
    if (filename.includes("node_modules")) return {};

    const topics = loadManifestTopics(context);
    // If the manifest is not available yet (clean checkout before generation), skip this rule
    if (!topics || topics.size === 0) return {};

    function checkCallExpression(node) {
      // Match EventRouter.publish("<topic>")
      if (
        node.callee &&
        node.callee.type === "MemberExpression" &&
        node.callee.object &&
        node.callee.object.name === "EventRouter" &&
        node.callee.property &&
        node.callee.property.name === "publish"
      ) {
        const arg = node.arguments && node.arguments[0];
        if (!arg) return;
        if (!(arg.type === "Literal" && typeof arg.value === "string")) {
          return; // allow dynamic in special cases; no non-literal error for now
        }
        const key = arg.value;
        if (!topics.has(key)) {
          context.report({ node: arg, messageId: "unknownTopic", data: { key } });
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
    "valid-topics": rule,
  },
};

