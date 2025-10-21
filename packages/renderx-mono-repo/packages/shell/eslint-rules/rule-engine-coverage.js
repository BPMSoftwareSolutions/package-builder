/**
 * ESLint plugin: rule-engine-coverage
 * - validate-control-panel-rules: ensure control panel schema properties have corresponding rule engine rules
 */
import fs from "node:fs";
import path from "node:path";

function loadComponentJsonFiles(context) {
  try {
    const cwd = context.getCwd?.() || process.cwd();
    const jsonComponentsDir = path.join(cwd, "public", "json-components");

    if (!fs.existsSync(jsonComponentsDir)) {
      return {};
    }

    const components = {};
    const files = fs.readdirSync(jsonComponentsDir);

    for (const file of files) {
      if (
        file.endsWith(".json") &&
        !file.includes("index") &&
        !file.includes("mapper") &&
        !file.includes("rules")
      ) {
        const componentType = file.replace(".json", "");
        const filePath = path.join(jsonComponentsDir, file);
        try {
          const content = fs.readFileSync(filePath, "utf8");
          const json = JSON.parse(content);
          components[componentType] = json;
        } catch (e) {
          // Skip malformed JSON files
          console.warn(
            `Failed to parse component JSON ${filePath}:`,
            e.message
          );
        }
      }
    }

    return components;
  } catch {
    return {};
  }
}

function loadRuleEngineRules(context) {
  try {
    const cwd = context.getCwd?.() || process.cwd();
    const legacyPath = path.join(cwd, "src", "component-mapper", "rule-engine.ts");
    const canonicalPath = path.join(
      cwd,
      "src",
      "domain",
      "mapping",
      "component-mapper",
      "rule-engine.ts"
    );

    // Prefer legacy path if it contains the rule constants; otherwise fall back to canonical path
    if (fs.existsSync(legacyPath)) {
      const content = fs.readFileSync(legacyPath, "utf8");
      if (content.includes("DEFAULT_UPDATE_RULES")) {
        const updateRules = parseRulesFromContent(content, "DEFAULT_UPDATE_RULES");
        const contentRules = parseRulesFromContent(content, "DEFAULT_CONTENT_RULES");
        const extractRules = parseRulesFromContent(content, "DEFAULT_EXTRACT_RULES");
        return { update: updateRules, content: contentRules, extract: extractRules };
      }
    }

    if (fs.existsSync(canonicalPath)) {
      const content = fs.readFileSync(canonicalPath, "utf8");
      const updateRules = parseRulesFromContent(content, "DEFAULT_UPDATE_RULES");
      const contentRules = parseRulesFromContent(content, "DEFAULT_CONTENT_RULES");
      const extractRules = parseRulesFromContent(content, "DEFAULT_EXTRACT_RULES");
      return { update: updateRules, content: contentRules, extract: extractRules };
    }

    return { update: {}, content: {}, extract: {} };
  } catch {
    return { update: {}, content: {}, extract: {} };
  }
}

function extractComponentRules(byTypeContent, componentType, startIndex) {
  try {
    // Find the start of the component's rule array
    const componentStart = byTypeContent.indexOf(
      `${componentType}:`,
      startIndex
    );
    if (componentStart === -1) return [];

    const arrayStart = byTypeContent.indexOf("[", componentStart);
    if (arrayStart === -1) return [];

    // Find the matching closing bracket
    let pos = arrayStart + 1;
    let bracketCount = 1;
    let rulesContent = "";

    while (pos < byTypeContent.length && bracketCount > 0) {
      const char = byTypeContent[pos];
      if (char === "[") bracketCount++;
      else if (char === "]") bracketCount--;

      if (bracketCount > 0) {
        rulesContent += char;
      }
      pos++;
    }

    // Parse the rules content to extract whenAttr and as properties
    const rules = [];

    // For update rules, look for whenAttr properties
    const whenAttrMatches = rulesContent.match(/whenAttr:\s*["']([^"']+)["']/g);
    if (whenAttrMatches) {
      whenAttrMatches.forEach((match) => {
        const attrMatch = match.match(/whenAttr:\s*["']([^"']+)["']/);
        if (attrMatch) {
          rules.push({ whenAttr: attrMatch[1] });
        }
      });
    }

    // For extract rules, look for as properties
    const asMatches = rulesContent.match(/as:\s*["']([^"']+)["']/g);
    if (asMatches) {
      asMatches.forEach((match) => {
        const asMatch = match.match(/as:\s*["']([^"']+)["']/);
        if (asMatch) {
          rules.push({ as: asMatch[1] });
        }
      });
    }

    return rules;
  } catch {
    return [];
  }
}

