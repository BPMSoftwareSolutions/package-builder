/**
 * ADF Repository Extractor Service
 * Extracts repository names from Architecture Definition Files
 */

import { ArchitectureDefinition } from './adf-fetcher.js';

export interface ExtractedRepository {
  name: string;
  owner: string;
}

/**
 * Extract repository names from ADF containers
 * Looks for repository information in container metadata
 */
export function extractRepositoriesFromADF(adf: ArchitectureDefinition, defaultOrg: string = 'BPMSoftwareSolutions'): ExtractedRepository[] {
  const repositories: Map<string, ExtractedRepository> = new Map();

  if (!adf.c4Model || !adf.c4Model.containers) {
    console.warn('⚠️ No C4 model containers found in ADF');
    return [];
  }

  // Extract repositories from containers
  for (const container of adf.c4Model.containers) {
    // Check if container has repositories metadata (array)
    if (container.repositories && Array.isArray(container.repositories)) {
      for (const repo of container.repositories) {
        // Handle both string format "owner/name" and just "name"
        let owner = defaultOrg;
        let name = repo;

        if (typeof repo === 'string' && repo.includes('/')) {
          const parts = repo.split('/');
          owner = parts[0];
          name = parts[1];
        }

        const key = `${owner}/${name}`;
        if (!repositories.has(key)) {
          repositories.set(key, {
            name,
            owner
          });
        }
      }
    }

    // Also check for repository in container metadata (singular)
    if (container.repository) {
      let owner = defaultOrg;
      let name = '';

      if (typeof container.repository === 'string') {
        // Handle both "owner/name" and just "name" formats
        if (container.repository.includes('/')) {
          const parts = container.repository.split('/');
          owner = parts[0];
          name = parts[1];
        } else {
          name = container.repository;
        }
      } else if (typeof container.repository === 'object') {
        name = container.repository.name || '';
        owner = container.repository.owner || defaultOrg;
      }

      if (name) {
        const key = `${owner}/${name}`;
        if (!repositories.has(key)) {
          repositories.set(key, {
            name,
            owner
          });
        }
      }
    }
  }

  const result = Array.from(repositories.values());
  console.log(`✅ Extracted ${result.length} repositories from ADF`);
  return result;
}

/**
 * Get unique repository names from ADF
 */
export function getRepositoryNames(adf: ArchitectureDefinition, defaultOrg: string = 'BPMSoftwareSolutions'): string[] {
  const repos = extractRepositoriesFromADF(adf, defaultOrg);
  return repos.map(r => `${r.owner}/${r.name}`);
}

