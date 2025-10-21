import fs from "fs";
import path from "path";

function loadSlots(cwd) {
  try {
    const p = path.join(cwd, "public", "layout-manifest.json");
    if (!fs.existsSync(p)) return new Set();
    const json = JSON.parse(fs.readFileSync(p, "utf8"));
    const arr = Array.isArray(json?.slots) ? json.slots : [];
    return new Set(arr.map((s) => s?.name).filter(Boolean));
  } catch {
    return new Set();
  }
}

export default {
  rules: {
    "require-slot-manifest-registration": {
      meta: {
        type: "problem",
        docs: { description: "Require that literal PanelSlot slot values are registered in layout-manifest.json" },
        schema: [],
        messages: {
          unregistered: "Slot '{name}' is not registered in layout-manifest.json (issue #61)."
        }
      },
      create(context) {
        const cwd = context.getCwd?.() || process.cwd();
        const slots = loadSlots(cwd);
        // If layout-manifest has not been generated yet, skip this rule
        if (!slots || slots.size === 0) return {};
        return {
          JSXOpeningElement(node) {
            const name = node.name && node.name.name;
            if (name !== "PanelSlot") return;
            for (const attr of node.attributes || []) {
              if (attr.type === "JSXAttribute" && attr.name?.name === "slot" && attr.value?.type === "Literal") {
                const val = String(attr.value.value || "");
                if (!slots.has(val)) {
                  context.report({ node: attr, messageId: "unregistered", data: { name: val } });
                }
              }
            }
          }
        };
      }
    }
  }
};

