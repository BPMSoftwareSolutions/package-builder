/**
 * ADF Team Mapper Service
 * Extracts team-to-repository mappings from Architecture Definition Files
 */

import { ArchitectureDefinition } from './adf-fetcher.js';

export interface TeamMetadata {
  name: string;
  description?: string;
  repositories: string[];
  containerIds: string[];
}

export interface TeamMapping {
  [team: string]: {
    repositories: string[];
    containerIds: string[];
    description?: string;
  };
}

/**
 * Service for extracting and managing team mappings from ADF
 */
export class ADFTeamMapper {
  private teamMapping: TeamMapping = {};
  private repoToTeamMap: Map<string, string> = new Map();
  private initialized: boolean = false;

  /**
   * Initialize team mappings from ADF
   */
  async initializeFromADF(adf: ArchitectureDefinition): Promise<void> {
    this.teamMapping = {};
    this.repoToTeamMap.clear();

    if (!adf.c4Model?.containers) {
      this.initialized = true;
      return;
    }

    // Extract team mappings from containers
    for (const container of adf.c4Model.containers) {
      const team = container.team;
      if (!team) {
        continue;
      }

      // Get repositories for this container
      const repos = this.extractRepositories(container);

      // Initialize team entry if not exists
      if (!this.teamMapping[team]) {
        this.teamMapping[team] = {
          repositories: [],
          containerIds: [],
          description: container.teamDescription
        };
      }

      // Add repositories and container ID
      this.teamMapping[team].repositories.push(...repos);
      this.teamMapping[team].containerIds.push(container.id);

      // Map each repository to team
      for (const repo of repos) {
        this.repoToTeamMap.set(repo, team);
      }
    }

    // Deduplicate repositories
    for (const team in this.teamMapping) {
      this.teamMapping[team].repositories = [
        ...new Set(this.teamMapping[team].repositories)
      ];
    }

    this.initialized = true;
  }

  /**
   * Extract repositories from a container
   */
  private extractRepositories(container: any): string[] {
    const repos: string[] = [];

    // Handle single repository
    if (container.repository) {
      repos.push(this.normalizeRepository(container.repository));
    }

    // Handle multiple repositories
    if (container.repositories && Array.isArray(container.repositories)) {
      for (const repo of container.repositories) {
        repos.push(this.normalizeRepository(repo));
      }
    }

    return repos;
  }

  /**
   * Normalize repository name to owner/name format
   */
  private normalizeRepository(repo: string | object): string {
    if (typeof repo === 'string') {
      return repo;
    }
    if (typeof repo === 'object' && repo !== null) {
      if ('repository' in repo) {
        return (repo as any).repository;
      }
      if ('name' in repo) {
        return (repo as any).name;
      }
    }
    return '';
  }

  /**
   * Get all teams
   */
  getTeams(): string[] {
    if (!this.initialized) {
      throw new Error('ADFTeamMapper not initialized. Call initializeFromADF first.');
    }
    return Object.keys(this.teamMapping);
  }

  /**
   * Get repositories for a team
   */
  getTeamRepositories(team: string): string[] {
    if (!this.initialized) {
      throw new Error('ADFTeamMapper not initialized. Call initializeFromADF first.');
    }
    return this.teamMapping[team]?.repositories || [];
  }

  /**
   * Get team for a repository
   */
  getTeamForRepository(repo: string): string | null {
    if (!this.initialized) {
      throw new Error('ADFTeamMapper not initialized. Call initializeFromADF first.');
    }
    return this.repoToTeamMap.get(repo) || null;
  }

  /**
   * Get team metadata
   */
  getTeamMetadata(team: string): TeamMetadata | null {
    if (!this.initialized) {
      throw new Error('ADFTeamMapper not initialized. Call initializeFromADF first.');
    }

    const mapping = this.teamMapping[team];
    if (!mapping) {
      return null;
    }

    return {
      name: team,
      description: mapping.description,
      repositories: mapping.repositories,
      containerIds: mapping.containerIds
    };
  }

  /**
   * Get all team mappings
   */
  getAllTeamMappings(): TeamMapping {
    if (!this.initialized) {
      throw new Error('ADFTeamMapper not initialized. Call initializeFromADF first.');
    }
    return { ...this.teamMapping };
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reset mapper
   */
  reset(): void {
    this.teamMapping = {};
    this.repoToTeamMap.clear();
    this.initialized = false;
  }
}

// Export singleton instance
export const adfTeamMapper = new ADFTeamMapper();

