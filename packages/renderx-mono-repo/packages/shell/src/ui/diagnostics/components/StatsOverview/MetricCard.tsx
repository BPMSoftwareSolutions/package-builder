import React from 'react';
import { ProgressRing } from './ProgressRing';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  percentage?: number;
  color?: 'blue' | 'green' | 'orange';
  showProgressRing?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  percentage,
  color = 'blue',
  showProgressRing = false
}) => {
  return (
    <div className="metric-card">
      <h3 className="metric-title">{title}</h3>
      {showProgressRing && percentage !== undefined && (
        <div className="progress-ring">
          <ProgressRing percentage={percentage} color={color} />
        </div>
      )}
      <div className="metric-value">{value}</div>
      {subtitle && <div className="metric-subtitle">{subtitle}</div>}
    </div>
  );
};

export interface SimpleMetricCardProps {
  label: string;
  value: string | number;
}

export const SimpleMetricCard: React.FC<SimpleMetricCardProps> = ({ label, value }) => {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-strong">{value}</div>
    </div>
  );
};

