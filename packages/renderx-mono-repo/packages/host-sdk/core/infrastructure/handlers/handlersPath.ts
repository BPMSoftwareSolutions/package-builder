// Minimal helpers for resolving handler module specifiers in the host SDK
// These replace references that existed in the demo host repo

/**
 * Determines whether a module specifier is a bare specifier (e.g. "@scope/pkg/subpath")
 * rather than a relative/absolute path or URL.
 */
export function isBareSpecifier(spec: string): boolean {
  if (!spec) return false;
  return !spec.startsWith('.') && !spec.startsWith('/') && !/^[a-zA-Z]+:\/\//.test(spec);
}

/**
 * Normalizes a handlers module specifier for dynamic import. For now this is a no-op
 * and simply returns the provided spec; it exists for parity with the original host code
 * and future extension if environment-specific normalization is required.
 */
export function normalizeHandlersImportSpec(_isBrowser: boolean, handlersPath: string): string {
  return handlersPath;
}

