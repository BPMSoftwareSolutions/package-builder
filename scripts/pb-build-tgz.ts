#!/usr/bin/env node
/**
 * pb-build-tgz.ts
 * Builds and packs packages into tarballs, emitting metadata
 */

import { readdir, readFile, mkdir, stat } from 'fs/promises';
import { join, basename } from 'path';
import { parseArgs } from 'util';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createHash } from 'crypto';

const execAsync = promisify(exec);

interface PackageMetadata {
  name: string;
  version: string;
  path: string;
  size: number;
  hash: string;
}

async function buildPackage(packagePath: string): Promise<void> {
  console.log(`🔨 Building package: ${basename(packagePath)}`);
  
  try {
    const { stdout, stderr } = await execAsync('npm run build', {
      cwd: packagePath,
      shell: process.platform === 'win32' ? 'powershell.exe' : undefined
    });
    
    if (stderr && !stderr.includes('npm warn')) {
      console.warn(`   Warning: ${stderr}`);
    }
    
    console.log(`   ✅ Build complete`);
  } catch (error: any) {
    console.error(`   ❌ Build failed: ${error.message}`);
    throw error;
  }
}

async function packPackage(packagePath: string, artifactsDir: string): Promise<PackageMetadata> {
  const packageJsonPath = join(packagePath, 'package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
  
  console.log(`📦 Packing: ${packageJson.name}@${packageJson.version}`);
  
  // Ensure artifacts directory exists
  await mkdir(artifactsDir, { recursive: true });
  
  try {
    const { stdout } = await execAsync(`npm pack --pack-destination "${artifactsDir}"`, {
      cwd: packagePath,
      shell: process.platform === 'win32' ? 'powershell.exe' : undefined
    });
    
    // Extract filename from npm pack output
    const filename = stdout.trim().split('\n').pop()?.trim() || '';
    const tarballPath = join(artifactsDir, filename);
    
    // Get file stats
    const stats = await stat(tarballPath);
    
    // Calculate hash
    const fileBuffer = await readFile(tarballPath);
    const hash = createHash('sha256').update(fileBuffer).digest('hex');
    
    const metadata: PackageMetadata = {
      name: packageJson.name,
      version: packageJson.version,
      path: tarballPath,
      size: stats.size,
      hash
    };
    
    console.log(`   ✅ Packed: ${filename}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Hash: ${hash.substring(0, 16)}...`);
    
    return metadata;
  } catch (error: any) {
    console.error(`   ❌ Pack failed: ${error.message}`);
    throw error;
  }
}

async function processPackages(packagesPattern: string): Promise<PackageMetadata[]> {
  const packagesDir = join(process.cwd(), 'packages');
  const artifactsDir = join(process.cwd(), '.artifacts');
  
  console.log(`📦 Processing packages in: ${packagesDir}`);
  console.log(`📁 Artifacts directory: ${artifactsDir}\n`);
  
  // Get all package directories
  const entries = await readdir(packagesDir, { withFileTypes: true });
  const packageDirs = entries
    .filter(entry => entry.isDirectory())
    .map(entry => join(packagesDir, entry.name));
  
  if (packageDirs.length === 0) {
    console.warn('⚠️  No packages found');
    return [];
  }
  
  const results: PackageMetadata[] = [];
  
  for (const packagePath of packageDirs) {
    try {
      // Build the package
      await buildPackage(packagePath);
      
      // Pack the package
      const metadata = await packPackage(packagePath, artifactsDir);
      results.push(metadata);
      
      console.log('');
    } catch (error) {
      console.error(`Failed to process ${basename(packagePath)}\n`);
      // Continue with other packages
    }
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

processPackages(packagesPattern)
  .then(results => {
    console.log('═'.repeat(60));
    console.log('📊 Summary');
    console.log('═'.repeat(60));
    console.log(`Total packages: ${results.length}`);
    console.log(`Total size: ${(results.reduce((sum, r) => sum + r.size, 0) / 1024).toFixed(2)} KB`);
    console.log('');
    console.log('Packages:');
    results.forEach(r => {
      console.log(`  • ${r.name}@${r.version}`);
      console.log(`    ${basename(r.path)}`);
    });
    console.log('');
    
    // Output JSON for CI/CD
    console.log('JSON Output:');
    console.log(JSON.stringify(results, null, 2));
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });

