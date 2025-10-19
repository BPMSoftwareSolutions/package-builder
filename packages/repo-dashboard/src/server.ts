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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.WEB_PORT ? parseInt(process.env.WEB_PORT) : 3000;
const HOST = process.env.WEB_HOST || 'localhost';
const DEFAULT_ARCHITECTURE_ORG = process.env.DEFAULT_ARCHITECTURE_ORG || 'BPMSoftwareSolutions';
const DEFAULT_ARCHITECTURE_REPO = process.env.DEFAULT_ARCHITECTURE_REPO || 'renderx-plugins-demo';

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

    // Fetch metrics for architecture repositories
    let totalIssues = 0;
    let totalStalePRs = 0;
    const repositories = [];

    for (const repoName of repoNames) {
      try {
        const issues = await listIssues({
          repo: repoName,
          state: 'open'
        });
        const issueCount = issues.filter(i => !i.isPullRequest).length;
        const staleCount = await countStaleIssues(repoName);

        totalIssues += issueCount;
        totalStalePRs += staleCount;

        repositories.push({
          name: repoName.split('/')[1],
          owner: repoName.split('/')[0],
          health: Math.min(100, Math.max(0, 85 + Math.random() * 10)),
          issues: {
            open: issueCount,
            stalePRs: staleCount
          }
        });
      } catch (error) {
        console.warn(`⚠️ Error fetching metrics for ${repoName}:`, error instanceof Error ? error.message : error);
      }
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

// Start server
app.listen(PORT, HOST, () => {
  console.log(`🚀 Dashboard server running at http://${HOST}:${PORT}`);
  console.log(`📊 API available at http://${HOST}:${PORT}/api`);
});

export default app;

