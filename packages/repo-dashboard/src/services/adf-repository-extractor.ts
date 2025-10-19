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
    // Check if container has repositories metadata
    if (container.repositories && Array.isArray(container.repositories)) {
      for (const repoName of container.repositories) {
        const key = `${defaultOrg}/${repoName}`;
        if (!repositories.has(key)) {
          repositories.set(key, {
            name: repoName,
            owner: defaultOrg
          });
        }
      }
    }

    // Also check for repository in container metadata
    if (container.repository) {
      const repoName = typeof container.repository === 'string' 
        ? container.repository 
        : container.repository.name;
      
      const owner = typeof container.repository === 'object' && container.repository.owner
        ? container.repository.owner
        : defaultOrg;

      const key = `${owner}/${repoName}`;
      if (!repositories.has(key)) {
        repositories.set(key, {
          name: repoName,
          owner
        });
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

