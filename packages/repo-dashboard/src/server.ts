/**
 * Express server for repo-dashboard web UI
 */

import express, { Request, Response, NextFunction } from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { listRepos, listIssues, getWorkflowStatus, countStaleIssues } from './github.js';
import { getPackageReadiness } from './local.js';
import { adfFetcher } from './services/adf-fetcher.js';
import { adfCache } from './services/adf-cache.js';
import { extractRepositoriesFromADF } from './services/adf-repository-extractor.js';
import { prMetricsCollector } from './services/pull-request-metrics-collector.js';
import { deploymentMetricsCollector } from './services/deployment-metrics-collector.js';
import { metricsAggregator } from './services/metrics-aggregator.js';
import { WIPTrackerService } from './services/wip-tracker.js';
import { FlowStageAnalyzerService } from './services/flow-stage-analyzer.js';
import { DeployCadenceService } from './services/deploy-cadence.js';
import { conductorMetricsCollector } from './services/conductor-metrics-collector.js';
import { architectureValidationCollector } from './services/architecture-validation-collector.js';
import { bundleMetricsCollector } from './services/bundle-metrics-collector.js';
import { testCoverageCollector } from './services/test-coverage-collector.js';
import { codeQualityCollector } from './services/code-quality-collector.js';
import { testExecutionCollector } from './services/test-execution-collector.js';
import { ConstraintDetectionService } from './services/constraint-detection.js';
import { RootCauseAnalysisService } from './services/root-cause-analysis.js';
import { PredictiveAnalysisService } from './services/predictive-analysis.js';
import { crossTeamDependencyService } from './services/cross-team-dependency.js';
import { handoffTrackingService } from './services/handoff-tracking.js';
import { dependencyHealthService } from './services/dependency-health.js';
import { crossTeamCommunicationService } from './services/cross-team-communication.js';
import { environmentConfigurationService } from './services/environment-configuration.js';
import { configurationDriftDetectionService } from './services/configuration-drift-detection.js';
import { buildEnvironmentService } from './services/build-environment.js';
import { environmentHealthService } from './services/environment-health.js';
import { BusFactorAnalysisService } from './services/bus-factor-analysis.js';
import { KnowledgeSharingService } from './services/knowledge-sharing.js';
import { SkillInventoryService } from './services/skill-inventory.js';
import { CodeOwnershipService } from './services/code-ownership.js';
import { buildStatusService } from './services/build-status.js';
import { testResultsService } from './services/test-results.js';
import { deploymentStatusService } from './services/deployment-status.js';
import { feedbackAggregationService } from './services/feedback-aggregation.js';
import { alertingService } from './services/alerting.js';
import { ConductorLogsCollector } from './services/conductor-logs-collector.js';
import { ContainerHealthMonitor } from './services/container-health.js';
import { ConductorMetricsExtractor } from './services/conductor-metrics-from-logs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.WEB_PORT ? parseInt(process.env.WEB_PORT) : 3000;
const HOST = process.env.WEB_HOST || 'localhost';
const DEFAULT_ARCHITECTURE_ORG = process.env.DEFAULT_ARCHITECTURE_ORG || 'BPMSoftwareSolutions';
const DEFAULT_ARCHITECTURE_REPO = process.env.DEFAULT_ARCHITECTURE_REPO || 'renderx-plugins-demo';

// Initialize Phase 1.2 services
const wipTracker = new WIPTrackerService(prMetricsCollector);
const flowStageAnalyzer = new FlowStageAnalyzerService(prMetricsCollector);
const deployCadenceService = new DeployCadenceService(deploymentMetricsCollector);

// Initialize Phase 1.4 services (Constraint Radar & Bottleneck Detection)
const constraintDetectionService = new ConstraintDetectionService();
const rootCauseAnalysisService = new RootCauseAnalysisService();
const predictiveAnalysisService = new PredictiveAnalysisService();

// Initialize Phase 1.7 services (Knowledge Sharing & Bus Factor Analysis)
const busFactorAnalysisService = new BusFactorAnalysisService();
const knowledgeSharingService = new KnowledgeSharingService();
const skillInventoryService = new SkillInventoryService();
const codeOwnershipService = new CodeOwnershipService();

// Initialize Phase 2 services (Conductor Log Exposure)
const conductorLogsCollector = new ConductorLogsCollector();
const containerHealthMonitor = new ContainerHealthMonitor();
const conductorMetricsExtractor = new ConductorMetricsExtractor();

// Middleware
app.use(express.json());

// CORS middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Error handling middleware
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Helper function to load local ADF file
function loadLocalADF(filename: string): any {
  try {
    const adfPath = join(__dirname, '..', 'docs', filename);
    console.log(`📂 Loading local ADF from: ${adfPath}`);
    const content = readFileSync(adfPath, 'utf-8');
    const adf = JSON.parse(content);
    console.log(`✅ Successfully loaded local ADF: ${adf.name}`);
    return adf;
  } catch (error) {
    console.error(`❌ Error loading local ADF ${filename}:`, error);
    throw error;
  }
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Configuration endpoint
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    defaultArchitectureOrg: DEFAULT_ARCHITECTURE_ORG,
    defaultArchitectureRepo: DEFAULT_ARCHITECTURE_REPO,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Get summary metrics for default organization
app.get('/api/summary', asyncHandler(async (req: Request, res: Response) => {
  try {
    const org = 'BPMSoftwareSolutions';
    const { architecture } = req.query;

    // If architecture parameter is provided, use architecture-aware logic
    if (architecture && typeof architecture === 'string') {
      const [adfOrg, adfRepo] = architecture.split('/');
      if (adfOrg && adfRepo) {
        return res.redirect(`/api/summary/architecture/${adfOrg}/${adfRepo}`);
      }
    }

    // Default to architecture-first mode: redirect to default architecture
    // This ensures the dashboard loads only repos from the architecture instead of all org repos
    return res.redirect(`/api/summary/architecture/${DEFAULT_ARCHITECTURE_ORG}/${DEFAULT_ARCHITECTURE_REPO}`);

    // Legacy code below kept for reference but unreachable
    // Fetch repos for the organization
    const repos = await listRepos({ org, limit: 100 });

    // Calculate summary metrics
    let totalIssues = 0;
    let totalStalePRs = 0;

    for (const repo of repos) {
      try {
        const issues = await listIssues({
          repo: `${repo.owner}/${repo.name}`,
          state: 'open'
        });
        totalIssues += issues.filter(i => !i.isPullRequest).length;
        const staleCount = await countStaleIssues(`${repo.owner}/${repo.name}`);
        totalStalePRs += staleCount;
      } catch (error) {
        console.warn(`⚠️ Error fetching issues for ${repo.name}:`, error instanceof Error ? error.message : error);
      }
    }

    const summary = {
      organization: org,
      repos: {
        total: repos.length,
        health: Math.min(100, Math.max(0, 85 + Math.random() * 10))
      },
      architectures: {
        total: 3,
        health: Math.min(100, Math.max(0, 88 + Math.random() * 10))
      },
      packages: {
        total: 5,
        health: Math.min(100, Math.max(0, 90 + Math.random() * 10))
      },
      issues: {
        open: totalIssues,
        stalePRs: totalStalePRs
      },
      recentActivity: [
        {
          type: 'deployment',
          description: 'Latest deployment completed successfully',
          timestamp: new Date().toISOString()
        },
        {
          type: 'build',
          description: 'Build pipeline executed',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    };

    res.json(summary);
  } catch (error) {
    console.error('❌ Error fetching summary:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch summary'
    });
  }
}));

// Get architecture-aware summary metrics
app.get('/api/summary/architecture/:org/:repo', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, repo } = req.params;
    const { branch = 'main', path = 'adf.json' } = req.query;

    console.log(`📊 Fetching architecture-aware summary for ${org}/${repo}`);

    // Check if this is a local ADF file (renderx-plugins-demo)
    let adf: any;
    if (repo === 'renderx-plugins-demo' && path === 'adf.json') {
      // Load the local renderx-plugins-demo-adf.json file
      adf = loadLocalADF('renderx-plugins-demo-adf.json');
    } else {
      // Fetch the ADF from GitHub
      adf = await adfFetcher.fetchADF({
        org,
        repo,
        branch: branch as string,
        path: path as string
      });
    }

    // Extract repositories from ADF
    const architectureRepos = extractRepositoriesFromADF(adf, org);
    const repoNames = architectureRepos.map(r => `${r.owner}/${r.name}`);

    console.log(`📊 Found ${repoNames.length} repositories in architecture`);
    console.log(`📋 Repository names: ${repoNames.join(', ')}`);

    // Fetch metrics for architecture repositories
    let totalIssues = 0;
    let totalStalePRs = 0;
    const repositories = [];

    for (const repoName of repoNames) {
      let issueCount = 0;
      let staleCount = 0;
      let health = 85;
      let metricsAvailable = false;

      try {
        console.log(`🔍 Fetching metrics for ${repoName}...`);
        const issues = await listIssues({
          repo: repoName,
          state: 'open'
        });
        issueCount = issues.filter(i => !i.isPullRequest).length;
        staleCount = await countStaleIssues(repoName);
        metricsAvailable = true;
        console.log(`✅ Successfully fetched metrics for ${repoName}`);
      } catch (error) {
        console.warn(`⚠️ Error fetching metrics for ${repoName}:`, error instanceof Error ? error.message : error);
        console.log(`📌 Using default metrics for ${repoName}`);
        // Use default metrics instead of skipping the repository
        issueCount = 0;
        staleCount = 0;
        health = 0; // Indicate metrics are unavailable
      }

      totalIssues += issueCount;
      totalStalePRs += staleCount;

      repositories.push({
        name: repoName.split('/')[1],
        owner: repoName.split('/')[0],
        health: Math.min(100, Math.max(0, health + (metricsAvailable ? Math.random() * 10 : 0))),
        issues: {
          open: issueCount,
          stalePRs: staleCount
        },
        metricsAvailable
      });
    }

    // Calculate container health scores
    const containers = (adf.c4Model?.containers || []).map((container: any) => ({
      id: container.id,
      name: container.name,
      type: container.type,
      description: container.description,
      healthScore: Math.min(100, Math.max(0, 85 + Math.random() * 10)),
      repository: container.repository || container.repositories?.[0]
    }));

    const summary = {
      architecture: {
        name: adf.name,
        version: adf.version,
        description: adf.description
      },
      repositories,
      containers,
      aggregatedMetrics: {
        overallHealth: Math.min(100, Math.max(0, 85 + Math.random() * 10)),
        totalIssues,
        stalePRs: totalStalePRs,
        testCoverage: adf.metrics?.testCoverage || 0.75,
        buildStatus: adf.metrics?.buildStatus || 'success'
      },
      relationships: adf.c4Model?.relationships || []
    };

    res.json(summary);
  } catch (error) {
    console.error('❌ Error fetching architecture summary:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch architecture summary'
    });
  }
}));

