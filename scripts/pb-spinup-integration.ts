#!/usr/bin/env node
/**
 * pb-spinup-integration.ts
 * Creates a temporary project to test package installation and usage
 */

import { mkdir, writeFile, readFile, readdir, rm } from 'fs/promises';
import { join, basename } from 'path';
import { parseArgs } from 'util';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface TestResult {
  package: string;
  installed: boolean;
  smoke: boolean;
  exports_verified: string[];
  errors: string[];
  warnings: string[];
}

async function findTarball(packageName: string, artifactsDir: string): Promise<string | null> {
  try {
    const files = await readdir(artifactsDir);
    const tarball = files.find(f => f.includes(packageName) && f.endsWith('.tgz'));
    return tarball ? join(artifactsDir, tarball) : null;
  } catch {
    return null;
  }
}

async function createTempProject(packageName: string, tarballPath: string): Promise<string> {
  const timestamp = Date.now();
  const tempDir = join(process.cwd(), `tmp-integration-${packageName}-${timestamp}`);
  
  console.log(`📁 Creating temp project: ${tempDir}`);
  await mkdir(tempDir, { recursive: true });
  
  // Create package.json
  const packageJson = {
    name: `test-${packageName}`,
    version: '1.0.0',
    type: 'module',
    private: true
  };
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  
  // Create tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      esModuleInterop: true,
      skipLibCheck: true
    }
  };
  await writeFile(join(tempDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
  
  return tempDir;
}

async function installPackage(tempDir: string, tarballPath: string): Promise<boolean> {
  console.log(`📦 Installing package from: ${basename(tarballPath)}`);
  
  try {
    const { stdout, stderr } = await execAsync(`npm install "${tarballPath}"`, {
      cwd: tempDir,
      shell: process.platform === 'win32' ? 'powershell.exe' : undefined
    });
    
    if (stderr && !stderr.includes('npm warn')) {
      console.warn(`   Warning: ${stderr}`);
    }
    
    console.log(`   ✅ Installation complete`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Installation failed: ${error.message}`);
    return false;
  }
}

async function generateSmokeTest(tempDir: string, packageName: string): Promise<string> {
  // Read the installed package.json to get exports
  const installedPackageJson = JSON.parse(
    await readFile(join(tempDir, 'node_modules', packageName, 'package.json'), 'utf-8')
  );
  
  const smokeTestPath = join(tempDir, 'smoke.ts');
  
  // Generate a simple smoke test
  const smokeTest = `import * as pkg from '${packageName}';

console.log('🧪 Running smoke test for ${packageName}');

// Verify package exports
const exports = Object.keys(pkg);
console.log('Exports found:', exports);

if (exports.length === 0) {
  console.error('❌ No exports found!');
  process.exit(1);
}

// Verify each export is defined
for (const exp of exports) {
  const value = (pkg as any)[exp];
  if (value === undefined) {
    console.error(\`❌ Export '\${exp}' is undefined\`);
    process.exit(1);
  }
  console.log(\`✅ \${exp}: \${typeof value}\`);
}

console.log('✅ Smoke test passed');
`;
  
  await writeFile(smokeTestPath, smokeTest);
  return smokeTestPath;
}

async function runSmokeTest(tempDir: string, smokeTestPath: string): Promise<{ success: boolean; exports: string[]; error?: string }> {
  console.log(`🧪 Running smoke test...`);
  
  try {
    const { stdout, stderr } = await execAsync(`npx tsx "${smokeTestPath}"`, {
      cwd: tempDir,
      shell: process.platform === 'win32' ? 'powershell.exe' : undefined
    });
    
    console.log(stdout);
    
    if (stderr && !stderr.includes('ExperimentalWarning')) {
      console.warn(`   Warning: ${stderr}`);
    }
    
    // Parse exports from output
    const exportsMatch = stdout.match(/Exports found: \[(.*?)\]/);
    const exports = exportsMatch 
      ? exportsMatch[1].split(',').map(e => e.trim().replace(/['"]/g, ''))
      : [];
    
    console.log(`   ✅ Smoke test passed`);
    return { success: true, exports };
  } catch (error: any) {
    console.error(`   ❌ Smoke test failed: ${error.message}`);
    return { success: false, exports: [], error: error.message };
  }
}

async function testPackage(packageName: string): Promise<TestResult> {
  const artifactsDir = join(process.cwd(), '.artifacts');
  const result: TestResult = {
    package: packageName,
    installed: false,
    smoke: false,
    exports_verified: [],
    errors: [],
    warnings: []
  };
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Testing package: ${packageName}`);
  console.log('═'.repeat(60));
  
  // Find tarball
  const tarballPath = await findTarball(packageName, artifactsDir);
  if (!tarballPath) {
    result.errors.push(`Tarball not found in ${artifactsDir}`);
    console.error(`❌ Tarball not found for ${packageName}`);
    return result;
  }
  
  let tempDir: string | null = null;
  
  try {
    // Create temp project
    tempDir = await createTempProject(packageName, tarballPath);
    
    // Install package
    result.installed = await installPackage(tempDir, tarballPath);
    if (!result.installed) {
      result.errors.push('Installation failed');
      return result;
    }
    
    // Generate and run smoke test
    const smokeTestPath = await generateSmokeTest(tempDir, `@bpm/${packageName}`);
    const smokeResult = await runSmokeTest(tempDir, smokeTestPath);
    
    result.smoke = smokeResult.success;
    result.exports_verified = smokeResult.exports;
    
    if (!smokeResult.success && smokeResult.error) {
      result.errors.push(smokeResult.error);
    }
    
    // Cleanup on success
    if (result.smoke && tempDir) {
      console.log(`🧹 Cleaning up temp directory...`);
      await rm(tempDir, { recursive: true, force: true });
    }
    
  } catch (error: any) {
    result.errors.push(error.message);
    console.error(`❌ Test failed: ${error.message}`);
  }
  
  return result;
}

async function testAllPackages(packagesPattern: string): Promise<TestResult[]> {
  const packagesDir = join(process.cwd(), 'packages');
  
  // Get all package directories
  const entries = await readdir(packagesDir, { withFileTypes: true });
  const packageNames = entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
  
  if (packageNames.length === 0) {
    console.warn('⚠️  No packages found');
    return [];
  }
  
  const results: TestResult[] = [];
  
  for (const packageName of packageNames) {
    const result = await testPackage(packageName);
    results.push(result);
  }
  
  return results;
}

// Parse CLI arguments
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    packages: { type: 'string', default: 'packages/*' }
  }
});

const packagesPattern = values.packages as string;

testAllPackages(packagesPattern)
  .then(results => {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 Integration Test Summary');
    console.log('═'.repeat(60));
    
    const passed = results.filter(r => r.installed && r.smoke).length;
    const failed = results.length - passed;
    
    console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}\n`);
    
    results.forEach(r => {
      const status = r.installed && r.smoke ? '✅' : '❌';
      console.log(`${status} ${r.package}`);
      if (r.errors.length > 0) {
        r.errors.forEach(err => console.log(`   Error: ${err}`));
      }
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

