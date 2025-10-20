import React, { useState } from 'react';
import { ConductorLogsPanel } from '../components/ConductorLogsPanel';
import { ContainerHealthPanel } from '../components/ContainerHealthPanel';
import { ConductorMetricsPanel } from '../components/ConductorMetricsPanel';

interface ConductorLogsMonitoringDashboardProps {
  onNavigate?: (page: string, data?: any) => void;
}

export default function ConductorLogsMonitoringDashboard({ onNavigate }: ConductorLogsMonitoringDashboardProps) {
  const [selectedContainer, setSelectedContainer] = useState<string>('default');
  const [containers] = useState<string[]>(['default', 'conductor-1', 'conductor-2', 'conductor-3']);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>
          🎼 Conductor Logs & Monitoring
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          Monitor MusicalConductor orchestration logs, container health, and performance metrics
        </p>
      </div>

      {/* Container Selector */}
      <div style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: 'var(--card-background)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px'
      }}>
        <label style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginRight: '1rem' }}>
          Select Container:
        </label>
        <select
          value={selectedContainer}
          onChange={(e) => setSelectedContainer(e.target.value)}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--input-background)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          {containers.map(container => (
            <option key={container} value={container}>
              {container}
            </option>
          ))}
        </select>
      </div>

      {/* Main Dashboard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Container Health */}
        <ContainerHealthPanel containerId={selectedContainer} />

        {/* Conductor Metrics */}
        <ConductorMetricsPanel containerId={selectedContainer} />
      </div>

      {/* Conductor Logs */}
      <div style={{ marginBottom: '2rem' }}>
        <ConductorLogsPanel containerId={selectedContainer} maxLogs={100} />
      </div>

      {/* Information Section */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'var(--card-background)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        marginTop: '2rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>About Conductor Logs</h3>
        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          <p>
            The Conductor Logs & Monitoring dashboard provides real-time visibility into the MusicalConductor orchestration engine:
          </p>
          <ul style={{ margin: '1rem 0', paddingLeft: '2rem' }}>
            <li><strong>Container Health:</strong> Monitor container status, resource usage (CPU, memory, network), and uptime</li>
            <li><strong>Conductor Metrics:</strong> Track orchestration metrics including symphonies, movements, beats, and performance latencies</li>
            <li><strong>Logs:</strong> View detailed conductor logs with filtering by level, plugin, and symphony context</li>
            <li><strong>Performance:</strong> Monitor throughput, latency percentiles (p95, p99), and queue status</li>
            <li><strong>Error Tracking:</strong> Identify and analyze error patterns and trends</li>
          </ul>
          <p>
            Use this dashboard to troubleshoot issues, monitor performance, and ensure the orchestration engine is running smoothly.
          </p>
        </div>
      </div>
    </div>
  );
}

