// Interaction manifest builder (minimal impl for tests)
// Accepts an array of catalogs with { routes } and an array of override maps.
// Returns a manifest object: { routes: Record<string, { pluginId, sequenceId }> }

export type Route = { pluginId: string; sequenceId: string };
export type Catalog = { routes: Record<string, Route> };

export function buildInteractionManifest(
  catalogs: Array<Catalog | null | undefined>,
  overrides: Array<Record<string, Route> | null | undefined>
): Catalog {
  const manifest: Catalog = { routes: {} };
  for (const c of catalogs || []) {
    const routes = c?.routes;
    if (routes && typeof routes === 'object') {
      Object.assign(manifest.routes, routes);
    }
  }
  for (const o of overrides || []) {
    if (o && typeof o === 'object') {
      Object.assign(manifest.routes, o as Record<string, Route>);
    }
  }
  return manifest;
}
