/**
 * Tests for ADF Repository Extractor
 */

import { describe, it, expect } from 'vitest';
import { extractRepositoriesFromADF, getRepositoryNames } from './adf-repository-extractor.js';
import { ArchitectureDefinition } from './adf-fetcher.js';

describe('ADF Repository Extractor', () => {
  describe('extractRepositoriesFromADF', () => {
    it('should extract repositories from container repositories array', () => {
      const adf: ArchitectureDefinition = {
        version: '1.0.0',
        name: 'Test Architecture',
        c4Model: {
          containers: [
            {
              id: 'container-1',
              name: 'Container 1',
              repositories: ['repo-1', 'repo-2']
            },
            {
              id: 'container-2',
              name: 'Container 2',
              repositories: ['repo-3']
            }
          ]
        }
      };

      const repos = extractRepositoriesFromADF(adf, 'TestOrg');
      expect(repos).toHaveLength(3);
      expect(repos[0]).toEqual({ name: 'repo-1', owner: 'TestOrg' });
      expect(repos[1]).toEqual({ name: 'repo-2', owner: 'TestOrg' });
      expect(repos[2]).toEqual({ name: 'repo-3', owner: 'TestOrg' });
    });

    it('should extract repositories from container repository string', () => {
      const adf: ArchitectureDefinition = {
        version: '1.0.0',
        name: 'Test Architecture',
        c4Model: {
          containers: [
            {
              id: 'container-1',
              name: 'Container 1',
              repository: 'repo-1'
            }
          ]
        }
      };

      const repos = extractRepositoriesFromADF(adf, 'TestOrg');
      expect(repos).toHaveLength(1);
      expect(repos[0]).toEqual({ name: 'repo-1', owner: 'TestOrg' });
    });

    it('should extract repositories from container repository object', () => {
      const adf: ArchitectureDefinition = {
        version: '1.0.0',
        name: 'Test Architecture',
        c4Model: {
          containers: [
            {
              id: 'container-1',
              name: 'Container 1',
              repository: {
                name: 'repo-1',
                owner: 'CustomOrg'
              }
            }
          ]
        }
      };

      const repos = extractRepositoriesFromADF(adf, 'TestOrg');
      expect(repos).toHaveLength(1);
      expect(repos[0]).toEqual({ name: 'repo-1', owner: 'CustomOrg' });
    });

    it('should deduplicate repositories', () => {
      const adf: ArchitectureDefinition = {
        version: '1.0.0',
        name: 'Test Architecture',
        c4Model: {
          containers: [
            {
              id: 'container-1',
              name: 'Container 1',
              repositories: ['repo-1', 'repo-1']
            },
            {
              id: 'container-2',
              name: 'Container 2',
              repository: 'repo-1'
            }
          ]
        }
      };

      const repos = extractRepositoriesFromADF(adf, 'TestOrg');
      expect(repos).toHaveLength(1);
      expect(repos[0]).toEqual({ name: 'repo-1', owner: 'TestOrg' });
    });

    it('should handle ADF with no containers', () => {
      const adf: ArchitectureDefinition = {
        version: '1.0.0',
        name: 'Test Architecture'
      };

      const repos = extractRepositoriesFromADF(adf, 'TestOrg');
      expect(repos).toHaveLength(0);
    });

    it('should handle ADF with empty containers array', () => {
      const adf: ArchitectureDefinition = {
        version: '1.0.0',
        name: 'Test Architecture',
        c4Model: {
          containers: []
        }
      };

      const repos = extractRepositoriesFromADF(adf, 'TestOrg');
      expect(repos).toHaveLength(0);
    });

    it('should use default organization when not specified in container', () => {
      const adf: ArchitectureDefinition = {
        version: '1.0.0',
        name: 'Test Architecture',
        c4Model: {
          containers: [
            {
              id: 'container-1',
              name: 'Container 1',
              repositories: ['repo-1']
            }
          ]
        }
      };

      const repos = extractRepositoriesFromADF(adf, 'DefaultOrg');
      expect(repos[0].owner).toBe('DefaultOrg');
    });
  });

  describe('getRepositoryNames', () => {
    it('should return repository names in owner/name format', () => {
      const adf: ArchitectureDefinition = {
        version: '1.0.0',
        name: 'Test Architecture',
        c4Model: {
          containers: [
            {
              id: 'container-1',
              name: 'Container 1',
              repositories: ['repo-1', 'repo-2']
            }
          ]
        }
      };

      const names = getRepositoryNames(adf, 'TestOrg');
      expect(names).toEqual(['TestOrg/repo-1', 'TestOrg/repo-2']);
    });

    it('should handle mixed repository sources', () => {
      const adf: ArchitectureDefinition = {
        version: '1.0.0',
        name: 'Test Architecture',
        c4Model: {
          containers: [
            {
              id: 'container-1',
              name: 'Container 1',
              repositories: ['repo-1']
            },
            {
              id: 'container-2',
              name: 'Container 2',
              repository: {
                name: 'repo-2',
                owner: 'CustomOrg'
              }
            }
          ]
        }
      };

      const names = getRepositoryNames(adf, 'TestOrg');
      expect(names).toContain('TestOrg/repo-1');
      expect(names).toContain('CustomOrg/repo-2');
    });
  });
});

