import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Square, RefreshCw, Download, Trash2, Search, ChevronRight, ChevronDown } from 'lucide-react';

interface PluginInfo {
  id: string;
  ui?: {
    slot: string;
    module: string;
    export: string;
  };
  runtime?: {
    module: string;
    export: string;
  };
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

interface PluginLoadingStats {
  totalPlugins: number;
  loadedPlugins: number;
  failedPlugins: number;
  loadingTime: number;
}

interface TopicDef {
  routes: Array<{ pluginId: string; sequenceId: string }>;
  visibility?: string;
  notes?: string;
  perf?: {
    throttleMs?: number;
    debounceMs?: number;
    dedupeWindowMs?: number;
  };
  payloadSchema?: any;
}

interface RouteInfo {
  route: string;
  pluginId: string;
  sequenceId: string;
}

const TestPluginLoader = () => {
  // Core state
  const [loadedPlugins, setLoadedPlugins] = useState(new Set(['theme-plugin', 'canvas-plugin', 'ui-components']));
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([
    { timestamp: '14:32:15', level: 'info' as const, message: 'Initializing sophisticated plugin loader...' },
    { timestamp: '14:32:16', level: 'info' as const, message: 'Conductor initialized successfully' },
    { timestamp: '14:32:17', level: 'info' as const, message: 'Loaded 8 plugins from manifest' }
  ]);
  
  // Mock data
  const manifest = {
    plugins: [
      { id: 'theme-plugin', ui: { slot: 'headerLeft', module: './theme.js', export: 'ThemeToggle' } },
      { id: 'canvas-plugin', ui: { slot: 'main', module: './canvas.js', export: 'CanvasArea' }, runtime: { module: './canvas-runtime.js', export: 'CanvasRuntime' } },
      { id: 'ui-components', ui: { slot: 'sidebar', module: './components.js', export: 'ComponentPanel' } },
      { id: 'data-processor', runtime: { module: './processor.js', export: 'DataProcessor' } },
      { id: 'event-handler', runtime: { module: './events.js', export: 'EventHandler' } },
      { id: 'analytics-plugin', ui: { slot: 'headerRight', module: './analytics.js', export: 'Analytics' } },
      { id: 'workflow-engine', runtime: { module: './workflow.js', export: 'WorkflowEngine' } },
      { id: 'notification-system', ui: { slot: 'overlay', module: './notifications.js', export: 'NotificationCenter' } }
    ]
  };

  const mockTopics: Record<string, TopicDef> = {
    'theme.changed': {
      routes: [{ pluginId: 'theme-plugin', sequenceId: 'apply-theme' }],
      visibility: 'public',
      notes: 'Triggered when user changes theme preference'
    },
    'canvas.element.selected': {
      routes: [
        { pluginId: 'canvas-plugin', sequenceId: 'highlight-element' },
        { pluginId: 'ui-components', sequenceId: 'update-properties' }
      ],
      visibility: 'internal',
      perf: { throttleMs: 100 }
    },
    'data.processed': {
      routes: [{ pluginId: 'analytics-plugin', sequenceId: 'track-processing' }],
      visibility: 'public'
    }
  };

  const mockRoutes: RouteInfo[] = [
    { route: '/theme/toggle', pluginId: 'theme-plugin', sequenceId: 'toggle-theme' },
    { route: '/canvas/create', pluginId: 'canvas-plugin', sequenceId: 'create-element' },
    { route: '/components/list', pluginId: 'ui-components', sequenceId: 'list-components' },
    { route: '/data/process', pluginId: 'data-processor', sequenceId: 'process-data' },
    { route: '/analytics/track', pluginId: 'analytics-plugin', sequenceId: 'track-event' }
  ];

  const [loadingStats, setLoadingStats] = useState({
    totalPlugins: manifest.plugins.length,
    loadedPlugins: 3,
    failedPlugins: 0,
    loadingTime: 1247
  });
  
  // UI state
  const [selectedTab, setSelectedTab] = useState('plugins');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [performanceMetrics] = useState({
    'interaction_theme_toggle': 45,
    'interaction_canvas_create': 120,
    'topic_theme_changed': 23,
    'topic_canvas_selected': 67
  });

  const addLog = useCallback((level, message, data) => {
    const entry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      data
    };
    setLogs(prev => [...prev.slice(-99), entry]);
  }, []);

