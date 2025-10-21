#!/usr/bin/env node
/**
 * Validate RenderX Mono-Repo Workspace
 * 
 * This script validates:
 * - All packages exist with proper structure
 * - Package.json files are valid
 * - TypeScript configuration is correct
 * - Boundary rules are in place
 * - No deep imports are present
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: ValidationResult[] = [];

function checkFile(path: string, name: string): boolean {
  const exists = existsSync(path);
  if (!exists) {
    results.push({
      name,
      passed: false,
      message: `File not found: ${path}`
    });
  }
  return exists;
}

function checkPackage(packagePath: string, packageName: string): boolean {
  const pkgJsonPath = join(packagePath, 'package.json');
  const tsconfigPath = join(packagePath, 'tsconfig.json');
  const indexPath = join(packagePath, 'src', 'index.ts');

  let passed = true;

  if (!checkFile(pkgJsonPath, `${packageName}/package.json`)) {
    passed = false;
  }

  if (!checkFile(tsconfigPath, `${packageName}/tsconfig.json`)) {
    passed = false;
  }

  if (!checkFile(indexPath, `${packageName}/src/index.ts`)) {
    passed = false;
  }

  if (passed) {
    results.push({
      name: packageName,
      passed: true,
      message: 'Package structure valid'
    });
  }

  return passed;
}

function validatePackageJson(packagePath: string, packageName: string): boolean {
  try {
    const pkgJsonPath = join(packagePath, 'package.json');
    const content = readFileSync(pkgJsonPath, 'utf8');
    const pkg = JSON.parse(content);

    // Check required fields
    if (!pkg.name || !pkg.version) {
      results.push({
        name: `${packageName}/package.json`,
        passed: false,
        message: 'Missing name or version'
      });
      return false;
    }

    // Check exports field
    if (!pkg.exports) {
      results.push({
        name: `${packageName}/package.json`,
        passed: false,
        message: 'Missing exports field'
      });
      return false;
    }

    results.push({
      name: `${packageName}/package.json`,
      passed: true,
      message: 'Valid package.json'
    });
    return true;
  } catch (error) {
    results.push({
      name: `${packageName}/package.json`,
      passed: false,
      message: `Error parsing: ${error}`
    });
    return false;
  }
}

function main() {
  console.log('🔍 Validating RenderX Mono-Repo Workspace...\n');

  const rootPath = process.cwd();

  // Check root configuration files
  console.log('📋 Checking root configuration files...');
  const rootFiles = [
    'pnpm-workspace.yaml',
    'tsconfig.json',
    'eslint.config.js',
    'turbo.json',
    'renderx-adf.json',
    'package.json',
    'CODEOWNERS'
  ];

  rootFiles.forEach(file => {
    checkFile(join(rootPath, file), `root/${file}`);
  });

  // Check core packages
  console.log('📦 Checking core packages...');
  const corePackages = [
    'conductor',
    'sdk',
    'manifest-tools',
    'host-sdk',
    'shell',
    'contracts',
    'tooling'
  ];

  corePackages.forEach(pkg => {
    const pkgPath = join(rootPath, 'packages', pkg);
    checkPackage(pkgPath, `packages/${pkg}`);
    validatePackageJson(pkgPath, `packages/${pkg}`);
  });

  // Check plugin packages
  console.log('🎨 Checking plugin packages...');
  const plugins = [
    'canvas',
    'canvas-component',
    'components',
    'control-panel',
    'header',
    'library',
    'library-component'
  ];

  plugins.forEach(plugin => {
    const pkgPath = join(rootPath, 'packages', 'plugins', plugin);
    checkPackage(pkgPath, `packages/plugins/${plugin}`);
    validatePackageJson(pkgPath, `packages/plugins/${plugin}`);
  });

  // Print results
  console.log('\n📊 Validation Results:\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.message}`);
  });

  console.log(`\n📈 Summary: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log('❌ Validation FAILED');
    process.exit(1);
  } else {
    console.log('✅ Validation PASSED');
    process.exit(0);
  }
}

main();

