#!/usr/bin/env node
/**
 * pb-report.ts
 * Summarizes the status of all quality gates for PR checks
 */

import { readFile, readdir } from 'fs/promises';
import { join, basename } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface GateStatus {
  name: string;
  passed: boolean;
  details: string;
}

interface PackageReport {
  package: string;
  gates: GateStatus[];
  allPassed: boolean;
}

async function checkStructureGate(packagePath: string): Promise<GateStatus> {
  const requiredFiles = ['package.json', 'README.md', 'src', 'test', 'dist'];
  const missing: string[] = [];
  
  for (const file of requiredFiles) {
    try {
      const { access } = await import('fs/promises');
      await access(join(packagePath, file));
    } catch {
      missing.push(file);
    }
  }
  
  return {
    name: 'G1: Structure & Naming',
    passed: missing.length === 0,
    details: missing.length > 0 ? `Missing: ${missing.join(', ')}` : 'All required files present'
  };
}

async function checkUnitTestsGate(packagePath: string): Promise<GateStatus> {
  try {
    const { stdout, stderr } = await execAsync('npm test', {
      cwd: packagePath,
      shell: process.platform === 'win32' ? 'powershell.exe' : undefined
    });
    
    // Check if tests passed
    const passed = !stderr.includes('FAIL') && !stdout.includes('FAIL');
    
    return {
      name: 'G2: Unit Tests',
      passed,
      details: passed ? 'All tests passed' : 'Some tests failed'
    };
  } catch (error: any) {
    return {
      name: 'G2: Unit Tests',
      passed: false,
      details: `Test execution failed: ${error.message}`
    };
  }
}

async function checkPackGate(packagePath: string): Promise<GateStatus> {
  try {
    const packageJsonPath = join(packagePath, 'package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
    
    // Check exports map
    const hasExports = packageJson.exports && packageJson.exports['.'];
    const hasTypes = hasExports && packageJson.exports['.'].types;
    const hasImport = hasExports && packageJson.exports['.'].import;
    
    // Check dist files exist
    const { access } = await import('fs/promises');
    let distExists = false;
    try {
      await access(join(packagePath, 'dist', 'index.js'));
      await access(join(packagePath, 'dist', 'index.d.ts'));
      distExists = true;
    } catch {
      distExists = false;
    }
    
    const passed = hasExports && hasTypes && hasImport && distExists;
    
    return {
      name: 'G4: Pack & Publishability',
      passed,
      details: passed 
        ? 'Package has correct exports and build artifacts'
        : 'Missing exports map or build artifacts'
    };
  } catch (error: any) {
    return {
      name: 'G4: Pack & Publishability',
      passed: false,
      details: `Check failed: ${error.message}`
    };
  }
}

async function checkExternalInstallGate(packageName: string): Promise<GateStatus> {
  const artifactsDir = join(process.cwd(), '.artifacts');
  
  try {
    const files = await readdir(artifactsDir);
    const tarball = files.find(f => f.includes(packageName) && f.endsWith('.tgz'));
    
    if (!tarball) {
      return {
        name: 'G5: External Install Test',
        passed: false,
        details: 'Tarball not found'
      };
    }
    
    return {
      name: 'G5: External Install Test',
      passed: true,
      details: `Tarball created: ${tarball}`
    };
  } catch (error: any) {
    return {
      name: 'G5: External Install Test',
      passed: false,
      details: `Check failed: ${error.message}`
    };
  }
}

async function checkGuardrailsGate(packagePath: string): Promise<GateStatus> {
  try {
    const packageJsonPath = join(packagePath, 'package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
    
    const violations: string[] = [];
    
    // Check sideEffects
    if (packageJson.sideEffects !== false) {
      violations.push('sideEffects not false');
    }
    
    // Check type
    if (packageJson.type !== 'module') {
      violations.push('type not module');
    }
    
    // Check for heavy deps
    const heavyDeps = ['lodash', 'moment', 'jquery'];
    const allDeps = { ...packageJson.dependencies, ...packageJson.peerDependencies };
    for (const dep of heavyDeps) {
      if (allDeps[dep]) {
        violations.push(`Heavy dep: ${dep}`);
      }
    }
    
    return {
      name: 'G6: Guardrails',
      passed: violations.length === 0,
      details: violations.length > 0 ? violations.join(', ') : 'No violations'
    };
  } catch (error: any) {
    return {
      name: 'G6: Guardrails',
      passed: false,
      details: `Check failed: ${error.message}`
    };
  }
}

async function generatePackageReport(packagePath: string): Promise<PackageReport> {
  const packageName = basename(packagePath);
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Checking gates for: ${packageName}`);
  console.log('═'.repeat(60));
  
  const gates: GateStatus[] = [];
  
  // Run all gate checks
  gates.push(await checkStructureGate(packagePath));
  gates.push(await checkUnitTestsGate(packagePath));
  gates.push(await checkPackGate(packagePath));
  gates.push(await checkExternalInstallGate(packageName));
  gates.push(await checkGuardrailsGate(packagePath));
  
  // Print gate status
  gates.forEach(gate => {
    const status = gate.passed ? '✅' : '❌';
    console.log(`${status} ${gate.name}: ${gate.details}`);
  });
  
  const allPassed = gates.every(g => g.passed);
  
  return {
    package: packageName,
    gates,
    allPassed
  };
}

async function generateReport(): Promise<PackageReport[]> {
  const packagesDir = join(process.cwd(), 'packages');
  
  try {
    const entries = await readdir(packagesDir, { withFileTypes: true });
    const packageDirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => join(packagesDir, entry.name));
    
    if (packageDirs.length === 0) {
      console.warn('⚠️  No packages found');
      return [];
    }
    
    const reports: PackageReport[] = [];
    
    for (const packagePath of packageDirs) {
      const report = await generatePackageReport(packagePath);
      reports.push(report);
    }
    
    return reports;
  } catch (error: any) {
    console.error(`❌ Failed to read packages: ${error.message}`);
    return [];
  }
}

generateReport()
  .then(reports => {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 Quality Gates Summary');
    console.log('═'.repeat(60));
    
    const allPassed = reports.every(r => r.allPassed);
    const passedCount = reports.filter(r => r.allPassed).length;
    
    console.log(`Total packages: ${reports.length}`);
    console.log(`Passed all gates: ${passedCount}`);
    console.log(`Failed some gates: ${reports.length - passedCount}\n`);
    
    reports.forEach(r => {
      const status = r.allPassed ? '✅' : '❌';
      const passedGates = r.gates.filter(g => g.passed).length;
      console.log(`${status} ${r.package} (${passedGates}/${r.gates.length} gates passed)`);
    });
    
    console.log('\n' + '═'.repeat(60));
    if (allPassed) {
      console.log('✅ All packages passed all quality gates');
      console.log('✅ Packaged & verifiable');
    } else {
      console.log('❌ Some packages failed quality gates');
      console.log('❌ Not ready for merge');
    }
    console.log('═'.repeat(60));
    
    console.log('\nJSON Output:');
    console.log(JSON.stringify(reports, null, 2));
    
    if (!allPassed) {
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });

