#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Validation script for RenderX plugin components
 * Ensures package integrity before publishing
 */

const COMPONENTS_DIR = 'json-components';
const INDEX_FILE = path.join(COMPONENTS_DIR, 'index.json');

function validatePackage() {
  console.log('🔍 Validating RenderX plugin components package...\n');
  
  let hasErrors = false;

  // Check if components directory exists
  if (!fs.existsSync(COMPONENTS_DIR)) {
    console.error('❌ Components directory not found:', COMPONENTS_DIR);
    hasErrors = true;
  }

  // Check if index.json exists
  if (!fs.existsSync(INDEX_FILE)) {
    console.error('❌ Index file not found:', INDEX_FILE);
    hasErrors = true;
  }

  if (hasErrors) {
    process.exit(1);
  }

  // Read and validate index.json
  let indexData;
  try {
    const indexContent = fs.readFileSync(INDEX_FILE, 'utf8');
    indexData = JSON.parse(indexContent);
    console.log('✅ Index file is valid JSON');
  } catch (error) {
    console.error('❌ Invalid JSON in index file:', error.message);
    process.exit(1);
  }

  // Validate index.json structure
  if (!indexData.version) {
    console.error('❌ Index file missing version field');
    hasErrors = true;
  }

  if (!Array.isArray(indexData.components)) {
    console.error('❌ Index file missing or invalid components array');
    hasErrors = true;
  }

  if (hasErrors) {
    process.exit(1);
  }

  // Get actual component files (including subdirectories)
  function getAllJsonFiles(dir, basePath = '') {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = basePath ? path.join(basePath, item) : item;

      if (fs.statSync(fullPath).isDirectory()) {
        files.push(...getAllJsonFiles(fullPath, relativePath));
      } else if (item.endsWith('.json') && item !== 'index.json') {
        files.push(relativePath.replace(/\\/g, '/'));
      }
    }

    return files;
  }

  const actualFiles = getAllJsonFiles(COMPONENTS_DIR).sort();

  const declaredFiles = [...indexData.components].sort();

  console.log(`📋 Found ${actualFiles.length} component files`);
  console.log(`📋 Index declares ${declaredFiles.length} components`);

  // Check for missing files in index
  const missingFromIndex = actualFiles.filter(file => !declaredFiles.includes(file));
  if (missingFromIndex.length > 0) {
    console.warn('⚠️  Component files not listed in index.json (may be intentional):', missingFromIndex);
    console.warn('   If these should be discoverable by hosts, add them to index.json');
  }

  // Check for stale entries in index
  const staleInIndex = declaredFiles.filter(file => !actualFiles.includes(file));
  if (staleInIndex.length > 0) {
    console.error('❌ Stale entries in index.json (files do not exist):', staleInIndex);
    hasErrors = true;
  }

  // Validate each component file
  for (const componentFile of actualFiles) {
    const filePath = path.join(COMPONENTS_DIR, componentFile);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const componentData = JSON.parse(content);

      // Skip files that are not components (e.g., topic definitions)
      if (componentData.topics || componentData.definitions) {
        console.log(`ℹ️  Skipping non-component file: ${componentFile} (appears to be a topic definition)`);
        continue;
      }

      // Basic component structure validation
      if (!componentData.metadata) {
        console.error(`❌ Component ${componentFile} missing 'metadata' field`);
        hasErrors = true;
      } else {
        if (!componentData.metadata.type) {
          console.error(`❌ Component ${componentFile} missing 'metadata.type' field`);
          hasErrors = true;
        }
        if (!componentData.metadata.name) {
          console.error(`❌ Component ${componentFile} missing 'metadata.name' field`);
          hasErrors = true;
        }
      }

      if (!componentData.ui) {
        console.error(`❌ Component ${componentFile} missing 'ui' field`);
        hasErrors = true;
      } else {
        if (!componentData.ui.template) {
          console.error(`❌ Component ${componentFile} missing 'ui.template' field`);
          hasErrors = true;
        }
      }

      if (!componentData.integration) {
        console.error(`❌ Component ${componentFile} missing 'integration' field`);
        hasErrors = true;
      }

    } catch (error) {
      console.error(`❌ Invalid JSON in file ${componentFile}:`, error.message);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error('\n💥 Validation failed! Please fix the errors above.');
    process.exit(1);
  }

  console.log('\n✅ All validations passed!');

  // Count actual components (excluding topic definitions)
  let componentCount = 0;
  for (const file of actualFiles) {
    const filePath = path.join(COMPONENTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    if (!data.topics && !data.definitions) {
      componentCount++;
    }
  }

  console.log(`📦 Package is ready for publishing with ${componentCount} components`);
}

// Run validation
validatePackage();
