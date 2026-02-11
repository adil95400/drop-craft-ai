import { Page, expect } from '@playwright/test';

/** Test user credentials — use dedicated QA accounts */
export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'qa@shopopti-test.com',
  password: process.env.TEST_USER_PASSWORD || 'Test1234!@#',
  name: 'QA Tester',
};

export const NEW_USER = {
  email: `qa+${Date.now()}@shopopti-test.com`,
  password: 'NewUser1234!@#',
  name: 'New QA User',
};

/** Navigate to auth page and wait for load */
export async function goToAuth(page: Page) {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');
}

/** Login with existing credentials */
export async function login(page: Page, email?: string, password?: string) {
  await goToAuth(page);
  await page.getByPlaceholder(/email/i).fill(email || TEST_USER.email);
  await page.getByPlaceholder(/mot de passe|password/i).fill(password || TEST_USER.password);
  await page.getByRole('button', { name: /connexion|se connecter|login|sign in/i }).click();
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 15_000 });
}

/** Assert user is on dashboard after auth */
export async function assertLoggedIn(page: Page) {
  await expect(page).toHaveURL(/dashboard/);
}

/** Logout */
export async function logout(page: Page) {
  // Try common logout patterns
  const userMenu = page.getByRole('button', { name: /profil|account|user/i }).first();
  if (await userMenu.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await userMenu.click();
    await page.getByRole('menuitem', { name: /déconnexion|logout|sign out/i }).click();
  }
  await page.waitForURL('**/auth**', { timeout: 10_000 });
}
