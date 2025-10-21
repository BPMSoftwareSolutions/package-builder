import React from 'react';
import { Package, RefreshCw, BookOpen, Settings, Activity, Clock, Database } from 'lucide-react';
import { ActionButton } from './ActionButton';
import { RelativeTime } from './RelativeTime';
import { CollapsibleSection } from './CollapsibleSection';
import { JSONViewer } from './JSONViewer';

interface PluginInfoInspectorProps {
  plugin: any;
  onAction?: (action: string, data: any) => void;
}

export const PluginInfoInspector: React.FC<PluginInfoInspectorProps> = ({
  plugin,
  onAction
}) => {
  if (!plugin) {
    return (
      <div className="plugin-info-inspector">
        <p>No plugin data available</p>
      </div>
    );
  }

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action, { pluginId: plugin.id });
    } else {
      console.log(`Action: ${action}`, { pluginId: plugin.id });
    }
  };

  // Extract plugin metadata
  const pluginName = plugin.id || 'Unknown Plugin';
  const version = plugin.version || '1.0.0';
  const status = plugin.status || 'loaded';
  const loadTime = plugin.loadTime || plugin.loading?.loadTime;
  const description = plugin.description || `Plugin: ${pluginName}`;
  
  // Calculate stats
  const memoryUsage = plugin.metrics?.memoryUsage || plugin.memoryUsage || '0 MB';
  const lastActivity = plugin.metrics?.lastActivity || plugin.lastActivity || Date.now();
  const elementsCreated = plugin.metrics?.elementsCreated || plugin.elementsCreated || 0;
  const avgResponse = plugin.metrics?.avgResponse || plugin.avgResponse || 0;

  // Status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'loaded':
      case 'active':
        return 'var(--success-color, #28a745)';
      case 'loading':
        return 'var(--warning-color, #ffc107)';
      case 'failed':
      case 'error':
        return 'var(--danger-color, #dc3545)';
      default:
        return 'var(--text-secondary, #999)';
    }
  };

  return (
    <div className="plugin-info-inspector">
      {/* Header */}
      <div className="plugin-info-header">
        <div className="plugin-info-header-icon">
          <Package size={32} />
        </div>
        <div className="plugin-info-header-content">
          <h2 className="plugin-info-title">{pluginName}</h2>
          <div className="plugin-info-meta">
            <span className="plugin-info-version">v{version}</span>
            <span className="plugin-info-separator">•</span>
            <span 
              className="plugin-info-status" 
              style={{ color: getStatusColor(status) }}
            >
              {status}
            </span>
            {loadTime && (
              <>
                <span className="plugin-info-separator">•</span>
                <span className="plugin-info-load-time">{loadTime}ms load time</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overview */}
      <div className="plugin-info-section">
        <h3 className="plugin-info-section-title">Overview</h3>
        <p className="plugin-info-description">{description}</p>
      </div>

      {/* Quick Stats */}
      <div className="plugin-info-section">
        <h3 className="plugin-info-section-title">
          <Activity size={16} />
          Quick Stats
        </h3>
        <div className="plugin-info-stats">
          <div className="plugin-info-stat">
            <Database size={16} className="plugin-info-stat-icon" />
            <div className="plugin-info-stat-content">
              <div className="plugin-info-stat-label">Memory</div>
              <div className="plugin-info-stat-value">{memoryUsage}</div>
            </div>
          </div>
          <div className="plugin-info-stat">
            <Clock size={16} className="plugin-info-stat-icon" />
            <div className="plugin-info-stat-content">
              <div className="plugin-info-stat-label">Last Activity</div>
              <div className="plugin-info-stat-value">
                <RelativeTime timestamp={lastActivity} />
              </div>
            </div>
          </div>
          {elementsCreated > 0 && (
            <div className="plugin-info-stat">
              <Package size={16} className="plugin-info-stat-icon" />
              <div className="plugin-info-stat-content">
                <div className="plugin-info-stat-label">Elements Created</div>
                <div className="plugin-info-stat-value">{elementsCreated.toLocaleString()}</div>
              </div>
            </div>
          )}
          {avgResponse > 0 && (
            <div className="plugin-info-stat">
              <Activity size={16} className="plugin-info-stat-icon" />
              <div className="plugin-info-stat-content">
                <div className="plugin-info-stat-label">Avg Response</div>
                <div className="plugin-info-stat-value">{avgResponse}ms</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="plugin-info-section">
        <h3 className="plugin-info-section-title">Actions</h3>
        <div className="plugin-info-actions">
          <ActionButton
            icon={Activity}
            label="Test Plugin"
            onClick={() => handleAction('test')}
            variant="primary"
          />
          <ActionButton
            icon={RefreshCw}
            label="Reload"
            onClick={() => handleAction('reload')}
            variant="secondary"
          />
          <ActionButton
            icon={BookOpen}
            label="View Docs"
            onClick={() => handleAction('docs')}
            variant="secondary"
          />
          <ActionButton
            icon={Settings}
            label="Config"
            onClick={() => handleAction('config')}
            variant="secondary"
          />
        </div>
      </div>

      {/* Additional Details (Collapsible) */}
      {plugin.ui && (
        <CollapsibleSection title="UI Configuration" defaultExpanded={false}>
          <JSONViewer data={plugin.ui} />
        </CollapsibleSection>
      )}

      {plugin.runtime && (
        <CollapsibleSection title="Runtime Configuration" defaultExpanded={false}>
          <JSONViewer data={plugin.runtime} />
        </CollapsibleSection>
      )}

      {plugin.topics && (
        <CollapsibleSection 
          title="Topics" 
          badge={
            (plugin.topics.subscribes?.length || 0) + (plugin.topics.publishes?.length || 0)
          }
          defaultExpanded={false}
        >
          <JSONViewer data={plugin.topics} />
        </CollapsibleSection>
      )}

      {plugin.sequences && plugin.sequences.length > 0 && (
        <CollapsibleSection 
          title="Sequences" 
          badge={plugin.sequences.length}
          defaultExpanded={false}
        >
          <JSONViewer data={plugin.sequences} />
        </CollapsibleSection>
      )}

      {plugin.permissions && (
        <CollapsibleSection title="Permissions" defaultExpanded={false}>
          <JSONViewer data={plugin.permissions} />
        </CollapsibleSection>
      )}

      {plugin.configuration && (
        <CollapsibleSection title="Configuration" defaultExpanded={false}>
          <JSONViewer data={plugin.configuration} />
        </CollapsibleSection>
      )}

      {plugin.metrics && (
        <CollapsibleSection title="Metrics" defaultExpanded={false}>
          <JSONViewer data={plugin.metrics} />
        </CollapsibleSection>
      )}

      {plugin.dependencies && (
        <CollapsibleSection title="Dependencies" defaultExpanded={false}>
          <JSONViewer data={plugin.dependencies} />
        </CollapsibleSection>
      )}
    </div>
  );
};

