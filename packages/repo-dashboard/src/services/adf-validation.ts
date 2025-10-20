/**
 * ADF Validation Service
 * Validates repositories against Architecture Definition Files
 */

import { ArchitectureDefinition } from './adf-fetcher.js';
import { extractRepositoriesFromADF } from './adf-repository-extractor.js';

export interface ValidationResult {
  isValid: boolean;
  message: string;
  architectureRepos?: string[];
}

/**
 * Validate if a repository is defined in the ADF
 * @param org Organization name
 * @param repo Repository name
 * @param adf Architecture Definition File
 * @returns ValidationResult with validation status and message
 */
export function validateRepoInADF(
  org: string,
  repo: string,
  adf: ArchitectureDefinition
): ValidationResult {
  try {
    // Extract repositories from ADF
    const architectureRepos = extractRepositoriesFromADF(adf, org);
    const architectureRepoNames = architectureRepos.map(r => `${r.owner}/${r.name}`);

    // Check if the requested repo is in the ADF
    const fullRepoName = `${org}/${repo}`;
    const isValid = architectureRepos.some(r => r.owner === org && r.name === repo);

    if (isValid) {
      return {
        isValid: true,
        message: `Repository ${fullRepoName} is defined in the architecture`,
        architectureRepos: architectureRepoNames
      };
    }

    return {
      isValid: false,
      message: `Repository ${fullRepoName} is not defined in the renderx-plugins-demo architecture`,
      architectureRepos: architectureRepoNames
    };
  } catch (error) {
    console.error('❌ Error validating repo in ADF:', error);
    return {
      isValid: false,
      message: `Error validating repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
      architectureRepos: []
    };
  }
}

/**
 * Get all repositories defined in the ADF
 * @param adf Architecture Definition File
 * @param org Organization name (default org for repos without explicit owner)
 * @returns Array of repository names in format "owner/name"
 */
export function getADFRepositories(
  adf: ArchitectureDefinition,
  org: string = 'BPMSoftwareSolutions'
): string[] {
  try {
    const repos = extractRepositoriesFromADF(adf, org);
    return repos.map(r => `${r.owner}/${r.name}`);
  } catch (error) {
    console.error('❌ Error getting ADF repositories:', error);
    return [];
  }
}

/**
 * Create error response for non-compliant repository
 * @param org Organization name
 * @param repo Repository name
 * @param architectureRepos List of valid architecture repositories
 * @returns Error response object
 */
export function createNonCompliantRepoError(
  org: string,
  repo: string,
  architectureRepos: string[]
): {
  error: string;
  message: string;
  requestedRepo: string;
  architectureRepos: string[];
} {
  return {
    error: 'Repository not in architecture',
    message: `The repository '${org}/${repo}' is not defined in the renderx-plugins-demo architecture. Only repositories defined in the architecture are accessible.`,
    requestedRepo: `${org}/${repo}`,
    architectureRepos
  };
}

