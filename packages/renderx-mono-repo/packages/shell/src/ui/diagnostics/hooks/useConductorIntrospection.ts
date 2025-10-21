/**
 * useConductorIntrospection Hook
 * 
 * Manages conductor introspection state.
 * Extracted from DiagnosticsPanel.tsx as part of Phase 3 refactoring.
 * 
 * @see docs/refactoring/diagnostics-modularity-strategy.md
 * @see docs/refactoring/phase-3-implementation-guide.md
 */

import { useState, useEffect, useCallback } from 'react';
import { introspectConductor as introspectConductorService } from '../services';
import type { ConductorIntrospection } from '../types';

/**
 * Hook for managing conductor introspection
 * 
 * @param conductor - The conductor instance to introspect
 * @returns Object containing introspection data and refresh function
 */
export function useConductorIntrospection(conductor: any) {
  const [introspection, setIntrospection] = useState<ConductorIntrospection | null>(null);

  /**
   * Refreshes conductor introspection data
   */
  const refresh = useCallback(() => {
    if (conductor) {
      const data = introspectConductorService(conductor);
      setIntrospection(data);
    }
  }, [conductor]);

  // Introspect on mount and when conductor changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    introspection,
    refresh
  };
}