// Get architecture-specific repositories
app.get('/api/repos/architecture/:org/:repo', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, repo } = req.params;
    const { branch = 'main', path = 'adf.json' } = req.query;

    console.log(`📊 Fetching architecture-specific repos for ${org}/${repo}`);

    // Check if this is a local ADF file (renderx-plugins-demo)
    let adf: any;
    if (repo === 'renderx-plugins-demo' && path === 'adf.json') {
      // Load the local renderx-plugins-demo-adf.json file
      adf = loadLocalADF('renderx-plugins-demo-adf.json');
    } else {
      // Fetch the ADF from GitHub
      adf = await adfFetcher.fetchADF({
        org,
        repo,
        branch: branch as string,
        path: path as string
      });
    }

    // Extract repositories from ADF
    const architectureRepos = extractRepositoriesFromADF(adf, org);
    const repoNames = architectureRepos.map(r => `${r.owner}/${r.name}`);

    console.log(`📊 Found ${repoNames.length} repositories in architecture`);

    // Fetch additional status for each architecture repository
    const reposWithStatus = await Promise.all(
      architectureRepos.map(async (repo) => {
        try {
          const issues = await listIssues({
            repo: `${repo.owner}/${repo.name}`,
            state: 'open'
          });
          const prs = issues.filter(i => i.isPullRequest);
          const staleCount = await countStaleIssues(`${repo.owner}/${repo.name}`);
          const workflow = await getWorkflowStatus({ repo: `${repo.owner}/${repo.name}` });

          return {
            ...repo,
            openIssues: issues.filter(i => !i.isPullRequest).length,
            openPRs: prs.length,
            stalePRs: staleCount,
            lastWorkflow: workflow?.conclusion || 'unknown',
          };
        } catch (error) {
          console.warn(`⚠️ Error fetching status for ${repo.name}:`, error instanceof Error ? error.message : error);
          return {
            ...repo,
            openIssues: 0,
            openPRs: 0,
            stalePRs: 0,
            lastWorkflow: 'error',
          };
        }
      })
    );

    console.log(`✅ Fetched status for ${reposWithStatus.length} architecture repositories`);
    res.json(reposWithStatus);
  } catch (error) {
    console.error('❌ Error fetching architecture repositories:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch architecture repositories'
    });
  }
}));

// Get organization repositories
app.get('/api/repos/:org', asyncHandler(async (req: Request, res: Response) => {
  const { org } = req.params;
  const { limit = '50' } = req.query;

  try {
    console.log(`📊 Fetching repos for org: ${org}`);
    const repos = await listRepos({
      org,
      limit: Math.min(parseInt(limit as string), 100)
    });

    console.log(`✅ Found ${repos.length} repositories`);

    // Fetch additional status for each repo
    const reposWithStatus = await Promise.all(
      repos.map(async (repo) => {
        try {
          const issues = await listIssues({
            repo: `${repo.owner}/${repo.name}`,
            state: 'open'
          });
          const prs = issues.filter(i => i.isPullRequest);
          const staleCount = await countStaleIssues(`${repo.owner}/${repo.name}`);
          const workflow = await getWorkflowStatus({ repo: `${repo.owner}/${repo.name}` });

          return {
            ...repo,
            openIssues: issues.filter(i => !i.isPullRequest).length,
            openPRs: prs.length,
            stalePRs: staleCount,
            lastWorkflow: workflow?.conclusion || 'unknown',
          };
        } catch (error) {
          console.warn(`⚠️ Error fetching status for ${repo.name}:`, error instanceof Error ? error.message : error);
          return {
            ...repo,
            openIssues: 0,
            openPRs: 0,
            stalePRs: 0,
            lastWorkflow: 'error',
          };
        }
      })
    );

    res.json(reposWithStatus);
  } catch (error) {
    console.error('❌ Error fetching repositories:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch repositories'
    });
  }
}));

// Get issues for a repository
app.get('/api/repos/:owner/:repo/issues', asyncHandler(async (req: Request, res: Response) => {
  const { owner, repo } = req.params;
  const { state = 'open', limit = '50' } = req.query;
  
  try {
    const issues = await listIssues({
      repo: `${owner}/${repo}`,
      state: state as 'open' | 'closed' | 'all',
      limit: Math.min(parseInt(limit as string), 100)
    });
    
    res.json(issues);
  } catch (error) {
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch issues' 
    });
  }
}));

// Get local packages
app.get('/api/packages', asyncHandler(async (req: Request, res: Response) => {
  const { basePath = './packages', includePrivate = 'false' } = req.query;

  try {
    const readiness = await getPackageReadiness({
      basePath: basePath as string,
      includePrivate: includePrivate === 'true'
    });

    res.json(readiness);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch packages'
    });
  }
}));

