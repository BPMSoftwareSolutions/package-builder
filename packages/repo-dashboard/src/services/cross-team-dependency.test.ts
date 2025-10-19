/**
 * Tests for Cross-Team Dependency Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CrossTeamDependencyService, DependencyRelationship } from './cross-team-dependency.js';
import { ArchitectureDefinition } from './adf-fetcher.js';

describe('CrossTeamDependencyService', () => {
  let service: CrossTeamDependencyService;

  beforeEach(() => {
    service = new CrossTeamDependencyService();
  });

  describe('initializeTeamMapping', () => {
    it('should initialize team mapping from provided mapping', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk', 'renderx-manifest-tools']
      };

      service.initializeTeamMapping({} as ArchitectureDefinition, teamMapping);
      const deps = service.getAllDependencies();
      expect(deps).toBeDefined();
    });

    it('should extract team mapping from ADF containers', () => {
      const adf: ArchitectureDefinition = {
        version: '1.0',
        name: 'Test Architecture',
        c4Model: {
          containers: [
            {
              name: 'Host',
              team: 'Host Team',
              repositories: ['renderx-plugins-demo']
            },
            {
              name: 'SDK',
              team: 'SDK Team',
              repositories: ['renderx-plugins-sdk']
            }
          ]
        }
      };

      service.initializeTeamMapping(adf);
      const deps = service.getAllDependencies();
      expect(deps).toBeDefined();
    });
  });

  describe('extractDependencies', () => {
    it('should extract cross-team dependencies from ADF relationships', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk']
      };

      service.initializeTeamMapping({} as ArchitectureDefinition, teamMapping);

      const adf: ArchitectureDefinition = {
        version: '1.0',
        name: 'Test Architecture',
        c4Model: {
          relationships: [
            {
              source: 'renderx-plugins-demo',
              target: 'renderx-plugins-sdk',
              type: 'direct',
              version: '1.0.0',
              isCritical: true
            }
          ]
        }
      };

      const dependencies = service.extractDependencies(adf);
      expect(dependencies).toHaveLength(1);
      expect(dependencies[0].sourceTeam).toBe('Host Team');
      expect(dependencies[0].targetTeam).toBe('SDK Team');
      expect(dependencies[0].isCritical).toBe(true);
    });

    it('should return empty array when no relationships exist', () => {
      const adf: ArchitectureDefinition = {
        version: '1.0',
        name: 'Test Architecture'
      };

      const dependencies = service.extractDependencies(adf);
      expect(dependencies).toHaveLength(0);
    });

    it('should ignore same-team dependencies', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo', 'renderx-plugins-sdk']
      };

      service.initializeTeamMapping({} as ArchitectureDefinition, teamMapping);

      const adf: ArchitectureDefinition = {
        version: '1.0',
        name: 'Test Architecture',
        c4Model: {
          relationships: [
            {
              source: 'renderx-plugins-demo',
              target: 'renderx-plugins-sdk',
              type: 'direct'
            }
          ]
        }
      };

      const dependencies = service.extractDependencies(adf);
      expect(dependencies).toHaveLength(0);
    });
  });

  describe('buildDependencyGraph', () => {
    it('should build dependency graph with nodes and edges', () => {
      const dependencies: DependencyRelationship[] = [
        {
          id: 'dep1',
          sourceTeam: 'Host Team',
          sourceRepo: 'renderx-plugins-demo',
          targetTeam: 'SDK Team',
          targetRepo: 'renderx-plugins-sdk',
          type: 'direct',
          version: '1.0.0',
          isCritical: true,
          isUpToDate: true,
          hasBreakingChanges: false,
          lastUpdated: new Date(),
          integrationTestsPassing: true,
          failureRate: 0
        }
      ];

      const graph = service.buildDependencyGraph(dependencies);
      expect(graph.nodes.size).toBe(2);
      expect(graph.edges).toHaveLength(1);
      expect(graph.criticalPaths).toHaveLength(1);
    });

    it('should identify critical paths', () => {
      const dependencies: DependencyRelationship[] = [
        {
          id: 'dep1',
          sourceTeam: 'Host Team',
          sourceRepo: 'renderx-plugins-demo',
          targetTeam: 'SDK Team',
          targetRepo: 'renderx-plugins-sdk',
          type: 'direct',
          version: '1.0.0',
          isCritical: true,
          isUpToDate: true,
          hasBreakingChanges: false,
          lastUpdated: new Date(),
          integrationTestsPassing: true,
          failureRate: 0
        },
        {
          id: 'dep2',
          sourceTeam: 'SDK Team',
          sourceRepo: 'renderx-plugins-sdk',
          targetTeam: 'Conductor Team',
          targetRepo: 'musical-conductor',
          type: 'direct',
          version: '1.0.0',
          isCritical: false,
          isUpToDate: true,
          hasBreakingChanges: false,
          lastUpdated: new Date(),
          integrationTestsPassing: true,
          failureRate: 0
        }
      ];

      const graph = service.buildDependencyGraph(dependencies);
      expect(graph.criticalPaths.length).toBeGreaterThan(0);
    });
  });

  describe('getTeamDependencies', () => {
    it('should return team dependencies with health score', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk']
      };

      service.initializeTeamMapping({} as ArchitectureDefinition, teamMapping);

      const dependencies: DependencyRelationship[] = [
        {
          id: 'dep1',
          sourceTeam: 'Host Team',
          sourceRepo: 'renderx-plugins-demo',
          targetTeam: 'SDK Team',
          targetRepo: 'renderx-plugins-sdk',
          type: 'direct',
          version: '1.0.0',
          isCritical: true,
          isUpToDate: true,
          hasBreakingChanges: false,
          lastUpdated: new Date(),
          integrationTestsPassing: true,
          failureRate: 0
        }
      ];

      service.buildDependencyGraph(dependencies);
      const teamDeps = service.getTeamDependencies('Host Team');

      expect(teamDeps.team).toBe('Host Team');
      expect(teamDeps.outgoingDependencies).toHaveLength(1);
      expect(teamDeps.dependencyHealth).toBeGreaterThanOrEqual(0);
      expect(teamDeps.dependencyHealth).toBeLessThanOrEqual(100);
    });

    it('should calculate health score based on dependency status', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk']
      };

      service.initializeTeamMapping({} as ArchitectureDefinition, teamMapping);

      const healthyDep: DependencyRelationship = {
        id: 'dep1',
        sourceTeam: 'Host Team',
        sourceRepo: 'renderx-plugins-demo',
        targetTeam: 'SDK Team',
        targetRepo: 'renderx-plugins-sdk',
        type: 'direct',
        version: '1.0.0',
        isCritical: false,
        isUpToDate: true,
        hasBreakingChanges: false,
        lastUpdated: new Date(),
        integrationTestsPassing: true,
        failureRate: 0
      };

      service.buildDependencyGraph([healthyDep]);
      const teamDeps = service.getTeamDependencies('Host Team');

      expect(teamDeps.dependencyHealth).toBe(100);
    });
  });

  describe('getDependencyGraph', () => {
    it('should return the built dependency graph', () => {
      const dependencies: DependencyRelationship[] = [
        {
          id: 'dep1',
          sourceTeam: 'Host Team',
          sourceRepo: 'renderx-plugins-demo',
          targetTeam: 'SDK Team',
          targetRepo: 'renderx-plugins-sdk',
          type: 'direct',
          version: '1.0.0',
          isCritical: true,
          isUpToDate: true,
          hasBreakingChanges: false,
          lastUpdated: new Date(),
          integrationTestsPassing: true,
          failureRate: 0
        }
      ];

      service.buildDependencyGraph(dependencies);
      const graph = service.getDependencyGraph();

      expect(graph.nodes.size).toBe(2);
      expect(graph.edges).toHaveLength(1);
    });
  });
});