  const loadAllPlugins = async () => {
    setLoading(true);
    addLog('info', 'Loading all plugins...');

    // Simulate loading delay
    setTimeout(() => {
      setLoadedPlugins(new Set(manifest.plugins.map(p => p.id)));
      setLoadingStats(prev => ({
        ...prev,
        loadedPlugins: manifest.plugins.length,
        loadingTime: prev.loadingTime + 1850
      }));
      addLog('info', `Loaded all ${manifest.plugins.length} plugins successfully`);
      setLoading(false);
    }, 2000);
  };

  const loadPlugin = async (pluginId) => {
    setLoading(true);
    addLog('info', `Loading plugin: ${pluginId}`);

    setTimeout(() => {
      setLoadedPlugins(prev => new Set([...prev, pluginId]));
      setLoadingStats(prev => ({
        ...prev,
        loadedPlugins: prev.loadedPlugins + 1,
        loadingTime: prev.loadingTime + Math.floor(Math.random() * 500) + 200
      }));
      addLog('info', `Plugin ${pluginId} loaded successfully`);
      setLoading(false);
    }, 1000);
  };

  const unloadAllPlugins = () => {
    setLoadedPlugins(new Set());
    setLoadingStats(prev => ({ ...prev, loadedPlugins: 0, failedPlugins: 0 }));
    addLog('info', 'Unloaded all plugins');
  };

  const testInteraction = async (route) => {
    addLog('info', `Testing interaction: ${route}`);
    setTimeout(() => {
      addLog('info', `Interaction test completed for ${route}`);
    }, 500);
  };

  const testTopic = async (topicName) => {
    addLog('info', `Testing topic: ${topicName}`);
    setTimeout(() => {
      addLog('info', `Topic test completed for ${topicName}`);
    }, 300);
  };