// ADF endpoints
app.get('/api/adf/:org/:repo', asyncHandler(async (req: Request, res: Response) => {
  const { org, repo } = req.params;
  const { branch = 'main', path = 'adf.json' } = req.query;

  try {
    console.log(`📋 Fetching ADF for ${org}/${repo}`);

    // Check cache first
    const cacheKey = `${org}/${repo}/${branch}/${path}`;
    const cached = adfCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Fetch from GitHub
    const adf = await adfFetcher.fetchADF({
      org,
      repo,
      branch: branch as string,
      path: path as string
    });

    // Cache the result
    adfCache.set(cacheKey, adf);

    res.json(adf);
  } catch (error) {
    console.error(`❌ Error fetching ADF for ${org}/${repo}:`, error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch ADF'
    });
  }
}));

// List all ADFs in an organization
app.get('/api/adf/:org', asyncHandler(async (req: Request, res: Response) => {
  const { org } = req.params;

  try {
    console.log(`📋 Listing ADFs for organization: ${org}`);
    const adfs = await adfFetcher.listADFs(org);
    // Always return 200 with empty array if no ADFs found
    res.json(adfs);
  } catch (error) {
    console.error(`❌ Error listing ADFs for ${org}:`, error);
    // Return empty array instead of error to avoid breaking the UI
    res.json([]);
  }
}));

// Validate ADF
app.post('/api/adf/validate', asyncHandler(async (req: Request, res: Response) => {
  try {
    const adf = req.body;
    console.log(`📋 Validating ADF: ${adf.name}`);

    const isValid = await adfFetcher.validateADF(adf);

    res.json({
      valid: isValid,
      message: 'ADF is valid'
    });
  } catch (error) {
    console.error('❌ ADF validation error:', error);
    res.status(400).json({
      valid: false,
      error: error instanceof Error ? error.message : 'ADF validation failed'
    });
  }
}));

// Get ADF metrics
app.get('/api/adf/:org/:repo/metrics', asyncHandler(async (req: Request, res: Response) => {
  const { org, repo } = req.params;
  const { branch = 'main', path = 'adf.json' } = req.query;

  try {
    console.log(`📊 Fetching ADF metrics for ${org}/${repo}`);

    const adf = await adfFetcher.fetchADF({
      org,
      repo,
      branch: branch as string,
      path: path as string
    });

    const metrics = {
      org,
      repo,
      version: adf.version,
      name: adf.name,
      metrics: adf.metrics || {
        healthScore: 0,
        testCoverage: 0,
        buildStatus: 'unknown'
      },
      c4Model: {
        level: adf.c4Model?.level || 'container',
        containerCount: adf.c4Model?.containers?.length || 0,
        relationshipCount: adf.c4Model?.relationships?.length || 0
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error(`❌ Error fetching ADF metrics for ${org}/${repo}:`, error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch ADF metrics'
    });
  }
}));

// Cache statistics endpoint
app.get('/api/adf/cache/stats', asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = adfCache.getStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Error getting cache stats:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to get cache stats'
    });
  }
}));

// Architecture endpoints
app.get('/api/architecture', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Return mock architecture data for now
    const architecture = {
      version: '1.0.0',
      name: 'Enterprise CI/CD Dashboard',
      description: 'Comprehensive dashboard for CI/CD monitoring and metrics',
      c4Model: {
        level: 'container',
        containers: [
          {
            id: 'web-ui',
            name: 'Web UI',
            type: 'ui',
            description: 'React-based web dashboard',
            repositories: ['package-builder'],
            packages: [{ name: '@bpm/repo-dashboard', version: '0.1.0', status: 'beta' }],
            metrics: { healthScore: 0.85, testCoverage: 0.75, buildStatus: 'success' },
          },
          {
            id: 'api-server',
            name: 'API Server',
            type: 'service',
            description: 'Express.js API server',
            repositories: ['package-builder'],
            packages: [{ name: '@bpm/repo-dashboard', version: '0.1.0', status: 'beta' }],
            metrics: { healthScore: 0.90, testCoverage: 0.80, buildStatus: 'success' },
          },
          {
            id: 'python-scripts',
            name: 'Python Scripts',
            type: 'library',
            description: 'Python data collection and analysis',
            repositories: ['package-builder'],
            packages: [],
            metrics: { healthScore: 0.88, testCoverage: 0.85, buildStatus: 'success' },
          },
        ],
      },
      relationships: [
        { from: 'web-ui', to: 'api-server', type: 'communicates_with', description: 'HTTP requests' },
        { from: 'api-server', to: 'python-scripts', type: 'depends_on', description: 'Calls Python CLI' },
      ],
    };
    res.json(architecture);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch architecture'
    });
  }
}));

// Metrics endpoints
app.get('/api/metrics', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { days = '30' } = req.query;
    // Return mock metrics data
    const metrics = {
      timestamp: new Date().toISOString(),
      organization: 'BPMSoftwareSolutions',
      summary: {
        totalRepos: 5,
        healthScore: 0.85,
        buildSuccessRate: 0.92,
        testCoverageAvg: 0.78,
        openIssuesTotal: 12,
        stalePRsTotal: 3,
        deploymentFrequency: 2.5,
        leadTimeForChanges: 4.2,
        meanTimeToRecovery: 1.5,
        changeFailureRate: 0.08,
      },
      byRepository: {
        'package-builder': {
          healthScore: 0.88,
          buildStatus: 'success',
          testCoverage: 0.82,
          openIssues: 5,
          stalePRs: 1,
          lastDeployment: new Date().toISOString(),
          deploymentFrequency: 3.0,
          leadTime: 3.5,
          mttr: 1.2,
          changeFailureRate: 0.05,
        },
      },
      trends: {
        healthScoreTrend: Array.from({ length: parseInt(days as string) }, () => 0.85 + Math.random() * 0.1),
        buildSuccessRateTrend: Array.from({ length: parseInt(days as string) }, () => 0.90 + Math.random() * 0.05),
        testCoverageTrend: Array.from({ length: parseInt(days as string) }, () => 0.75 + Math.random() * 0.1),
        deploymentFrequencyTrend: Array.from({ length: parseInt(days as string) }, () => 2.0 + Math.random() * 1.5),
      },
    };
    res.json(metrics);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch metrics'
    });
  }
}));

// C4 Diagram endpoints
app.get('/api/c4/:level/mermaid', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { level } = req.params;
    const diagram = `graph TD
    A[Web UI] -->|HTTP| B[API Server]
    B -->|CLI| C[Python Scripts]
    C -->|Data| D[Database]
    B -->|Queries| D`;
    res.json({ diagram });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to generate diagram'
    });
  }
}));

// Components endpoints
app.get('/api/components', asyncHandler(async (req: Request, res: Response) => {
  try {
    const components = [
      {
        id: 'web-ui',
        name: 'Web UI',
        type: 'ui',
        description: 'React-based web dashboard',
      },
      {
        id: 'api-server',
        name: 'API Server',
        type: 'service',
        description: 'Express.js API server',
      },
    ];
    res.json(components);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch components'
    });
  }
}));

app.get('/api/components/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const component = {
      id,
      name: id.replace('-', ' ').toUpperCase(),
      type: 'service',
      description: 'Component description',
      repositories: ['package-builder'],
      packages: [{ name: '@bpm/repo-dashboard', version: '0.1.0', status: 'beta' }],
      dependencies: [],
      metrics: { healthScore: 0.85, testCoverage: 0.80, buildStatus: 'success' },
    };
    res.json(component);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch component'
    });
  }
}));

// Value Stream Metrics Endpoints

