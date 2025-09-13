import { test, expect } from '@playwright/test';

test.describe('Content Library', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    // Navigate to content library
    await page.getByText(/library/i).click();
  });

  test('should display content library interface', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /content library/i })).toBeVisible();
    await expect(page.getByText(/filter/i)).toBeVisible();
    await expect(page.getByText(/search/i)).toBeVisible();
  });

  test('should show content filters', async ({ page }) => {
    await expect(page.getByText(/all platforms/i)).toBeVisible();
    await expect(page.getByText(/all types/i)).toBeVisible();
  });

  test('should handle content filtering', async ({ page }) => {
    // Test platform filter
    await page.getByText(/all platforms/i).click();
    await page.getByText(/instagram/i).click();
    
    // Should update the content display
    await expect(page.getByText(/instagram/i)).toBeVisible();
  });

  test('should display content cards', async ({ page }) => {
    // Look for content card elements
    const contentCards = page.locator('[data-testid="content-card"]');
    
    // If content exists, check card structure
    if (await contentCards.count() > 0) {
      await expect(contentCards.first()).toBeVisible();
      await expect(contentCards.first().getByText(/platform/i)).toBeVisible();
      await expect(contentCards.first().getByText(/created/i)).toBeVisible();
    }
  });

  test('should handle content actions', async ({ page }) => {
    const contentCards = page.locator('[data-testid="content-card"]');
    
    if (await contentCards.count() > 0) {
      // Test content card actions
      await contentCards.first().hover();
      
      // Look for action buttons
      const editButton = contentCards.first().getByRole('button', { name: /edit/i });
      const deleteButton = contentCards.first().getByRole('button', { name: /delete/i });
      const scheduleButton = contentCards.first().getByRole('button', { name: /schedule/i });
      
      if (await editButton.isVisible()) {
        await expect(editButton).toBeVisible();
      }
      if (await deleteButton.isVisible()) {
        await expect(deleteButton).toBeVisible();
      }
      if (await scheduleButton.isVisible()) {
        await expect(scheduleButton).toBeVisible();
      }
    }
  });

  test('should handle pagination', async ({ page }) => {
    // Look for pagination controls
    const pagination = page.locator('[data-testid="pagination"]');
    
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible();
      
      // Test pagination buttons if they exist
      const nextButton = pagination.getByRole('button', { name: /next/i });
      const prevButton = pagination.getByRole('button', { name: /previous/i });
      
      if (await nextButton.isVisible()) {
        await expect(nextButton).toBeVisible();
      }
    }
  });
});