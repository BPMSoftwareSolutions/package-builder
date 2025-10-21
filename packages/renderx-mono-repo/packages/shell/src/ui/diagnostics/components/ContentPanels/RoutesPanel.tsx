import React from 'react';

export interface RoutesPanelProps {
  routes: any[];
  routeCount: number;
  searchTerm: string;
  loading: boolean;
  conductor: any;
  onTestInteraction: (route: string) => void;
}

export const RoutesPanel: React.FC<RoutesPanelProps> = ({
  routes,
  routeCount,
  searchTerm,
  loading,
  conductor,
  onTestInteraction
}) => {
  const filteredRoutes = routes?.filter((route: any) =>
    !searchTerm || route.route.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">Interaction Routes</h3>
        <span className="panel-badge">{routeCount}</span>
      </div>
      <div className="panel-content">
        {filteredRoutes.map((route: any, index: number) => (
          <div key={index} className="route-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div className="route-name">{route.route}</div>
                <div className="route-target">
                  → <span className="code">{route.pluginId}</span> / <span className="code">{route.sequenceId}</span>
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => onTestInteraction(route.route)}
                disabled={loading || !conductor}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              >
                Test
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

