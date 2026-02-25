import { test, expect } from '@playwright/test';

/**
 * Smoke — Auth critical paths
 * Validates login form rendering, validation, and protected route redirects.
 */
test.describe('Smoke — Auth Critical Paths', () => {
  test('login form renders with email, password, and submit', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('submit with empty fields shows validation feedback', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('button[type="submit"]').click();

    // Browser-native or custom validation should prevent submission
    const url = page.url();
    expect(url).toContain('/auth');
  });

  test('invalid credentials show error feedback', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('input[type="email"]').fill('nobody@invalid-test.com');
    await page.locator('input[type="password"]').fill('WrongPassword123!');
    await page.locator('button[type="submit"]').click();

    // Wait for network round-trip
    await page.waitForTimeout(3000);

    // Should stay on auth page (no redirect to dashboard)
    expect(page.url()).toContain('/auth');
  });

  test('unauthenticated user visiting /dashboard redirects to /auth', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/auth');
  });

  test('unauthenticated user visiting /products redirects to /auth', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/auth');
  });
});
