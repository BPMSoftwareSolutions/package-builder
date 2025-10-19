/**
 * Environment Configuration Service
 * Collects and tracks environment configurations from CI/CD workflows
 */

import crypto from 'crypto';

export interface EnvironmentConfiguration {
  timestamp: Date;
  environment: 'dev' | 'staging' | 'production';
  repo: string;
  org: string;

  // Configuration
  variables: Record<string, string>; // non-secret vars
  toolVersions: Record<string, string>; // Node, Python, etc.
  dependencies: Record<string, string>; // package versions

  // Metadata
  source: string; // workflow file, config file, etc.
  hash: string; // for drift detection
}

export interface ConfigurationHistory {
  repo: string;
  environment: string;
  configurations: EnvironmentConfiguration[];
  lastUpdated: Date;
}

export class EnvironmentConfigurationService {
  private configurationCache: Map<string, ConfigurationHistory> = new Map();

  /**
   * Collect environment configuration from a repository
   */
  async collectEnvironmentConfiguration(
    org: string,
    repo: string,
    environment: 'dev' | 'staging' | 'production' = 'production'
  ): Promise<EnvironmentConfiguration> {
    console.log(`📋 Collecting environment configuration for ${org}/${repo} (${environment})`);

    // Mock data - in production, this would parse actual workflow files
    const config: EnvironmentConfiguration = {
      timestamp: new Date(),
      environment,
      repo,
      org,
      variables: {
        'NODE_ENV': environment,
        'LOG_LEVEL': environment === 'production' ? 'error' : 'debug',
        'API_TIMEOUT': '30000',
        'CACHE_TTL': '3600'
      },
      toolVersions: {
        'node': '18.17.0',
        'npm': '9.6.7',
        'python': '3.11.0',
        'docker': '24.0.0'
      },
      dependencies: {
        'react': '18.2.0',
        'typescript': '5.1.6',
        'vite': '4.4.0',
        'vitest': '0.34.0'
      },
      source: `.github/workflows/${environment}.yml`,
      hash: ''
    };

    // Calculate hash for drift detection
    config.hash = this.calculateConfigHash(config);

    // Store in cache
    this.storeConfiguration(config);

    return config;
  }

  /**
   * Get configuration history for a repository
   */
  getConfigurationHistory(repo: string, environment: string): ConfigurationHistory | undefined {
    const key = `${repo}:${environment}`;
    return this.configurationCache.get(key);
  }

  /**
   * Track configuration changes
   */
  trackConfigurationChange(
    _repo: string,
    _environment: string,
    oldConfig: EnvironmentConfiguration,
    newConfig: EnvironmentConfiguration
  ): boolean {
    return oldConfig.hash !== newConfig.hash;
  }

  /**
   * Calculate hash for configuration
   */
  private calculateConfigHash(config: EnvironmentConfiguration): string {
    const configStr = JSON.stringify({
      variables: config.variables,
      toolVersions: config.toolVersions,
      dependencies: config.dependencies
    });
    return crypto.createHash('sha256').update(configStr).digest('hex');
  }

  /**
   * Store configuration in cache
   */
  private storeConfiguration(config: EnvironmentConfiguration): void {
    const key = `${config.repo}:${config.environment}`;
    const history = this.configurationCache.get(key) || {
      repo: config.repo,
      environment: config.environment,
      configurations: [],
      lastUpdated: new Date()
    };

    history.configurations.push(config);
    history.lastUpdated = new Date();

    // Keep only last 100 configurations
    if (history.configurations.length > 100) {
      history.configurations = history.configurations.slice(-100);
    }

    this.configurationCache.set(key, history);
  }

  /**
   * Get all tracked environments
   */
  getAllTrackedEnvironments(): string[] {
    return Array.from(this.configurationCache.keys());
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.configurationCache.clear();
  }
}

// Export singleton instance
export const environmentConfigurationService = new EnvironmentConfigurationService();

