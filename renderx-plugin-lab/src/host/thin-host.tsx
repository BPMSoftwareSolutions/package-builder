import React from 'react';

/**
 * Thin Host Component
 * Minimal host implementation for RenderX plugins
 */
export interface ThinHostProps {
  plugins?: string[];
  onReady?: () => void;
}

export const ThinHost: React.FC<ThinHostProps> = ({ plugins = [], onReady }) => {
  React.useEffect(() => {
    console.log('🎭 Thin Host mounted with plugins:', plugins);
    onReady?.();
  }, [plugins, onReady]);

  return (
    <div className="thin-host">
      <h1>RenderX Thin Host</h1>
      <div className="plugin-container">
        {plugins.map((plugin) => (
          <div key={plugin} className="plugin-slot" data-plugin={plugin}>
            Plugin: {plugin}
          </div>
        ))}
      </div>
    </div>
  );
};
