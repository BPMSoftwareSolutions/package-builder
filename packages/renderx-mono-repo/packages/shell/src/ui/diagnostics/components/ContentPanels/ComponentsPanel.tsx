import React from 'react';
import type { ComponentDetail } from '../../types';

export interface ComponentsPanelProps {
  components: ComponentDetail[];
  searchTerm: string;
}

export const ComponentsPanel: React.FC<ComponentsPanelProps> = ({
  components,
  searchTerm
}) => {
  const filteredComponents = components.filter(comp =>
    !searchTerm ||
    comp.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">Components</h3>
        <span className="panel-badge">{components.length}</span>
      </div>
      <div className="panel-content">
        {filteredComponents.map((component) => (
          <div key={component.id} className="plugin-item">
            <div className="plugin-header">
              <h4 className="plugin-name">{component.id}</h4>
            </div>
            <div className="plugin-details">
              {component.metadata?.name && (
                <div className="detail-row">
                  <span className="detail-label">Name:</span> {component.metadata.name}
                </div>
              )}
              {component.metadata?.description && (
                <div className="detail-row">
                  <span className="detail-label">Description:</span> {component.metadata.description}
                </div>
              )}
              {component.metadata?.type && (
                <div className="detail-row">
                  <span className="detail-label">Type:</span> <span className="code">{component.metadata.type}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

