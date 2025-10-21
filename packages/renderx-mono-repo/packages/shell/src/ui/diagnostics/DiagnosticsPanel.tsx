// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  🚧 REFACTORING IN PROGRESS - Issue #297                                 ║
// ║  Strategy: docs/refactoring/diagnostics-modularity-strategy.md           ║
// ║  Status: Phase 4 Complete ✅ | Phase 5 Pending ⏳                         ║
// ║                                                                          ║
// ║  ⚠️  FOR AI AGENTS: This file is being modularized                       ║
// ║                                                                          ║
// ║  DO NOT:                                                                 ║
// ║    • Add new inline types (use src/ui/diagnostics/types/)               ║
// ║    • Add data fetching logic here (use services/)                       ║
// ║    • Add new useState hooks (use existing custom hooks from hooks/)     ║
// ║    • Add complex nested components (extract to components/)             ║
// ║                                                                          ║
// ║  DO:                                                                     ║
// ║    • Import types from src/ui/diagnostics/types/                        ║
// ║    • Use existing services from src/ui/diagnostics/services/            ║
// ║    • Use existing hooks from src/ui/diagnostics/hooks/                  ║
// ║    • Use existing components from src/ui/diagnostics/components/        ║
// ║    • Keep changes minimal and follow existing patterns                  ║
// ║    • Read src/ui/diagnostics/REFACTORING.md for full guidance           ║
// ║                                                                          ║
// ║  Current: 383 lines → Target: <200 lines                                ║
// ║  Next Phase: Tree explorer modularization (Phase 5)                     ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import * as React from "react";
import { useState, useCallback, useMemo } from "react";
import { resolveInteraction } from "@renderx-plugins/host-sdk/core/manifests/interactionManifest";
import { getTopicsMap } from "@renderx-plugins/host-sdk/core/manifests/topicsManifest";
import { PluginTreeExplorer } from "../PluginTreeExplorer";
import {
  InspectionPanel,
  StatsOverview,
  DiagnosticsToolbar,
  PluginsPanel,
  TopicsPanel,
  RoutesPanel,
  ComponentsPanel,
  ConductorPanel,
  PerformancePanel,
  LogsPanel,
  FooterPanel,
  SequencePlayer,
  LogConverter
} from "./components";
import "./components/shared/inspection.css";
import {
  useDiagnosticsData,
  useDiagnosticsLogs,
  useConductorIntrospection,
  useEventMonitoring,
  usePerformanceMetrics,
  usePluginLoadingStats
} from "./hooks";

interface DiagnosticsPanelProps {
  conductor: any;
}

/**
 * DiagnosticsPanel - Main diagnostics interface for RenderX plugin system
 *
 * @refactoring-status phase-4-complete
 * @refactoring-issue #297
 * @refactoring-current-phase 4
 * @refactoring-next-phase 5-tree-explorer-modularization
 * @refactoring-target <200 lines (currently 383)
 *
 * @ai-guidance
 * This component is under active refactoring per diagnostics-modularity-strategy.md
 *
 * **Phase Status:**
 * - ✅ Phase 1: Types centralized in src/ui/diagnostics/types/
 * - ✅ Phase 2: Services extracted to src/ui/diagnostics/services/
 * - ✅ Phase 3: Custom hooks extracted to src/ui/diagnostics/hooks/
 * - ✅ Phase 4: Components extracted to src/ui/diagnostics/components/
 * - ⏳ Phase 5: Tree explorer modularization (pending)
 * - ⏳ Phase 6: Testing & documentation (pending)
 *
 * **When modifying this file:**
 * - Import types from src/ui/diagnostics/types/
 * - Use services from src/ui/diagnostics/services/
 * - Use hooks from src/ui/diagnostics/hooks/
 * - Use components from src/ui/diagnostics/components/
 * - DO NOT add inline types or data fetching logic
 * - DO NOT add new useState hooks (use existing custom hooks)
 * - DO NOT add complex nested components (extract to components/)
 * - Read src/ui/diagnostics/REFACTORING.md for detailed guidance
 *
 * @see docs/refactoring/diagnostics-modularity-strategy.md
 * @see docs/refactoring/PROGRESS-SUMMARY.md
 * @see src/ui/diagnostics/REFACTORING.md
 */
