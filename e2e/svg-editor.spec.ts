import { test, expect } from '@playwright/test';

test.describe('SVG Editor Package', () => {
  test('should load the host app', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loaded
    await expect(page.locator('h1')).toContainText('Package Builder');
  });

  test('should have SVG demo section', async ({ page }) => {
    await page.goto('/');
    
    // Check for SVG container
    const svgContainer = page.locator('#svg-container');
    await expect(svgContainer).toBeVisible();
    
    // Check for test rectangle
    const rect = page.locator('#test-rect');
    await expect(rect).toBeVisible();
  });

  test('should set attributes on button click', async ({ page }) => {
    await page.goto('/');
    
    const rect = page.locator('#test-rect');
    
    // Get initial fill color
    const initialFill = await rect.getAttribute('fill');
    expect(initialFill).toBe('blue');
    
    // Click the set attributes button
    await page.click('#btn-set-attrs');
    
    // Wait a bit for the change
    await page.waitForTimeout(100);
    
    // Check that fill changed to red
    const newFill = await rect.getAttribute('fill');
    expect(newFill).toBe('red');
    
    // Check that width changed
    const newWidth = await rect.getAttribute('width');
    expect(newWidth).toBe('120');
  });

  test('should apply transform on button click', async ({ page }) => {
    await page.goto('/');
    
    const rect = page.locator('#test-rect');
    
    // Initially should have no transform
    const initialTransform = await rect.getAttribute('transform');
    expect(initialTransform).toBeNull();
    
    // Click the translate button
    await page.click('#btn-translate');
    
    // Wait a bit for the change
    await page.waitForTimeout(100);
    
    // Check that transform was applied
    const newTransform = await rect.getAttribute('transform');
    expect(newTransform).toContain('translate');
  });

  test('should show output messages', async ({ page }) => {
    await page.goto('/');

    const output = page.locator('#output');

    // Initially should show ready message
    await expect(output).toContainText('Ready to test');

    // Click a button
    await page.click('#btn-set-attrs');

    // Should show success message with setAttrs result
    await expect(output).toContainText('setAttrs called: true');
    await expect(output).toContainText('Rectangle is now RED');
  });
});

