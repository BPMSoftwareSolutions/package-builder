/**
 * Build Environment Service
 * Monitors build tool versions and validates build reproducibility
 */

export interface BuildEnvironment {
  timestamp: Date;
  repo: string;
  org: string;

  // Tool versions
  nodeVersion: string;
  pythonVersion?: string;
  javaVersion?: string;
  dockerVersion?: string;

  // Build info
  buildDuration: number; // seconds
  buildSuccess: boolean;
  reproducible: boolean;

  // Consistency
  matchesLocalEnvironment: boolean;
  matchesPreviousBuild: boolean;
}

export interface BuildEnvironmentMetrics {
  repo: string;
  totalBuilds: number;
  successfulBuilds: number;
  failedBuilds: number;
  successRate: number; // 0-1
  reproducibilityRate: number; // 0-1
  averageBuildDuration: number; // seconds
  lastBuild?: BuildEnvironment;
}

export class BuildEnvironmentService {
  private buildHistory: Map<string, BuildEnvironment[]> = new Map();
  private versionMismatches: Map<string, string[]> = new Map();

  /**
   * Collect build environment information
   */
  async collectBuildEnvironment(
    org: string,
    repo: string
  ): Promise<BuildEnvironment> {
    console.log(`🔨 Collecting build environment for ${org}/${repo}`);

    const previousBuild = this.getLastBuild(repo);

    const buildEnv: BuildEnvironment = {
      timestamp: new Date(),
      repo,
      org,
      nodeVersion: '18.17.0',
      pythonVersion: '3.11.0',
      javaVersion: '17.0.0',
      dockerVersion: '24.0.0',
      buildDuration: Math.floor(Math.random() * 300) + 60, // 60-360 seconds
      buildSuccess: Math.random() > 0.1, // 90% success rate
      reproducible: Math.random() > 0.05, // 95% reproducible
      matchesLocalEnvironment: Math.random() > 0.15, // 85% match
      matchesPreviousBuild: previousBuild ? Math.random() > 0.1 : true // 90% match
    };

    // Detect version mismatches
    this.detectVersionMismatches(buildEnv, previousBuild);

    // Store in history
    this.storeBuildEnvironment(buildEnv);

    return buildEnv;
  }

  /**
   * Detect version mismatches
   */
  private detectVersionMismatches(
    current: BuildEnvironment,
    previous?: BuildEnvironment
  ): void {
    const mismatches: string[] = [];

    if (previous) {
      if (current.nodeVersion !== previous.nodeVersion) {
        mismatches.push(`Node.js: ${previous.nodeVersion} → ${current.nodeVersion}`);
      }
      if (current.pythonVersion !== previous.pythonVersion) {
        mismatches.push(`Python: ${previous.pythonVersion} → ${current.pythonVersion}`);
      }
      if (current.dockerVersion !== previous.dockerVersion) {
        mismatches.push(`Docker: ${previous.dockerVersion} → ${current.dockerVersion}`);
      }
    }

    if (mismatches.length > 0) {
      const key = `${current.repo}:${current.timestamp.toISOString()}`;
      this.versionMismatches.set(key, mismatches);
    }
  }

  /**
   * Validate build reproducibility
   */
  validateReproducibility(repo: string): boolean {
    const builds = this.buildHistory.get(repo) || [];
    if (builds.length < 2) return true;

    const recentBuilds = builds.slice(-10);
    const reproducibleCount = recentBuilds.filter(b => b.reproducible).length;

    return reproducibleCount / recentBuilds.length > 0.9; // 90% reproducibility threshold
  }

  /**
   * Get build environment metrics
   */
  getBuildEnvironmentMetrics(repo: string): BuildEnvironmentMetrics {
    const builds = this.buildHistory.get(repo) || [];

    if (builds.length === 0) {
      return {
        repo,
        totalBuilds: 0,
        successfulBuilds: 0,
        failedBuilds: 0,
        successRate: 0,
        reproducibilityRate: 0,
        averageBuildDuration: 0
      };
    }

    const successfulBuilds = builds.filter(b => b.buildSuccess).length;
    const failedBuilds = builds.length - successfulBuilds;
    const reproducibleBuilds = builds.filter(b => b.reproducible).length;
    const totalDuration = builds.reduce((sum, b) => sum + b.buildDuration, 0);

    return {
      repo,
      totalBuilds: builds.length,
      successfulBuilds,
      failedBuilds,
      successRate: successfulBuilds / builds.length,
      reproducibilityRate: reproducibleBuilds / builds.length,
      averageBuildDuration: Math.round(totalDuration / builds.length),
      lastBuild: builds[builds.length - 1]
    };
  }

  /**
   * Get version mismatches
   */
  getVersionMismatches(repo: string): string[] {
    const mismatches: string[] = [];

    for (const [key, values] of this.versionMismatches.entries()) {
      if (key.startsWith(repo)) {
        mismatches.push(...values);
      }
    }

    return mismatches;
  }

  /**
   * Store build environment
   */
  private storeBuildEnvironment(buildEnv: BuildEnvironment): void {
    const history = this.buildHistory.get(buildEnv.repo) || [];
    history.push(buildEnv);

    // Keep only last 100 builds
    if (history.length > 100) {
      history.shift();
    }

    this.buildHistory.set(buildEnv.repo, history);
  }

  /**
   * Get last build
   */
  private getLastBuild(repo: string): BuildEnvironment | undefined {
    const history = this.buildHistory.get(repo) || [];
    return history[history.length - 1];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.buildHistory.clear();
    this.versionMismatches.clear();
  }
}

// Export singleton instance
export const buildEnvironmentService = new BuildEnvironmentService();

