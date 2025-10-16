/**
 * @bpm/repo-dashboard
 * Repository and package management dashboard
 */

// Export types
export type {
  Repository,
  Issue,
  WorkflowRun,
  LocalPackage,
  RepositoryStatus,
  PackageReadiness,
  StatusOptions,
  IssuesOptions,
  PackagesOptions,
  PackOptions,
  ListReposOptions,
  ListIssuesOptions,
  WorkflowStatusOptions,
  FindPackagesOptions,
} from './types.js';

// Export GitHub API functions
export {
  listRepos,
  listIssues,
  getWorkflowStatus,
  getRepositoryStatus,
  countStaleIssues,
} from './github.js';

// Export local package functions
export {
  findLocalPackages,
  getPackageReadiness,
  getPackageInfo,
} from './local.js';

// Export CLI handlers
export {
  handleStatus,
  handleIssues,
  handlePackages,
  handlePack,
} from './cli.js';

