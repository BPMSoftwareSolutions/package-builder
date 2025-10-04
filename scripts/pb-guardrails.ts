#!/usr/bin/env node
/**
 * pb-guardrails.ts
 * Validates package structure, naming, exports, and dependencies
 */

import { readFile, readdir, access } from 'fs/promises';
import { join, basename } from 'path';
import { parseArgs } from 'util';

interface ValidationResult {
  package: string;
  passed: boolean;
  violations: string[];
  warnings: string[];
}

const HEAVY_DEPS = [
  'lodash',
  'moment',
  'jquery',
  'underscore',
  'axios' // prefer native fetch
];

const REQUIRED_FILES = ['package.json', 'README.md', 'src', 'test'];
const REQUIRED_PACKAGE_FIELDS = ['name', 'version', 'description', 'type', 'exports', 'main', 'types'];

async function validatePackageStructure(packagePath: string): Promise<string[]> {
  const violations: string[] = [];
  
  for (const file of REQUIRED_FILES) {
    try {
      await access(join(packagePath, file));
    } catch {
      violations.push(`Missing required file/directory: ${file}`);
    }
  }
  
  return violations;
}

async function validatePackageJson(packagePath: string): Promise<{ violations: string[]; warnings: string[] }> {
  const violations: string[] = [];
  const warnings: string[] = [];
  
  try {
    const packageJsonPath = join(packagePath, 'package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
    
    // Check required fields
    for (const field of REQUIRED_PACKAGE_FIELDS) {
      if (!packageJson[field]) {
        violations.push(`Missing required field in package.json: ${field}`);
      }
    }
    
    // Check name format
    if (packageJson.name && !packageJson.name.startsWith('@bpm/')) {
      violations.push(`Package name must start with @bpm/ (got: ${packageJson.name})`);
    }
    
    // Check type is module
    if (packageJson.type !== 'module') {
      violations.push(`Package type must be "module" (got: ${packageJson.type})`);
    }
    
    // Check sideEffects
    if (packageJson.sideEffects !== false) {
      warnings.push('sideEffects should be false for tree-shaking');
    }
    
    // Check exports map
    if (packageJson.exports) {
      const mainExport = packageJson.exports['.'];
      if (!mainExport) {
        violations.push('exports map must include "." entry');
      } else {
        if (!mainExport.types) {
          violations.push('exports["."] must include "types" field');
        }
        if (!mainExport.import) {
          violations.push('exports["."] must include "import" field');
        }
      }
    }
    
    // Check for heavy dependencies
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.peerDependencies
    };
    
    for (const dep of HEAVY_DEPS) {
      if (allDeps[dep]) {
        violations.push(`Heavy dependency detected: ${dep} (prefer native alternatives)`);
      }
    }
    
    // Check files field
    if (!packageJson.files || !Array.isArray(packageJson.files)) {
      warnings.push('files field should specify which files to include in package');
    } else {
      if (!packageJson.files.includes('dist')) {
        violations.push('files field must include "dist"');
      }
    }
    
    // Check scripts
    const requiredScripts = ['build', 'test'];
    for (const script of requiredScripts) {
      if (!packageJson.scripts?.[script]) {
        violations.push(`Missing required script: ${script}`);
      }
    }
    
  } catch (error: any) {
    violations.push(`Failed to read/parse package.json: ${error.message}`);
  }
  
  return { violations, warnings };
}

async function validateNaming(packagePath: string): Promise<string[]> {
  const violations: string[] = [];
  const packageName = basename(packagePath);
  
  // Check kebab-case
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(packageName)) {
    violations.push(`Package directory name must be kebab-case (got: ${packageName})`);
  }
  
  return violations;
}

async function validateBuildOutput(packagePath: string): Promise<string[]> {
  const violations: string[] = [];
  const distPath = join(packagePath, 'dist');
  
  try {
    await access(distPath);
    
    // Check for index.js and index.d.ts
    try {
      await access(join(distPath, 'index.js'));
    } catch {
      violations.push('dist/index.js not found (run build first)');
    }
    
    try {
      await access(join(distPath, 'index.d.ts'));
    } catch {
      violations.push('dist/index.d.ts not found (TypeScript declarations missing)');
    }
    
  } catch {
    violations.push('dist/ directory not found (run build first)');
  }
  
  return violations;
}

async function validatePackage(packagePath: string): Promise<ValidationResult> {
  const packageName = basename(packagePath);
  const result: ValidationResult = {
    package: packageName,
    passed: true,
    violations: [],
    warnings: []
  };
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Validating: ${packageName}`);
  console.log('═'.repeat(60));
  
  // Run all validations
  const structureViolations = await validatePackageStructure(packagePath);
  const namingViolations = await validateNaming(packagePath);
  const { violations: packageJsonViolations, warnings: packageJsonWarnings } = await validatePackageJson(packagePath);
  const buildViolations = await validateBuildOutput(packagePath);
  
  result.violations = [
    ...structureViolations,
    ...namingViolations,
    ...packageJsonViolations,
    ...buildViolations
  ];
  
  result.warnings = packageJsonWarnings;
  result.passed = result.violations.length === 0;
  
  // Print results
  if (result.violations.length > 0) {
    console.log('❌ Violations:');
    result.violations.forEach(v => console.log(`   • ${v}`));
  }
  
  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach(w => console.log(`   • ${w}`));
  }
  
  if (result.passed) {
    console.log('✅ All checks passed');
  }
  
  return result;
}

async function validateRepo(repoPath: string): Promise<ValidationResult[]> {
  const packagesDir = join(repoPath, 'packages');
  
  try {
    const entries = await readdir(packagesDir, { withFileTypes: true });
    const packageDirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => join(packagesDir, entry.name));
    
    if (packageDirs.length === 0) {
      console.warn('⚠️  No packages found');
      return [];
    }
    
    const results: ValidationResult[] = [];
    
    for (const packagePath of packageDirs) {
      const result = await validatePackage(packagePath);
      results.push(result);
    }
    
    return results;
  } catch (error: any) {
    console.error(`❌ Failed to read packages directory: ${error.message}`);
    return [];
  }
}

async function validateSinglePackage(packagePath: string): Promise<ValidationResult[]> {
  const result = await validatePackage(packagePath);
  return [result];
}

// Parse CLI arguments
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    repo: { type: 'string' },
    pkg: { type: 'string' }
  }
});

const repoPath = values.repo as string | undefined;
const pkgPath = values.pkg as string | undefined;

if (!repoPath && !pkgPath) {
  console.error('❌ Error: Either --repo or --pkg must be specified');
  console.error('Usage:');
  console.error('  node scripts/pb-guardrails.ts --repo .');
  console.error('  node scripts/pb-guardrails.ts --pkg packages/my-package');
  process.exit(1);
}

const validateFn = pkgPath 
  ? () => validateSinglePackage(pkgPath)
  : () => validateRepo(repoPath || '.');

validateFn()
  .then(results => {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 Guardrails Summary');
    console.log('═'.repeat(60));
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
    
    console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`Violations: ${totalViolations} | Warnings: ${totalWarnings}\n`);
    
    results.forEach(r => {
      const status = r.passed ? '✅' : '❌';
      console.log(`${status} ${r.package} (${r.violations.length} violations, ${r.warnings.length} warnings)`);
    });
    
    console.log('\nJSON Output:');
    console.log(JSON.stringify(results, null, 2));
    
    if (failed > 0) {
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });

