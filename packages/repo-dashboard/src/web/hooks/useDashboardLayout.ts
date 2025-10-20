import { useState, useEffect, useCallback } from 'react';

export interface LayoutComponent {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  settings?: Record<string, any>;
}

export interface DashboardLayout {
  id: string;
  name: string;
  components: LayoutComponent[];
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
}

const DEFAULT_LAYOUT_STORAGE_KEY = 'dashboard-layout';

export function useDashboardLayout(layoutId: string = 'default') {
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load layout from localStorage
  useEffect(() => {
    try {
      setLoading(true);
      const stored = localStorage.getItem(`${DEFAULT_LAYOUT_STORAGE_KEY}-${layoutId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setLayout(parsed);
      } else {
        setLayout(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load layout');
    } finally {
      setLoading(false);
    }
  }, [layoutId]);

  // Save layout to localStorage
  const saveLayout = useCallback((newLayout: DashboardLayout) => {
    try {
      localStorage.setItem(
        `${DEFAULT_LAYOUT_STORAGE_KEY}-${layoutId}`,
        JSON.stringify(newLayout)
      );
      setLayout(newLayout);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save layout');
    }
  }, [layoutId]);

  // Update component visibility
  const toggleComponentVisibility = useCallback((componentId: string) => {
    if (!layout) return;
    const updated = {
      ...layout,
      components: layout.components.map(c =>
        c.id === componentId ? { ...c, visible: !c.visible } : c
      ),
      updatedAt: new Date(),
    };
    saveLayout(updated);
  }, [layout, saveLayout]);

  // Update component position
  const updateComponentPosition = useCallback(
    (componentId: string, x: number, y: number) => {
      if (!layout) return;
      const updated = {
        ...layout,
        components: layout.components.map(c =>
          c.id === componentId ? { ...c, position: { x, y } } : c
        ),
        updatedAt: new Date(),
      };
      saveLayout(updated);
    },
    [layout, saveLayout]
  );

  // Update component size
  const updateComponentSize = useCallback(
    (componentId: string, width: number, height: number) => {
      if (!layout) return;
      const updated = {
        ...layout,
        components: layout.components.map(c =>
          c.id === componentId ? { ...c, size: { width, height } } : c
        ),
        updatedAt: new Date(),
      };
      saveLayout(updated);
    },
    [layout, saveLayout]
  );

  // Reset to default layout
  const resetLayout = useCallback(() => {
    localStorage.removeItem(`${DEFAULT_LAYOUT_STORAGE_KEY}-${layoutId}`);
    setLayout(null);
  }, [layoutId]);

  return {
    layout,
    loading,
    error,
    saveLayout,
    toggleComponentVisibility,
    updateComponentPosition,
    updateComponentSize,
    resetLayout,
  };
}