  const exportLogs = () => {
    const logData = { logs, stats: loadingStats, timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plugin-loader-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('info', 'Exported detailed report');
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Logs cleared');
  };

  const toggleExpanded = (id) => {
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

  // Filtered data
  const filteredPlugins = useMemo(() => {
    if (!searchTerm) return manifest.plugins;
    return manifest.plugins.filter(plugin => 
      plugin.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plugin.ui?.slot?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plugin.ui?.module?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const filteredTopics = useMemo(() => {
    const topics = Object.entries(mockTopics);
    if (!searchTerm) return topics;
    return topics.filter(([topic]) => 
      topic.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const filteredRoutes = useMemo(() => {
    if (!searchTerm) return mockRoutes;
    return mockRoutes.filter(route => 
      route.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.pluginId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-8 sticky top-0 z-50">
        <h1 className="text-2xl font-semibold text-white mb-1">
          RenderX Plugin Loading Test
        </h1>
        <p className="text-sm text-gray-400">
          Sophisticated Inspector - Vite-driven Plugin Loading with Detailed Introspection
        </p>
      </div>
      
      <div className="max-w-7xl mx-auto p-8">
        {/* Plugin Loading Controls Toolbar */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-white mr-4">Plugin Loading Controls</h3>
            <div className="w-px h-6 bg-gray-600"></div>
            <button
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 px-4 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50"
              onClick={loadAllPlugins}
              disabled={loading}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play size={16} />
              )}
              Load All Plugins
            </button>
            <button
              className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              onClick={unloadAllPlugins}
              disabled={loading}
            >
              <Square size={14} />
              Unload All
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
              onClick={() => addLog('info', 'Stats refreshed')}
            >
              <RefreshCw size={14} />
              Refresh Stats
            </button>
            <button
              className="bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
              onClick={exportLogs}
            >
              <Download size={14} />
              Export Report
            </button>
            <button
              className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
              onClick={clearLogs}
            >
              <Trash2 size={14} />
              Clear Logs
            </button>
          </div>
        </div>

        {/* Plugin Statistics */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Plugin Statistics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="text-center p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{loadingStats.totalPlugins}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Total Plugins</div>
            </div>
            <div className="text-center p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{loadingStats.loadedPlugins}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Loaded</div>
            </div>
            <div className="text-center p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{loadingStats.failedPlugins}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Failed</div>
            </div>
            <div className="text-center p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{loadingStats.loadingTime}ms</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Load Time</div>
            </div>
            <div className="text-center p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{mockRoutes.length}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Routes</div>
            </div>
            <div className="text-center p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{Object.keys(mockTopics).length}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Topics</div>
            </div>
            <div className="text-center p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">12</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Components</div>
            </div>
            <div className="text-center p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{loadedPlugins.size}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Mounted</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex flex-wrap gap-3">
            {['plugins', 'topics', 'routes', 'performance'].map(tab => (
              <button
                key={tab}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  selectedTab === tab 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => setSelectedTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Search ${selectedTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {selectedTab === 'plugins' && (
            <div className="xl:col-span-2">
              <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-700 px-6 py-4 border-b border-gray-600 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Available Plugins</h3>
                  <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {filteredPlugins.length}
                  </span>
                </div>
                <div className="p-6 max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    {filteredPlugins.map((plugin) => (
                      <div key={plugin.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-semibold text-white text-base">{plugin.id}</h4>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              loadedPlugins.has(plugin.id)
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-600 text-white'
                            }`}>
                              {loadedPlugins.has(plugin.id) ? 'Loaded' : 'Unloaded'}
                            </span>
                            <button
                              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
                              onClick={() => loadPlugin(plugin.id)}
                              disabled={loading || loadedPlugins.has(plugin.id)}
                            >
                              {loadedPlugins.has(plugin.id) ? 'Loaded' : 'Load'}
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-400 space-y-2">
                          {plugin.ui && (
                            <div>
                              <span className="font-medium text-gray-300">UI:</span>{' '}
                              <code className="bg-gray-800 px-2 py-1 rounded text-xs">{plugin.ui.slot}</code> →{' '}
                              <code className="bg-gray-800 px-2 py-1 rounded text-xs">{plugin.ui.module}#{plugin.ui.export}</code>
                            </div>
                          )}
                          {plugin.runtime && (
                            <div>
                              <span className="font-medium text-gray-300">Runtime:</span>{' '}
                              <code className="bg-gray-800 px-2 py-1 rounded text-xs">{plugin.runtime.module}#{plugin.runtime.export}</code>
                            </div>
                          )}
                          {!plugin.ui && !plugin.runtime && (
                            <div className="text-gray-500">No UI or runtime configuration</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'topics' && (
            <div className="xl:col-span-2">
              <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-700 px-6 py-4 border-b border-gray-600 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Topics</h3>
                  <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {filteredTopics.length}
                  </span>
                </div>
                <div className="p-6 max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    {filteredTopics.map(([topicName, topicDef]) => (
                      <div key={topicName} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div
                            className="flex items-center cursor-pointer flex-1"
                            onClick={() => toggleExpanded(topicName)}
                          >
                            {expandedItems.has(topicName) ? (
                              <ChevronDown size={16} className="text-gray-400 mr-2" />
                            ) : (
                              <ChevronRight size={16} className="text-gray-400 mr-2" />
                            )}
                            <h4 className="font-semibold text-white">{topicName}</h4>
                          </div>
                          <button
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs font-medium"
                            onClick={() => testTopic(topicName)}
                          >
                            Test
                          </button>
                        </div>
                        <div className="text-sm text-gray-400 mb-3">
                          {topicDef.routes.length} route(s) • {topicDef.visibility || 'public'}
                        </div>
                        {expandedItems.has(topicName) && (
                          <div className="pl-6 border-l-2 border-gray-700 space-y-3">
                            <div>
                              <strong className="text-gray-300">Routes:</strong>
                              {topicDef.routes.map((route, idx) => (
                                <div key={idx} className="ml-4 text-xs">
                                  → <code className="bg-gray-800 px-1 py-0.5 rounded">{route.pluginId}</code> /{' '}
                                  <code className="bg-gray-800 px-1 py-0.5 rounded">{route.sequenceId}</code>
                                </div>
                              ))}
                            </div>
                            {topicDef.notes && (
                              <div>
                                <strong className="text-gray-300">Notes:</strong> {topicDef.notes}
                              </div>
                            )}
                            {topicDef.perf && (
                              <div>
                                <strong className="text-gray-300">Performance:</strong>
                                {topicDef.perf.throttleMs && ` throttle: ${topicDef.perf.throttleMs}ms`}
                                {topicDef.perf.debounceMs && ` debounce: ${topicDef.perf.debounceMs}ms`}
                                {topicDef.perf.dedupeWindowMs && ` dedupe: ${topicDef.perf.dedupeWindowMs}ms`}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'routes' && (
            <div className="xl:col-span-2">
              <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-700 px-6 py-4 border-b border-gray-600 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Interaction Routes</h3>
                  <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {filteredRoutes.length}
                  </span>
                </div>
                <div className="p-6 max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    {filteredRoutes.map((route, index) => (
                      <div key={index} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-2">{route.route}</h4>
                            <div className="text-sm text-gray-400">
                              → <code className="bg-gray-800 px-2 py-1 rounded text-xs">{route.pluginId}</code> /{' '}
                              <code className="bg-gray-800 px-2 py-1 rounded text-xs">{route.sequenceId}</code>
                            </div>
                          </div>
                          <button
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs font-medium"
                            onClick={() => testInteraction(route.route)}
                          >
                            Test
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'performance' && (
            <div className="xl:col-span-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-700 px-6 py-4 border-b border-gray-600">
                    <h3 className="text-lg font-semibold">Loading Performance</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-300">Total Load Time:</span>
                        <span className="text-white">{loadingStats.loadingTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-300">Average per Plugin:</span>
                        <span className="text-white">
                          {loadingStats.loadedPlugins > 0
                            ? Math.round(loadingStats.loadingTime / loadingStats.loadedPlugins)
                            : 0}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-300">Success Rate:</span>
                        <span className="text-white">
                          {loadingStats.totalPlugins > 0
                            ? Math.round((loadingStats.loadedPlugins / loadingStats.totalPlugins) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-700 px-6 py-4 border-b border-gray-600">
                    <h3 className="text-lg font-semibold">Test Execution Times</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {Object.entries(performanceMetrics)
                        .sort(([,a], [,b]) => b - a)
                        .map(([key, duration]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="font-medium text-gray-300 text-sm">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className={`text-sm font-mono ${
                              duration > 100 ? 'text-red-400' :
                              duration > 50 ? 'text-yellow-400' :
                              'text-green-400'
                            }`}>
                              {duration}ms
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logs Panel */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-gray-700 px-6 py-4 border-b border-gray-600 flex justify-between items-center">
            <h3 className="text-lg font-semibold">System Logs</h3>
            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
              {logs.length}
            </span>
          </div>
          <div className="bg-black text-green-400 font-mono text-sm p-6 max-h-80 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-blue-400">[{log.timestamp}]</span>{' '}
                <span className={
                  log.level === 'info' ? 'text-cyan-400' :
                  log.level === 'warn' ? 'text-yellow-400' :
                  'text-red-400'
                }>
                  {log.level.toUpperCase()}
                </span>{' '}
                <span className="text-gray-300">{log.message}</span>
                {log.data && (
                  <div className="ml-4 text-blue-300 text-xs">
                    {typeof log.data === 'string' ? log.data : JSON.stringify(log.data)}
                  </div>
                )}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500">No logs yet...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPluginLoader;
                