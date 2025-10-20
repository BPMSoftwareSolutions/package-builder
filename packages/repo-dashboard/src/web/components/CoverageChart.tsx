import React, { useMemo } from 'react';
import { CoverageMetrics } from '../../services/test-coverage-collector.js';

interface CoverageChartProps {
  metricsHistory: CoverageMetrics[];
  targetCoverage?: number;
  title?: string;
}

export const CoverageChart: React.FC<CoverageChartProps> = ({
  metricsHistory,
  targetCoverage = 80,
  title = 'Coverage Trend'
}) => {
  const chartData = useMemo(() => {
    if (metricsHistory.length === 0) {
      return { points: [], maxValue: 100, minValue: 0 };
    }

    const sortedHistory = [...metricsHistory].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const avgCoverages = sortedHistory.map(m => 
      (m.lineCoverage + m.branchCoverage + m.functionCoverage + m.statementCoverage) / 4
    );

    const maxValue = Math.max(...avgCoverages, targetCoverage);
    const minValue = Math.min(...avgCoverages, targetCoverage);

    return {
      points: avgCoverages,
      maxValue: Math.ceil(maxValue / 10) * 10,
      minValue: Math.floor(minValue / 10) * 10,
      dates: sortedHistory.map(m => new Date(m.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    };
  }, [metricsHistory]);

  if (chartData.points.length === 0) {
    return (
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '2rem',
          backgroundColor: 'var(--card-background)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        <p>No coverage data available</p>
      </div>
    );
  }

  const chartHeight = 300;
  const chartWidth = Math.max(600, chartData.points.length * 50);
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const graphHeight = chartHeight - padding.top - padding.bottom;
  const graphWidth = chartWidth - padding.left - padding.right;

  const yScale = (value: number) => {
    const range = chartData.maxValue - chartData.minValue;
    const normalized = (value - chartData.minValue) / range;
    return padding.top + graphHeight * (1 - normalized);
  };

  const xScale = (index: number) => {
    return padding.left + (index / (chartData.points.length - 1)) * graphWidth;
  };

  // Generate path for line chart
  const pathData = chartData.points
    .map((point, index) => {
      const x = xScale(index);
      const y = yScale(point);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Target line
  const targetY = yScale(targetCoverage);

  return (
    <div
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '1.5rem',
        backgroundColor: 'var(--card-background)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>{title}</h3>

      <div style={{ overflowX: 'auto' }}>
        <svg width={chartWidth} height={chartHeight} style={{ minWidth: '100%' }}>
          {/* Grid lines */}
          {Array.from({ length: 5 }).map((_, i) => {
            const value = chartData.minValue + (chartData.maxValue - chartData.minValue) * (i / 4);
            const y = yScale(value);
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeDasharray="4"
                  opacity="0.5"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="var(--text-secondary)"
                >
                  {Math.round(value)}%
                </text>
              </g>
            );
          })}

          {/* Target line */}
          <line
            x1={padding.left}
            y1={targetY}
            x2={chartWidth - padding.right}
            y2={targetY}
            stroke="var(--severity-medium)"
            strokeDasharray="4"
            strokeWidth="2"
            opacity="0.7"
          />
          <text
            x={chartWidth - padding.right + 5}
            y={targetY + 4}
            fontSize="12"
            fill="var(--severity-medium)"
            fontWeight="bold"
          >
            Target: {targetCoverage}%
          </text>

          {/* Coverage line */}
          <path
            d={pathData}
            fill="none"
            stroke="var(--severity-info)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {chartData.points.map((point, index) => {
            const x = xScale(index);
            const y = yScale(point);
            const isAboveTarget = point >= targetCoverage;
            return (
              <circle
                key={`point-${index}`}
                cx={x}
                cy={y}
                r="4"
                fill={isAboveTarget ? 'var(--severity-info)' : 'var(--severity-medium)'}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}

          {/* X-axis */}
          <line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={chartWidth - padding.right}
            y2={chartHeight - padding.bottom}
            stroke="var(--border-color)"
            strokeWidth="1"
          />

          {/* X-axis labels */}
          {chartData.dates.map((date, index) => {
            if (index % Math.ceil(chartData.dates.length / 5) === 0 || index === chartData.dates.length - 1) {
              const x = xScale(index);
              return (
                <text
                  key={`label-${index}`}
                  x={x}
                  y={chartHeight - padding.bottom + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="var(--text-secondary)"
                >
                  {date}
                </text>
              );
            }
            return null;
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--severity-info)', borderRadius: '2px' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Coverage Trend</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '2px', backgroundColor: 'var(--severity-medium)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Target ({targetCoverage}%)</span>
        </div>
      </div>
    </div>
  );
};

export default CoverageChart;

