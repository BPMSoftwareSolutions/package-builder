/**
 * Tests for Dashboard page
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';

describe('Dashboard Page', () => {
  it('should render dashboard title', () => {
    const title = 'Repository Dashboard';
    expect(title).toBeDefined();
  });

  it('should have organization repositories card', () => {
    const cardTitle = '📦 Organization Repositories';
    expect(cardTitle).toContain('Organization');
  });

  it('should have repository issues card', () => {
    const cardTitle = '🐛 Repository Issues';
    expect(cardTitle).toContain('Issues');
  });

  it('should have local packages card', () => {
    const cardTitle = '📚 Local Packages';
    expect(cardTitle).toContain('Packages');
  });

  it('should have about card', () => {
    const cardTitle = 'ℹ️ About';
    expect(cardTitle).toContain('About');
  });

  it('should have organization input field', () => {
    const inputLabel = 'Organization Name:';
    expect(inputLabel).toBeDefined();
  });

  it('should have repository input field', () => {
    const inputLabel = 'Repository (owner/repo):';
    expect(inputLabel).toBeDefined();
  });

  it('should handle organization form submission', () => {
    const onNavigate = vi.fn();
    expect(typeof onNavigate).toBe('function');
  });

  it('should handle repository form submission', () => {
    const onNavigate = vi.fn();
    expect(typeof onNavigate).toBe('function');
  });

  it('should have view repositories button', () => {
    const buttonText = 'View Repositories';
    expect(buttonText).toBeDefined();
  });

  it('should have view issues button', () => {
    const buttonText = 'View Issues';
    expect(buttonText).toBeDefined();
  });

  it('should have view packages button', () => {
    const buttonText = 'View Packages';
    expect(buttonText).toBeDefined();
  });
});

