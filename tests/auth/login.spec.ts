import { test, expect } from '@playwright/test';
import { goToAuth, login, TEST_USER } from '../helpers/auth.helper';

test.describe('Auth — Login', () => {
  test('shows login form on /auth', async ({ page }) => {
    await goToAuth(page);
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/mot de passe|password/i)).toBeVisible();
  });

  test('rejects invalid credentials', async ({ page }) => {
    await goToAuth(page);
    await page.getByPlaceholder(/email/i).fill('wrong@email.com');
    await page.getByPlaceholder(/mot de passe|password/i).fill('WrongPassword123');
    await page.getByRole('button', { name: /connexion|se connecter|login|sign in/i }).click();
    // Should show error, not redirect
    await expect(page.getByText(/erreur|invalid|incorrect/i)).toBeVisible({ timeout: 10_000 });
  });

  test('logs in successfully with valid credentials', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('redirects authenticated user away from /auth', async ({ page }) => {
    await login(page);
    await page.goto('/auth');
    await expect(page).not.toHaveURL(/\/auth$/);
  });
});
