/**
 * ESLint Plugin: Feature Coverage
 * 
 * Ensures all features in features.json have corresponding tests.
 * This plugin validates that JavaScript test files cover all frontend features.
 */

const fs = require('fs');
const path = require('path');

/**
 * Load features.json from the project root
 */
function loadFeatures(context) {
  try {
    // Try to find features.json relative to the current file
    const currentDir = path.dirname(context.getFilename());
    let featuresPath = null;
    
    // Search up the directory tree for features.json
    let searchDir = currentDir;
    for (let i = 0; i < 10; i++) {
      const testPath = path.join(searchDir, 'features.json');
      if (fs.existsSync(testPath)) {
        featuresPath = testPath;
        break;
      }
      searchDir = path.dirname(searchDir);
    }
    
    if (!featuresPath) {
      return null;
    }
    
    const content = fs.readFileSync(featuresPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading features.json:', error.message);
    return null;
  }
}

/**
 * Extract test function names from the AST
 */
function extractTestFunctions(context) {
  const testFunctions = [];
  const sourceCode = context.getSourceCode();
  const ast = sourceCode.ast;
  
  // Walk through the AST to find test functions
  function walk(node) {
    if (!node) return;
    
    // Check for function declarations/expressions with 'test' or 'it' in the name
    if (node.type === 'FunctionDeclaration' && node.id && node.id.name) {
      if (node.id.name.startsWith('test') || node.id.name.startsWith('it')) {
        testFunctions.push(node.id.name);
      }
    }
    
    // Check for describe/test/it calls
    if (node.type === 'CallExpression' && node.callee) {
      const calleeName = node.callee.name;
      if (calleeName === 'test' || calleeName === 'it' || calleeName === 'describe') {
        // Get the test name from the first argument
        if (node.arguments[0] && node.arguments[0].type === 'Literal') {
          const testName = node.arguments[0].value;
          // Convert test name to function name format
          const functionName = testName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
          testFunctions.push(`test_${functionName}`);
        }
      }
    }
    
    // Recursively walk child nodes
    for (const key in node) {
      if (node[key] && typeof node[key] === 'object') {
        if (Array.isArray(node[key])) {
          node[key].forEach(walk);
        } else {
          walk(node[key]);
        }
      }
    }
  }
  
  walk(ast);
  return testFunctions;
}

/**
 * Validate frontend feature coverage
 */
function validateFrontendCoverage(features, testFunctions) {
  const missing = [];
  
  if (!features || !features.features || !features.features.frontend) {
    return missing;
  }
  
  const frontend = features.features.frontend;
  
  // Check views
  if (frontend.views && frontend.views.features) {
    frontend.views.features.forEach(feature => {
      const featureName = feature.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const expectedTests = [
        `test_${featureName}`,
        `test_view_${featureName}`,
        `test_frontend_${featureName}`
      ];
      
      const hasTest = expectedTests.some(testName => 
        testFunctions.some(tf => tf.includes(featureName))
      );
      
      if (!hasTest) {
        missing.push({
          feature: `Frontend View: ${feature.name}`,
          expectedTest: expectedTests[0],
          testCases: feature.testCases || []
        });
      }
    });
  }
  
  // Check progress tracking
  if (frontend.progressTracking && frontend.progressTracking.features) {
    frontend.progressTracking.features.forEach(feature => {
      const featureName = feature.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const expectedTests = [
        `test_${featureName}`,
        `test_progress_${featureName}`,
        `test_tracking_${featureName}`
      ];
      
      const hasTest = expectedTests.some(testName => 
        testFunctions.some(tf => tf.includes(featureName))
      );
      
      if (!hasTest) {
        missing.push({
          feature: `Progress Tracking: ${feature.name}`,
          expectedTest: expectedTests[0],
          testCases: feature.testCases || []
        });
      }
    });
  }
  
  // Check navigation
  if (frontend.navigation && frontend.navigation.features) {
    frontend.navigation.features.forEach(feature => {
      const featureName = feature.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const expectedTests = [
        `test_${featureName}`,
        `test_navigation_${featureName}`,
        `test_nav_${featureName}`
      ];
      
      const hasTest = expectedTests.some(testName => 
        testFunctions.some(tf => tf.includes(featureName))
      );
      
      if (!hasTest) {
        missing.push({
          feature: `Navigation: ${feature.name}`,
          expectedTest: expectedTests[0],
          testCases: feature.testCases || []
        });
      }
    });
  }
  
  return missing;
}

module.exports = {
  rules: {
    'require-feature-tests': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Ensure all features in features.json have corresponding tests',
          category: 'Testing',
          recommended: true
        },
        messages: {
          missingTest: 'Feature "{{feature}}" in features.json has no corresponding test. Expected test: {{expectedTest}}',
          missingTestCase: 'Test case "{{testCase}}" for feature "{{feature}}" is not implemented',
          noFeaturesFile: 'Could not find features.json file',
          testFileSummary: '{{count}} frontend features are missing tests. Run validate_coverage.py for details.'
        },
        schema: [
          {
            type: 'object',
            properties: {
              featuresPath: {
                type: 'string',
                description: 'Path to features.json file (optional)'
              },
              ignorePatterns: {
                type: 'array',
                items: { type: 'string' },
                description: 'Feature name patterns to ignore'
              }
            },
            additionalProperties: false
          }
        ]
      },
      create(context) {
        return {
          Program(node) {
            // Only run on test files
            const filename = context.getFilename();
            if (!filename.includes('.test.') && !filename.includes('.spec.') && !filename.includes('test')) {
              return;
            }
            
            // Load features.json
            const features = loadFeatures(context);
            if (!features) {
              context.report({
                node,
                messageId: 'noFeaturesFile'
              });
              return;
            }
            
            // Extract test functions from this file
            const testFunctions = extractTestFunctions(context);
            
            // Validate frontend coverage
            const missing = validateFrontendCoverage(features, testFunctions);
            
            // Report missing tests
            if (missing.length > 0) {
              // Report summary at the top of the file
              context.report({
                node,
                messageId: 'testFileSummary',
                data: {
                  count: missing.length
                }
              });
              
              // Report individual missing features (limit to first 5 to avoid spam)
              missing.slice(0, 5).forEach(item => {
                context.report({
                  node,
                  messageId: 'missingTest',
                  data: {
                    feature: item.feature,
                    expectedTest: item.expectedTest
                  }
                });
              });
            }
          }
        };
      }
    }
  }
};

