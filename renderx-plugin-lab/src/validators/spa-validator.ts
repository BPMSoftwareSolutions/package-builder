/**
 * Symphonic Plugin Architecture (SPA) Validator
 * Validates plugin manifests and structure
 */

export interface PluginManifest {
  name: string;
  version: string;
  type: 'panel' | 'enhancement' | 'canvas';
  exports: string[];
}

export class SPAValidator {
  validate(manifest: PluginManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!manifest.name) {
      errors.push('Plugin name is required');
    }

    if (!manifest.version) {
      errors.push('Plugin version is required');
    }

    if (!['panel', 'enhancement', 'canvas'].includes(manifest.type)) {
      errors.push('Invalid plugin type');
    }

    if (!Array.isArray(manifest.exports) || manifest.exports.length === 0) {
      errors.push('Plugin must export at least one component');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export function validatePlugin(manifest: PluginManifest): boolean {
  const validator = new SPAValidator();
  const result = validator.validate(manifest);
  
  if (!result.valid) {
    console.error('❌ Plugin validation failed:', result.errors);
  }
  
  return result.valid;
}
