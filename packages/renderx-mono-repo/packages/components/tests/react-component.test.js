#!/usr/bin/env node

/**
 * Unit tests for React component JSON definition
 * Validates structure, schema, and integration requirements
 */

const fs = require('fs');
const path = require('path');

// Test utilities
function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`❌ ${message}: expected ${expected}, got ${actual}`);
  }
}

function assertExists(value, message) {
  if (value === undefined || value === null) {
    throw new Error(`❌ ${message}: value is undefined or null`);
  }
}

function assertType(value, expectedType, message) {
  if (typeof value !== expectedType) {
    throw new Error(`❌ ${message}: expected ${expectedType}, got ${typeof value}`);
  }
}

// Load React component
const REACT_COMPONENT_PATH = path.join(__dirname, '..', 'json-components', 'react.json');
const INDEX_PATH = path.join(__dirname, '..', 'json-components', 'index.json');

function loadReactComponent() {
  if (!fs.existsSync(REACT_COMPONENT_PATH)) {
    throw new Error('❌ React component file not found');
  }
  
  const content = fs.readFileSync(REACT_COMPONENT_PATH, 'utf8');
  return JSON.parse(content);
}

function loadIndex() {
  if (!fs.existsSync(INDEX_PATH)) {
    throw new Error('❌ Index file not found');
  }
  
  const content = fs.readFileSync(INDEX_PATH, 'utf8');
  return JSON.parse(content);
}

// Test suite
function runTests() {
  console.log('🧪 Running React component tests...\n');
  
  let testCount = 0;
  let passedCount = 0;
  
  function test(name, testFn) {
    testCount++;
    try {
      testFn();
      console.log(`✅ ${name}`);
      passedCount++;
    } catch (error) {
      console.error(`❌ ${name}: ${error.message}`);
    }
  }
  
  const reactComponent = loadReactComponent();
  const index = loadIndex();
  
  // Test 1: Basic structure validation
  test('React component has required metadata fields', () => {
    assertExists(reactComponent.metadata, 'metadata field missing');
    assertEqual(reactComponent.metadata.type, 'react', 'metadata.type should be "react"');
    assertEqual(reactComponent.metadata.name, 'React', 'metadata.name should be "React"');
    assertExists(reactComponent.metadata.version, 'metadata.version missing');
    assertExists(reactComponent.metadata.description, 'metadata.description missing');
    assertType(reactComponent.metadata.tags, 'object', 'metadata.tags should be an array');
    assert(Array.isArray(reactComponent.metadata.tags), 'metadata.tags should be an array');
    assert(reactComponent.metadata.tags.includes('react'), 'metadata.tags should include "react"');
  });
  
  // Test 2: UI structure validation
  test('React component has proper UI configuration', () => {
    assertExists(reactComponent.ui, 'ui field missing');
    assertExists(reactComponent.ui.template, 'ui.template missing');
    assertExists(reactComponent.ui.styles, 'ui.styles missing');
    assertExists(reactComponent.ui.icon, 'ui.icon missing');
    assertEqual(reactComponent.ui.icon.value, '⚛️', 'ui.icon.value should be React emoji');
    assertExists(reactComponent.ui.tools, 'ui.tools missing');
    assert(reactComponent.ui.tools.drag.enabled, 'ui.tools.drag should be enabled');
    assert(reactComponent.ui.tools.resize.enabled, 'ui.tools.resize should be enabled');
  });
  
  // Test 3: Integration properties validation
  test('React component has proper integration configuration', () => {
    assertExists(reactComponent.integration, 'integration field missing');
    assertExists(reactComponent.integration.properties, 'integration.properties missing');
    assertExists(reactComponent.integration.properties.schema, 'integration.properties.schema missing');
    assertExists(reactComponent.integration.properties.schema.code, 'integration.properties.schema.code missing');
    
    const codeSchema = reactComponent.integration.properties.schema.code;
    assertEqual(codeSchema.type, 'string', 'code schema type should be string');
    assertExists(codeSchema.default, 'code schema should have default value');
    assert(codeSchema.default.includes('export default function'), 'default code should be a React component');
    assertExists(codeSchema.ui, 'code schema should have UI configuration');
    assertEqual(codeSchema.ui.control, 'code', 'code schema UI control should be "code"');
  });
  
  // Test 4: Template structure validation (as per GitHub issue spec)
  test('React component has proper template structure for external plugins', () => {
    assertExists(reactComponent.template, 'template field missing');
    assertExists(reactComponent.template.render, 'template.render missing');
    assertEqual(reactComponent.template.render.strategy, 'react', 'template.render.strategy should be "react"');
    assertExists(reactComponent.template.react, 'template.react missing');
    assertExists(reactComponent.template.react.code, 'template.react.code missing');
    assertExists(reactComponent.template.classes, 'template.classes missing');
    assert(Array.isArray(reactComponent.template.classes), 'template.classes should be an array');
    assert(reactComponent.template.classes.includes('rx-comp'), 'template.classes should include "rx-comp"');
    assert(reactComponent.template.classes.includes('rx-react'), 'template.classes should include "rx-react"');
  });
  
  // Test 5: Interactions validation
  test('React component has proper plugin interactions', () => {
    assertExists(reactComponent.interactions, 'interactions field missing');
    assertExists(reactComponent.interactions['canvas.component.create'], 'canvas.component.create interaction missing');
    assertEqual(reactComponent.interactions['canvas.component.create'].pluginId, 'CanvasComponentPlugin', 'should use CanvasComponentPlugin');
    assertEqual(reactComponent.interactions['canvas.component.create'].sequenceId, 'canvas-component-create-symphony', 'should use correct sequence');
  });
  
  // Test 6: Index file includes React component
  test('Index file includes React component', () => {
    assert(Array.isArray(index.components), 'index.components should be an array');
    assert(index.components.includes('react.json'), 'index.components should include react.json');
  });
  
  // Test 7: Canvas integration validation
  test('React component has proper canvas integration', () => {
    assertExists(reactComponent.integration.canvasIntegration, 'canvasIntegration missing');
    const canvasIntegration = reactComponent.integration.canvasIntegration;
    assert(canvasIntegration.resizable, 'should be resizable');
    assert(canvasIntegration.draggable, 'should be draggable');
    assert(canvasIntegration.selectable, 'should be selectable');
    assertType(canvasIntegration.defaultWidth, 'number', 'defaultWidth should be a number');
    assertType(canvasIntegration.defaultHeight, 'number', 'defaultHeight should be a number');
  });
  
  // Test 8: Events validation
  test('React component has proper event definitions', () => {
    assertExists(reactComponent.integration.events, 'events field missing');
    assertExists(reactComponent.integration.events.mount, 'mount event missing');
    assertExists(reactComponent.integration.events.unmount, 'unmount event missing');
    assertExists(reactComponent.integration.events.error, 'error event missing');
  });
  
  console.log(`\n📊 Test Results: ${passedCount}/${testCount} tests passed`);
  
  if (passedCount === testCount) {
    console.log('✅ All React component tests passed!');
    return true;
  } else {
    console.log('❌ Some tests failed!');
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  try {
    const success = runTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

module.exports = { runTests };