export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ conductor }) => {
  // ┌─────────────────────────────────────────────────────────────────┐
  // │ 🚧 REFACTORING ZONE: Custom Hooks Usage                         │
  // │ Phase 3 Complete: Using custom hooks for state management       │
  // │ DO: Continue using these hooks for all state needs              │
  // │ DO NOT: Add new useState hooks - extend existing hooks instead  │
  // └─────────────────────────────────────────────────────────────────┘
  const { logs, addLog, clearLogs } = useDiagnosticsLogs();
  const {
    manifest,
    interactionStats,
    topicsStats,
    pluginStats,
    components,
    loading,
    error: _error,
    refresh: refreshData
  } = useDiagnosticsData(conductor, addLog);
  const { introspection: conductorIntrospection, refresh: refreshConductor } = useConductorIntrospection(conductor);
  const { metrics: performanceMetrics, trackMetric } = usePerformanceMetrics();
  const { stats: loadingStats, updateStats: updateLoadingStats } = usePluginLoadingStats();

  // Subscribe to event monitoring
  useEventMonitoring(conductor, addLog);

  // Combined refresh function
  const updateStats = useCallback(async () => {
    await refreshData();
    refreshConductor();
  }, [refreshData, refreshConductor]);

  // ┌─────────────────────────────────────────────────────────────────┐
  // │ 🚧 REFACTORING ZONE: UI State                                   │
  // │ Target: Extract to useUIState() hook or similar                 │
  // │ DO NOT: Add more useState hooks here                            │
  // │ DO: Keep UI state minimal, consider extraction in future        │
  // └─────────────────────────────────────────────────────────────────┘
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [manifestsRefreshCounter] = useState(0);
  const [selectedNodePath, setSelectedNodePath] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<'overview' | 'plugins' | 'topics' | 'routes' | 'components' | 'conductor' | 'performance' | 'inspection' | 'sequence-player' | 'log-converter'>('overview');
  const [_selectedNodeData, _setSelectedNodeData] = useState<any>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(() => {
    const saved = localStorage.getItem('diagnostics-left-panel-width');
    return saved ? parseInt(saved, 10) : 300;
  });

  // Update loading stats when manifest changes
  React.useEffect(() => {
    if (manifest?.plugins) {
      updateLoadingStats({ totalPlugins: manifest.plugins.length });
    }
  }, [manifest, updateLoadingStats]);

  // ┌─────────────────────────────────────────────────────────────────┐
  // │ 🚧 REFACTORING ZONE: Event Handlers                             │
  // │ Target: Consider extracting to custom hook or service           │
  // │ DO: Keep handlers focused and minimal                           │
  // │ DO NOT: Add complex business logic here                         │
  // └─────────────────────────────────────────────────────────────────┘
  const testInteraction = async (route: string) => {
    if (!conductor) return;

    const startTime = Date.now();
    try {
      addLog('info', `Testing interaction: ${route}`);
      const resolved = resolveInteraction(route);
      addLog('info', `Resolved to: ${resolved.pluginId} / ${resolved.sequenceId}`);

      // Test with minimal payload
      const result = await conductor.play(resolved.pluginId, resolved.sequenceId, {
        test: true,
        timestamp: Date.now()
      });

      const duration = Date.now() - startTime;
      trackMetric(`interaction_${route}`, duration);
      addLog('info', `Interaction test completed for ${route} in ${duration}ms`, result);
    } catch (error) {
      const duration = Date.now() - startTime;
      trackMetric(`interaction_${route}_error`, duration);
      addLog('error', `Interaction test failed for ${route} after ${duration}ms`, error);
    }
  };

  const testTopic = async (topicName: string) => {
    if (!conductor) return;

    try {
      addLog('info', `Testing topic: ${topicName}`);

      // Publish directly through conductor
      await conductor.publish(topicName, {
        test: true,
        timestamp: Date.now(),
        source: 'diagnostics-panel-test'
      }, conductor);

      addLog('info', `Topic test completed for ${topicName}`);
    } catch (error) {
      addLog('error', `Topic test failed for ${topicName}`, error);
    }
  };

  const exportLogs = () => {
    const logData = {
      timestamp: new Date().toISOString(),
      stats: {
        loading: loadingStats,
        interaction: interactionStats,
        topics: topicsStats,
        plugins: pluginStats,
        conductor: conductorIntrospection
      },
      logs: logs,
      manifest: manifest
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostics-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addLog('info', 'Exported detailed report');
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Get topics map first (needed by handleTreeNodeSelect)
  const topicsMap = useMemo(() => {
    return getTopicsMap();
  }, [manifestsRefreshCounter]);

  // Handle tree node selection
  const handleTreeNodeSelect = useCallback((nodePath: string | null) => {
    setSelectedNodePath(nodePath);

    if (!nodePath) {
      setSelectedNodeType('overview');
      _setSelectedNodeData(null);
      return;
    }

    // Parse the node path to determine what to show
    if (nodePath === 'plugins') {
      setSelectedNodeType('plugins');
      _setSelectedNodeData(null);
    } else if (nodePath.startsWith('plugin:')) {
      // Check if it's a plugin sub-node (e.g., plugin:id:info)
      const parts = nodePath.split(':');
      if (parts.length === 3) {
        // Plugin sub-node: plugin:{pluginId}:{nodeType}
        const pluginId = parts[1];
        const _nodeType = parts[2]; // Prefix with _ to indicate intentionally unused
        const plugin = manifest?.plugins.find(p => p.id === pluginId);

        // Use 'inspection' type to trigger InspectionPanel
        setSelectedNodeType('inspection');
        _setSelectedNodeData(plugin);
      } else {
        // Just plugin node: plugin:{pluginId}
        const pluginId = nodePath.substring(7);
        const plugin = manifest?.plugins.find(p => p.id === pluginId);
        setSelectedNodeType('plugins');
        _setSelectedNodeData(plugin);
      }
    } else if (nodePath === 'routes') {
      setSelectedNodeType('routes');
      _setSelectedNodeData(null);
    } else if (nodePath.startsWith('route:')) {
      const routeName = nodePath.substring(6);
      const route = interactionStats?.routes?.find((r: any) => r.route === routeName);
      setSelectedNodeType('routes');
      _setSelectedNodeData(route);
    } else if (nodePath === 'topics') {
      setSelectedNodeType('topics');
      _setSelectedNodeData(null);
    } else if (nodePath.startsWith('topic:')) {
      const topicName = nodePath.substring(6);
      const topicDef = topicsMap[topicName];
      setSelectedNodeType('topics');
      _setSelectedNodeData({ name: topicName, def: topicDef });
    } else if (nodePath === 'components') {
      setSelectedNodeType('components');
      _setSelectedNodeData(null);
    } else if (nodePath === 'conductor') {
      setSelectedNodeType('conductor');
      _setSelectedNodeData(null);
    } else if (nodePath === 'performance') {
      setSelectedNodeType('performance');
      _setSelectedNodeData(null);
    } else if (nodePath === 'sequence-player') {
      setSelectedNodeType('sequence-player');
      _setSelectedNodeData(null);
    } else if (nodePath === 'log-converter') {
      setSelectedNodeType('log-converter');
      _setSelectedNodeData(null);
    } else {
      setSelectedNodeType('overview');
      _setSelectedNodeData(null);
    }
  }, [manifest, interactionStats, topicsMap]);

  // Filtered data based on search
  const filteredPlugins = useMemo(() => {
    if (!manifest || !searchTerm) return manifest?.plugins || [];
    return manifest.plugins.filter(plugin =>
      plugin.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plugin.ui?.slot?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plugin.ui?.module?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [manifest, searchTerm]);

  // Derived metrics for enhanced stats dashboard
  // Total plugins from manifest
  const totalPluginsCount = manifest?.plugins?.length || 0;

  // Get loaded plugin IDs from conductor's discovered plugins
  // Since we can't reliably determine which plugins are loaded from conductor introspection,
  // we'll assume all manifest plugins are loaded if the conductor is available
  const loadedPluginIds = useMemo(() => {
    if (!conductor || !manifest?.plugins) return new Set<string>();
    // If conductor exists, assume all manifest plugins are loaded
    return new Set(manifest.plugins.map(p => p.id));
  }, [conductor, manifest]);

  const loadedPluginsCount = loadedPluginIds.size;
  const failedPluginsCount = Math.max(0, totalPluginsCount - loadedPluginsCount);
  const routeCount = interactionStats?.routeCount || 0;
  const topicCount = topicsStats?.topicCount || 0;



  return (
    <div className="inspector-container">
      {/* ┌─────────────────────────────────────────────────────────────────┐
          │ 🚧 REFACTORING ZONE: Header Section                             │
          │ Phase 4 Complete: Could be extracted to DiagnosticsHeader       │
          │ DO: Keep header simple and presentational                       │
          │ DO NOT: Add complex logic to header                             │
          └─────────────────────────────────────────────────────────────────┘ */}
      <div className="inspector-header">
        <h1 className="inspector-title">RenderX Diagnostics Panel</h1>
        <p className="inspector-subtitle">
          Plugin Introspection & System Diagnostics
        </p>
      </div>

      <div className="inspector-content">
        {/* ┌─────────────────────────────────────────────────────────────────┐
            │ 🚧 REFACTORING ZONE: Toolbar Component                          │
            │ Phase 4 Complete: Using DiagnosticsToolbar component            │
            │ DO: Use this component for toolbar actions                      │
            │ DO NOT: Add inline toolbar UI here                              │
            └─────────────────────────────────────────────────────────────────┘ */}
        <DiagnosticsToolbar
          loading={loading}
          onRefresh={updateStats}
          onExport={exportLogs}
          onClearLogs={clearLogs}
        />

        {/* ┌─────────────────────────────────────────────────────────────────┐
            │ 🚧 REFACTORING ZONE: Stats Overview Component                   │
            │ Phase 4 Complete: Using StatsOverview component                 │
            │ DO: Use this component for statistics display                   │
            │ DO NOT: Add inline stats UI here                                │
            └─────────────────────────────────────────────────────────────────┘ */}
        <StatsOverview
          loadedPluginsCount={loadedPluginsCount}
          totalPluginsCount={totalPluginsCount}
          failedPluginsCount={failedPluginsCount}
          routeCount={routeCount}
          topicCount={topicCount}
        />

        {/* Three-panel layout */}
        <div className="layout-three-panel">
          {/* Left Panel - Plugin Tree Explorer */}
          <aside className="left-panel" style={{ width: `${leftPanelWidth}px` }}>
            <PluginTreeExplorer
              plugins={manifest?.plugins || []}
              routes={interactionStats?.routes || []}
              topicsMap={topicsMap as any}
              onSelectNode={handleTreeNodeSelect}
            />
          </aside>

          {/* Resize Handle */}
          <div
            className="resize-handle"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = leftPanelWidth;

              const handleMouseMove = (e: MouseEvent) => {
                const delta = e.clientX - startX;
                const newWidth = Math.max(250, Math.min(600, startWidth + delta));
                setLeftPanelWidth(newWidth);
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                // Save to localStorage
                localStorage.setItem('diagnostics-left-panel-width', leftPanelWidth.toString());
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />

          {/* Right Panel - Main Content */}
          <section className="right-panel">
            {/* Search */}
            <input
              type="text"
              className="search-box"
              placeholder={`Search ${selectedNodeType}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Main Content Panels */}
            <div className="grid">
          {selectedNodeType === 'inspection' && (
            <InspectionPanel
              selectedNode={selectedNodePath}
              nodeData={_selectedNodeData}
              onNavigate={(nodeId) => handleTreeNodeSelect(nodeId)}
              onAction={(action, data) => {
                console.log('Action:', action, data);
                addLog('info', `Action: ${action} on ${data.pluginId}`);
              }}
            />
          )}
          {selectedNodeType === 'plugins' && (
            <PluginsPanel
              plugins={filteredPlugins}
              loadedPluginIds={loadedPluginIds}
              searchTerm={searchTerm}
            />
          )}

          {selectedNodeType === 'topics' && (
            <TopicsPanel
              topicsMap={new Map(Object.entries(topicsMap))}
              searchTerm={searchTerm}
              expandedItems={expandedItems}
              loading={loading}
              conductor={conductor}
              onToggleExpanded={toggleExpanded}
              onTestTopic={testTopic}
            />
          )}

          {selectedNodeType === 'routes' && (
            <RoutesPanel
              routes={interactionStats?.routes || []}
              routeCount={interactionStats?.routeCount || 0}
              searchTerm={searchTerm}
              loading={loading}
              conductor={conductor}
              onTestInteraction={testInteraction}
            />
          )}

          {selectedNodeType === 'components' && (
            <ComponentsPanel
              components={components}
              searchTerm={searchTerm}
            />
          )}

          {selectedNodeType === 'conductor' && (
            <ConductorPanel introspection={conductorIntrospection} />
          )}

          {selectedNodeType === 'performance' && (
            <PerformancePanel
              conductor={conductor}
              performanceMetrics={performanceMetrics}
              interactionStatsLoaded={!!interactionStats?.loaded}
              topicsStatsLoaded={!!topicsStats?.loaded}
              logs={logs}
            />
          )}

          {selectedNodeType === 'sequence-player' && (
            <SequencePlayer />
          )}

          {selectedNodeType === 'log-converter' && (
            <LogConverter />
          )}
        </div>

            {/* Logs Panel */}
            <LogsPanel logs={logs} />
          </section>

          {/* Footer Panel */}
          <FooterPanel
            selectedNodePath={selectedNodePath}
            loadedPluginsCount={loadedPluginsCount}
            totalPluginsCount={totalPluginsCount}
            routeCount={routeCount}
            topicCount={topicCount}
            logs={logs}
            onExport={exportLogs}
            onRefresh={updateStats}
          />
        </div>
      </div>
    </div>
  );
};

