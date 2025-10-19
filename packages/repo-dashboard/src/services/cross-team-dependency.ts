/**
 * Cross-Team Dependency Service
 * Tracks cross-team dependencies and measures hand-off efficiency
 */

import { ArchitectureDefinition } from './adf-fetcher.js';

export interface DependencyRelationship {
  id: string;
  sourceTeam: string;
  sourceRepo: string;
  targetTeam: string;
  targetRepo: string;

  // Dependency info
  type: 'direct' | 'transitive';
  version: string;
  isCritical: boolean;

  // Health
  isUpToDate: boolean;
  hasBreakingChanges: boolean;
  lastUpdated: Date;

  // Metrics
  integrationTestsPassing: boolean;
  failureRate: number;
}

export interface DependencyGraph {
  nodes: Map<string, { team: string; repo: string }>;
  edges: DependencyRelationship[];
  criticalPaths: string[][];
}

export interface TeamDependencies {
  team: string;
  repos: string[];
  incomingDependencies: DependencyRelationship[];
  outgoingDependencies: DependencyRelationship[];
  criticalDependencies: DependencyRelationship[];
  dependencyHealth: number; // 0-100
}

/**
 * Service for tracking cross-team dependencies
 */
export class CrossTeamDependencyService {
  private teamRepoMapping: Map<string, string[]> = new Map();
  private dependencyGraph: DependencyGraph = {
    nodes: new Map(),
    edges: [],
    criticalPaths: []
  };

  /**
   * Initialize team-to-repo mapping from ADF
   */
  initializeTeamMapping(adf: ArchitectureDefinition, teamMapping?: Record<string, string[]>): void {
    this.teamRepoMapping.clear();

    if (teamMapping) {
      // Use provided team mapping
      for (const [team, repos] of Object.entries(teamMapping)) {
        this.teamRepoMapping.set(team, repos);
      }
    } else {
      // Extract from ADF containers
      if (adf.c4Model?.containers) {
        for (const container of adf.c4Model.containers) {
          const team = container.team || container.name || 'Unknown';
          const repos = container.repositories || (container.repository ? [container.repository] : []);
          this.teamRepoMapping.set(team, repos);
        }
      }
    }

    console.log(`✅ Initialized team mapping with ${this.teamRepoMapping.size} teams`);
  }

  /**
   * Extract dependencies from ADF relationships
   */
  extractDependencies(adf: ArchitectureDefinition): DependencyRelationship[] {
    const dependencies: DependencyRelationship[] = [];

    if (!adf.c4Model?.relationships) {
      console.warn('⚠️ No relationships found in ADF');
      return dependencies;
    }

    for (const rel of adf.c4Model.relationships) {
      const sourceTeam = this.getTeamForRepo(rel.source);
      const targetTeam = this.getTeamForRepo(rel.target);

      if (sourceTeam && targetTeam && sourceTeam !== targetTeam) {
        const dependency: DependencyRelationship = {
          id: `${rel.source}->${rel.target}`,
          sourceTeam,
          sourceRepo: rel.source,
          targetTeam,
          targetRepo: rel.target,
          type: rel.type || 'direct',
          version: rel.version || '1.0.0',
          isCritical: rel.isCritical || false,
          isUpToDate: rel.isUpToDate !== false,
          hasBreakingChanges: rel.hasBreakingChanges || false,
          lastUpdated: new Date(rel.lastUpdated || Date.now()),
          integrationTestsPassing: rel.integrationTestsPassing !== false,
          failureRate: rel.failureRate || 0
        };

        dependencies.push(dependency);
      }
    }

    console.log(`✅ Extracted ${dependencies.length} cross-team dependencies`);
    return dependencies;
  }

  /**
   * Build dependency graph
   */
  buildDependencyGraph(dependencies: DependencyRelationship[]): DependencyGraph {
    const nodes = new Map<string, { team: string; repo: string }>();
    const edges = dependencies;

    // Add all nodes
    for (const dep of dependencies) {
      nodes.set(dep.sourceRepo, { team: dep.sourceTeam, repo: dep.sourceRepo });
      nodes.set(dep.targetRepo, { team: dep.targetTeam, repo: dep.targetRepo });
    }

    // Identify critical paths (simplified: paths with critical dependencies)
    const criticalPaths = this.identifyCriticalPaths(dependencies);

    this.dependencyGraph = { nodes, edges, criticalPaths };
    console.log(`✅ Built dependency graph with ${nodes.size} nodes and ${edges.length} edges`);

    return this.dependencyGraph;
  }

  /**
   * Identify critical paths in dependency graph
   */
  private identifyCriticalPaths(dependencies: DependencyRelationship[]): string[][] {
    const criticalDeps = dependencies.filter(d => d.isCritical);
    const paths: string[][] = [];

    for (const dep of criticalDeps) {
      paths.push([dep.sourceRepo, dep.targetRepo]);
    }

    return paths;
  }

  /**
   * Get team for a repository
   */
  private getTeamForRepo(repo: string): string | null {
    for (const [team, repos] of this.teamRepoMapping.entries()) {
      if (repos.includes(repo)) {
        return team;
      }
    }
    return null;
  }

  /**
   * Get dependencies for a team
   */
  getTeamDependencies(team: string): TeamDependencies {
    const repos = this.teamRepoMapping.get(team) || [];
    const incomingDeps = this.dependencyGraph.edges.filter(d => d.targetTeam === team);
    const outgoingDeps = this.dependencyGraph.edges.filter(d => d.sourceTeam === team);
    const criticalDeps = [...incomingDeps, ...outgoingDeps].filter(d => d.isCritical);

    // Calculate health score
    const totalDeps = incomingDeps.length + outgoingDeps.length;
    const healthyDeps = [...incomingDeps, ...outgoingDeps].filter(
      d => d.isUpToDate && !d.hasBreakingChanges && d.integrationTestsPassing
    ).length;
    const dependencyHealth = totalDeps > 0 ? Math.round((healthyDeps / totalDeps) * 100) : 100;

    return {
      team,
      repos,
      incomingDependencies: incomingDeps,
      outgoingDependencies: outgoingDeps,
      criticalDependencies: criticalDeps,
      dependencyHealth
    };
  }

  /**
   * Get all dependencies
   */
  getAllDependencies(): DependencyRelationship[] {
    return this.dependencyGraph.edges;
  }

  /**
   * Get dependency graph
   */
  getDependencyGraph(): DependencyGraph {
    return this.dependencyGraph;
  }
}

// Export singleton instance
export const crossTeamDependencyService = new CrossTeamDependencyService();

