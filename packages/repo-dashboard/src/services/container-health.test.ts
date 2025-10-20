import { describe, it, expect, beforeEach } from 'vitest';
import { ContainerHealthMonitor, ContainerHealth } from './container-health';

describe('ContainerHealthMonitor', () => {
  let monitor: ContainerHealthMonitor;

  beforeEach(() => {
    monitor = new ContainerHealthMonitor();
  });

  describe('getContainerHealth', () => {
    it('should return container health status', async () => {
      const health = await monitor.getContainerHealth('container-123');

      expect(health).toBeDefined();
      expect(health.containerId).toBe('container-123');
      expect(health.status).toBe('running');
      expect(health.healthStatus).toBe('healthy');
    });

    it('should have valid resource metrics', async () => {
      const health = await monitor.getContainerHealth('container-123');

      expect(health.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(health.cpuUsage).toBeLessThanOrEqual(1);
      expect(health.memoryUsage).toBeGreaterThan(0);
      expect(health.memoryLimit).toBeGreaterThan(0);
      expect(health.memoryUsage).toBeLessThanOrEqual(health.memoryLimit);
    });
  });

  describe('storeHealthRecord', () => {
    it('should store health record', () => {
      const health: ContainerHealth = {
        timestamp: new Date(),
        containerId: 'container-123',
        containerName: 'test-container',
        status: 'running',
        uptime: 3600,
        cpuUsage: 0.25,
        memoryUsage: 256 * 1024 * 1024,
        memoryLimit: 512 * 1024 * 1024,
        networkIn: 1024 * 1024,
        networkOut: 512 * 1024,
        healthStatus: 'healthy',
        lastHealthCheck: new Date(),
        recentLogCount: 100,
        errorCount: 2,
        warningCount: 5,
      };

      monitor.storeHealthRecord('container-123', health);
      const history = monitor.getHealthHistory('container-123');

      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(health);
    });

    it('should store multiple health records', () => {
      const health1: ContainerHealth = {
        timestamp: new Date(),
        containerId: 'container-123',
        containerName: 'test-container',
        status: 'running',
        uptime: 3600,
        cpuUsage: 0.25,
        memoryUsage: 256 * 1024 * 1024,
        memoryLimit: 512 * 1024 * 1024,
        networkIn: 1024 * 1024,
        networkOut: 512 * 1024,
        healthStatus: 'healthy',
        lastHealthCheck: new Date(),
        recentLogCount: 100,
        errorCount: 2,
        warningCount: 5,
      };

      const health2: ContainerHealth = {
        ...health1,
        cpuUsage: 0.5,
        memoryUsage: 512 * 1024 * 1024,
      };

      monitor.storeHealthRecord('container-123', health1);
      monitor.storeHealthRecord('container-123', health2);

      const history = monitor.getHealthHistory('container-123');
      expect(history).toHaveLength(2);
    });
  });

  describe('getHealthHistory', () => {
    it('should return empty array for unknown container', () => {
      const history = monitor.getHealthHistory('unknown-container');
      expect(history).toHaveLength(0);
    });

    it('should respect limit parameter', () => {
      const health: ContainerHealth = {
        timestamp: new Date(),
        containerId: 'container-123',
        containerName: 'test-container',
        status: 'running',
        uptime: 3600,
        cpuUsage: 0.25,
        memoryUsage: 256 * 1024 * 1024,
        memoryLimit: 512 * 1024 * 1024,
        networkIn: 1024 * 1024,
        networkOut: 512 * 1024,
        healthStatus: 'healthy',
        lastHealthCheck: new Date(),
        recentLogCount: 100,
        errorCount: 2,
        warningCount: 5,
      };

      for (let i = 0; i < 10; i++) {
        monitor.storeHealthRecord('container-123', health);
      }

      const history = monitor.getHealthHistory('container-123', 5);
      expect(history).toHaveLength(5);
    });
  });

  describe('getAverageCpuUsage', () => {
    it('should calculate average CPU usage', () => {
      const health1: ContainerHealth = {
        timestamp: new Date(),
        containerId: 'container-123',
        containerName: 'test-container',
        status: 'running',
        uptime: 3600,
        cpuUsage: 0.2,
        memoryUsage: 256 * 1024 * 1024,
        memoryLimit: 512 * 1024 * 1024,
        networkIn: 1024 * 1024,
        networkOut: 512 * 1024,
        healthStatus: 'healthy',
        lastHealthCheck: new Date(),
        recentLogCount: 100,
        errorCount: 2,
        warningCount: 5,
      };

      const health2: ContainerHealth = { ...health1, cpuUsage: 0.4 };
      const health3: ContainerHealth = { ...health1, cpuUsage: 0.6 };

      monitor.storeHealthRecord('container-123', health1);
      monitor.storeHealthRecord('container-123', health2);
      monitor.storeHealthRecord('container-123', health3);

      const avgCpu = monitor.getAverageCpuUsage('container-123');
      expect(avgCpu).toBeCloseTo(0.4, 5);
    });

    it('should return 0 for unknown container', () => {
      const avgCpu = monitor.getAverageCpuUsage('unknown-container');
      expect(avgCpu).toBe(0);
    });
  });

  describe('getPeakResourceUsage', () => {
    it('should return peak resource usage', () => {
      const health1: ContainerHealth = {
        timestamp: new Date(),
        containerId: 'container-123',
        containerName: 'test-container',
        status: 'running',
        uptime: 3600,
        cpuUsage: 0.2,
        memoryUsage: 256 * 1024 * 1024,
        memoryLimit: 512 * 1024 * 1024,
        networkIn: 1024 * 1024,
        networkOut: 512 * 1024,
        healthStatus: 'healthy',
        lastHealthCheck: new Date(),
        recentLogCount: 100,
        errorCount: 2,
        warningCount: 5,
      };

      const health2: ContainerHealth = {
        ...health1,
        cpuUsage: 0.8,
        memoryUsage: 512 * 1024 * 1024,
      };

      monitor.storeHealthRecord('container-123', health1);
      monitor.storeHealthRecord('container-123', health2);

      const peak = monitor.getPeakResourceUsage('container-123');
      expect(peak.cpuUsage).toBe(0.8);
      expect(peak.memoryUsage).toBe(512 * 1024 * 1024);
    });
  });

  describe('clearHealthHistory', () => {
    it('should clear health history', () => {
      const health: ContainerHealth = {
        timestamp: new Date(),
        containerId: 'container-123',
        containerName: 'test-container',
        status: 'running',
        uptime: 3600,
        cpuUsage: 0.25,
        memoryUsage: 256 * 1024 * 1024,
        memoryLimit: 512 * 1024 * 1024,
        networkIn: 1024 * 1024,
        networkOut: 512 * 1024,
        healthStatus: 'healthy',
        lastHealthCheck: new Date(),
        recentLogCount: 100,
        errorCount: 2,
        warningCount: 5,
      };

      monitor.storeHealthRecord('container-123', health);
      expect(monitor.getHealthHistory('container-123')).toHaveLength(1);

      monitor.clearHealthHistory('container-123');
      expect(monitor.getHealthHistory('container-123')).toHaveLength(0);
    });
  });
});

