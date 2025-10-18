/**
 * Express server for repo-dashboard web UI
 */

import express, { Request, Response, NextFunction } from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { listRepos, listIssues, getWorkflowStatus, countStaleIssues } from './github.js';
import { getPackageReadiness } from './local.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.WEB_PORT ? parseInt(process.env.WEB_PORT) : 3000;
const HOST = process.env.WEB_HOST || 'localhost';

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

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

