/**
 * Tests for Dependency Health Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyHealthService, DependencyVersion, IntegrationTestResult } from './dependency-health.js';

describe('DependencyHealthService', () => {
  let service: DependencyHealthService;

  beforeEach(() => {
    service = new DependencyHealthService();
  });

  describe('checkDependencyHealth', () => {
    it('should check dependency health and return status', () => {
      const dependencies: DependencyVersion[] = [
        {
          name: 'react',
          currentVersion: '18.2.0',
          latestVersion: '18.2.0',
          isUpToDate: true,
          hasBreakingChanges: false,
          releaseDate: new Date()
        },
        {
          name: 'typescript',
          currentVersion: '5.0.0',
          latestVersion: '5.1.0',
          isUpToDate: false,
          hasBreakingChanges: false,
          releaseDate: new Date()
        }
      ];

      const status = service.checkDependencyHealth('test-repo', dependencies);

      expect(status.repo).toBe('test-repo');
      expect(status.totalDependencies).toBe(2);
      expect(status.upToDateCount).toBe(1);
      expect(status.outdatedCount).toBe(1);
      expect(status.healthScore).toBeGreaterThanOrEqual(0);
      expect(status.healthScore).toBeLessThanOrEqual(100);
    });

    it('should calculate perfect health score for all up-to-date dependencies', () => {
      const dependencies: DependencyVersion[] = [
        {
          name: 'react',
          currentVersion: '18.2.0',
          latestVersion: '18.2.0',
          isUpToDate: true,
          hasBreakingChanges: false,
          releaseDate: new Date()
        }
      ];

      const status = service.checkDependencyHealth('test-repo', dependencies);
      expect(status.healthScore).toBe(100);
    });

    it('should reduce health score for breaking changes', () => {
      const dependencies: DependencyVersion[] = [
        {
          name: 'react',
          currentVersion: '17.0.0',
          latestVersion: '18.0.0',
          isUpToDate: false,
          hasBreakingChanges: true,
          releaseDate: new Date()
        }
      ];

      const status = service.checkDependencyHealth('test-repo', dependencies);
      expect(status.healthScore).toBeLessThan(100);
      expect(status.breakingChangesCount).toBe(1);
    });

    it('should create alerts for breaking changes', () => {
      const dependencies: DependencyVersion[] = [
        {
          name: 'react',
          currentVersion: '17.0.0',
          latestVersion: '18.0.0',
          isUpToDate: false,
          hasBreakingChanges: true,
          releaseDate: new Date()
        }
      ];

      service.checkDependencyHealth('test-repo', dependencies);
      const alerts = service.getAlerts('test-repo');

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('critical');
    });
  });

  describe('recordTestResult', () => {
    it('should record integration test result', () => {
      const result: IntegrationTestResult = {
        repo: 'test-repo',
        dependencyName: 'react',
        testDate: new Date(),
        passed: true,
        duration: 5000
      };

      service.recordTestResult(result);
      const results = service.getTestResults('test-repo', 'react');

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(true);
    });

    it('should create alert for failed test', () => {
      const result: IntegrationTestResult = {
        repo: 'test-repo',
        dependencyName: 'react',
        testDate: new Date(),
        passed: false,
        failureReason: 'Component rendering failed',
        duration: 5000
      };

      service.recordTestResult(result);
      const alerts = service.getAlerts('test-repo');

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('high');
    });
  });

  describe('getTestPassRate', () => {
    it('should calculate test pass rate', () => {
      const results: IntegrationTestResult[] = [
        {
          repo: 'test-repo',
          dependencyName: 'react',
          testDate: new Date(),
          passed: true,
          duration: 5000
        },
        {
          repo: 'test-repo',
          dependencyName: 'react',
          testDate: new Date(),
          passed: true,
          duration: 5000
        },
        {
          repo: 'test-repo',
          dependencyName: 'react',
          testDate: new Date(),
          passed: false,
          duration: 5000
        }
      ];

      for (const result of results) {
        service.recordTestResult(result);
      }

      const passRate = service.getTestPassRate('test-repo', 'react');
      expect(passRate).toBe(67); // 2 out of 3 passed
    });

    it('should return 100% pass rate for no tests', () => {
      const passRate = service.getTestPassRate('test-repo', 'react');
      expect(passRate).toBe(100);
    });
  });

  describe('getAlerts', () => {
    it('should return unresolved alerts by default', () => {
      const dependencies: DependencyVersion[] = [
        {
          name: 'react',
          currentVersion: '17.0.0',
          latestVersion: '18.0.0',
          isUpToDate: false,
          hasBreakingChanges: true,
          releaseDate: new Date()
        }
      ];

      service.checkDependencyHealth('test-repo', dependencies);
      const alerts = service.getAlerts('test-repo');

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.every(a => !a.resolved)).toBe(true);
    });

    it('should include resolved alerts when requested', () => {
      const dependencies: DependencyVersion[] = [
        {
          name: 'react',
          currentVersion: '17.0.0',
          latestVersion: '18.0.0',
          isUpToDate: false,
          hasBreakingChanges: true,
          releaseDate: new Date()
        }
      ];

      service.checkDependencyHealth('test-repo', dependencies);
      const alerts = service.getAlerts('test-repo', true);

      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  describe('resolveAlert', () => {
    it('should resolve an alert', () => {
      const dependencies: DependencyVersion[] = [
        {
          name: 'react',
          currentVersion: '17.0.0',
          latestVersion: '18.0.0',
          isUpToDate: false,
          hasBreakingChanges: true,
          releaseDate: new Date()
        }
      ];

      service.checkDependencyHealth('test-repo', dependencies);
      const alerts = service.getAlerts('test-repo');
      const alertId = alerts[0].id;

      service.resolveAlert(alertId);
      const unresolvedAlerts = service.getAlerts('test-repo');

      expect(unresolvedAlerts).toHaveLength(0);
    });
  });

  describe('getHealthStatus', () => {
    it('should return health status for a repository', () => {
      const dependencies: DependencyVersion[] = [
        {
          name: 'react',
          currentVersion: '18.2.0',
          latestVersion: '18.2.0',
          isUpToDate: true,
          hasBreakingChanges: false,
          releaseDate: new Date()
        }
      ];

      service.checkDependencyHealth('test-repo', dependencies);
      const status = service.getHealthStatus('test-repo');

      expect(status).not.toBeNull();
      expect(status?.repo).toBe('test-repo');
    });

    it('should return null for non-existent repository', () => {
      const status = service.getHealthStatus('non-existent-repo');
      expect(status).toBeNull();
    });
  });

  describe('getOrganizationHealthScore', () => {
    it('should calculate organization-wide health score', () => {
      const dependencies: DependencyVersion[] = [
        {
          name: 'react',
          currentVersion: '18.2.0',
          latestVersion: '18.2.0',
          isUpToDate: true,
          hasBreakingChanges: false,
          releaseDate: new Date()
        }
      ];

      service.checkDependencyHealth('repo1', dependencies);
      service.checkDependencyHealth('repo2', dependencies);

      const orgScore = service.getOrganizationHealthScore();
      expect(orgScore).toBe(100);
    });

    it('should return 100 for no repositories', () => {
      const orgScore = service.getOrganizationHealthScore();
      expect(orgScore).toBe(100);
    });
  });
});