// Get PR metrics for a repository
app.get('/api/metrics/value-stream/:org/:repo', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, repo } = req.params;
    const { days = '30' } = req.query;
    const daysNum = parseInt(days as string, 10) || 30;

    console.log(`📊 Fetching PR metrics for ${org}/${repo}`);

    const metrics = await prMetricsCollector.collectPRMetrics(org, repo, daysNum);
    const aggregated = await prMetricsCollector.calculateAggregateMetrics(org, repo, daysNum);

    res.json({
      repository: `${org}/${repo}`,
      period: `${daysNum}d`,
      metrics: aggregated,
      prCount: metrics.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching PR metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch PR metrics'
    });
  }
}));

// Get deployment metrics for a repository
app.get('/api/metrics/deployment/:org/:repo', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, repo } = req.params;
    const { days = '30' } = req.query;
    const daysNum = parseInt(days as string, 10) || 30;

    console.log(`📊 Fetching deployment metrics for ${org}/${repo}`);

    const metrics = await deploymentMetricsCollector.collectDeploymentMetrics(org, repo, daysNum);
    const aggregated = await deploymentMetricsCollector.calculateAggregateMetrics(org, repo, daysNum);

    res.json({
      repository: `${org}/${repo}`,
      period: `${daysNum}d`,
      metrics: aggregated,
      deploymentCount: metrics.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching deployment metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch deployment metrics'
    });
  }
}));

// Get team metrics
app.get('/api/metrics/team/:team', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { team } = req.params;
    const { org = 'BPMSoftwareSolutions', period = '30d' } = req.query;

    console.log(`📊 Fetching team metrics for ${team}`);

    const teamMetrics = await metricsAggregator.aggregateTeamMetrics(
      org as string,
      team,
      (period as '7d' | '30d') || '30d'
    );

    res.json(teamMetrics);
  } catch (error) {
    console.error('❌ Error fetching team metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch team metrics'
    });
  }
}));

// Get all teams
app.get('/api/metrics/teams', asyncHandler(async (req: Request, res: Response) => {
  try {
    const teams = metricsAggregator.getTeams();
    res.json({
      teams,
      count: teams.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching teams:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch teams'
    });
  }
}));

// Get metrics cache statistics
app.get('/api/metrics/cache/stats', asyncHandler(async (req: Request, res: Response) => {
  try {
    const prStats = prMetricsCollector.getCacheStats();
    const deployStats = deploymentMetricsCollector.getCacheStats();

    res.json({
      prMetrics: prStats,
      deploymentMetrics: deployStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching cache stats:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch cache stats'
    });
  }
}));

// Phase 1.2: Flow Visualization Endpoints

// Get WIP metrics for a team
app.get('/api/metrics/wip/:org/:team', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, team } = req.params;
    const { repos = '', days = '30' } = req.query;
    const daysNum = parseInt(days as string, 10) || 30;
    const repoList = (repos as string).split(',').filter(r => r.trim());

    if (repoList.length === 0) {
      return res.status(400).json({
        error: 'At least one repository must be specified in the repos parameter'
      });
    }

    console.log(`📊 Fetching WIP metrics for ${org}/${team}`);

    const metrics = await wipTracker.calculateWIPMetrics(org, team, repoList, daysNum);

    res.json({
      team,
      org,
      period: `${daysNum}d`,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching WIP metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch WIP metrics'
    });
  }
}));

// Get flow stage breakdown for a repository
app.get('/api/metrics/flow-stages/:org/:repo', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, repo } = req.params;
    const { team = 'unknown', days = '30' } = req.query;
    const daysNum = parseInt(days as string, 10) || 30;

    console.log(`📊 Fetching flow stage metrics for ${org}/${repo}`);

    const breakdown = await flowStageAnalyzer.analyzeFlowStages(org, team as string, repo, daysNum);

    res.json({
      repository: `${org}/${repo}`,
      team,
      period: `${daysNum}d`,
      breakdown,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching flow stage metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch flow stage metrics'
    });
  }
}));

// Get deploy cadence metrics for a repository
app.get('/api/metrics/deploy-cadence/:org/:repo', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, repo } = req.params;
    const { team = 'unknown', days = '30' } = req.query;
    const daysNum = parseInt(days as string, 10) || 30;

    console.log(`📊 Fetching deploy cadence metrics for ${org}/${repo}`);

    const cadence = await deployCadenceService.calculateDeployCadence(org, team as string, repo, daysNum);

    res.json({
      repository: `${org}/${repo}`,
      team,
      period: `${daysNum}d`,
      cadence,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching deploy cadence metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch deploy cadence metrics'
    });
  }
}));

// Get WIP alerts for a team
app.get('/api/metrics/wip-alerts/:org/:team', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, team } = req.params;
    const { repos = '', threshold = '10' } = req.query;
    const thresholdNum = parseInt(threshold as string, 10) || 10;
    const repoList = (repos as string).split(',').filter(r => r.trim());

    if (repoList.length === 0) {
      return res.status(400).json({
        error: 'At least one repository must be specified in the repos parameter'
      });
    }

    console.log(`📊 Checking WIP alerts for ${org}/${team}`);

    const alert = await wipTracker.checkWIPAlert(org, team, repoList, thresholdNum);

    res.json({
      team,
      org,
      alert,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error checking WIP alerts:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to check WIP alerts'
    });
  }
}));

// RenderX-Specific Metrics Endpoints (Phase 1.3)

// Get Conductor metrics for organization
app.get('/api/metrics/conductor/:org', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org } = req.params;
    console.log(`📊 Fetching Conductor metrics for organization: ${org}`);

    // For now, return aggregated mock data
    const metrics = {
      organization: org,
      timestamp: new Date().toISOString(),
      aggregated: {
        sequencesPerMinute: 250,
        avgQueueLength: 15,
        avgExecutionTime: 280,
        successRate: 0.94,
        errorRate: 0.06
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('❌ Error fetching Conductor metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch Conductor metrics'
    });
  }
}));

// Get Conductor metrics for specific repository
app.get('/api/metrics/conductor/:org/:repo', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, repo } = req.params;
    console.log(`📊 Fetching Conductor metrics for ${org}/${repo}`);

    const metrics = await conductorMetricsCollector.collectConductorMetrics(org, repo);

    res.json({
      repository: `${org}/${repo}`,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching Conductor metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch Conductor metrics'
    });
  }
}));

// Get architecture validation metrics for organization
app.get('/api/metrics/architecture-validation/:org', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org } = req.params;
    console.log(`📊 Fetching architecture validation metrics for organization: ${org}`);

    // For now, return aggregated mock data
    const metrics = {
      organization: org,
      timestamp: new Date().toISOString(),
      aggregated: {
        passRate: 0.85,
        failRate: 0.15,
        commonViolations: [
          { type: 'import-boundary', count: 12 },
          { type: 'sequence-shape', count: 5 },
          { type: 'dependency-cycle', count: 2 }
        ]
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('❌ Error fetching validation metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch validation metrics'
    });
  }
}));

// Get architecture validation metrics for specific repository
app.get('/api/metrics/architecture-validation/:org/:repo', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, repo } = req.params;
    const { commit = 'HEAD' } = req.query;
    console.log(`📊 Fetching validation metrics for ${org}/${repo}`);

    const metrics = await architectureValidationCollector.collectValidationMetrics(org, repo, commit as string);

    res.json({
      repository: `${org}/${repo}`,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching validation metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch validation metrics'
    });
  }
}));

// Get bundle metrics for organization
app.get('/api/metrics/bundle/:org', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org } = req.params;
    console.log(`📊 Fetching bundle metrics for organization: ${org}`);

    // For now, return aggregated mock data
    const metrics = {
      organization: org,
      timestamp: new Date().toISOString(),
      aggregated: {
        totalBundleSize: 2500000,
        avgLoadTime: 1500,
        healthStatus: 'good'
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('❌ Error fetching bundle metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch bundle metrics'
    });
  }
}));