function parseRulesFromContent(content, ruleName) {
  const rules = { default: [], byType: {} };

  try {
    // Find the rule constant definition
    const ruleStartPattern = new RegExp(`const ${ruleName}[^=]*=\\s*{`, "g");
    const ruleStartMatch = ruleStartPattern.exec(content);

    if (!ruleStartMatch) return rules;

    let pos = ruleStartMatch.index + ruleStartMatch[0].length;
    let braceCount = 1;
    let ruleContent = "";

    // Extract the full rule object content
    while (pos < content.length && braceCount > 0) {
      const char = content[pos];
      if (char === "{") braceCount++;
      else if (char === "}") braceCount--;

      if (braceCount > 0) {
        ruleContent += char;
      }
      pos++;
    }

    // Find byType section using a more robust approach
    const byTypeStart = ruleContent.indexOf("byType:");
    if (byTypeStart !== -1) {
      const afterByType = ruleContent.substring(byTypeStart);
      const openBraceIndex = afterByType.indexOf("{");

      if (openBraceIndex !== -1) {
        let pos = openBraceIndex + 1;
        let braceCount = 1;
        let byTypeContent = "";

        while (pos < afterByType.length && braceCount > 0) {
          const char = afterByType[pos];
          if (char === "{") braceCount++;
          else if (char === "}") braceCount--;

          if (braceCount > 0) {
            byTypeContent += char;
          }
          pos++;
        }

        // Find component type definitions - look for "componentName: [" at the start of a line or after whitespace
        const typePattern = /(?:^|\s)(\w+):\s*\[/gm;
        let typeMatch;

        while ((typeMatch = typePattern.exec(byTypeContent)) !== null) {
          const componentType = typeMatch[1];
          // Skip common property names that aren't component types
          if (!["values", "default", "byType"].includes(componentType)) {
            // Extract the actual rules for this component type
            const componentRules = extractComponentRules(
              byTypeContent,
              componentType,
              typeMatch.index
            );
            rules.byType[componentType] = componentRules;
          }
        }
      }
    }

    return rules;
  } catch (e) {
    console.error(`Error parsing ${ruleName}:`, e);
    return rules;
  }
}

function getControlPanelProperties(componentJson) {
  const properties = [];

  try {
    const schema = componentJson?.integration?.properties?.schema;
    if (schema && typeof schema === "object") {
      properties.push(...Object.keys(schema));
    }
  } catch {
    // Skip malformed component JSON
  }

  return properties;
}

function hasSpecificUpdateRule(componentType, property, _rules) {
  try {
    const cwd = process.cwd();
    const candidates = [
      path.join(cwd, "src", "component-mapper", "rule-engine.ts"),
      path.join(cwd, "src", "domain", "mapping", "component-mapper", "rule-engine.ts"),
    ];

    let content = null;
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const c = fs.readFileSync(p, "utf8");
        if (c.includes("const DEFAULT_UPDATE_RULES")) {
          content = c;
          break;
        }
      }
    }

    if (!content) return false;

    // Find the DEFAULT_UPDATE_RULES section
    const updateRulesStart = content.indexOf("const DEFAULT_UPDATE_RULES");
    if (updateRulesStart === -1) return false;

    // Find the byType section within DEFAULT_UPDATE_RULES
    const byTypeStart = content.indexOf("byType:", updateRulesStart);
    if (byTypeStart === -1) return false;

    // Find the component section within byType
    const componentPattern = new RegExp(`${componentType}:\\s*\\[`, "g");
    componentPattern.lastIndex = byTypeStart;
    const componentMatch = componentPattern.exec(content);
    if (!componentMatch) return false;

    // Find the end of this component's rules by counting brackets
    let pos = componentMatch.index + componentMatch[0].length;
    let bracketCount = 1;
    let componentRules = "";

    while (pos < content.length && bracketCount > 0) {
      const char = content[pos];
      if (char === "[") bracketCount++;
      else if (char === "]") bracketCount--;

      if (bracketCount > 0) {
        componentRules += char;
      }
      pos++;
    }

    // Check if this specific property has a whenAttr rule
    const propertyRulePattern = new RegExp(`whenAttr:\\s*["']${property}["']`);
    return propertyRulePattern.test(componentRules);
  } catch {
    return false;
  }
}

