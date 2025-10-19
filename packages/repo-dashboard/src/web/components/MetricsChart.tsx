import React from 'react';
import {
  LineChart,
  BarChart,
  PieChart,
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface MetricsChartProps {
  data: any[];
  type: 'line' | 'bar' | 'pie';
  dataKey: string;
  xAxisKey?: string;
  title?: string;
  height?: number;
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#4a9eff',
  '#4caf50',
  '#ff9800',
  '#f44336',
  '#2196f3',
  '#9c27b0',
  '#00bcd4',
  '#ffc107',
];

export const MetricsChart: React.FC<MetricsChartProps> = ({
  data,
  type,
  dataKey,
  xAxisKey = 'name',
  title,
  height = 300,
  colors = DEFAULT_COLORS,
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        No data available
      </div>
    );
  }

  const chartProps = {
    data,
    height,
    margin: { top: 5, right: 30, left: 0, bottom: 5 },
  };

  return (
    <div style={{ width: '100%' }}>
      {title && (
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {type === 'line' && (
          <LineChart {...chartProps}>
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
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              dot={{ fill: colors[0] }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        )}
        {type === 'bar' && (
          <BarChart {...chartProps}>
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
            <Bar dataKey={dataKey} fill={colors[0]} />
          </BarChart>
        )}
        {type === 'pie' && (
          <PieChart {...chartProps}>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <Legend />
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={xAxisKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default MetricsChart;

