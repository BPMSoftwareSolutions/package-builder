import React from 'react';
import { Search } from 'lucide-react';
import { PluginInfoInspector } from './PluginInfoInspector';

interface InspectionPanelProps {
  selectedNode: string | null;
  nodeData: any;
  onNavigate?: (nodeId: string) => void;
  onAction?: (action: string, data: any) => void;
}

type NodeType = 
  | 'plugin'
  | 'plugin-info'
  | 'ui-config'
  | 'runtime'
  | 'topics'
  | 'routes'
  | 'sequences'
  | 'sequence'
  | 'execution'
  | 'topic'
  | 'route'
  | 'handler'
  | 'movement'
  | 'dependency'
  | 'permission'
  | 'configuration'
  | 'metrics'
  | null;

export const InspectionPanel: React.FC<InspectionPanelProps> = ({
  selectedNode,
  nodeData,
  onNavigate: _onNavigate,
  onAction
}) => {
  // Detect node type from selectedNode ID
  const detectNodeType = (nodeId: string | null): NodeType => {
    if (!nodeId) return null;

    // Plugin-level nodes: plugin:{pluginId}:{nodeType}
    if (nodeId.startsWith('plugin:')) {
      const parts = nodeId.split(':');
      if (parts.length === 2) {
        // Just plugin ID: plugin:{pluginId}
        return 'plugin';
      } else if (parts.length === 3) {
        // Plugin sub-node: plugin:{pluginId}:{nodeType}
        const subType = parts[2];
        switch (subType) {
          case 'info':
            return 'plugin-info';
          case 'ui':
            return 'ui-config';
          case 'runtime':
            return 'runtime';
          case 'topics':
            return 'topics';
          case 'routes':
            return 'routes';
          case 'sequences':
            return 'sequences';
          case 'permissions':
            return 'permission';
          case 'configuration':
            return 'configuration';
          case 'metrics':
            return 'metrics';
          case 'dependencies':
            return 'dependency';
          default:
            return null;
        }
      }
    }

    // Top-level nodes
    if (nodeId === 'plugins') return 'plugin';
    if (nodeId === 'routes') return 'routes';
    if (nodeId === 'topics') return 'topics';
    if (nodeId.startsWith('route:')) return 'route';
    if (nodeId.startsWith('topic:')) return 'topic';
    if (nodeId.startsWith('sequence:')) return 'sequence';
    if (nodeId.startsWith('execution:')) return 'execution';

    return null;
  };

  const nodeType = detectNodeType(selectedNode);

  // Empty state when no node is selected
  if (!selectedNode || !nodeType) {
    return (
      <div className="inspection-panel-empty">
        <div className="inspection-panel-empty-icon">
          <Search size={48} />
        </div>
        <h3 className="inspection-panel-empty-title">No Node Selected</h3>
        <p className="inspection-panel-empty-text">
          Select a plugin or node from the tree to view detailed information
        </p>
      </div>
    );
  }

  // Render appropriate inspector based on node type
  const renderInspector = () => {
    switch (nodeType) {
      case 'plugin-info':
        return <PluginInfoInspector plugin={nodeData} onAction={onAction} />;

      case 'plugin':
        return (
          <div className="inspection-panel-content">
            <h3>Plugin Overview</h3>
            <p>Plugin: {selectedNode}</p>
            <pre>{JSON.stringify(nodeData, null, 2)}</pre>
          </div>
        );

      case 'ui-config':
        return (
          <div className="inspection-panel-content">
            <h3>UI Configuration</h3>
            <pre>{JSON.stringify(nodeData, null, 2)}</pre>
          </div>
        );

      case 'runtime':
        return (
          <div className="inspection-panel-content">
            <h3>Runtime Configuration</h3>
            <pre>{JSON.stringify(nodeData, null, 2)}</pre>
          </div>
        );

      case 'topics':
        return (
          <div className="inspection-panel-content">
            <h3>Topics</h3>
            <pre>{JSON.stringify(nodeData, null, 2)}</pre>
          </div>
        );

      case 'routes':
        return (
          <div className="inspection-panel-content">
            <h3>Routes</h3>
            <pre>{JSON.stringify(nodeData, null, 2)}</pre>
          </div>
        );

      case 'sequences':
        return (
          <div className="inspection-panel-content">
            <h3>Sequences</h3>
            <pre>{JSON.stringify(nodeData, null, 2)}</pre>
          </div>
        );

      case 'permission':
        return (
          <div className="inspection-panel-content">
            <h3>Permissions</h3>
            <pre>{JSON.stringify(nodeData, null, 2)}</pre>
          </div>
        );

      case 'configuration':
        return (
          <div className="inspection-panel-content">
            <h3>Configuration</h3>
            <pre>{JSON.stringify(nodeData, null, 2)}</pre>
          </div>
        );

      case 'metrics':
        return (
          <div className="inspection-panel-content">
            <h3>Metrics</h3>
            <pre>{JSON.stringify(nodeData, null, 2)}</pre>
          </div>
        );

      case 'dependency':
        return (
          <div className="inspection-panel-content">
            <h3>Dependencies</h3>
            <pre>{JSON.stringify(nodeData, null, 2)}</pre>
          </div>
        );

      case 'route':
        return (
          <div className="inspection-panel-content">
            <h3>Route Details</h3>
            <pre>{JSON.stringify(nodeData, null, 2)}</pre>
          </div>
        );

      case 'topic':
        return (
          <div className="inspection-panel-content">
            <h3>Topic Details</h3>
            <pre>{JSON.stringify(nodeData, null, 2)}</pre>
          </div>
        );

      case 'sequence':
        return (
          <div className="inspection-panel-content">
            <h3>Sequence Details</h3>
            <pre>{JSON.stringify(nodeData, null, 2)}</pre>
          </div>
        );

      case 'execution':
        return (
          <div className="inspection-panel-content">
            <h3>Execution Details</h3>
            <pre>{JSON.stringify(nodeData, null, 2)}</pre>
          </div>
        );

      default:
        return (
          <div className="inspection-panel-content">
            <h3>Unknown Node Type</h3>
            <p>Node: {selectedNode}</p>
            <p>Type: {nodeType}</p>
          </div>
        );
    }
  };

  return (
    <div className="inspection-panel">
      {renderInspector()}
    </div>
  );
};

