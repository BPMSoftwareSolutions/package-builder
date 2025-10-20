/**
 * Unit tests for ADF Team Mapper Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ADFTeamMapper } from './adf-team-mapper.js';
import type { ArchitectureDefinition } from './adf-fetcher.js';

describe('ADFTeamMapper', () => {
  let mapper: ADFTeamMapper;

  const mockADF: ArchitectureDefinition = {
    version: '1.0.0',
    name: 'Test Architecture',
    c4Model: {
      level: 'container',
      containers: [
        {
          id: 'host-app',
          name: 'Host App',
          type: 'web-application',
          team: 'Host Team',
          teamDescription: 'Responsible for host application',
          repository: 'BPMSoftwareSolutions/renderx-plugins-demo'
        },
        {
          id: 'plugin-system',
          name: 'Plugin System',
          type: 'library',
          team: 'SDK Team',
          teamDescription: 'Responsible for SDK',
          repositories: [
            'BPMSoftwareSolutions/renderx-plugins-sdk',
            'BPMSoftwareSolutions/renderx-manifest-tools'
          ]
        },
        {
          id: 'plugin-canvas',
          name: 'Canvas Plugin',
          type: 'plugin',
          team: 'Canvas Team',
          teamDescription: 'Responsible for canvas plugin',
          repository: 'BPMSoftwareSolutions/renderx-plugins-canvas'
        }
      ],
      relationships: []
    }
  };

  beforeEach(() => {
    mapper = new ADFTeamMapper();
  });

  describe('initializeFromADF', () => {
    it('should initialize team mappings from ADF', async () => {
      await mapper.initializeFromADF(mockADF);
      expect(mapper.isInitialized()).toBe(true);
    });

    it('should handle ADF with no containers', async () => {
      const emptyADF: ArchitectureDefinition = {
        version: '1.0.0',
        name: 'Empty',
        c4Model: {
          containers: []
        }
      };
      await mapper.initializeFromADF(emptyADF);
      expect(mapper.isInitialized()).toBe(true);
      expect(mapper.getTeams()).toHaveLength(0);
    });

    it('should handle ADF with no c4Model', async () => {
      const noModelADF: ArchitectureDefinition = {
        version: '1.0.0',
        name: 'No Model'
      };
      await mapper.initializeFromADF(noModelADF);
      expect(mapper.isInitialized()).toBe(true);
    });
  });

  describe('getTeams', () => {
    it('should return all teams', async () => {
      await mapper.initializeFromADF(mockADF);
      const teams = mapper.getTeams();
      expect(teams).toContain('Host Team');
      expect(teams).toContain('SDK Team');
      expect(teams).toContain('Canvas Team');
      expect(teams).toHaveLength(3);
    });

    it('should throw error if not initialized', () => {
      expect(() => mapper.getTeams()).toThrow('not initialized');
    });
  });

  describe('getTeamRepositories', () => {
    it('should return repositories for a team', async () => {
      await mapper.initializeFromADF(mockADF);
      const repos = mapper.getTeamRepositories('SDK Team');
      expect(repos).toContain('BPMSoftwareSolutions/renderx-plugins-sdk');
      expect(repos).toContain('BPMSoftwareSolutions/renderx-manifest-tools');
      expect(repos).toHaveLength(2);
    });

    it('should return single repository for team', async () => {
      await mapper.initializeFromADF(mockADF);
      const repos = mapper.getTeamRepositories('Host Team');
      expect(repos).toContain('BPMSoftwareSolutions/renderx-plugins-demo');
      expect(repos).toHaveLength(1);
    });

    it('should return empty array for unknown team', async () => {
      await mapper.initializeFromADF(mockADF);
      const repos = mapper.getTeamRepositories('Unknown Team');
      expect(repos).toHaveLength(0);
    });
  });

  describe('getTeamForRepository', () => {
    it('should return team for a repository', async () => {
      await mapper.initializeFromADF(mockADF);
      const team = mapper.getTeamForRepository('BPMSoftwareSolutions/renderx-plugins-demo');
      expect(team).toBe('Host Team');
    });

    it('should return team for repository in multi-repo team', async () => {
      await mapper.initializeFromADF(mockADF);
      const team = mapper.getTeamForRepository('BPMSoftwareSolutions/renderx-plugins-sdk');
      expect(team).toBe('SDK Team');
    });

    it('should return null for unknown repository', async () => {
      await mapper.initializeFromADF(mockADF);
      const team = mapper.getTeamForRepository('unknown/repo');
      expect(team).toBeNull();
    });
  });

  describe('getTeamMetadata', () => {
    it('should return team metadata', async () => {
      await mapper.initializeFromADF(mockADF);
      const metadata = mapper.getTeamMetadata('Host Team');
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('Host Team');
      expect(metadata?.description).toBe('Responsible for host application');
      expect(metadata?.repositories).toContain('BPMSoftwareSolutions/renderx-plugins-demo');
      expect(metadata?.containerIds).toContain('host-app');
    });

    it('should return null for unknown team', async () => {
      await mapper.initializeFromADF(mockADF);
      const metadata = mapper.getTeamMetadata('Unknown Team');
      expect(metadata).toBeNull();
    });
  });

  describe('getAllTeamMappings', () => {
    it('should return all team mappings', async () => {
      await mapper.initializeFromADF(mockADF);
      const mappings = mapper.getAllTeamMappings();
      expect(Object.keys(mappings)).toHaveLength(3);
      expect(mappings['Host Team']).toBeDefined();
      expect(mappings['SDK Team']).toBeDefined();
      expect(mappings['Canvas Team']).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should reset mapper state', async () => {
      await mapper.initializeFromADF(mockADF);
      expect(mapper.isInitialized()).toBe(true);
      mapper.reset();
      expect(mapper.isInitialized()).toBe(false);
      expect(() => mapper.getTeams()).toThrow();
    });
  });

  describe('deduplication', () => {
    it('should deduplicate repositories', async () => {
      const adfWithDupes: ArchitectureDefinition = {
        version: '1.0.0',
        name: 'Test',
        c4Model: {
          containers: [
            {
              id: 'test',
              name: 'Test',
              team: 'Test Team',
              repositories: [
                'BPMSoftwareSolutions/repo1',
                'BPMSoftwareSolutions/repo1',
                'BPMSoftwareSolutions/repo2'
              ]
            }
          ]
        }
      };
      await mapper.initializeFromADF(adfWithDupes);
      const repos = mapper.getTeamRepositories('Test Team');
      expect(repos).toHaveLength(2);
    });
  });
});

