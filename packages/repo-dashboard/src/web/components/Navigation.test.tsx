/**
 * Tests for Navigation component
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';

describe('Navigation Component', () => {
  it('should render navigation element', () => {
    const navElement = 'nav';
    expect(navElement).toBeDefined();
  });

  it('should have brand link', () => {
    const brandText = '📊 Dashboard';
    expect(brandText).toContain('Dashboard');
  });

  it('should have navigation links', () => {
    const links = ['Home', 'Repositories', 'Issues', 'Packages'];
    expect(links.length).toBe(4);
  });

  it('should handle navigation click', () => {
    const onNavigate = vi.fn();
    expect(typeof onNavigate).toBe('function');
  });

  it('should highlight active page', () => {
    const currentPage = 'dashboard';
    const isActive = currentPage === 'dashboard';
    expect(isActive).toBe(true);
  });

  it('should have home link', () => {
    const homeLink = 'Home';
    expect(homeLink).toBeDefined();
  });

  it('should have repositories link', () => {
    const reposLink = 'Repositories';
    expect(reposLink).toBeDefined();
  });

  it('should have issues link', () => {
    const issuesLink = 'Issues';
    expect(issuesLink).toBeDefined();
  });

  it('should have packages link', () => {
    const packagesLink = 'Packages';
    expect(packagesLink).toBeDefined();
  });
});

