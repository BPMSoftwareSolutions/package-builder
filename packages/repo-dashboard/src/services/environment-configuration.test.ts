/**
 * Tests for Environment Configuration Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EnvironmentConfigurationService } from './environment-configuration.js';

describe('EnvironmentConfigurationService', () => {
  let service: EnvironmentConfigurationService;

  beforeEach(() => {
    service = new EnvironmentConfigurationService();
    service.clearCache();
  });

  describe('collectEnvironmentConfiguration', () => {
    it('should collect environment configuration for production', async () => {
      const config = await service.collectEnvironmentConfiguration(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo',
        'production'
      );

      expect(config).toBeDefined();
      expect(config.org).toBe('BPMSoftwareSolutions');
      expect(config.repo).toBe('renderx-plugins-demo');
      expect(config.environment).toBe('production');
      expect(config.variables).toBeDefined();
      expect(config.toolVersions).toBeDefined();
      expect(config.dependencies).toBeDefined();
      expect(config.hash).toBeDefined();
      expect(config.hash.length).toBe(64); // SHA256 hash length
    });

    it('should collect environment configuration for dev', async () => {
      const config = await service.collectEnvironmentConfiguration(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo',
        'dev'
      );

      expect(config.environment).toBe('dev');
      expect(config.variables['NODE_ENV']).toBe('dev');
    });

    it('should collect environment configuration for staging', async () => {
      const config = await service.collectEnvironmentConfiguration(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo',
        'staging'
      );

      expect(config.environment).toBe('staging');
      expect(config.variables['NODE_ENV']).toBe('staging');
    });

    it('should include tool versions', async () => {
      const config = await service.collectEnvironmentConfiguration(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo'
      );

      expect(config.toolVersions['node']).toBeDefined();
      expect(config.toolVersions['npm']).toBeDefined();
      expect(config.toolVersions['python']).toBeDefined();
      expect(config.toolVersions['docker']).toBeDefined();
    });

    it('should include dependencies', async () => {
      const config = await service.collectEnvironmentConfiguration(
        'BPMSoftwareSolutions',
        'renderx-plugins-demo'
      );

      expect(config.dependencies['react']).toBeDefined();
      expect(config.dependencies['typescript']).toBeDefined();
      expect(config.dependencies['vite']).toBeDefined();
    });
  });

  describe('getConfigurationHistory', () => {
    it('should return undefined for non-existent history', () => {
      const history = service.getConfigurationHistory('non-existent', 'production');
      expect(history).toBeUndefined();
    });

    it('should return configuration history after collection', async () => {
      await service.collectEnvironmentConfiguration(
        'BPMSoftwareSolutions',
        'test-repo',
        'production'
      );

      const history = service.getConfigurationHistory('test-repo', 'production');
      expect(history).toBeDefined();
      expect(history?.repo).toBe('test-repo');
      expect(history?.environment).toBe('production');
      expect(history?.configurations.length).toBeGreaterThan(0);
    });

    it('should track multiple configurations', async () => {
      await service.collectEnvironmentConfiguration(
        'BPMSoftwareSolutions',
        'test-repo',
        'production'
      );
      await service.collectEnvironmentConfiguration(
        'BPMSoftwareSolutions',
        'test-repo',
        'production'
      );

      const history = service.getConfigurationHistory('test-repo', 'production');
      expect(history?.configurations.length).toBe(2);
    });
  });

  describe('trackConfigurationChange', () => {
    it('should detect configuration changes', async () => {
      const config1 = await service.collectEnvironmentConfiguration(
        'BPMSoftwareSolutions',
        'test-repo',
        'production'
      );

      const config2 = await service.collectEnvironmentConfiguration(
        'BPMSoftwareSolutions',
        'test-repo',
        'production'
      );

      // Modify config2
      config2.variables['NEW_VAR'] = 'new_value';
      config2.hash = 'different_hash';

      const changed = service.trackConfigurationChange('test-repo', 'production', config1, config2);
      expect(changed).toBe(true);
    });

    it('should detect no changes when hashes match', async () => {
      const config1 = await service.collectEnvironmentConfiguration(
        'BPMSoftwareSolutions',
        'test-repo',
        'production'
      );

      const config2 = { ...config1 };

      const changed = service.trackConfigurationChange('test-repo', 'production', config1, config2);
      expect(changed).toBe(false);
    });
  });

  describe('getAllTrackedEnvironments', () => {
    it('should return empty array initially', () => {
      const envs = service.getAllTrackedEnvironments();
      expect(envs).toEqual([]);
    });

    it('should return tracked environments after collection', async () => {
      await service.collectEnvironmentConfiguration(
        'BPMSoftwareSolutions',
        'repo1',
        'production'
      );
      await service.collectEnvironmentConfiguration(
        'BPMSoftwareSolutions',
        'repo2',
        'dev'
      );

      const envs = service.getAllTrackedEnvironments();
      expect(envs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached configurations', async () => {
      await service.collectEnvironmentConfiguration(
        'BPMSoftwareSolutions',
        'test-repo',
        'production'
      );

      service.clearCache();

      const envs = service.getAllTrackedEnvironments();
      expect(envs).toEqual([]);
    });
  });
});

