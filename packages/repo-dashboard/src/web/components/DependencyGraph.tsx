import React from 'react';

interface Node {
  id: string;
  label: string;
  type?: 'service' | 'library' | 'ui' | 'database';
}

interface Edge {
  from: string;
  to: string;
  type?: 'depends_on' | 'communicates_with' | 'extends';
}

interface DependencyGraphProps {
  nodes: Node[];
  edges: Edge[];
  title?: string;
  height?: number;
  onNodeClick?: (nodeId: string) => void;
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  nodes,
  edges,
  title,
  height = 400,
  onNodeClick,
}) => {
  const typeColors: Record<string, string> = {
    service: 'var(--type-service)',
    library: 'var(--severity-info)',
    ui: 'var(--severity-medium)',
    database: 'var(--severity-critical)',
  };

  const edgeTypeStyles: Record<string, { stroke: string; strokeDasharray: string }> = {
    depends_on: { stroke: 'var(--type-service)', strokeDasharray: '0' },
    communicates_with: { stroke: 'var(--severity-medium)', strokeDasharray: '5 5' },
    extends: { stroke: 'var(--severity-info)', strokeDasharray: '2 2' },
    implements: { stroke: 'var(--severity-info)', strokeDasharray: '2 2' },
    uses: { stroke: 'var(--type-service)', strokeDasharray: '0' },
    generates: { stroke: 'var(--severity-medium)', strokeDasharray: '5 5' },
    loads: { stroke: 'var(--severity-medium)', strokeDasharray: '5 5' },
  };

  // Default style for unknown edge types
  const defaultEdgeStyle = { stroke: 'var(--border-color)', strokeDasharray: '0' };

  // Simple grid layout
  const nodeWidth = 150;
  const nodeHeight = 60;
  const padding = 50;
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const rows = Math.ceil(nodes.length / cols);

  const positions: Record<string, { x: number; y: number }> = {};
  nodes.forEach((node, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    positions[node.id] = {
      x: padding + col * (nodeWidth + 100),
      y: padding + row * (nodeHeight + 100),
    };
  });

  const svgWidth = padding * 2 + cols * (nodeWidth + 100);
  const svgHeight = padding * 2 + rows * (nodeHeight + 100);

  return (
    <div style={{ width: '100%' }}>
      {title && (
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
          {title}
        </h3>
      )}
      <div
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          overflow: 'auto',
          minHeight: height,
        }}
      >
        <svg width={svgWidth} height={svgHeight} style={{ minWidth: '100%' }}>
          {/* Draw edges */}
          {edges.map((edge, idx) => {
            const fromPos = positions[edge.from];
            const toPos = positions[edge.to];
            if (!fromPos || !toPos) return null;

            const style = edgeTypeStyles[edge.type || 'depends_on'] || defaultEdgeStyle;
            const x1 = fromPos.x + nodeWidth / 2;
            const y1 = fromPos.y + nodeHeight / 2;
            const x2 = toPos.x + nodeWidth / 2;
            const y2 = toPos.y + nodeHeight / 2;

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={style.stroke}
                  strokeWidth="2"
                  strokeDasharray={style.strokeDasharray}
                  markerEnd="url(#arrowhead)"
                />
              </g>
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="var(--accent-color)" />
            </marker>
          </defs>

          {/* Draw nodes */}
          {nodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;

            const color = typeColors[node.type || 'service'];

            return (
              <g
                key={`node-${node.id}`}
                onClick={() => onNodeClick?.(node.id)}
                style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
              >
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={nodeWidth}
                  height={nodeHeight}
                  fill={color}
                  fillOpacity="0.2"
                  stroke={color}
                  strokeWidth="2"
                  rx="4"
                />
                <text
                  x={pos.x + nodeWidth / 2}
                  y={pos.y + nodeHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="var(--text-primary)"
                  fontSize="12"
                  fontWeight="500"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default DependencyGraph;

