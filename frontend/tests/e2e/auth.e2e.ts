import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should show login form fields', async ({ page }) => {
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.getByLabel('Email address').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Should stay on login page (no successful redirect)
    await expect(page).toHaveURL('/auth/login');
  });

  test('should navigate to register page', async ({ page }) => {
    await page.getByText(/create one/i).click();
    await expect(page).toHaveURL('/auth/register');
    await expect(page.getByLabel('Email address')).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.getByText(/forgot password/i).click();
    await expect(page).toHaveURL('/auth/forgot-password');
  });
});
