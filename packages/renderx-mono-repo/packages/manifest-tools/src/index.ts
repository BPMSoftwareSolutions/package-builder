// Shared pure builders & types for manifests (Phase 1 extraction)

export interface InteractionRoute { pluginId: string; sequenceId: string }
export interface InteractionManifest { version: string; routes: Record<string, InteractionRoute> }

export function buildInteractionManifest(
  catalogs: Array<any>,
  componentOverrideMaps: Array<Record<string, InteractionRoute>>
): InteractionManifest {
  const routes: Record<string, InteractionRoute> = {};
  // Merge plugin catalogs first (later catalogs override earlier ones deterministically)
  for (const cat of catalogs || []) {
    const r = cat?.routes || {};
    for (const [k, v] of Object.entries(r)) routes[k] = v as InteractionRoute;
  }
  // Then merge component-level overrides (these take precedence over plugin catalogs)
  for (const o of componentOverrideMaps || []) {
    for (const [k, v] of Object.entries(o || {})) routes[k] = v as InteractionRoute;
  }
  // Emit with sorted keys for deterministic JSON across platforms
  const sortedRoutes: Record<string, InteractionRoute> = {};
  for (const k of Object.keys(routes).sort()) sortedRoutes[k] = routes[k];
  return { version: '1.0.0', routes: sortedRoutes };
}

export interface TopicRoute { pluginId: string; sequenceId: string }
export interface TopicDef {
  routes: TopicRoute[];
  payloadSchema?: any;
  visibility?: 'public' | 'internal';
  correlationKeys?: string[];
  perf?: { throttleMs?: number; debounceMs?: number; dedupeWindowMs?: number };
  notes?: string;
}
export interface TopicsManifest { version: string; topics: Record<string, TopicDef> }

export function buildTopicsManifest(catalogs: Array<any>): TopicsManifest {
  const topics: Record<string, TopicDef> = {};
  for (const cat of catalogs || []) {
    const t = cat?.topics || {};
    for (const [key, defAny] of Object.entries<any>(t)) {
      const def = defAny || {};
      const routes: TopicRoute[] = [];
      if (def.route) routes.push(def.route);
      if (Array.isArray(def.routes)) routes.push(...def.routes);
      topics[key] = {
        routes,
        payloadSchema: def.payloadSchema || null,
        visibility: def.visibility || 'public',
        correlationKeys: Array.isArray(def.correlationKeys) ? def.correlationKeys : [],
        perf: def.perf || {},
        notes: def.notes || ''
      };
    }
  }
  return { version: '1.0.0', topics };
}

export interface LayoutManifest { layout: any; slots: any[] }