function checkBidirectionalConsistency(componentType, rules) {
  const issues = [];

  try {
    const updateRules = rules.update.byType[componentType] || [];
    const extractRules = rules.extract.byType[componentType] || [];

    // Get attributes that can be updated
    const updateAttrs = updateRules
      .map((rule) => rule.whenAttr)
      .filter(Boolean);

    // Get attributes that can be extracted
    const extractAttrs = extractRules.map((rule) => rule.as).filter(Boolean);

    // Find attributes that can be updated but not extracted
    const missingExtractions = updateAttrs.filter(
      (attr) => !extractAttrs.includes(attr)
    );

    // Find attributes that can be extracted but not updated (less critical, but worth noting)
    const missingUpdates = extractAttrs.filter(
      (attr) => !updateAttrs.includes(attr)
    );

    if (missingExtractions.length > 0) {
      issues.push({
        type: "missingExtraction",
        attributes: missingExtractions,
        message: `Component '${componentType}' can update [${missingExtractions.join(
          ", "
        )}] but cannot extract them. This causes control panel to show stale values after updates.`,
      });
    }

    if (missingUpdates.length > 0) {
      // Filter out common read-only properties that don't need updates
      const readOnlyProps = ["content", "text", "textContent"];
      const criticalMissingUpdates = missingUpdates.filter(
        (attr) => !readOnlyProps.includes(attr)
      );

      if (criticalMissingUpdates.length > 0) {
        issues.push({
          type: "missingUpdate",
          attributes: criticalMissingUpdates,
          message: `Component '${componentType}' can extract [${criticalMissingUpdates.join(
            ", "
          )}] but cannot update them. Consider adding update rules if these should be editable.`,
        });
      }
    }

    return issues;
  } catch {
    return [];
  }
}

const validateControlPanelRulesRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure control panel schema properties have corresponding rule engine rules to prevent silent degradation",
    },
    schema: [],
    messages: {
      missingUpdateRule:
        "Control panel property '{{property}}' for component '{{component}}' has no corresponding update rule in rule-engine.ts. This causes silent degradation when users edit this property.",
      noRulesForComponent:
        "Component '{{component}}' has control panel properties but no rules defined in rule-engine.ts: {{properties}}",
      bidirectionalMismatch: "{{message}}",
    },
  },
  create(context) {
    const filename = context.getFilename();

    // Only check rule-engine.ts file
    if (!filename.includes("rule-engine.ts")) {
      return {};
    }

    const components = loadComponentJsonFiles(context);
    const rules = loadRuleEngineRules(context);

    return {
      Program(node) {
        // Validate each component's control panel properties against rule engine rules
        for (const [componentType, componentJson] of Object.entries(
          components
        )) {
          const controlPanelProperties =
            getControlPanelProperties(componentJson);

          if (controlPanelProperties.length === 0) {
            continue; // No control panel properties to validate
          }

          const hasUpdateRules = rules.update.byType[componentType];
          const hasContentRules = rules.content.byType[componentType];
          const hasExtractRules = rules.extract.byType[componentType];

          // If component has no rules at all, report it
          if (!hasUpdateRules && !hasContentRules && !hasExtractRules) {
            context.report({
              node,
              messageId: "noRulesForComponent",
              data: {
                component: componentType,
                properties: controlPanelProperties.join(", "),
              },
            });
            continue;
          }

          // Check each control panel property for appropriate rule coverage
          for (const property of controlPanelProperties) {
            // Properties that are typically handled by content rules, not update rules
            if (["content", "text"].includes(property)) {
              if (!hasContentRules) {
                context.report({
                  node,
                  messageId: "missingUpdateRule",
                  data: {
                    property: `${property} (content rule)`,
                    component: componentType,
                  },
                });
              }
              continue;
            }

            // All other properties need update rules for live editing
            if (!hasUpdateRules) {
              context.report({
                node,
                messageId: "missingUpdateRule",
                data: {
                  property,
                  component: componentType,
                },
              });
            } else {
              // Component has update rules, but check if THIS specific property has a rule
              const hasSpecificRule = hasSpecificUpdateRule(
                componentType,
                property,
                rules
              );
              if (!hasSpecificRule) {
                context.report({
                  node,
                  messageId: "missingUpdateRule",
                  data: {
                    property,
                    component: componentType,
                  },
                });
              }
            }
          }

          // Check bidirectional consistency for components that have both update and extract rules
          const hasUpdateRulesForComponent = rules.update.byType[componentType];
          const hasExtractRulesForComponent =
            rules.extract.byType[componentType];

          if (hasUpdateRulesForComponent || hasExtractRulesForComponent) {
            const bidirectionalIssues = checkBidirectionalConsistency(
              componentType,
              rules
            );

            for (const issue of bidirectionalIssues) {
              context.report({
                node,
                messageId: "bidirectionalMismatch",
                data: {
                  message: issue.message,
                },
              });
            }
          }
        }
      },
    };
  },
};

export default {
  rules: {
    "validate-control-panel-rules": validateControlPanelRulesRule,
  },
};
