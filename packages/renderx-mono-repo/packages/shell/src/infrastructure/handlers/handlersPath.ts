export function normalizeHandlersImportSpec(isBrowser: boolean, handlersPath: string): string {
  const raw = (handlersPath || '').trim();
  if (!raw) return raw;
  // URL: http(s)://...
  if (/^https?:\/\//i.test(raw)) return raw;
  // Treat project-relative paths like 'plugins/...', 'json-sequences/...' as paths
  const looksProjectPath = raw.startsWith('plugins/') || raw.startsWith('json-sequences/') || raw.startsWith('public/');
  // Bare package specifier (initial support: scoped packages like @scope/pkg/...)
  const isBare = !raw.startsWith('/') && !raw.startsWith('.') && !looksProjectPath && raw.startsWith('@');
  // In the browser, try to resolve bare specifiers to fully-qualified URLs so native import() works
  if (isBrowser && isBare) {
    // In Vitest, let the transformer resolve bare imports; do not rewrite
    try {
      if ((import.meta as any).vitest) {
        return raw;
      }
    } catch {}
    // Preferred: Vite/modern resolver
    try {
      const resolver: any = (import.meta as any).resolve;
      if (typeof resolver === 'function') {
        const resolved = resolver(raw);
        if (typeof resolved === 'string' && resolved) return resolved;
      }
    } catch {}
    // Dev fallback: Vite's /@id/<specifier> proxy
    try {
      const env: any = (import.meta as any).env;
      if (env && env.DEV) {
        return '/@id/' + raw;
      }
    } catch {}
    // Last resort: return raw (lets bundlers handle it in non-browser contexts)
    return raw;
  }
  // Path normalization for non-bare specs
  if (isBrowser) {
    return raw.startsWith('/') ? raw : '/' + raw.replace(/^\.\/?/, '');
  } else {
    // In Node/test, let the resolver handle bare packages normally
    if (isBare) {
      return raw;
    }
    return raw.startsWith('/') ? `..${raw}` : `../${raw.replace(/^\.\/?/, '')}`;
  }
}

export function isBareSpecifier(spec: string): boolean {
  const s = (spec || '').trim();
  if (!s) return false;
  if (/^https?:\/\//i.test(s)) return false; // URL is not considered "bare"
  const looksProjectPath = s.startsWith('plugins/') || s.startsWith('json-sequences/') || s.startsWith('public/');
  return !s.startsWith('/') && !s.startsWith('.') && !looksProjectPath && s.startsWith('@');
}
