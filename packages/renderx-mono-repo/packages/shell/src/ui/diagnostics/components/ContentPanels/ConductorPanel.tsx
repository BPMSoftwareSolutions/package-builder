import React from 'react';
import type { ConductorIntrospection } from '../../types';

export interface ConductorPanelProps {
  introspection: ConductorIntrospection | null;
}

export const ConductorPanel: React.FC<ConductorPanelProps> = ({ introspection }) => {
  if (!introspection) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Conductor Introspection</h3>
        </div>
        <div className="panel-content">
          <div style={{ color: 'var(--text-muted)' }}>No introspection data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">Conductor Introspection</h3>
      </div>
      <div className="panel-content">
        <div className="plugin-item">
          <h4 className="plugin-name">Mounted Plugin IDs</h4>
          <div className="plugin-details">
            {introspection.mountedPluginIds.length > 0 ? (
              introspection.mountedPluginIds.map(id => (
                <div key={id} className="detail-row">
                  <span className="code">{id}</span>
                </div>
              ))
            ) : (
              <div className="detail-row" style={{ color: 'var(--text-muted)' }}>
                No plugins mounted
              </div>
            )}
          </div>
        </div>

        <div className="plugin-item">
          <h4 className="plugin-name">Runtime Mounted Sequence IDs</h4>
          <div className="plugin-details">
            {introspection.runtimeMountedSeqIds.length > 0 ? (
              introspection.runtimeMountedSeqIds.map(id => (
                <div key={id} className="detail-row">
                  <span className="code">{id}</span>
                </div>
              ))
            ) : (
              <div className="detail-row" style={{ color: 'var(--text-muted)' }}>
                No sequences mounted
              </div>
            )}
          </div>
        </div>

        <div className="plugin-item">
          <h4 className="plugin-name">Sequence Catalog Directories</h4>
          <div className="plugin-details">
            {introspection.sequenceCatalogDirs.length > 0 ? (
              introspection.sequenceCatalogDirs.map(dir => (
                <div key={dir} className="detail-row">
                  <span className="code">{dir}</span>
                </div>
              ))
            ) : (
              <div className="detail-row" style={{ color: 'var(--text-muted)' }}>
                No catalog directories
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

