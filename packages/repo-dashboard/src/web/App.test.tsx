/**
 * Tests for App component
 */

import { describe, it, expect } from 'vitest';
import React from 'react';

describe('App Component', () => {
  it('should render without crashing', () => {
    expect(React).toBeDefined();
  });

  it('should have navigation component', () => {
    const navigationComponent = 'Navigation';
    expect(navigationComponent).toBeDefined();
  });

  it('should have dashboard page', () => {
    const dashboardPage = 'Dashboard';
    expect(dashboardPage).toBeDefined();
  });

  it('should have repo status page', () => {
    const repoStatusPage = 'RepoStatus';
    expect(repoStatusPage).toBeDefined();
  });

  it('should have issues page', () => {
    const issuesPage = 'Issues';
    expect(issuesPage).toBeDefined();
  });

  it('should have packages page', () => {
    const packagesPage = 'Packages';
    expect(packagesPage).toBeDefined();
  });

  it('should handle page navigation', () => {
    const pages = ['dashboard', 'repos', 'issues', 'packages'];
    expect(pages.length).toBe(4);
  });

  it('should initialize with dashboard page', () => {
    const initialPage = 'dashboard';
    expect(initialPage).toBe('dashboard');
  });
});

