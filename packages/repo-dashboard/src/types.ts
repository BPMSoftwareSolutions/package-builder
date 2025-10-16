/**
 * Type definitions for repo-dashboard
 */

export interface Repository {
  name: string;
  owner: string;
  url: string;
  description?: string;
  isPrivate: boolean;
  topics?: string[];
  lastUpdated: string;
}

export interface Issue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  isPullRequest: boolean;
  createdAt: string;
  updatedAt: string;
  url: string;
  author: string;
}

export interface WorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required';
  createdAt: string;
  updatedAt: string;
  url: string;
}

export interface LocalPackage {
  name: string;
  path: string;
  version: string;
  private: boolean;
  description?: string;
  buildReady: boolean;
  packReady: boolean;
  distExists: boolean;
  artifactsExists: boolean;
}

export interface RepositoryStatus {
  repo: Repository;
  openIssues: number;
  openPRs: number;
  stalePRs: number;
  lastWorkflowRun?: WorkflowRun;
}

export interface PackageReadiness {
  total: number;
  ready: number;
  packages: LocalPackage[];
}

// CLI Options
export interface StatusOptions {
  org: string;
  json?: boolean;
}

export interface IssuesOptions {
  repo: string;
  filter?: 'stale' | 'open' | 'all';
  json?: boolean;
}

export interface PackagesOptions {
  listReady?: boolean;
  json?: boolean;
  basePath?: string;
}

export interface PackOptions {
  package: string;
  dryRun?: boolean;
}

// GitHub API Options
export interface ListReposOptions {
  org: string;
  topic?: string;
  limit?: number;
}

export interface ListIssuesOptions {
  repo: string;
  state?: 'open' | 'closed' | 'all';
  limit?: number;
}

export interface WorkflowStatusOptions {
  repo: string;
  branch?: string;
}

export interface FindPackagesOptions {
  basePath?: string;
  includePrivate?: boolean;
}