// Get bundle metrics for specific repository
app.get('/api/metrics/bundle/:org/:repo', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, repo } = req.params;
    console.log(`📊 Fetching bundle metrics for ${org}/${repo}`);

    const metrics = await bundleMetricsCollector.collectBundleMetrics(org, repo);
    const alerts = bundleMetricsCollector.checkBudgetAlerts(metrics);

    res.json({
      repository: `${org}/${repo}`,
      metrics,
      alerts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching bundle metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch bundle metrics'
    });
  }
}));

// Get bundle threshold alerts for organization
app.get('/api/metrics/bundle-alerts/:org', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org } = req.params;
    console.log(`📊 Fetching bundle alerts for organization: ${org}`);

    // For now, return mock alert data
    const alerts = {
      organization: org,
      timestamp: new Date().toISOString(),
      alerts: [
        {
          repository: 'renderx-plugins-canvas',
          severity: 'warning',
          message: 'Plugin bundle approaching budget limit'
        }
      ]
    };

    res.json(alerts);
  } catch (error) {
    console.error('❌ Error fetching bundle alerts:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch bundle alerts'
    });
  }
}));

// Test Coverage Metrics Endpoints (Phase 2.1)

// Get coverage metrics for organization
app.get('/api/metrics/coverage/:org', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org } = req.params;
    console.log(`📊 Fetching coverage metrics for organization: ${org}`);

    // For now, return aggregated mock data
    const metrics = {
      organization: org,
      timestamp: new Date().toISOString(),
      aggregated: {
        lineCoverage: 82.5,
        branchCoverage: 78.3,
        functionCoverage: 85.1,
        statementCoverage: 81.2,
        trend: 'improving'
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('❌ Error fetching coverage metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch coverage metrics'
    });
  }
}));

// Get coverage metrics for specific repository
app.get('/api/metrics/coverage/:org/:repo', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, repo } = req.params;
    console.log(`📊 Fetching coverage metrics for ${org}/${repo}`);

    const metrics = await testCoverageCollector.collectCoverageMetrics(org, repo);

    res.json({
      repository: `${org}/${repo}`,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching coverage metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch coverage metrics'
    });
  }
}));

// Get coverage metrics for team
app.get('/api/metrics/coverage/:org/:team', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, team } = req.params;
    console.log(`📊 Fetching coverage metrics for team: ${team} in ${org}`);

    // For now, return aggregated mock data for team
    const metrics = {
      organization: org,
      team,
      timestamp: new Date().toISOString(),
      aggregated: {
        lineCoverage: 80.2,
        branchCoverage: 76.8,
        functionCoverage: 83.5,
        statementCoverage: 79.9,
        trend: 'stable'
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('❌ Error fetching team coverage metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch team coverage metrics'
    });
  }
}));

// Code Quality Metrics Endpoints (Phase 2.1)

// Get quality metrics for organization
app.get('/api/metrics/quality/:org', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org } = req.params;
    console.log(`📊 Fetching quality metrics for organization: ${org}`);

    // For now, return aggregated mock data
    const metrics = {
      organization: org,
      timestamp: new Date().toISOString(),
      aggregated: {
        qualityScore: 78.5,
        lintingIssues: { error: 5, warning: 25, info: 40 },
        typeErrors: 8,
        securityVulnerabilities: { critical: 0, high: 2, medium: 5, low: 12 },
        trend: 'improving'
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('❌ Error fetching quality metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch quality metrics'
    });
  }
}));

// Get quality metrics for specific repository
app.get('/api/metrics/quality/:org/:repo', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, repo } = req.params;
    console.log(`📊 Fetching quality metrics for ${org}/${repo}`);

    const metrics = await codeQualityCollector.collectQualityMetrics(org, repo);

    res.json({
      repository: `${org}/${repo}`,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching quality metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch quality metrics'
    });
  }
}));

// Test Execution Metrics Endpoints (Phase 2.1)

// Get test metrics for organization
app.get('/api/metrics/tests/:org', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org } = req.params;
    console.log(`📊 Fetching test metrics for organization: ${org}`);

    // For now, return aggregated mock data
    const metrics = {
      organization: org,
      timestamp: new Date().toISOString(),
      aggregated: {
        totalTests: 2500,
        passRate: 0.92,
        avgExecutionTime: 250,
        flakyTestPercentage: 0.03,
        trend: 'stable'
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('❌ Error fetching test metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch test metrics'
    });
  }
}));

// Get test metrics for specific repository
app.get('/api/metrics/tests/:org/:repo', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, repo } = req.params;
    console.log(`📊 Fetching test metrics for ${org}/${repo}`);

    const metrics = await testExecutionCollector.collectTestMetrics(org, repo);

    res.json({
      repository: `${org}/${repo}`,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching test metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch test metrics'
    });
  }
}));

// Phase 1.4: Constraint Radar & Bottleneck Detection Endpoints

// Get constraints for organization
app.get('/api/metrics/constraints/:org', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org } = req.params;
    console.log(`📊 Fetching constraints for organization: ${org}`);

    // For now, return mock data
    const constraints = {
      organization: org,
      timestamp: new Date().toISOString(),
      constraints: []
    };

    res.json(constraints);
  } catch (error) {
    console.error('❌ Error fetching constraints:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch constraints'
    });
  }
}));

// Get constraints for team
app.get('/api/metrics/constraints/:org/:team', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, team } = req.params;
    console.log(`📊 Fetching constraints for team: ${team}`);

    // For now, return mock data
    const constraints = {
      organization: org,
      team,
      timestamp: new Date().toISOString(),
      constraints: []
    };

    res.json(constraints);
  } catch (error) {
    console.error('❌ Error fetching team constraints:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch team constraints'
    });
  }
}));

// Get constraint radar for repository
app.get('/api/metrics/constraints/:org/:team/:repo', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, team, repo } = req.params;
    console.log(`📊 Fetching constraint radar for ${org}/${repo}`);

    // Collect flow stage metrics
    const flowBreakdown = await flowStageAnalyzer.analyzeFlowStages(org, team, repo);

    // Detect constraints
    const radarData = constraintDetectionService.detectConstraints(
      org,
      team,
      repo,
      flowBreakdown.stages,
      flowBreakdown.anomalies.length
    );

    res.json({
      repository: `${org}/${repo}`,
      radarData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching constraint radar:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch constraint radar'
    });
  }
}));

// Get bottleneck detection results
app.get('/api/metrics/bottlenecks/:org', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org } = req.params;
    console.log(`📊 Fetching bottleneck detection for organization: ${org}`);

    // For now, return mock data
    const bottlenecks = {
      organization: org,
      timestamp: new Date().toISOString(),
      bottlenecks: []
    };

    res.json(bottlenecks);
  } catch (error) {
    console.error('❌ Error fetching bottlenecks:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch bottlenecks'
    });
  }
}));

// Get constraint history
app.get('/api/metrics/constraint-history/:org/:team/:repo', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, team, repo } = req.params;
    console.log(`📊 Fetching constraint history for ${org}/${repo}`);

    const history = constraintDetectionService.getConstraintHistory(org, team, repo);

    res.json({
      repository: `${org}/${repo}`,
      history,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching constraint history:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch constraint history'
    });
  }
}));

// Acknowledge constraint
app.post('/api/metrics/constraints/:org/:team/acknowledge', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, team } = req.params;
    console.log(`📊 Acknowledging constraint for team: ${team}`);

    res.json({
      organization: org,
      team,
      acknowledged: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error acknowledging constraint:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to acknowledge constraint'
    });
  }
}));

// Get predictive analysis
app.get('/api/metrics/predictive/:org/:team/:repo', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, team, repo } = req.params;
    console.log(`📊 Fetching predictive analysis for ${org}/${repo}`);

    // Collect flow stage metrics
    const flowBreakdown = await flowStageAnalyzer.analyzeFlowStages(org, team, repo);

    // Detect constraints
    const radarData = constraintDetectionService.detectConstraints(
      org,
      team,
      repo,
      flowBreakdown.stages
    );

    // Perform predictive analysis
    const prediction = predictiveAnalysisService.performPredictiveAnalysis(
      org,
      team,
      repo,
      radarData.constraints,
      flowBreakdown.stages
    );

    res.json({
      repository: `${org}/${repo}`,
      prediction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching predictive analysis:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch predictive analysis'
    });
  }
}));

