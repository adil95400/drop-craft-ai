import { test, expect } from '@playwright/test';

/**
 * Smoke tests — Protected route redirects
 * Verifies that unauthenticated users are redirected to /auth.
 */

const PROTECTED_ROUTES = [
  '/dashboard',
  '/products',
  '/orders',
  '/customers',
  '/settings',
  '/analytics',
  '/integrations',
  '/automation',
];

test.describe('Smoke — Protected Routes Redirect', () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route} redirects to auth when unauthenticated`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      // Should redirect to auth or show auth-related content
      const url = page.url();
      expect(url).toMatch(/\/auth/);
    });
  }
});
