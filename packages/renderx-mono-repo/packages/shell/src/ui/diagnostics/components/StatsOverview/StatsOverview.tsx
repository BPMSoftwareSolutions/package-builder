import React from 'react';
import { MetricCard, SimpleMetricCard } from './MetricCard';

export interface StatsOverviewProps {
  loadedPluginsCount: number;
  totalPluginsCount: number;
  failedPluginsCount: number;
  routeCount: number;
  topicCount: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  loadedPluginsCount,
  totalPluginsCount,
  failedPluginsCount,
  routeCount,
  topicCount
}) => {
  const percent = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);

  const loadingProgressPct = percent(loadedPluginsCount, totalPluginsCount);
  const successRatePct = totalPluginsCount > 0
    ? Math.round(((totalPluginsCount - failedPluginsCount) / totalPluginsCount) * 100)
    : 0;
  const loadPerfPct = loadedPluginsCount > 0 ? 100 : 0;

  return (
    <div className="control-panel">
      <h2>System Statistics</h2>
      <div className="stats-enhanced">
        <div className="stats-dashboard">
          <div className="metric-grid-top">
            <MetricCard
              title="Loading Progress"
              value={`${loadedPluginsCount} / ${totalPluginsCount}`}
              subtitle="Successfully Loaded"
              percentage={loadingProgressPct}
              color="blue"
              showProgressRing={true}
            />
            <MetricCard
              title="Success Rate"
              value={`${successRatePct}%`}
              subtitle={`${failedPluginsCount} failed`}
              percentage={successRatePct}
              color="green"
              showProgressRing={true}
            />
            <MetricCard
              title="System Status"
              value={loadedPluginsCount > 0 ? 'Ready' : 'Loading'}
              subtitle={`${loadedPluginsCount} plugins active`}
              percentage={loadPerfPct}
              color="green"
              showProgressRing={true}
            />
          </div>

          <div className="metric-grid-bottom">
            <SimpleMetricCard label="Total Plugins" value={totalPluginsCount} />
            <SimpleMetricCard label="Loaded" value={loadedPluginsCount} />
            <SimpleMetricCard label="Failed" value={failedPluginsCount} />
            <SimpleMetricCard label="Routes" value={routeCount} />
            <SimpleMetricCard label="Topics" value={topicCount} />
          </div>
        </div>
      </div>
    </div>
  );
};