// Phase 1.5: Cross-Team Dependency Tracking & Hand-off Analysis endpoints

// Get organization-wide dependencies
app.get('/api/metrics/dependencies/:org', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org } = req.params;
    const { branch = 'main', path = 'adf.json' } = req.query;

    console.log(`📊 Fetching cross-team dependencies for ${org}`);

    // Load ADF
    let adf: any;
    if (org === 'BPMSoftwareSolutions' && path === 'adf.json') {
      adf = loadLocalADF('renderx-plugins-demo-adf.json');
    } else {
      adf = await adfFetcher.fetchADF({
        org,
        repo: DEFAULT_ARCHITECTURE_REPO,
        branch: branch as string,
        path: path as string
      });
    }

    // Initialize team mapping from ADF
    const teamMapping: Record<string, string[]> = {};
    if (adf.c4Model?.containers) {
      for (const container of adf.c4Model.containers) {
        const team = container.team || container.name || 'Unknown';
        const repos = container.repositories || (container.repository ? [container.repository] : []);
        teamMapping[team] = repos;
      }
    }

    crossTeamDependencyService.initializeTeamMapping(adf, teamMapping);
    const dependencies = crossTeamDependencyService.extractDependencies(adf);
    crossTeamDependencyService.buildDependencyGraph(dependencies);

    res.json({
      organization: org,
      dependencies,
      graph: crossTeamDependencyService.getDependencyGraph(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching dependencies:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch dependencies'
    });
  }
}));

// Get team-specific dependencies
app.get('/api/metrics/dependencies/:org/:team', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, team } = req.params;
    const { branch = 'main', path = 'adf.json' } = req.query;

    console.log(`📊 Fetching dependencies for team ${team} in ${org}`);

    // Load ADF
    let adf: any;
    if (org === 'BPMSoftwareSolutions' && path === 'adf.json') {
      adf = loadLocalADF('renderx-plugins-demo-adf.json');
    } else {
      adf = await adfFetcher.fetchADF({
        org,
        repo: DEFAULT_ARCHITECTURE_REPO,
        branch: branch as string,
        path: path as string
      });
    }

    // Initialize team mapping
    const teamMapping: Record<string, string[]> = {};
    if (adf.c4Model?.containers) {
      for (const container of adf.c4Model.containers) {
        const teamName = container.team || container.name || 'Unknown';
        const repos = container.repositories || (container.repository ? [container.repository] : []);
        teamMapping[teamName] = repos;
      }
    }

    crossTeamDependencyService.initializeTeamMapping(adf, teamMapping);
    crossTeamDependencyService.extractDependencies(adf);
    const teamDeps = crossTeamDependencyService.getTeamDependencies(team);

    res.json({
      organization: org,
      team,
      teamDependencies: teamDeps,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching team dependencies:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch team dependencies'
    });
  }
}));

// Get hand-off metrics for a team
app.get('/api/metrics/handoffs/:org/:team', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, team } = req.params;

    console.log(`📊 Fetching hand-off metrics for team ${team} in ${org}`);

    // Initialize team mapping
    const teamMapping: Record<string, string[]> = {
      'Host Team': ['renderx-plugins-demo'],
      'SDK Team': ['renderx-plugins-sdk', 'renderx-manifest-tools'],
      'Conductor Team': ['musical-conductor'],
      'Plugin Teams': [
        'renderx-plugins-canvas',
        'renderx-plugins-components',
        'renderx-plugins-control-panel',
        'renderx-plugins-header',
        'renderx-plugins-library'
      ]
    };

    handoffTrackingService.initializeTeamMapping(teamMapping);

    // Get PR metrics for the team's repos
    const teamRepos = teamMapping[team] || [];
    const allPRMetrics: any[] = [];

    for (const repo of teamRepos) {
      try {
        const metrics = await prMetricsCollector.collectMetrics(`${org}/${repo}`, '30d');
        allPRMetrics.push(...metrics);
      } catch (error) {
        console.warn(`⚠️ Could not fetch PR metrics for ${repo}`);
      }
    }

    // Calculate handoff metrics
    const handoffMetrics = handoffTrackingService.calculateHandoffMetrics(allPRMetrics);
    const teamHandoffMetrics = handoffTrackingService.getTeamHandoffMetrics(team);
    const bottlenecks = handoffTrackingService.identifyApprovalBottlenecks();

    res.json({
      organization: org,
      team,
      handoffMetrics,
      teamHandoffMetrics,
      bottlenecks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching hand-off metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch hand-off metrics'
    });
  }
}));

// Get dependency health status
app.get('/api/metrics/dependency-health/:org', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org } = req.params;

    console.log(`📊 Fetching dependency health for ${org}`);

    // Get all repositories in the organization
    const repos = await listRepos({ org, limit: 100 });

    // Check dependency health for each repo
    for (const repo of repos) {
      try {
        // Mock dependency data for demonstration
        const dependencies = [
          {
            name: 'react',
            currentVersion: '18.2.0',
            latestVersion: '18.2.0',
            isUpToDate: true,
            hasBreakingChanges: false,
            releaseDate: new Date()
          },
          {
            name: 'typescript',
            currentVersion: '5.0.0',
            latestVersion: '5.1.0',
            isUpToDate: false,
            hasBreakingChanges: false,
            releaseDate: new Date()
          }
        ];

        dependencyHealthService.checkDependencyHealth(`${org}/${repo.name}`, dependencies);
      } catch (error) {
        console.warn(`⚠️ Could not check health for ${repo.name}`);
      }
    }

    const allHealthStatuses = dependencyHealthService.getAllHealthStatuses();
    const orgHealthScore = dependencyHealthService.getOrganizationHealthScore();

    res.json({
      organization: org,
      healthStatuses: allHealthStatuses,
      organizationHealthScore: orgHealthScore,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching dependency health:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch dependency health'
    });
  }
}));

// Get cross-team communication metrics
app.get('/api/metrics/cross-team-communication/:org', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org } = req.params;

    console.log(`📊 Fetching cross-team communication metrics for ${org}`);

    // Initialize team mapping
    const teamMapping: Record<string, string[]> = {
      'Host Team': ['renderx-plugins-demo'],
      'SDK Team': ['renderx-plugins-sdk', 'renderx-manifest-tools'],
      'Conductor Team': ['musical-conductor'],
      'Plugin Teams': [
        'renderx-plugins-canvas',
        'renderx-plugins-components',
        'renderx-plugins-control-panel',
        'renderx-plugins-header',
        'renderx-plugins-library'
      ]
    };

    crossTeamCommunicationService.initializeTeamMapping(teamMapping);

    // Get issues for all repos
    for (const [team, repos] of Object.entries(teamMapping)) {
      for (const repo of repos) {
        try {
          const issues = await listIssues({
            repo: `${org}/${repo}`,
            state: 'all',
            limit: 50
          });

          // Track cross-team issues
          for (const issue of issues) {
            if (issue.isPullRequest) {
              // Simplified: assume response time is based on issue age
              const responseTime = Math.random() * 1000; // minutes
              crossTeamCommunicationService.trackCrossTeamIssue(issue, repo, repo, responseTime);
            }
          }
        } catch (error) {
          console.warn(`⚠️ Could not fetch issues for ${repo}`);
        }
      }
    }

    // Get communication patterns for all teams
    const communicationPatterns = [];
    for (const team of Object.keys(teamMapping)) {
      const pattern = crossTeamCommunicationService.getTeamCommunicationPattern(team);
      communicationPatterns.push(pattern);
    }

    res.json({
      organization: org,
      communicationPatterns,
      allCrossTeamIssues: crossTeamCommunicationService.getAllCrossTeamIssues(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching cross-team communication metrics:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch cross-team communication metrics'
    });
  }
}));

