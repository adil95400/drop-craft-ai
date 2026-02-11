import { test, expect } from '@playwright/test';
import { login, logout } from '../helpers/auth.helper';

test.describe('Auth — Logout', () => {
  test('logs out and redirects to auth', async ({ page }) => {
    await login(page);
    await logout(page);
    await expect(page).toHaveURL(/auth/);
  });

  test('cannot access dashboard after logout', async ({ page }) => {
    await login(page);
    await logout(page);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/auth/);
  });
});
