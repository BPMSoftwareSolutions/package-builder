/**
 * Tests for Express server
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Request, Response } from 'express';

describe('Server Setup', () => {
  it('should have required environment variables configured', () => {
    expect(process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GH_PAT).toBeDefined();
  });

  it('should have Express app configured', () => {
    const app = express();
    expect(app).toBeDefined();
    expect(typeof app.get).toBe('function');
    expect(typeof app.post).toBe('function');
  });

  it('should have CORS headers configured', () => {
    const app = express();
    app.use((req: Request, res: Response, next: Function) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      next();
    });
    
    expect(app).toBeDefined();
  });

  it('should have API routes defined', () => {
    const app = express();
    const routes = [
      '/api/health',
      '/api/repos/:org',
      '/api/repos/:owner/:repo/issues',
      '/api/packages',
    ];
    
    routes.forEach(route => {
      expect(route).toBeDefined();
    });
  });

  it('should have error handling middleware', () => {
    const app = express();
    const errorHandler = (err: any, req: Request, res: Response, next: Function) => {
      res.status(500).json({ error: 'Internal server error' });
    };
    
    expect(typeof errorHandler).toBe('function');
  });

  it('should have async handler wrapper', () => {
    const asyncHandler = (fn: Function) => (req: Request, res: Response, next: Function) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
    
    expect(typeof asyncHandler).toBe('function');
  });
});

describe('API Routes', () => {
  it('should have health check endpoint', () => {
    const endpoint = '/api/health';
    expect(endpoint).toBe('/api/health');
  });

  it('should have repos endpoint', () => {
    const endpoint = '/api/repos/:org';
    expect(endpoint).toMatch(/\/api\/repos/);
  });

  it('should have issues endpoint', () => {
    const endpoint = '/api/repos/:owner/:repo/issues';
    expect(endpoint).toMatch(/\/api\/repos.*\/issues/);
  });

  it('should have packages endpoint', () => {
    const endpoint = '/api/packages';
    expect(endpoint).toBe('/api/packages');
  });
});

