/**
 * ESLint rule: beat-kind-dom-access
 *
 * Enforces that DOM access/updates only occur in beat handlers with kind="stage-crew"
 *
 * This rule:
 * 1. Parses symphony files to extract beat definitions and their kind properties
 * 2. Maps handlers to their kinds by analyzing the sequence structure
 * 3. Detects DOM access patterns in handler functions
 * 4. Reports violations when DOM access occurs in handlers with kind other than "stage-crew"
 */

const DOM_ACCESS_PATTERNS = [
  // Document methods
  "document.querySelector",
  "document.querySelectorAll",
  "document.getElementById",
  "document.getElementsByClassName",
  "document.getElementsByTagName",
  "document.createElement",
  "document.createTextNode",
  "document.createDocumentFragment",

  // Element manipulation
  "appendChild",
  "removeChild",
  "replaceChild",
  "insertBefore",
  "insertAdjacentElement",
  "insertAdjacentHTML",
  "insertAdjacentText",

  // Attribute manipulation
  "setAttribute",
  "removeAttribute",
  "getAttribute",

  // Style manipulation
  "style.",
  "classList.",

  // Event handling
  "addEventListener",
  "removeEventListener",

  // Content manipulation
  "innerHTML",
  "outerHTML",
  "textContent",
  "innerText",
];

import fs from "node:fs";
import path from "node:path";

function normalizePath(p) {
  return String(p || "").replace(/\\/g, "/");
}

