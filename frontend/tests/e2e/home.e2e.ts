import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load and redirect based on auth state', async ({ page }) => {
    await page.goto('/');
    // Home page redirects to login or dashboard
    await expect(page).toHaveURL(/\/auth\/login|\/dashboard/);
  });

  test('should have navigation to key pages', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByText(/marketx/i)).toBeVisible();
  });
});
