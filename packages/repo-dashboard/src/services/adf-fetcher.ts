/**
 * ADF Fetcher Service
 * Fetches, validates, and caches Architecture Definition Files from GitHub repositories
 */

import { fetchGitHub } from '../github.js';

export interface ADFFetchOptions {
  org: string;
  repo: string;
  branch?: string;
  path?: string;
}

export interface ADFMetadata {
  org: string;
  repo: string;
  path: string;
  version: string;
  name: string;
  lastUpdated: string;
}

export interface ArchitectureDefinition {
  version: string;
  name: string;
  description?: string;
  c4Model?: {
    level?: string;
    containers?: any[];
    relationships?: any[];
  };
  metrics?: {
    healthScore?: number;
    testCoverage?: number;
    buildStatus?: string;
  };
  [key: string]: any;
}

/**
 * ADFFetcher class for fetching and validating ADF files from GitHub
 */
export class ADFFetcher {
  private cache: Map<string, { data: ArchitectureDefinition; timestamp: number }> = new Map();
  private cacheTTL: number = 3600000; // 1 hour in milliseconds

  /**
   * Fetch ADF from local endpoint first, then GitHub, then mock data
   * This provides resilience when GitHub API is unavailable
   */
  async fetchADF(options: ADFFetchOptions): Promise<ArchitectureDefinition> {
    const { org, repo, branch = 'main', path = 'adf.json' } = options;
    const cacheKey = `${org}/${repo}/${branch}/${path}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`✅ ADF cache hit for ${cacheKey}`);
      return cached.data;
    }

    try {
      console.log(`🔗 Fetching ADF from ${org}/${repo} (branch: ${branch}, path: ${path})`);

      // Step 1: Try to fetch from local endpoint first
      try {
        const localAdf = await this.fetchFromLocalEndpoint(repo, path);
        if (localAdf) {
          console.log(`✅ Successfully fetched ADF from local endpoint for ${org}/${repo}`);
          // Validate ADF
          await this.validateADF(localAdf);
          // Cache the result
          this.cache.set(cacheKey, { data: localAdf, timestamp: Date.now() });
          return localAdf;
        }
      } catch (localError) {
        console.debug(`ℹ️ Local endpoint not available:`, localError instanceof Error ? localError.message : localError);
      }

      // Step 2: Fall back to GitHub API
      try {
        const githubAdf = await this.fetchFromGitHub(org, repo, branch, path);
        // Validate ADF
        await this.validateADF(githubAdf);
        // Cache the result
        this.cache.set(cacheKey, { data: githubAdf, timestamp: Date.now() });
        console.log(`✅ Successfully fetched and cached ADF from GitHub for ${org}/${repo}`);
        return githubAdf;
      } catch (githubError) {
        console.warn(`⚠️ GitHub API fetch failed:`, githubError instanceof Error ? githubError.message : githubError);
      }

      // Step 3: Fall back to mock data
      console.warn(`⚠️ All fetch methods failed, using mock data for ${org}/${repo}`);
      const mockAdf = this.getMockADF(org, repo);
      // Cache the mock result
      this.cache.set(cacheKey, { data: mockAdf, timestamp: Date.now() });
      return mockAdf;
    } catch (error) {
      console.error(`❌ Error fetching ADF for ${org}/${repo}:`, error);
      throw error;
    }
  }

  /**
   * Fetch ADF from local endpoint (served by Express)
   */
  private async fetchFromLocalEndpoint(_repo: string, path: string): Promise<ArchitectureDefinition | null> {
    try {
      // Extract filename from path (e.g., 'renderx-plugins-demo-adf.json' from 'docs/renderx-plugins-demo-adf.json')
      const filename = path.split('/').pop() || path;
      const localUrl = `/adf/${filename}`;

      console.log(`📂 Trying local endpoint: ${localUrl}`);
      const response = await fetch(localUrl);

      if (!response.ok) {
        throw new Error(`Local endpoint returned ${response.status}`);
      }

      const adf = await response.json() as ArchitectureDefinition;
      console.log(`✅ Successfully fetched from local endpoint: ${localUrl}`);
      return adf;
    } catch (error) {
      console.debug(`ℹ️ Local endpoint fetch failed:`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Fetch ADF from GitHub API
   */
  private async fetchFromGitHub(org: string, repo: string, branch: string, path: string): Promise<ArchitectureDefinition> {
    const endpoint = `/repos/${org}/${repo}/contents/${path}?ref=${branch}`;
    const response = await fetchGitHub<any>(endpoint);

    // GitHub returns base64 encoded content
    if (response.content) {
      const content = Buffer.from(response.content, 'base64').toString('utf-8');
      const adf = JSON.parse(content) as ArchitectureDefinition;
      return adf;
    }

    throw new Error('No content found in GitHub response');
  }

  /**
   * Get mock ADF data as fallback
   */
  private getMockADF(org: string, repo: string): ArchitectureDefinition {
    return {
      version: '1.0.0',
      name: `${repo} Architecture`,
      description: `Mock ADF for ${org}/${repo} (GitHub API unavailable)`,
      c4Model: {
        level: 'container',
        containers: [],
        relationships: []
      },
      metrics: {
        healthScore: 0,
        testCoverage: 0,
        buildStatus: 'unknown'
      }
    };
  }

  /**
   * Validate ADF against schema
   */
  async validateADF(adf: any): Promise<boolean> {
    if (!adf || typeof adf !== 'object') {
      throw new Error('ADF must be a valid object');
    }

    if (!adf.version) {
      throw new Error('ADF must have a version field');
    }

    if (!adf.name) {
      throw new Error('ADF must have a name field');
    }

    // Basic validation - can be extended with JSON schema validation
    console.log(`✅ ADF validation passed for ${adf.name}`);
    return true;
  }

  /**
   * List all ADFs in an organization
   */
  async listADFs(org: string): Promise<ADFMetadata[]> {
    try {
      console.log(`🔗 Listing ADFs for organization: ${org}`);

      // Fetch all repositories in the organization
      const endpoint = `/orgs/${org}/repos?per_page=100&sort=updated&direction=desc`;

      let repos: any[] = [];
      try {
        repos = await fetchGitHub<any[]>(endpoint);
      } catch (error) {
        console.warn(`⚠️ Could not fetch repos for organization ${org}:`, error);
        // Return empty array if organization doesn't exist or has no repos
        return [];
      }

      const adfs: ADFMetadata[] = [];

      // Try to fetch ADF from each repository
      for (const repo of repos) {
        try {
          const adf = await this.fetchADF({
            org,
            repo: repo.name,
            branch: repo.default_branch || 'main',
            path: 'adf.json'
          });

          adfs.push({
            org,
            repo: repo.name,
            path: 'adf.json',
            version: adf.version,
            name: adf.name,
            lastUpdated: repo.updated_at
          });
        } catch (error) {
          // Repository might not have an ADF, skip it
          console.log(`⚠️ No ADF found in ${repo.name}`);
        }
      }

      console.log(`✅ Found ${adfs.length} ADFs in organization ${org}`);
      return adfs;
    } catch (error) {
      console.error(`❌ Error listing ADFs for ${org}:`, error);
      // Return empty array instead of throwing to avoid breaking the UI
      return [];
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('✅ ADF cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const adfFetcher = new ADFFetcher();

