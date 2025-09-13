import { test, expect } from '@playwright/test';

test.describe('Content Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - in real tests you'd login first
    await page.goto('/dashboard');
  });

  test('should display content generation interface', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /content generator/i })).toBeVisible();
    await expect(page.getByText(/platform/i)).toBeVisible();
    await expect(page.getByText(/content type/i)).toBeVisible();
  });

  test('should allow platform selection', async ({ page }) => {
    // Check platform options are available
    await expect(page.getByText(/instagram/i)).toBeVisible();
    await expect(page.getByText(/tiktok/i)).toBeVisible();
    await expect(page.getByText(/youtube/i)).toBeVisible();
    await expect(page.getByText(/linkedin/i)).toBeVisible();
    await expect(page.getByText(/twitter/i)).toBeVisible();
  });

  test('should show content type options', async ({ page }) => {
    await expect(page.getByText(/caption/i)).toBeVisible();
    await expect(page.getByText(/image/i)).toBeVisible();
    await expect(page.getByText(/video/i)).toBeVisible();
  });

  test('should handle content generation form submission', async ({ page }) => {
    // Select platform
    await page.getByText(/instagram/i).click();
    
    // Select content type
    await page.getByText(/caption/i).click();
    
    // Fill prompt
    await page.getByPlaceholder(/describe your content/i).fill('A beautiful sunset over the ocean');
    
    // Submit form
    await page.getByRole('button', { name: /generate/i }).click();
    
    // Should show loading state
    await expect(page.getByText(/generating/i)).toBeVisible();
  });

  test('should display usage limits', async ({ page }) => {
    await expect(page.getByText(/usage/i)).toBeVisible();
    await expect(page.getByText(/\d+\/\d+/)).toBeVisible(); // Usage counter pattern
  });

  test('should be mobile responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that content is still accessible
    await expect(page.getByRole('heading', { name: /content generator/i })).toBeVisible();
    await expect(page.getByText(/platform/i)).toBeVisible();
    
    // Check mobile navigation if present
    const mobileNav = page.getByRole('button', { name: /menu/i });
    if (await mobileNav.isVisible()) {
      await mobileNav.click();
      await expect(page.getByRole('navigation')).toBeVisible();
    }
  });
});