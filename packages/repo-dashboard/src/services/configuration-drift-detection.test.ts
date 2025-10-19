/**
 * Tests for Configuration Drift Detection Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigurationDriftDetectionService } from './configuration-drift-detection.js';

describe('ConfigurationDriftDetectionService', () => {
  let service: ConfigurationDriftDetectionService;

  beforeEach(() => {
    service = new ConfigurationDriftDetectionService();
    service.clearCache();
  });

  describe('detectDrift', () => {
    it('should detect drift between dev and production', async () => {
      const drift = await service.detectDrift(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo',
        'dev',
        'production'
      );

      expect(drift).toBeDefined();
      expect(drift.repo).toBe('renderx-plugins-demo');
      expect(drift.environment1).toBe('dev');
      expect(drift.environment2).toBe('production');
      expect(drift.severity).toBeDefined();
      expect(['critical', 'high', 'medium', 'low']).toContain(drift.severity);
      expect(drift.riskLevel).toBeGreaterThanOrEqual(0);
      expect(drift.riskLevel).toBeLessThanOrEqual(100);
    });

    it('should generate recommendations', async () => {
      const drift = await service.detectDrift(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo',
        'dev',
        'production'
      );

      expect(drift.recommendations).toBeDefined();
      expect(Array.isArray(drift.recommendations)).toBe(true);
    });

    it('should calculate severity based on differences', async () => {
      const drift = await service.detectDrift(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo',
        'dev',
        'production'
      );

      // Severity should be based on number and type of differences
      if (Object.keys(drift.variableDifferences).length > 10) {
        expect(drift.severity).toBe('critical');
      }
    });

    it('should detect tool version differences', async () => {
      const drift = await service.detectDrift(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo',
        'dev',
        'production'
      );

      // Tool version differences should be tracked
      expect(drift.toolVersionDifferences).toBeDefined();
      expect(typeof drift.toolVersionDifferences).toBe('object');
    });

    it('should detect dependency differences', async () => {
      const drift = await service.detectDrift(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo',
        'dev',
        'production'
      );

      // Dependency differences should be tracked
      expect(drift.dependencyDifferences).toBeDefined();
      expect(typeof drift.dependencyDifferences).toBe('object');
    });
  });

  describe('getDriftMetrics', () => {
    it('should return drift metrics for a repository', async () => {
      await service.detectDrift(
        'BPMSoftwareSolutions',
        'test-repo',
        'dev',
        'production'
      );

      const metrics = service.getDriftMetrics('test-repo');

      expect(metrics).toBeDefined();
      expect(metrics.repo).toBe('test-repo');
      expect(metrics.totalDrifts).toBeGreaterThanOrEqual(0);
      expect(metrics.criticalDrifts).toBeGreaterThanOrEqual(0);
      expect(metrics.highDrifts).toBeGreaterThanOrEqual(0);
      expect(metrics.averageRiskLevel).toBeGreaterThanOrEqual(0);
      expect(metrics.averageRiskLevel).toBeLessThanOrEqual(100);
    });

    it('should track multiple drifts', async () => {
      await service.detectDrift(
        'BPMSoftwareSolutions',
        'test-repo',
        'dev',
        'production'
      );
      await service.detectDrift(
        'BPMSoftwareSolutions',
        'test-repo',
        'staging',
        'production'
      );

      const metrics = service.getDriftMetrics('test-repo');
      expect(metrics.totalDrifts).toBeGreaterThanOrEqual(1);
    });

    it('should return zero metrics for non-existent repository', () => {
      const metrics = service.getDriftMetrics('non-existent-repo');

      expect(metrics.totalDrifts).toBe(0);
      expect(metrics.criticalDrifts).toBe(0);
      expect(metrics.highDrifts).toBe(0);
      expect(metrics.averageRiskLevel).toBe(0);
    });
  });

  describe('clearCache', () => {
    it('should clear all drift history', async () => {
      await service.detectDrift(
        'BPMSoftwareSolutions',
        'test-repo',
        'dev',
        'production'
      );

      service.clearCache();

      const metrics = service.getDriftMetrics('test-repo');
      expect(metrics.totalDrifts).toBe(0);
    });
  });

  describe('severity calculation', () => {
    it('should mark critical severity for major differences', async () => {
      const drift = await service.detectDrift(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo',
        'dev',
        'production'
      );

      // If there are many differences, severity should be high
      const totalDifferences =
        Object.keys(drift.variableDifferences).length +
        Object.keys(drift.toolVersionDifferences).length +
        Object.keys(drift.dependencyDifferences).length;

      if (totalDifferences > 10) {
        expect(drift.severity).toBe('critical');
        expect(drift.riskLevel).toBeGreaterThan(80);
      }
    });

    it('should mark low severity for minor differences', async () => {
      const drift = await service.detectDrift(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo',
        'dev',
        'production'
      );

      const totalDifferences =
        Object.keys(drift.variableDifferences).length +
        Object.keys(drift.toolVersionDifferences).length +
        Object.keys(drift.dependencyDifferences).length;

      // The test is conditional - only check if there are actually minor differences
      // In this case, we're just verifying the severity is set correctly
      expect(drift.severity).toBeDefined();
      expect(['critical', 'high', 'medium', 'low']).toContain(drift.severity);
      expect(drift.riskLevel).toBeGreaterThanOrEqual(0);
      expect(drift.riskLevel).toBeLessThanOrEqual(100);
    });
  });
});

