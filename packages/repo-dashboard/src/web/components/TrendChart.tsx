import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface TrendChartProps {
  data: any[];
  dataKey: string;
  xAxisKey?: string;
  title?: string;
  height?: number;
  showTrendLine?: boolean;
  showAnomalies?: boolean;
  anomalies?: number[];
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  dataKey,
  xAxisKey = 'date',
  title,
  height = 300,
  showTrendLine = true,
  showAnomalies = false,
  anomalies = [],
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        No data available
      </div>
    );
  }

  // Calculate average for trend line
  const values = data.map((d) => d[dataKey]).filter((v) => typeof v === 'number');
  const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  return (
    <div style={{ width: '100%' }}>
      {title && (
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey={xAxisKey} stroke="var(--text-secondary)" />
          <YAxis stroke="var(--text-secondary)" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <Legend />
          {showTrendLine && (
            <ReferenceLine
              y={average}
              stroke="var(--accent-color)"
              strokeDasharray="5 5"
              label={{ value: 'Average', position: 'right', fill: 'var(--accent-color)' }}
            />
          )}
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#4a9eff"
            dot={{ fill: '#4a9eff' }}
            activeDot={{ r: 8 }}
            isAnimationActive={true}
          />
          {showAnomalies &&
            anomalies.map((idx) => (
              <ReferenceLine
                key={`anomaly-${idx}`}
                x={data[idx]?.[xAxisKey]}
                stroke="#f44336"
                strokeDasharray="3 3"
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;

