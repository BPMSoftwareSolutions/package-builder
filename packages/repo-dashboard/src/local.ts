/**
 * Local package discovery and analysis
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { LocalPackage, FindPackagesOptions, PackageReadiness } from './types.js';

export async function findLocalPackages(options: FindPackagesOptions = {}): Promise<LocalPackage[]> {
  const { basePath = './packages', includePrivate = false } = options;
  
  try {
    const resolvedPath = resolve(basePath);
    const entries = await readdir(resolvedPath, { withFileTypes: true });
    
    const packages: LocalPackage[] = [];
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const packagePath = join(resolvedPath, entry.name);
      const packageJsonPath = join(packagePath, 'package.json');
      
      try {
        const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);
        
        // Skip private packages if not included
        if (packageJson.private && !includePrivate) continue;
        
        const pkg = await analyzePackage(packagePath, packageJson);
        packages.push(pkg);
      } catch (error) {
        // Skip packages without valid package.json
        continue;
      }
    }
    
    return packages;
  } catch (error) {
    throw new Error(`Failed to find local packages: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function analyzePackage(packagePath: string, packageJson: any): Promise<LocalPackage> {
  const distExists = await directoryExists(join(packagePath, 'dist'));
  const artifactsExists = await directoryExists(join(packagePath, '.artifacts'));
  
  // Check if build is ready (has dist or .artifacts)
  const buildReady = distExists || artifactsExists;
  
  // Check if pack is ready (has dist and package.json with proper exports)
  const packReady = buildReady && hasProperExports(packageJson);
  
  return {
    name: packageJson.name || 'unknown',
    path: packagePath,
    version: packageJson.version || '0.0.0',
    private: packageJson.private || false,
    description: packageJson.description,
    buildReady,
    packReady,
    distExists,
    artifactsExists,
  };
}

async function directoryExists(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

function hasProperExports(packageJson: any): boolean {
  // Check for exports field or main field
  return !!(packageJson.exports || packageJson.main);
}

export async function getPackageReadiness(options: FindPackagesOptions = {}): Promise<PackageReadiness> {
  const packages = await findLocalPackages(options);
  const ready = packages.filter(pkg => pkg.packReady);
  
  return {
    total: packages.length,
    ready: ready.length,
    packages,
  };
}

export async function getPackageInfo(packagePath: string): Promise<LocalPackage | null> {
  try {
    const packageJsonPath = join(packagePath, 'package.json');
    const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    
    return analyzePackage(packagePath, packageJson);
  } catch (error) {
    return null;
  }
}

