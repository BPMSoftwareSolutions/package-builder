/**
 * ESLint rule: sequences-in-json
 *
 * Enforces that sequence definitions are in JSON files instead of JavaScript/TypeScript files.
 * 
 * According to ADR-0014, all sequences should be defined in JSON files organized per plugin,
 * with TypeScript files only exporting handlers. This rule prevents the old pattern of
 * exporting sequence objects from TypeScript files.
 *
 * This rule detects:
 * 1. `export const sequence = { ... }` - Direct sequence exports
 * 2. `export { sequence }` - Named sequence exports
 * 3. `export default { sequence: ... }` - Default exports containing sequences
 * 4. Object literals with sequence-like structure (id, movements, beats)
 */

const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce that sequences are defined in JSON files instead of JavaScript/TypeScript files",
      category: "Best Practices", 
      recommended: true,
    },
    schema: [],
    messages: {
      sequenceExportNotAllowed: 
        'Sequence definitions must be in JSON files, not TypeScript/JavaScript. Move this sequence to a JSON file in json-sequences/ directory. See ADR-0014 for migration guide.',
      sequenceObjectNotAllowed:
        'Object with sequence-like structure detected. Sequences must be defined in JSON files, not TypeScript/JavaScript. Move to json-sequences/ directory.',
    },
  },

  create(context) {
    const filename = context.getFilename();

    // Only apply to TypeScript and JavaScript files
    if (!filename.match(/\.(ts|tsx|js|jsx)$/)) {
      return {};
    }

    // Skip test files and non-plugin files
    if (filename.includes('.spec.') || filename.includes('.test.') || (!filename.includes('plugins/') && !filename.includes('plugins\\'))) {
      return {};
    }

    // Track reported nodes to avoid duplicates
    const reportedNodes = new Set();

    function isSequenceLikeObject(node) {
      // Handle TypeScript "as const" assertions
      if (node && node.type === 'TSAsExpression') {
        node = node.expression;
      }

      if (!node || node.type !== 'ObjectExpression') {
        return false;
      }

      const properties = node.properties || [];
      const propertyNames = properties
        .filter(prop => prop.key && prop.key.type === 'Identifier')
        .map(prop => prop.key.name);

      // Check for sequence-like structure: must have id and movements
      const hasId = propertyNames.includes('id');
      const hasMovements = propertyNames.includes('movements');
      
      if (!hasId || !hasMovements) {
        return false;
      }

      // Additional check: movements should be an array containing objects with beats
      const movementsProperty = properties.find(prop => 
        prop.key && prop.key.name === 'movements'
      );
      
      if (movementsProperty && movementsProperty.value.type === 'ArrayExpression') {
        const movements = movementsProperty.value.elements || [];
        // Check if any movement has a beats property
        const hasBeats = movements.some(movement => {
          if (movement && movement.type === 'ObjectExpression') {
            const movementProps = movement.properties || [];
            return movementProps.some(prop => 
              prop.key && prop.key.name === 'beats'
            );
          }
          return false;
        });
        
        if (hasBeats) {
          return true;
        }
      }

      return false;
    }

    function checkVariableDeclarator(node) {
      if (node.id && node.id.name === 'sequence' && node.init) {
        // Get the actual node to check (handle "as const" assertions)
        let nodeToCheck = node.init;
        if (nodeToCheck.type === 'TSAsExpression') {
          nodeToCheck = nodeToCheck.expression;
        }

        if (isSequenceLikeObject(node.init) && !reportedNodes.has(nodeToCheck)) {
          reportedNodes.add(nodeToCheck);
          context.report({
            node: nodeToCheck,
            messageId: 'sequenceExportNotAllowed',
          });
        }
      }
    }

    function checkObjectExpression(node) {
      // Check for sequence property in default exports
      if (node.properties) {
        for (const property of node.properties) {
          if (property.key && property.key.name === 'sequence' && property.value) {
            if (isSequenceLikeObject(property.value)) {
              context.report({
                node: property.value,
                messageId: 'sequenceExportNotAllowed',
              });
            }
          }
        }
      }
    }

    return {
      // Handle: export const sequence = { ... }
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator': checkVariableDeclarator,
      
      // Handle: const sequence = { ... }; export { sequence };
      'ExportNamedDeclaration': (node) => {
        if (node.specifiers) {
          for (const specifier of node.specifiers) {
            if (specifier.exported && specifier.exported.name === 'sequence') {
              context.report({
                node: specifier,
                messageId: 'sequenceExportNotAllowed',
              });
            }
          }
        }
      },

      // Handle: export default { sequence: ... }
      'ExportDefaultDeclaration > ObjectExpression': checkObjectExpression,

      // Handle standalone sequence-like objects that might be exported later
      'VariableDeclarator': (node) => {
        if (node.id && node.id.name === 'sequence' && node.init) {
          // Get the actual node to check (handle "as const" assertions)
          let nodeToCheck = node.init;
          if (nodeToCheck.type === 'TSAsExpression') {
            nodeToCheck = nodeToCheck.expression;
          }

          if (isSequenceLikeObject(node.init) && !reportedNodes.has(nodeToCheck)) {
            // Check if this variable is in the scope of an export
            let parent = node.parent;
            while (parent) {
              if (parent.type === 'ExportNamedDeclaration' || parent.type === 'ExportDefaultDeclaration') {
                reportedNodes.add(nodeToCheck);
                context.report({
                  node: nodeToCheck,
                  messageId: 'sequenceExportNotAllowed',
                });
                break;
              }
              parent = parent.parent;
            }
          }
        }
      },
    };
  },
};

export default {
  rules: {
    'sequences-in-json': rule,
  },
};