function loadHandlerKindMapFromJson(filename) {
  try {
    const repoRoot = process.cwd();
    const jsonRoot = path.join(repoRoot, "json-sequences");
    if (!fs.existsSync(jsonRoot)) return new Map();

    const fileAbs = normalizePath(path.resolve(filename));
    const pluginDirs = fs
      .readdirSync(jsonRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    const out = new Map();

    for (const plugin of pluginDirs) {
      const indexPath = path.join(jsonRoot, plugin, "index.json");
      if (!fs.existsSync(indexPath)) continue;
      let idx;
      try {
        idx = JSON.parse(fs.readFileSync(indexPath, "utf-8") || "{}");
      } catch {
        continue;
      }
      const entries = Array.isArray(idx?.sequences) ? idx.sequences : [];
      for (const ent of entries) {
        const hp = String(ent?.handlersPath || "");
        if (!hp) continue;
        const handlersAbs = normalizePath(
          path.resolve(repoRoot, hp.startsWith("/") ? hp.slice(1) : hp)
        );
        if (handlersAbs !== fileAbs) continue;

        // Found matching handlers module; load its sequence JSON file
        const fileField = String(ent?.file || "");
        const seqPath = fileField.startsWith("/")
          ? path.resolve(repoRoot, fileField.slice(1))
          : path.resolve(jsonRoot, plugin, fileField);
        if (!fs.existsSync(seqPath)) continue;
        let seq;
        try {
          seq = JSON.parse(fs.readFileSync(seqPath, "utf-8") || "{}");
        } catch {
          continue;
        }
        const movements = Array.isArray(seq?.movements) ? seq.movements : [];
        for (const mv of movements) {
          const beats = Array.isArray(mv?.beats) ? mv.beats : [];
          for (const b of beats) {
            const handler = b?.handler;
            if (!handler) continue;
            const kind = b?.kind ?? null;
            if (!out.has(handler)) out.set(handler, kind);
          }
        }
      }
    }

    return out;
  } catch {
    return new Map();
  }
}

function extractSequenceBeats(sequenceNode) {
  const beats = [];

  // Handle "as const" assertion
  if (sequenceNode && sequenceNode.type === "TSAsExpression") {
    sequenceNode = sequenceNode.expression;
  }

  if (!sequenceNode || sequenceNode.type !== "ObjectExpression") {
    return beats;
  }

  const movementsProperty = sequenceNode.properties.find(
    (prop) => prop.key && prop.key.name === "movements"
  );

  if (
    !movementsProperty ||
    movementsProperty.value.type !== "ArrayExpression"
  ) {
    return beats;
  }

  for (const movement of movementsProperty.value.elements) {
    if (movement.type !== "ObjectExpression") continue;

    const beatsProperty = movement.properties.find(
      (prop) => prop.key && prop.key.name === "beats"
    );

    if (!beatsProperty || beatsProperty.value.type !== "ArrayExpression")
      continue;

    for (const beat of beatsProperty.value.elements) {
      if (beat.type !== "ObjectExpression") continue;

      const handlerProp = beat.properties.find(
        (p) => p.key && p.key.name === "handler"
      );
      const kindProp = beat.properties.find(
        (p) => p.key && p.key.name === "kind"
      );

      if (handlerProp && handlerProp.value.type === "Literal") {
        const handlerName = handlerProp.value.value;
        const kind =
          kindProp && kindProp.value.type === "Literal"
            ? kindProp.value.value
            : null;

        beats.push({ handlerName, kind });
      }
    }
  }

  return beats;
}

function extractHandlerFunctions(handlersNode) {
  const handlers = new Map();

  if (!handlersNode || handlersNode.type !== "ObjectExpression") {
    return handlers;
  }

  for (const property of handlersNode.properties) {
    if (property.key && property.key.name && property.value) {
      handlers.set(property.key.name, property.value);
    }
  }

  return handlers;
}

function checkForDOMAccess(node, context) {
  const violations = [];

  function traverse(node) {
    if (!node) return;

    // Check member expressions (e.g., document.querySelector, element.style)
    if (node.type === "MemberExpression") {
      const source = context.getSourceCode().getText(node);

      for (const pattern of DOM_ACCESS_PATTERNS) {
        if (source.includes(pattern)) {
          violations.push({
            node,
            pattern,
            source,
          });
        }
      }
    }

    // Check call expressions (e.g., document.createElement())
    if (node.type === "CallExpression" && node.callee) {
      const source = context.getSourceCode().getText(node.callee);

      for (const pattern of DOM_ACCESS_PATTERNS) {
        if (source.includes(pattern)) {
          violations.push({
            node,
            pattern,
            source,
          });
        }
      }
    }

    // Recursively check child nodes
    for (const key in node) {
      if (key === "parent" || key === "range" || key === "loc") continue;

      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(traverse);
      } else if (child && typeof child === "object" && child.type) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return violations;
}

const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        'Enforce DOM access only in beat handlers with kind="stage-crew"',
      category: "Best Practices",
      recommended: true,
    },
    schema: [],
    messages: {
      domAccessInNonStageCrew:
        'DOM access "{{pattern}}" is only allowed in beat handlers with kind="stage-crew". Handler "{{handlerName}}" has kind="{{kind}}".',
      domAccessInUnknownKind:
        'DOM access "{{pattern}}" detected in handler "{{handlerName}}" but no kind specified. Only kind="stage-crew" handlers may access DOM.',
      domAccessInUnmappedHandler:
        'DOM access "{{pattern}}" detected in handler "{{handlerName}}" but handler is not mapped to any beat in the sequence.',
    },
  },

  create(context) {
    // Only apply to symphony files
    const filename = context.getFilename();
    if (!filename.includes(".symphony.")) {
      return {};
    }

    let sequenceNode = null;
    let handlersNode = null;
    let handlerKindMap = new Map();

    return {
      Program(node) {
        // Find handlers export (object literal with functions)
        for (const statement of node.body) {
          if (
            statement.type === "ExportNamedDeclaration" &&
            statement.declaration
          ) {
            if (statement.declaration.type === "VariableDeclaration") {
              for (const declarator of statement.declaration.declarations) {
                if (declarator.id.name === "handlers") {
                  handlersNode = declarator.init;
                } else if (declarator.id.name === "sequence") {
                  // Deprecated: TS sequence optional
                  sequenceNode = declarator.init;
                }
              }
            }
          }
        }

        // Prefer JSON catalogs to build handler→kind mapping; fall back to TS sequence if present
        handlerKindMap = loadHandlerKindMapFromJson(filename) || new Map();
        if ((!handlerKindMap || handlerKindMap.size === 0) && sequenceNode) {
          const beats = extractSequenceBeats(sequenceNode);
          for (const beat of beats)
            handlerKindMap.set(beat.handlerName, beat.kind);
        }
      },

      "Program:exit"() {
        if (!handlersNode) return;

        const handlers = extractHandlerFunctions(handlersNode);

        for (const [handlerName, handlerNode] of handlers) {
          const violations = checkForDOMAccess(handlerNode, context);
          const handlerKind = handlerKindMap.get(handlerName);

          for (const violation of violations) {
            if (!handlerKindMap.has(handlerName)) {
              context.report({
                node: violation.node,
                messageId: "domAccessInUnmappedHandler",
                data: {
                  pattern: violation.pattern,
                  handlerName,
                },
              });
            } else if (handlerKind !== "stage-crew") {
              if (handlerKind) {
                context.report({
                  node: violation.node,
                  messageId: "domAccessInNonStageCrew",
                  data: {
                    pattern: violation.pattern,
                    handlerName,
                    kind: handlerKind,
                  },
                });
              } else {
                context.report({
                  node: violation.node,
                  messageId: "domAccessInUnknownKind",
                  data: {
                    pattern: violation.pattern,
                    handlerName,
                  },
                });
              }
            }
          }
        }
      },
    };
  },
};

export default {
  rules: {
    "beat-kind-dom-access": rule,
  },
};
