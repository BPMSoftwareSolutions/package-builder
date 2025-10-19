/**
 * Tests for Build Environment Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BuildEnvironmentService } from './build-environment.js';

describe('BuildEnvironmentService', () => {
  let service: BuildEnvironmentService;

  beforeEach(() => {
    service = new BuildEnvironmentService();
    service.clearCache();
  });

  describe('collectBuildEnvironment', () => {
    it('should collect build environment information', async () => {
      const buildEnv = await service.collectBuildEnvironment(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo'
      );

      expect(buildEnv).toBeDefined();
      expect(buildEnv.org).toBe('BPMSoftwareSolutions');
      expect(buildEnv.repo).toBe('renderx-plugins-demo');
      expect(buildEnv.nodeVersion).toBeDefined();
      expect(buildEnv.buildDuration).toBeGreaterThan(0);
      expect(typeof buildEnv.buildSuccess).toBe('boolean');
      expect(typeof buildEnv.reproducible).toBe('boolean');
    });

    it('should include tool versions', async () => {
      const buildEnv = await service.collectBuildEnvironment(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo'
      );

      expect(buildEnv.nodeVersion).toBeDefined();
      expect(buildEnv.pythonVersion).toBeDefined();
      expect(buildEnv.javaVersion).toBeDefined();
      expect(buildEnv.dockerVersion).toBeDefined();
    });

    it('should track build success', async () => {
      const buildEnv = await service.collectBuildEnvironment(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo'
      );

      expect(typeof buildEnv.buildSuccess).toBe('boolean');
    });

    it('should track reproducibility', async () => {
      const buildEnv = await service.collectBuildEnvironment(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo'
      );

      expect(typeof buildEnv.reproducible).toBe('boolean');
    });

    it('should track environment consistency', async () => {
      const buildEnv = await service.collectBuildEnvironment(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo'
      );

      expect(typeof buildEnv.matchesLocalEnvironment).toBe('boolean');
      expect(typeof buildEnv.matchesPreviousBuild).toBe('boolean');
    });
  });

  describe('getBuildEnvironmentMetrics', () => {
    it('should return metrics for a repository', async () => {
      await service.collectBuildEnvironment(
        'BPMSoftwareSolutions',
        'test-repo'
      );

      const metrics = service.getBuildEnvironmentMetrics('test-repo');

      expect(metrics).toBeDefined();
      expect(metrics.repo).toBe('test-repo');
      expect(metrics.totalBuilds).toBeGreaterThanOrEqual(1);
      expect(metrics.successfulBuilds).toBeGreaterThanOrEqual(0);
      expect(metrics.failedBuilds).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(1);
      expect(metrics.reproducibilityRate).toBeGreaterThanOrEqual(0);
      expect(metrics.reproducibilityRate).toBeLessThanOrEqual(1);
    });

    it('should return zero metrics for non-existent repository', () => {
      const metrics = service.getBuildEnvironmentMetrics('non-existent-repo');

      expect(metrics.totalBuilds).toBe(0);
      expect(metrics.successfulBuilds).toBe(0);
      expect(metrics.failedBuilds).toBe(0);
      expect(metrics.successRate).toBe(0);
      expect(metrics.reproducibilityRate).toBe(0);
      expect(metrics.averageBuildDuration).toBe(0);
    });

    it('should track multiple builds', async () => {
      await service.collectBuildEnvironment(
        'BPMSoftwareSolutions',
        'test-repo'
      );
      await service.collectBuildEnvironment(
        'BPMSoftwareSolutions',
        'test-repo'
      );

      const metrics = service.getBuildEnvironmentMetrics('test-repo');
      expect(metrics.totalBuilds).toBe(2);
    });

    it('should calculate success rate correctly', async () => {
      await service.collectBuildEnvironment(
        'BPMSoftwareSolutions',
        'test-repo'
      );

      const metrics = service.getBuildEnvironmentMetrics('test-repo');
      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(1);
    });
  });

  describe('validateReproducibility', () => {
    it('should return true for single build', async () => {
      await service.collectBuildEnvironment(
        'BPMSoftwareSolutions',
        'test-repo'
      );

      const reproducible = service.validateReproducibility('test-repo');
      expect(reproducible).toBe(true);
    });

    it('should validate reproducibility for multiple builds', async () => {
      for (let i = 0; i < 5; i++) {
        await service.collectBuildEnvironment(
          'BPMSoftwareSolutions',
          'test-repo'
        );
      }

      const reproducible = service.validateReproducibility('test-repo');
      expect(typeof reproducible).toBe('boolean');
    });
  });

  describe('getVersionMismatches', () => {
    it('should return empty array for non-existent repository', () => {
      const mismatches = service.getVersionMismatches('non-existent-repo');
      expect(mismatches).toEqual([]);
    });

    it('should track version mismatches', async () => {
      await service.collectBuildEnvironment(
        'BPMSoftwareSolutions',
        'test-repo'
      );
      await service.collectBuildEnvironment(
        'BPMSoftwareSolutions',
        'test-repo'
      );

      const mismatches = service.getVersionMismatches('test-repo');
      expect(Array.isArray(mismatches)).toBe(true);
    });
  });

  describe('clearCache', () => {
    it('should clear all build history', async () => {
      await service.collectBuildEnvironment(
        'BPMSoftwareSolutions',
        'test-repo'
      );

      service.clearCache();

      const metrics = service.getBuildEnvironmentMetrics('test-repo');
      expect(metrics.totalBuilds).toBe(0);
    });
  });
});

