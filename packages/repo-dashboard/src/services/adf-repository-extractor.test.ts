/**
 * Tests for ADF Repository Extractor
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { extractRepositoriesFromADF, getRepositoryNames } from './adf-repository-extractor.js';
import { ArchitectureDefinition } from './adf-fetcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

    it('should extract all repositories from RenderX Plugins Demo ADF', () => {
      const adf: ArchitectureDefinition = {
        version: '1.0.0',
        name: 'RenderX Plugins Demo',
        c4Model: {
          containers: [
            {
              id: 'host-app',
              name: 'RenderX Host Application',
              repository: 'BPMSoftwareSolutions/renderx-plugins-demo'
            },
            {
              id: 'plugin-system',
              name: 'Plugin System',
              repositories: [
                'BPMSoftwareSolutions/renderx-plugins-sdk',
                'BPMSoftwareSolutions/renderx-manifest-tools'
              ]
            },
            {
              id: 'orchestration-engine',
              name: 'MusicalConductor Orchestration Engine',
              repository: 'BPMSoftwareSolutions/musical-conductor'
            },
            {
              id: 'plugin-examples',
              name: 'Example Plugins',
              repositories: [
                'BPMSoftwareSolutions/renderx-plugins-canvas',
                'BPMSoftwareSolutions/renderx-plugins-components',
                'BPMSoftwareSolutions/renderx-plugins-control-panel',
                'BPMSoftwareSolutions/renderx-plugins-header',
                'BPMSoftwareSolutions/renderx-plugins-library'
              ]
            },
            {
              id: 'ui-layer',
              name: 'UI Layer',
              repository: 'BPMSoftwareSolutions/renderx-plugins-demo'
            },
            {
              id: 'artifact-system',
              name: 'Artifact System',
              repository: 'BPMSoftwareSolutions/renderx-plugins-demo'
            }
          ]
        }
      };

      const repos = extractRepositoriesFromADF(adf, 'BPMSoftwareSolutions');

      // Should have 9 unique repositories (renderx-plugins-demo appears 3 times but should be deduplicated)
      expect(repos).toHaveLength(9);

      // Verify all expected repositories are present
      const repoNames = repos.map(r => r.name).sort();
      expect(repoNames).toEqual([
        'musical-conductor',
        'renderx-manifest-tools',
        'renderx-plugins-canvas',
        'renderx-plugins-components',
        'renderx-plugins-control-panel',
        'renderx-plugins-demo',
        'renderx-plugins-header',
        'renderx-plugins-library',
        'renderx-plugins-sdk'
      ]);

      // Verify all are from BPMSoftwareSolutions org
      repos.forEach(repo => {
        expect(repo.owner).toBe('BPMSoftwareSolutions');
      });
    });

    it('should extract all repositories from actual renderx-plugins-demo-adf.json file', () => {
      // Load the actual ADF file
      const adfPath = join(__dirname, '..', '..', 'docs', 'renderx-plugins-demo-adf.json');
      const adfContent = readFileSync(adfPath, 'utf-8');
      const adf = JSON.parse(adfContent) as ArchitectureDefinition;

      const repos = extractRepositoriesFromADF(adf, 'BPMSoftwareSolutions');

      // Should have 8 unique repositories (components repo removed - no package.json)
      expect(repos).toHaveLength(8);

      // Verify all expected repositories are present
      const repoNames = repos.map(r => r.name).sort();
      expect(repoNames).toEqual([
        'MusicalConductor',
        'renderx-host-sdk',
        'renderx-plugin-canvas',
        'renderx-plugin-control-panel',
        'renderx-plugin-header',
        'renderx-plugin-library',
        'renderx-plugin-manifest-tools',
        'renderx-plugins-demo'
      ]);

      // Verify all are from BPMSoftwareSolutions org
      repos.forEach(repo => {
        expect(repo.owner).toBe('BPMSoftwareSolutions');
      });
    });
  });
});

