/**
 * ESLint rule: require-routing-declarations
 * 
 * Enforces that canvas-component sequences declare explicit routing preferences
 * instead of relying on hard-coded fallbacks in derive-external-topics.js
 * 
 * @fileoverview Require explicit routing declarations for canvas drag/resize sequences
 */

import path from 'path';

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require explicit routing declarations for canvas drag/resize sequences',
      category: 'Plugin Architecture',
      recommended: true
    },
    fixable: 'code',
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          enforcePatterns: {
            type: 'array',
            items: { type: 'string' },
            default: ['drag', 'resize\\.move']
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      missingRoutingDeclaration: 'Canvas sequence "{{sequenceId}}" requires explicit routing declaration. Add topicMapping.routeToBase or topicTransform.routeToBase to eliminate hard-coded fallback.',
      addRoutingFlag: 'Add routing declaration to sequence',
      addPatternRouting: 'Add pattern-based routing declaration'
    }
  },

  create(context) {
    const options = context.options[0] || {};
    const enforcePatterns = options.enforcePatterns || ['drag', 'resize\\.move'];
    
    return {
      Program(node) {
        const filename = context.getFilename();
        const basename = path.basename(filename);
        
        // Only check canvas-component sequence files that are owned by this repo
        // Exclude files in public/json-sequences (copied from external plugins)
        if (!filename.includes('canvas-component') || 
            !basename.endsWith('.json') ||
            filename.includes('public/json-sequences') ||
            filename.includes('public\\json-sequences')) {
          return;
        }

        // Parse JSON content
        let jsonContent;
        try {
          const sourceCode = context.getSourceCode();
          jsonContent = JSON.parse(sourceCode.getText());
        } catch {
          return; // Skip invalid JSON
        }

        // Check if this is a sequence file that needs routing declarations
        if (!jsonContent.pluginId || !jsonContent.id) {
          return;
        }

        const sequenceId = jsonContent.id;
        const isCanvasComponent = /CanvasComponent/i.test(jsonContent.pluginId);
        
        if (!isCanvasComponent) {
          return;
        }

        // Check if sequence matches patterns that require routing declarations
        const needsRoutingDeclaration = enforcePatterns.some(pattern => {
          const regex = new RegExp(pattern, 'i');
          return regex.test(sequenceId);
        });

        if (!needsRoutingDeclaration) {
          return;
        }

        // Check if routing declaration exists
        const hasTopicMapping = jsonContent.topicMapping?.routeToBase !== undefined;
        const hasTopicTransform = jsonContent.topicTransform?.routeToBase !== undefined;
        
        if (!hasTopicMapping && !hasTopicTransform) {
          context.report({
            node,
            messageId: 'missingRoutingDeclaration',
            data: {
              sequenceId: sequenceId
            },
            fix(fixer) {
              // Provide auto-fix by adding topicMapping.routeToBase
              const sourceText = context.getSourceCode().getText();
              
              try {
                const parsed = JSON.parse(sourceText);
                
                // Add routing declaration
                if (!parsed.topicMapping) {
                  parsed.topicMapping = {};
                }
                parsed.topicMapping.routeToBase = true;
                
                const fixedJson = JSON.stringify(parsed, null, 2);
                
                return fixer.replaceText(node, fixedJson);
              } catch {
                return null; // Can't auto-fix if JSON is malformed
              }
            },
            suggest: [
              {
                messageId: 'addRoutingFlag',
                fix(fixer) {
                  const sourceText = context.getSourceCode().getText();
                  try {
                    const parsed = JSON.parse(sourceText);
                    if (!parsed.topicMapping) {
                      parsed.topicMapping = {};
                    }
                    parsed.topicMapping.routeToBase = true;
                    const fixedJson = JSON.stringify(parsed, null, 2);
                    return fixer.replaceText(node, fixedJson);
                  } catch {
                    return null;
                  }
                }
              },
              {
                messageId: 'addPatternRouting',
                fix(fixer) {
                  const sourceText = context.getSourceCode().getText();
                  try {
                    const parsed = JSON.parse(sourceText);
                    if (!parsed.topicTransform) {
                      parsed.topicTransform = {};
                    }
                    parsed.topicTransform.routeToBase = "\\\\.(drag|resize)\\\\.move$";
                    const fixedJson = JSON.stringify(parsed, null, 2);
                    return fixer.replaceText(node, fixedJson);
                  } catch {
                    return null;
                  }
                }
              }
            ]
          });
        }
      }
    };
  }
};

export default {
  rules: {
    'require-routing-declarations': rule,
  },
};