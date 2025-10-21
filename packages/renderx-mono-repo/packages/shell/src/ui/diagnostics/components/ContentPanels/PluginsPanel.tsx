import React from 'react';
import type { PluginInfo } from '../../types';

export interface PluginsPanelProps {
  plugins: PluginInfo[];
  loadedPluginIds: Set<string>;
  searchTerm: string;
}

export const PluginsPanel: React.FC<PluginsPanelProps> = ({
  plugins,
  loadedPluginIds,
  searchTerm
}) => {
  const filteredPlugins = plugins.filter(plugin =>
    !searchTerm || plugin.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">Available Plugins</h3>
        <span className="panel-badge">{filteredPlugins.length}</span>
      </div>
      <div className="panel-content">
        {filteredPlugins.map((plugin) => (
          <div key={plugin.id} className="plugin-item">
            <div className="plugin-header">
              <h4 className="plugin-name">{plugin.id}</h4>
              <div className="plugin-actions">
                <span className={`plugin-status ${loadedPluginIds.has(plugin.id) ? 'status-loaded' : 'status-unloaded'}`}>
                  {loadedPluginIds.has(plugin.id) ? 'Loaded' : 'Unloaded'}
                </span>
              </div>
            </div>
            <div className="plugin-details">
              {plugin.ui && (
                <div className="detail-row">
                  <span className="detail-label">UI:</span>
                  <span className="code">{plugin.ui.slot}</span> →
                  <span className="code">{plugin.ui.module}#{plugin.ui.export}</span>
                </div>
              )}
              {plugin.runtime && (
                <div className="detail-row">
                  <span className="detail-label">Runtime:</span>
                  <span className="code">{plugin.runtime.module}#{plugin.runtime.export}</span>
                </div>
              )}
              {!plugin.ui && !plugin.runtime && (
                <div className="detail-row" style={{ color: 'var(--text-muted)' }}>
                  No UI or runtime configuration
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

