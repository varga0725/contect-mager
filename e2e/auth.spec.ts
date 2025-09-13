import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should switch to registration form', async ({ page }) => {
    await page.getByText(/don't have an account/i).click();
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check for validation messages
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('should handle registration flow', async ({ page }) => {
    await page.getByText(/don't have an account/i).click();
    
    // Fill registration form
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByPlaceholder(/password/i).fill('password123');
    
    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Should redirect to dashboard or show success message
    // Note: This will fail without a real backend, but tests the flow
    await expect(page).toHaveURL(/dashboard|login/);
  });

  test('should be accessible', async ({ page }) => {
    // Check for proper ARIA labels and roles
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByLabelText(/email/i)).toBeVisible();
    await expect(page.getByLabelText(/password/i)).toBeVisible();
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.getByPlaceholder(/email/i)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByPlaceholder(/password/i)).toBeFocused();
  });
});