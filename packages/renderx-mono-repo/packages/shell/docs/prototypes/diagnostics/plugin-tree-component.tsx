import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Package, 
  Zap, 
  Route, 
  MessageSquare, 
  Settings, 
  Play, 
  Eye, 
  Code, 
  Activity, 
  Clock,
  Users,
  Database,
  Layers,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';

const PluginTreeExplorer = () => {
  const [expandedNodes, setExpandedNodes] = useState(new Set(['plugin-canvas', 'plugin-canvas-ui', 'plugin-canvas-runtime']));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterType, setFilterType] = useState('all');

  // Mock comprehensive plugin data
  const pluginData = {
    'plugin-canvas': {
      id: 'plugin-canvas',
      name: 'Canvas Plugin',
      version: '2.1.4',
      status: 'loaded',
      type: 'hybrid',
      description: 'Interactive canvas for visual element manipulation',
      author: 'RenderX Team',
      loadTime: 247,
      memoryUsage: '12.4MB',
      lastActivity: '2 minutes ago',
      ui: {
        slot: 'main',
        module: './canvas/canvas-ui.js',
        export: 'CanvasArea',
        dependencies: ['react', 'fabric.js', 'lodash'],
        props: {
          width: { type: 'number', default: 800 },
          height: { type: 'number', default: 600 },
          zoom: { type: 'number', default: 1.0 },
          gridEnabled: { type: 'boolean', default: true }
        },
        events: ['onElementSelect', 'onCanvasResize', 'onZoomChange']
      },
      runtime: {
        module: './canvas/canvas-runtime.js',
        export: 'CanvasRuntime',
        sequences: [
          {
            id: 'create-element',
            name: 'Create Element',
            description: 'Creates a new canvas element',
            parameters: ['type', 'position', 'properties'],
            returns: 'elementId'
          },
          {
            id: 'update-element',
            name: 'Update Element',
            description: 'Updates canvas element properties',
            parameters: ['elementId', 'properties'],
            returns: 'success'
          }
        ],
        capabilities: ['element-creation', 'transformation', 'export']
      },
      topics: {
        subscribes: [
          {
            name: 'canvas.element.selected',
            handler: 'onElementSelected',
            throttle: 100,
            description: 'Handles element selection events'
          },
          {
            name: 'theme.changed',
            handler: 'onThemeChanged',
            description: 'Updates canvas theme'
          }
        ],
        publishes: [
          {
            name: 'canvas.element.created',
            payload: { elementId: 'string', type: 'string', position: 'object' },
            description: 'Emitted when new element is created'
          },
          {
            name: 'canvas.viewport.changed',
            payload: { zoom: 'number', pan: 'object' },
            throttle: 200,
            description: 'Viewport transformation updates'
          }
        ]
      },
      routes: [
        {
          path: '/canvas/create',
          sequence: 'create-element',
          method: 'POST',
          description: 'Create new canvas element'
        },
        {
          path: '/canvas/elements/:id',
          sequence: 'update-element',
          method: 'PUT',
          description: 'Update existing element'
        },
        {
          path: '/canvas/export',
          sequence: 'export-canvas',
          method: 'GET',
          description: 'Export canvas data'
        }
      ],
      interactions: [
        {
          trigger: 'click',
          target: '.canvas-element',
          action: 'selectElement',
          modifiers: ['ctrl', 'shift']
        },
        {
          trigger: 'drag',
          target: '.canvas-element',
          action: 'moveElement',
          constraints: ['snap-to-grid', 'bounds']
        }
      ],
      permissions: {
        read: ['canvas.state', 'canvas.elements'],
        write: ['canvas.elements', 'canvas.viewport'],
        execute: ['element.create', 'element.update', 'element.delete']
      },
      config: {
        enabledFeatures: ['grid', 'snap', 'rulers', 'zoom'],
        maxElements: 1000,
        autoSave: true,
        autoSaveInterval: 30000
      },
      metrics: {
        elementsCreated: 1247,
        averageResponseTime: 23,
        errorRate: 0.02,
        memoryLeaks: 0,
        performanceScore: 94
      }
    },
    'plugin-theme': {
      id: 'plugin-theme',
      name: 'Theme Manager',
      version: '1.8.2',
      status: 'loaded',
      type: 'ui-only',
      description: 'Manages application theming and visual preferences',
      author: 'Design Team',
      loadTime: 89,
      memoryUsage: '3.2MB',
      lastActivity: '5 minutes ago',
      ui: {
        slot: 'headerLeft',
        module: './theme/theme-toggle.js',
        export: 'ThemeToggle',
        dependencies: ['react', 'styled-components'],
        props: {
          position: { type: 'string', default: 'left' },
          showLabel: { type: 'boolean', default: true }
        },
        events: ['onThemeChange']
      },
      topics: {
        publishes: [
          {
            name: 'theme.changed',
            payload: { theme: 'string', timestamp: 'number' },
            description: 'Broadcast theme changes'
          }
        ]
      },
      config: {
        availableThemes: ['light', 'dark', 'auto'],
        defaultTheme: 'dark',
        persistPreference: true
      }
    },
    'plugin-analytics': {
      id: 'plugin-analytics',
      name: 'Analytics Tracker',
      version: '3.0.1',
      status: 'unloaded',
      type: 'runtime-only',
      description: 'Tracks user interactions and system performance',
      author: 'Data Team',
      loadTime: null,
      memoryUsage: null,
      lastActivity: 'Never',
      runtime: {
        module: './analytics/analytics-engine.js',
        export: 'AnalyticsEngine',
        sequences: [
          {
            id: 'track-event',
            name: 'Track Event',
            description: 'Records user interaction events',
            parameters: ['event', 'properties'],
            returns: 'trackingId'
          }
        ]
      },
      topics: {
        subscribes: [
          {
            name: '*',
            handler: 'trackAllEvents',
            description: 'Universal event tracker'
          }
        ]
      }
    }
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const isExpanded = (nodeId) => expandedNodes.has(nodeId);

  const TreeNode = ({ nodeId, label, icon: Icon, children, level = 0, type = 'folder', data = null, badge = null }) => {
    const hasChildren = children && Object.keys(children).length > 0;
    const expanded = isExpanded(nodeId);
    const isSelected = selectedNode === nodeId;
    
    return (
      <div className="select-none">
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 group ${
            isSelected 
              ? 'bg-blue-500/20 border border-blue-500/30' 
              : 'hover:bg-gray-700/50'
          }`}
          style={{ paddingLeft: `${0.75 + level * 1.5}rem` }}
          onClick={() => {
            if (hasChildren) toggleNode(nodeId);
            setSelectedNode(nodeId);
          }}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown size={16} className="text-gray-400 group-hover:text-gray-300" />
            ) : (
              <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-300" />
            )
          ) : (
            <div className="w-4" />
          )}
          
          {Icon && <Icon size={16} className={`${
            type === 'plugin' ? 'text-blue-400' :
            type === 'section' ? 'text-purple-400' :
            type === 'item' ? 'text-green-400' :
            type === 'config' ? 'text-orange-400' :
            'text-gray-400'
          }`} />}
          
          <span className={`flex-1 text-sm ${
            type === 'plugin' ? 'font-semibold text-white' :
            type === 'section' ? 'font-medium text-gray-200' :
            'text-gray-300'
          }`}>
            {label}
          </span>
          
          {badge && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              badge.type === 'success' ? 'bg-green-500/20 text-green-400' :
              badge.type === 'error' ? 'bg-red-500/20 text-red-400' :
              badge.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {badge.text}
            </span>
          )}
          
          {data && (
            <span className="text-xs text-gray-500 ml-2">
              {typeof data === 'string' ? data : JSON.stringify(data).slice(0, 30)}
            </span>
          )}
        </div>
        
        {hasChildren && expanded && (
          <div className="ml-4 border-l border-gray-700/50">
            {Object.entries(children).map(([key, child]) => {
              if (React.isValidElement(child)) {
                return <div key={key}>{child}</div>;
              }
              return null;
            })}
          </div>
        )}
      </div>
    );
  };

  const renderPluginTree = (pluginId, plugin) => {
    const statusBadge = {
      type: plugin.status === 'loaded' ? 'success' : plugin.status === 'failed' ? 'error' : 'warning',
      text: plugin.status
    };

    const children = {};

    // Basic Info Section
    children.info = (
      <TreeNode
        key="info"
        nodeId={`${pluginId}-info`}
        label="Plugin Information"
        icon={Settings}
        type="section"
        children={{
          version: <TreeNode key="version" nodeId={`${pluginId}-version`} label="Version" type="item" data={plugin.version} />,
          author: <TreeNode key="author" nodeId={`${pluginId}-author`} label="Author" type="item" data={plugin.author} />,
          description: <TreeNode key="desc" nodeId={`${pluginId}-desc`} label="Description" type="item" data={plugin.description} />,
          loadTime: <TreeNode key="loadTime" nodeId={`${pluginId}-loadTime`} label="Load Time" type="item" data={plugin.loadTime ? `${plugin.loadTime}ms` : 'N/A'} />,
          memory: <TreeNode key="memory" nodeId={`${pluginId}-memory`} label="Memory Usage" type="item" data={plugin.memoryUsage || 'N/A'} />,
          lastActivity: <TreeNode key="activity" nodeId={`${pluginId}-activity`} label="Last Activity" type="item" data={plugin.lastActivity} />
        }}
      />
    );

    // UI Section
    if (plugin.ui) {
      const uiChildren = {
        slot: <TreeNode key="slot" nodeId={`${pluginId}-ui-slot`} label="Slot" type="item" data={plugin.ui.slot} />,
        module: <TreeNode key="module" nodeId={`${pluginId}-ui-module`} label="Module" type="item" data={plugin.ui.module} />,
        export: <TreeNode key="export" nodeId={`${pluginId}-ui-export`} label="Export" type="item" data={plugin.ui.export} />
      };

      if (plugin.ui.dependencies) {
        uiChildren.deps = (
          <TreeNode
            key="deps"
            nodeId={`${pluginId}-ui-deps`}
            label="Dependencies"
            icon={Package}
            type="config"
            children={Object.fromEntries(plugin.ui.dependencies.map((dep, i) => [
              i,
              <TreeNode key={i} nodeId={`${pluginId}-ui-dep-${i}`} label={dep} type="item" />
            ]))}
          />
        );
      }

      if (plugin.ui.props) {
        uiChildren.props = (
          <TreeNode
            key="props"
            nodeId={`${pluginId}-ui-props`}
            label="Props"
            icon={Settings}
            type="config"
            children={Object.fromEntries(Object.entries(plugin.ui.props).map(([prop, config]) => [
              prop,
              <TreeNode key={prop} nodeId={`${pluginId}-ui-prop-${prop}`} label={prop} type="item" data={`${config.type} (${config.default})`} />
            ]))}
          />
        );
      }

      children.ui = (
        <TreeNode
          key="ui"
          nodeId={`${pluginId}-ui`}
          label="User Interface"
          icon={Eye}
          type="section"
          children={uiChildren}
        />
      );
    }

    // Runtime Section
    if (plugin.runtime) {
      const runtimeChildren = {
        module: <TreeNode key="module" nodeId={`${pluginId}-runtime-module`} label="Module" type="item" data={plugin.runtime.module} />,
        export: <TreeNode key="export" nodeId={`${pluginId}-runtime-export`} label="Export" type="item" data={plugin.runtime.export} />
      };

      if (plugin.runtime.sequences) {
        runtimeChildren.sequences = (
          <TreeNode
            key="sequences"
            nodeId={`${pluginId}-runtime-sequences`}
            label="Sequences"
            icon={Zap}
            type="config"
            children={Object.fromEntries(plugin.runtime.sequences.map((seq, i) => [
              i,
              <TreeNode
                key={i}
                nodeId={`${pluginId}-seq-${i}`}
                label={seq.name}
                type="item"
                children={{
                  id: <TreeNode key="id" nodeId={`${pluginId}-seq-${i}-id`} label="ID" type="item" data={seq.id} />,
                  desc: <TreeNode key="desc" nodeId={`${pluginId}-seq-${i}-desc`} label="Description" type="item" data={seq.description} />,
                  params: <TreeNode key="params" nodeId={`${pluginId}-seq-${i}-params`} label="Parameters" type="item" data={seq.parameters?.join(', ')} />,
                  returns: <TreeNode key="returns" nodeId={`${pluginId}-seq-${i}-returns`} label="Returns" type="item" data={seq.returns} />
                }}
              />
            ]))}
          />
        );
      }

      children.runtime = (
        <TreeNode
          key="runtime"
          nodeId={`${pluginId}-runtime`}
          label="Runtime"
          icon={Zap}
          type="section"
          children={runtimeChildren}
        />
      );
    }

    // Topics Section
    if (plugin.topics) {
      const topicChildren = {};

      if (plugin.topics.subscribes) {
        topicChildren.subscribes = (
          <TreeNode
            key="subscribes"
            nodeId={`${pluginId}-topics-sub`}
            label="Subscribes To"
            icon={Database}
            type="config"
            children={Object.fromEntries(plugin.topics.subscribes.map((topic, i) => [
              i,
              <TreeNode
                key={i}
                nodeId={`${pluginId}-topic-sub-${i}`}
                label={topic.name}
                type="item"
                children={{
                  handler: <TreeNode key="handler" nodeId={`${pluginId}-topic-sub-${i}-handler`} label="Handler" type="item" data={topic.handler} />,
                  throttle: topic.throttle ? <TreeNode key="throttle" nodeId={`${pluginId}-topic-sub-${i}-throttle`} label="Throttle" type="item" data={`${topic.throttle}ms`} /> : null,
                  desc: <TreeNode key="desc" nodeId={`${pluginId}-topic-sub-${i}-desc`} label="Description" type="item" data={topic.description} />
                }}
              />
            ]))}
          />
        );
      }

      if (plugin.topics.publishes) {
        topicChildren.publishes = (
          <TreeNode
            key="publishes"
            nodeId={`${pluginId}-topics-pub`}
            label="Publishes"
            icon={Activity}
            type="config"
            children={Object.fromEntries(plugin.topics.publishes.map((topic, i) => [
              i,
              <TreeNode
                key={i}
                nodeId={`${pluginId}-topic-pub-${i}`}
                label={topic.name}
                type="item"
                children={Object.fromEntries(Object.entries({
                  payload: topic.payload ? JSON.stringify(topic.payload, null, 2) : null,
                  throttle: topic.throttle ? `${topic.throttle}ms` : null,
                  desc: topic.description
                }).filter(([, v]) => v !== null).map(([k, v]) => [
                  k,
                  <TreeNode key={k} nodeId={`${pluginId}-topic-pub-${i}-${k}`} label={k} type="item" data={v} />
                ]))}
              />
            ]))}
          />
        );
      }

      children.topics = (
        <TreeNode
          key="topics"
          nodeId={`${pluginId}-topics`}
          label="Topics"
          icon={MessageSquare}
          type="section"
          children={topicChildren}
        />
      );
    }

    // Routes Section
    if (plugin.routes) {
      children.routes = (
        <TreeNode
          key="routes"
          nodeId={`${pluginId}-routes`}
          label="Routes"
          icon={Route}
          type="section"
          children={Object.fromEntries(plugin.routes.map((route, i) => [
            i,
            <TreeNode
              key={i}
              nodeId={`${pluginId}-route-${i}`}
              label={`${route.method} ${route.path}`}
              type="item"
              children={{
                sequence: <TreeNode key="seq" nodeId={`${pluginId}-route-${i}-seq`} label="Sequence" type="item" data={route.sequence} />,
                desc: <TreeNode key="desc" nodeId={`${pluginId}-route-${i}-desc`} label="Description" type="item" data={route.description} />
              }}
            />
          ]))}
        />
      );
    }

    // Metrics Section
    if (plugin.metrics) {
      children.metrics = (
        <TreeNode
          key="metrics"
          nodeId={`${pluginId}-metrics`}
          label="Performance Metrics"
          icon={Activity}
          type="section"
          children={Object.fromEntries(Object.entries(plugin.metrics).map(([key, value]) => [
            key,
            <TreeNode key={key} nodeId={`${pluginId}-metric-${key}`} label={key} type="item" data={String(value)} />
          ]))}
        />
      );
    }

    return (
      <TreeNode
        key={pluginId}
        nodeId={pluginId}
        label={plugin.name}
        icon={Package}
        type="plugin"
        badge={statusBadge}
        children={children}
      />
    );
  };

  const filteredPlugins = useMemo(() => {
    let plugins = Object.entries(pluginData);
    
    if (searchTerm) {
      plugins = plugins.filter(([id, plugin]) => 
        plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plugin.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      plugins = plugins.filter(([, plugin]) => plugin.status === filterType);
    }
    
    return plugins;
  }, [searchTerm, filterType]);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Layers className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Plugin Tree Explorer</h2>
          <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
            {filteredPlugins.length} plugins
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            onClick={() => setExpandedNodes(new Set())}
          >
            <MoreHorizontal size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search plugins..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <select
            className="bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-8 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="loaded">Loaded</option>
            <option value="unloaded">Unloaded</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Tree */}
      <div className="bg-gray-900/50 rounded-lg p-4 max-h-96 overflow-y-auto">
        <div className="space-y-1">
          {filteredPlugins.map(([pluginId, plugin]) => 
            renderPluginTree(pluginId, plugin)
          )}
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Selected Node</h3>
          <div className="text-xs text-gray-400 font-mono">
            {selectedNode}
          </div>
        </div>
      )}
    </div>
  );
};

export default PluginTreeExplorer;