import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface C4DiagramProps {
  diagram: string;
  title?: string;
  height?: number;
}

export const C4Diagram: React.FC<C4DiagramProps> = ({
  diagram,
  title,
  height = 500,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && diagram) {
      mermaid.contentLoaded();
      mermaid.run();
    }
  }, [diagram]);

  return (
    <div style={{ width: '100%' }}>
      {title && (
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
          {title}
        </h3>
      )}
      <div
        ref={containerRef}
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '1rem',
          minHeight: height,
          overflow: 'auto',
        }}
        className="mermaid"
      >
        {diagram}
      </div>
    </div>
  );
};

export default C4Diagram;