// Environment Configuration endpoints
app.get('/api/metrics/environment/:org/:env', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, env } = req.params;
    const repo = req.query.repo as string || 'renderx-plugins-demo';

    console.log(`📋 Fetching environment configuration for ${org}/${repo} (${env})`);

    const config = await environmentConfigurationService.collectEnvironmentConfiguration(
      org,
      repo,
      env as 'dev' | 'staging' | 'production'
    );

    res.json({
      organization: org,
      repository: repo,
      environment: env,
      configuration: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching environment configuration:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch environment configuration'
    });
  }
}));

// Configuration Drift Detection endpoints
app.get('/api/metrics/environment-drift/:org', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org } = req.params;
    const repo = req.query.repo as string || 'renderx-plugins-demo';

    console.log(`🔍 Fetching configuration drift metrics for ${org}/${repo}`);

    const drift = await configurationDriftDetectionService.detectDrift(
      org,
      repo,
      'dev',
      'production'
    );

    const driftMetrics = configurationDriftDetectionService.getDriftMetrics(repo);

    res.json({
      organization: org,
      repository: repo,
      drift,
      metrics: driftMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching configuration drift:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch configuration drift'
    });
  }
}));

// Build Environment endpoints
app.get('/api/metrics/build-environment/:org/:repo', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org, repo } = req.params;

    console.log(`🔨 Fetching build environment for ${org}/${repo}`);

    const buildEnv = await buildEnvironmentService.collectBuildEnvironment(org, repo);
    const metrics = buildEnvironmentService.getBuildEnvironmentMetrics(repo);

    res.json({
      organization: org,
      repository: repo,
      buildEnvironment: buildEnv,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching build environment:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch build environment'
    });
  }
}));

// Environment Health endpoints
app.get('/api/metrics/environment-health/:org', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org } = req.params;
    const repo = req.query.repo as string || 'renderx-plugins-demo';

    console.log(`💚 Fetching environment health for ${org}/${repo}`);

    const healthScore = await environmentHealthService.calculateEnvironmentHealth(org, repo);
    const healthMetrics = environmentHealthService.getEnvironmentHealthMetrics(repo);

    res.json({
      organization: org,
      repository: repo,
      healthScore,
      metrics: healthMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching environment health:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch environment health'
    });
  }
}));

// Environment Consistency Score endpoints
app.get('/api/metrics/environment-consistency/:org', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { org } = req.params;

    console.log(`📊 Fetching environment consistency for ${org}`);

    // Get consistency scores for all tracked environments
    const trackedEnvs = environmentConfigurationService.getAllTrackedEnvironments();
    const consistencyScores = [];

    for (const envKey of trackedEnvs) {
      const [repo, env] = envKey.split(':');
      const healthMetrics = environmentHealthService.getEnvironmentHealthMetrics(repo);
      if (healthMetrics.healthScores.length > 0) {
        const latestScore = healthMetrics.healthScores[healthMetrics.healthScores.length - 1];
        consistencyScores.push({
          repository: repo,
          environment: env,
          consistencyScore: latestScore.consistencyScore,
          reproducibilityScore: latestScore.reproducibilityScore,
          driftScore: latestScore.driftScore,
          overallHealthScore: latestScore.overallHealthScore,
          status: latestScore.status
        });
      }
    }

    res.json({
      organization: org,
      consistencyScores,
      averageConsistency: consistencyScores.length > 0
        ? Math.round(consistencyScores.reduce((sum, s) => sum + s.consistencyScore, 0) / consistencyScores.length)
        : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching environment consistency:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch environment consistency'
    });
  }
}));

// Insights endpoints
app.get('/api/insights', asyncHandler(async (req: Request, res: Response) => {
  try {
    const insights = {
      trends: [
        {
          metric: 'Health Score',
          description: 'Overall system health is improving',
          direction: 'up',
          change: 5.2,
        },
      ],
      anomalies: [
        {
          metric: 'Build Success Rate',
          description: 'Unusual drop in build success rate',
          severity: 'high',
        },
      ],
      recommendations: [
        {
          title: 'Improve Test Coverage',
          description: 'Test coverage is below target',
          priority: 'high',
          actions: ['Add unit tests', 'Increase integration tests'],
        },
      ],
      report: '# System Analysis Report\n\nOverall system health is good with room for improvement.',
    };
    res.json(insights);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch insights'
    });
  }
}));

// Phase 1.7 API endpoints - Knowledge Sharing & Bus Factor Analysis

// Bus Factor Analysis endpoints
app.get('/api/metrics/bus-factor/:org/:team/:repo', asyncHandler(async (req: Request, res: Response) => {
  const { org, team, repo } = req.params;
  try {
    // Mock commit history for demonstration
    const commitHistory = [
      { author: 'alice', files: ['src/main.ts', 'src/utils.ts'] },
      { author: 'alice', files: ['src/main.ts'] },
      { author: 'bob', files: ['src/api.ts'] },
      { author: 'charlie', files: ['src/config.ts'] },
    ];

    const analysis = await busFactorAnalysisService.analyzeBusFactor(org, team, repo, commitHistory);
    res.json(analysis);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to analyze bus factor'
    });
  }
}));

// Knowledge Sharing endpoints
app.get('/api/metrics/knowledge-sharing/:org/:team', asyncHandler(async (req: Request, res: Response) => {
  const { org, team } = req.params;
  try {
    // Mock PR metrics for demonstration
    const prMetrics = [
      { reviewers: ['alice', 'bob'] },
      { reviewers: ['bob', 'charlie'] },
      { reviewers: ['alice'] },
    ];

    const metrics = await knowledgeSharingService.calculateMetrics(
      org,
      team,
      prMetrics,
      5, // documentationUpdates
      2, // knowledgeSharingEvents
      1  // pairProgrammingSessions
    );
    res.json(metrics);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to calculate knowledge sharing metrics'
    });
  }
}));

// Skill Inventory endpoints
app.get('/api/metrics/skill-inventory/:org/:team', asyncHandler(async (req: Request, res: Response) => {
  const { org, team } = req.params;
  try {
    // Mock commit history for skill extraction
    const commitHistory = [
      { author: 'alice', files: ['src/main.ts', 'src/utils.tsx'] },
      { author: 'bob', files: ['src/api.ts', 'Dockerfile'] },
      { author: 'charlie', files: ['src/config.ts', 'src/main.test.ts'] },
    ];

    const inventory = await skillInventoryService.calculateSkillInventory(
      org,
      team,
      commitHistory,
      ['alice', 'bob', 'charlie']
    );
    res.json(inventory);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to calculate skill inventory'
    });
  }
}));

// Code Ownership endpoints
app.get('/api/metrics/code-ownership/:org/:team/:repo', asyncHandler(async (req: Request, res: Response) => {
  const { org, team, repo } = req.params;
  try {
    // Mock commit and review history
    const commitHistory = [
      { author: 'alice', files: ['src/main.ts', 'src/utils.ts'] },
      { author: 'alice', files: ['src/main.ts'] },
      { author: 'bob', files: ['src/api.ts'] },
    ];

    const reviewData = [
      { file: 'src/main.ts', reviewers: ['bob', 'charlie'] },
      { file: 'src/api.ts', reviewers: ['alice'] },
    ];

    const metrics = await codeOwnershipService.calculateOwnership(
      org,
      team,
      repo,
      commitHistory,
      reviewData
    );
    res.json(metrics);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to calculate code ownership'
    });
  }
}));

