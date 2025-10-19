/**
 * Tests for Environment Health Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EnvironmentHealthService } from './environment-health.js';

describe('EnvironmentHealthService', () => {
  let service: EnvironmentHealthService;

  beforeEach(() => {
    service = new EnvironmentHealthService();
    service.clearCache();
  });

  describe('calculateEnvironmentHealth', () => {
    it('should calculate environment health score', async () => {
      const healthScore = await service.calculateEnvironmentHealth(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo'
      );

      expect(healthScore).toBeDefined();
      expect(healthScore.repo).toBe('renderx-plugins-demo');
      expect(healthScore.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(healthScore.consistencyScore).toBeLessThanOrEqual(100);
      expect(healthScore.reproducibilityScore).toBeGreaterThanOrEqual(0);
      expect(healthScore.reproducibilityScore).toBeLessThanOrEqual(100);
      expect(healthScore.driftScore).toBeGreaterThanOrEqual(0);
      expect(healthScore.driftScore).toBeLessThanOrEqual(100);
      expect(healthScore.overallHealthScore).toBeGreaterThanOrEqual(0);
      expect(healthScore.overallHealthScore).toBeLessThanOrEqual(100);
    });

    it('should determine health status', async () => {
      const healthScore = await service.calculateEnvironmentHealth(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo'
      );

      expect(['healthy', 'warning', 'critical']).toContain(healthScore.status);
    });

    it('should generate recommendations', async () => {
      const healthScore = await service.calculateEnvironmentHealth(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo'
      );

      expect(Array.isArray(healthScore.recommendations)).toBe(true);
    });

    it('should track environment-related failures', async () => {
      const healthScore = await service.calculateEnvironmentHealth(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo'
      );

      expect(typeof healthScore.environmentRelatedFailures).toBe('number');
      expect(healthScore.environmentRelatedFailures).toBeGreaterThanOrEqual(0);
    });

    it('should calculate MTTR', async () => {
      const healthScore = await service.calculateEnvironmentHealth(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo'
      );

      expect(typeof healthScore.mttr).toBe('number');
      expect(healthScore.mttr).toBeGreaterThanOrEqual(0);
    });

    it('should calculate failure rate', async () => {
      const healthScore = await service.calculateEnvironmentHealth(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo'
      );

      expect(typeof healthScore.failureRate).toBe('number');
      expect(healthScore.failureRate).toBeGreaterThanOrEqual(0);
      expect(healthScore.failureRate).toBeLessThanOrEqual(1);
    });
  });

  describe('getEnvironmentHealthMetrics', () => {
    it('should return health metrics for a repository', async () => {
      await service.calculateEnvironmentHealth(
        'BPMSoftwareSolutions',
        'test-repo'
      );

      const metrics = service.getEnvironmentHealthMetrics('test-repo');

      expect(metrics).toBeDefined();
      expect(metrics.repo).toBe('test-repo');
      expect(metrics.healthScores).toBeDefined();
      expect(Array.isArray(metrics.healthScores)).toBe(true);
      expect(metrics.averageHealthScore).toBeGreaterThanOrEqual(0);
      expect(metrics.averageHealthScore).toBeLessThanOrEqual(100);
      expect(['improving', 'stable', 'degrading']).toContain(metrics.trend);
    });

    it('should track multiple health scores', async () => {
      await service.calculateEnvironmentHealth(
        'BPMSoftwareSolutions',
        'test-repo'
      );
      await service.calculateEnvironmentHealth(
        'BPMSoftwareSolutions',
        'test-repo'
      );

      const metrics = service.getEnvironmentHealthMetrics('test-repo');
      expect(metrics.healthScores.length).toBeGreaterThanOrEqual(2);
    });

    it('should calculate average health score', async () => {
      await service.calculateEnvironmentHealth(
        'BPMSoftwareSolutions',
        'test-repo'
      );

      const metrics = service.getEnvironmentHealthMetrics('test-repo');
      expect(metrics.averageHealthScore).toBeGreaterThanOrEqual(0);
      expect(metrics.averageHealthScore).toBeLessThanOrEqual(100);
    });

    it('should calculate trend', async () => {
      for (let i = 0; i < 5; i++) {
        await service.calculateEnvironmentHealth(
          'BPMSoftwareSolutions',
          'test-repo'
        );
      }

      const metrics = service.getEnvironmentHealthMetrics('test-repo');
      expect(['improving', 'stable', 'degrading']).toContain(metrics.trend);
    });
  });

  describe('health status determination', () => {
    it('should mark healthy status for high scores', async () => {
      const healthScore = await service.calculateEnvironmentHealth(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo'
      );

      if (healthScore.overallHealthScore >= 80 && healthScore.driftScore <= 30) {
        expect(healthScore.status).toBe('healthy');
      }
    });

    it('should mark warning status for medium scores', async () => {
      const healthScore = await service.calculateEnvironmentHealth(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo'
      );

      if (healthScore.overallHealthScore >= 60 && healthScore.overallHealthScore < 80) {
        expect(healthScore.status).toBe('warning');
      }
    });

    it('should mark critical status for low scores', async () => {
      const healthScore = await service.calculateEnvironmentHealth(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo'
      );

      if (healthScore.overallHealthScore < 60) {
        expect(healthScore.status).toBe('critical');
      }
    });
  });

  describe('recommendations', () => {
    it('should recommend improving reproducibility if score is low', async () => {
      const healthScore = await service.calculateEnvironmentHealth(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo'
      );

      if (healthScore.reproducibilityScore < 80) {
        expect(healthScore.recommendations.some(r => r.includes('reproducibility'))).toBe(true);
      }
    });

    it('should recommend addressing drift if score is high', async () => {
      const healthScore = await service.calculateEnvironmentHealth(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo'
      );

      if (healthScore.driftScore > 50) {
        expect(healthScore.recommendations.some(r => r.includes('drift'))).toBe(true);
      }
    });
  });

  describe('clearCache', () => {
    it('should clear all health history', async () => {
      await service.calculateEnvironmentHealth(
        'BPMSoftwareSolutions',
        'test-repo'
      );

      service.clearCache();

      const metrics = service.getEnvironmentHealthMetrics('test-repo');
      expect(metrics.healthScores.length).toBe(0);
    });
  });
});

