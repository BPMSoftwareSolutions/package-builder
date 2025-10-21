/**
 * ESLint plugin: import-css-injection-coverage
 * - validate-import-css: ensure import flow injects template CSS for components with variant selectors
 */
import fs from "node:fs";
import path from "node:path";

function loadJsonComponents(cwd) {
  try {
    const dir = path.join(cwd, "public", "json-components");
    if (!fs.existsSync(dir)) return {};

    const components = {};
    const files = fs.readdirSync(dir);

    for (const file of files) {
      if (
        file.endsWith(".json") &&
        !file.includes("index") &&
        !file.includes("mapper")
      ) {
        const componentType = file.replace(".json", "");
        const filePath = path.join(dir, file);
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

function hasVariantSelectors(componentJson) {
  try {
    const css = componentJson?.ui?.styles?.css || "";
    const schema = componentJson?.integration?.properties?.schema || {};

    // Look for properties with enum values (variants)
    const variantProperties = Object.entries(schema).filter(
      ([_, propDef]) => Array.isArray(propDef?.enum) && propDef.enum.length > 0
    );

    if (variantProperties.length === 0) return false;

    // Check if CSS contains selectors for any variant values
    for (const [_propName, propDef] of variantProperties) {
      const variants = propDef.enum;
      const componentType = getComponentTypeFromJson(componentJson);

      // Look for variant selectors like .rx-button--primary, .rx-button--danger
      const hasVariantCss = variants.some((variant) =>
        css.includes(`${componentType}--${variant}`)
      );

      if (hasVariantCss) return true;
    }

    return false;
  } catch {
    return false;
  }
}

function getComponentTypeFromJson(componentJson) {
  try {
    return componentJson?.metadata?.type || "rx-component";
  } catch {
    return "rx-component";
  }
}

function analyzeImportFlow(cwd) {
  // Prefer local source files (legacy, pre-externalization)
  let parsePath = path.join(
    cwd,
    "plugins",
    "canvas-component",
    "symphonies",
    "import",
    "import.parse.pure.ts"
  );
  let nodesPath = path.join(
    cwd,
    "plugins",
    "canvas-component",
    "symphonies",
    "import",
    "import.nodes.stage-crew.ts"
  );

  let parseExists = fs.existsSync(parsePath);
  let nodesExists = fs.existsSync(nodesPath);

  // Fallback to the externalized package in node_modules when local files are removed
  if (!parseExists || !nodesExists) {
    const externalDir = path.join(
      cwd,
      "node_modules",
      "@renderx-plugins",
      "canvas-component",
      "dist",
      "symphonies",
      "import"
    );
    const externalParse = path.join(externalDir, "import.parse.pure.js");
    const externalNodes = path.join(externalDir, "import.nodes.stage-crew.js");

    if (fs.existsSync(externalParse) && fs.existsSync(externalNodes)) {
      parsePath = externalParse;
      nodesPath = externalNodes;
      parseExists = true;
      nodesExists = true;
    }
  }

  if (!parseExists || !nodesExists) {
    return { canAnalyze: false };
  }

  const parseText = fs.readFileSync(parsePath, "utf8");
  const nodesText = fs.readFileSync(nodesPath, "utf8");

  // Check if nodes stage-crew expects CSS from import component
  const nodesUsesTplCss = nodesText.includes("css: importComponent.css");

  // Check if parse stage sets CSS on component objects
  // Look for patterns like: component.css = ..., css: c.template?.styles?.css, etc.
  const parseSetsCssPattern =
    /(?:component\.css\s*=|css:\s*(?:c\.template|importComponent|comp))/;
  const parseSetsCss = parseSetsCssPattern.test(parseText);

  return {
    canAnalyze: true,
    nodesUsesTplCss,
    parseSetsCss,
  };
}

const validateImportCssRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure import flow injects template CSS for components with variant selectors",
    },
    schema: [],
    messages: {
      missingCssMapping:
        "Import flow does not map template CSS into imported components for '{{component}}'. The transformImportDataToCreateFormat function uses template.css, but parseUiFile does not set it. Variant updates will have no visual effect for imported components.",
      cannotAnalyze:
        "Cannot analyze import flow: missing import.parse.pure.ts or import.nodes.stage-crew.ts files",
    },
  },
  create(context) {
    const filename = context.getFilename();

    // Only check import-related files
    if (
      !filename.includes("import") ||
      (!filename.includes("parse") && !filename.includes("nodes"))
    ) {
      return {};
    }

    const cwd = context.getCwd?.() || process.cwd();
    const components = loadJsonComponents(cwd);
    const importAnalysis = analyzeImportFlow(cwd);

    return {
      Program(node) {
        if (!importAnalysis.canAnalyze) {
          context.report({
            node,
            messageId: "cannotAnalyze",
          });
          return;
        }

        // Find components that have variant selectors in their CSS
        const variantComponents = Object.entries(components)
          .filter(([_, json]) => hasVariantSelectors(json))
          .map(([componentType]) => componentType);

        if (variantComponents.length === 0) {
          return; // No variant components to check
        }

        // Report if nodes expects CSS but parse doesn't provide it
        if (importAnalysis.nodesUsesTplCss && !importAnalysis.parseSetsCss) {
          for (const componentType of variantComponents) {
            context.report({
              node,
              messageId: "missingCssMapping",
              data: {
                component: componentType,
              },
            });
          }
        }
      },
    };
  },
};

export default {
  rules: {
    "validate-import-css": validateImportCssRule,
  },
};
