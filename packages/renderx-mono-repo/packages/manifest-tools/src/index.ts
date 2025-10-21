/**
 * @renderx/manifest-tools
 * Manifest generation, validation, and integrity verification
 */

/**
 * Validate a plugin manifest
 */
export function validateManifest(manifest: any): boolean {
  return manifest && manifest.name && manifest.version;
}

/**
 * Generate manifest integrity hash
 */
export function generateIntegrityHash(manifest: any): string {
  return Buffer.from(JSON.stringify(manifest)).toString('base64');
}

/**
 * Verify manifest integrity
 */
export function verifyIntegrity(manifest: any, hash: string): boolean {
  return generateIntegrityHash(manifest) === hash;
}