// High-risk areas endpoint
app.get('/api/metrics/high-risk-areas/:org', asyncHandler(async (req: Request, res: Response) => {
  const { org } = req.params;
  try {
    // Return aggregated high-risk areas across organization
    const highRiskAreas = {
      timestamp: new Date(),
      org,
      criticalRiskAreas: [
        {
          repo: 'renderx-plugins-sdk',
          team: 'SDK Team',
          busFactor: 1,
          riskLevel: 'critical',
          keyPerson: 'alice',
          recommendation: 'Immediate knowledge transfer required'
        }
      ],
      highRiskAreas: [
        {
          repo: 'musical-conductor',
          team: 'Conductor Team',
          busFactor: 2,
          riskLevel: 'high',
          keyPeople: ['bob', 'charlie'],
          recommendation: 'Increase code review participation'
        }
      ],
      summary: {
        totalRepos: 9,
        criticalCount: 1,
        highCount: 2,
        mediumCount: 3,
        lowCount: 3
      }
    };
    res.json(highRiskAreas);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch high-risk areas'
    });
  }
}));

// Phase 1.8: Real-Time Feedback & Alerting System endpoints

// Build Status endpoints
app.get('/api/metrics/build-status/:org/:repo', asyncHandler(async (req: Request, res: Response) => {
  const { org, repo } = req.params;
  try {
    const buildStatus = await buildStatusService.collectBuildStatus(org, repo);
    res.json({
      timestamp: new Date(),
      org,
      repo,
      buildStatus: buildStatus.length > 0 ? buildStatus[0] : null,
      history: buildStatus.slice(0, 10)
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch build status'
    });
  }
}));

// Test Results endpoints
app.get('/api/metrics/test-results/:org/:repo', asyncHandler(async (req: Request, res: Response) => {
  const { org, repo } = req.params;
  try {
    const testResults = await testResultsService.collectTestResults(org, repo);
    res.json({
      timestamp: new Date(),
      org,
      repo,
      latest: testResults.length > 0 ? testResults[0] : null,
      history: testResults.slice(0, 10)
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch test results'
    });
  }
}));

// Deployment Status endpoints
app.get('/api/metrics/deployment-status/:org/:repo', asyncHandler(async (req: Request, res: Response) => {
  const { org, repo } = req.params;
  try {
    const deploymentStatus = await deploymentStatusService.collectDeploymentStatus(org, repo);
    res.json({
      timestamp: new Date(),
      org,
      repo,
      latest: deploymentStatus.length > 0 ? deploymentStatus[0] : null,
      history: deploymentStatus.slice(0, 10)
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch deployment status'
    });
  }
}));

// Feedback Aggregation endpoints
app.get('/api/metrics/feedback-summary/:org', asyncHandler(async (req: Request, res: Response) => {
  const { org } = req.params;
  try {
    // Get list of repos from query parameter or use default
    const repos = req.query.repos ? (Array.isArray(req.query.repos) ? req.query.repos : [req.query.repos]) : [];
    const summary = await feedbackAggregationService.aggregateFeedback(org, repos as string[]);
    res.json(summary);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch feedback summary'
    });
  }
}));

// Alert endpoints
app.get('/api/metrics/alerts/:org', asyncHandler(async (req: Request, res: Response) => {
  const { org } = req.params;
  try {
    const alerts = alertingService.getActiveAlerts();
    const metrics = alertingService.getAlertMetrics();
    res.json({
      timestamp: new Date(),
      org,
      alerts,
      metrics
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch alerts'
    });
  }
}));

// Get alerts for specific team
app.get('/api/metrics/alerts/:org/:team', asyncHandler(async (req: Request, res: Response) => {
  const { org, team } = req.params;
  try {
    const alerts = alertingService.getTeamAlerts(team);
    res.json({
      timestamp: new Date(),
      org,
      team,
      alerts
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch team alerts'
    });
  }
}));

// Acknowledge alert endpoint
app.post('/api/metrics/alerts/:org/:alertId/acknowledge', asyncHandler(async (req: Request, res: Response) => {
  const { org, alertId } = req.params;
  try {
    const alert = alertingService.acknowledgeAlert(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json({
      timestamp: new Date(),
      org,
      alert
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to acknowledge alert'
    });
  }
}));

// Resolve alert endpoint
app.post('/api/metrics/alerts/:org/:alertId/resolve', asyncHandler(async (req: Request, res: Response) => {
  const { org, alertId } = req.params;
  try {
    const alert = alertingService.resolveAlert(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json({
      timestamp: new Date(),
      org,
      alert
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to resolve alert'
    });
  }
}));

// ============================================================================
// Conductor Logs & Monitoring API Endpoints (Phase 2)
// ============================================================================

// Get conductor logs for a container
app.get('/api/conductor/logs/:containerId', asyncHandler(async (req: Request, res: Response) => {
  const { containerId } = req.params;
  try {
    const logs = conductorLogsCollector.getLogs();
    res.json({
      containerId,
      logs: logs.slice(0, 100),
      timestamp: new Date()
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch conductor logs'
    });
  }
}));

// Get container health status
app.get('/api/conductor/container-health/:containerId', asyncHandler(async (req: Request, res: Response) => {
  const { containerId } = req.params;
  try {
    const health = {
      status: 'running' as const,
      uptime: Math.floor(Math.random() * 86400 * 30), // Random uptime up to 30 days
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      networkIn: Math.floor(Math.random() * 1000000),
      networkOut: Math.floor(Math.random() * 1000000),
      healthStatus: Math.random() > 0.1 ? ('healthy' as const) : ('degraded' as const),
      lastUpdated: new Date().toISOString()
    };
    res.json(health);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch container health'
    });
  }
}));

// Get conductor metrics
app.get('/api/conductor/metrics/:containerId', asyncHandler(async (req: Request, res: Response) => {
  const { containerId } = req.params;
  try {
    const metrics = {
      orchestration: {
        totalSymphonies: Math.floor(Math.random() * 1000),
        activeMovements: Math.floor(Math.random() * 100),
        completedBeats: Math.floor(Math.random() * 10000)
      },
      performance: {
        avgLatency: Math.random() * 100,
        p95Latency: Math.random() * 200,
        p99Latency: Math.random() * 300,
        throughput: Math.random() * 1000
      },
      queue: {
        pending: Math.floor(Math.random() * 50),
        processing: Math.floor(Math.random() * 20),
        completed: Math.floor(Math.random() * 5000)
      },
      errors: {
        total: Math.floor(Math.random() * 100),
        rate: Math.random() * 0.05,
        topErrors: [
          { error: 'Timeout', count: Math.floor(Math.random() * 50) },
          { error: 'Plugin Error', count: Math.floor(Math.random() * 30) },
          { error: 'Resource Exhausted', count: Math.floor(Math.random() * 20) }
        ]
      },
      plugins: {
        'canvas-plugin': { calls: Math.floor(Math.random() * 1000), errors: Math.floor(Math.random() * 10), avgLatency: Math.random() * 50 },
        'library-plugin': { calls: Math.floor(Math.random() * 800), errors: Math.floor(Math.random() * 8), avgLatency: Math.random() * 40 },
        'header-plugin': { calls: Math.floor(Math.random() * 600), errors: Math.floor(Math.random() * 5), avgLatency: Math.random() * 30 }
      }
    };
    res.json(metrics);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch conductor metrics'
    });
  }
}));

// Serve static files from public directory
const publicPath = join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Serve React app for all other routes
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(join(publicPath, 'index.html'));
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize services before starting server
async function initializeServices() {
  try {
    console.log('🔧 Initializing services...');

    // Initialize MetricsAggregator with ADF data
    await metricsAggregator.initialize();
    console.log('✅ MetricsAggregator initialized');

    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing services:', error);
    // Continue anyway - services will initialize on first use
  }
}

// Start server
async function startServer() {
  await initializeServices();

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Dashboard server running at http://${HOST}:${PORT}`);
    console.log(`📊 API available at http://${HOST}:${PORT}/api`);
  });
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export default app;

