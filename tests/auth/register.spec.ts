import { test, expect } from '@playwright/test';
import { goToAuth, NEW_USER } from '../helpers/auth.helper';

test.describe('Auth — Register', () => {
  test('shows registration form', async ({ page }) => {
    await goToAuth(page);
    // Switch to register tab/mode
    const registerTab = page.getByRole('tab', { name: /inscription|register|sign up/i });
    if (await registerTab.isVisible().catch(() => false)) {
      await registerTab.click();
    } else {
      const registerLink = page.getByText(/créer un compte|s'inscrire|sign up/i);
      if (await registerLink.isVisible().catch(() => false)) {
        await registerLink.click();
      }
    }
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  });

  test('validates email format', async ({ page }) => {
    await goToAuth(page);
    const registerTab = page.getByRole('tab', { name: /inscription|register|sign up/i });
    if (await registerTab.isVisible().catch(() => false)) await registerTab.click();

    await page.getByPlaceholder(/email/i).fill('not-an-email');
    await page.getByPlaceholder(/mot de passe|password/i).first().fill(NEW_USER.password);
    await page.getByRole('button', { name: /inscription|s'inscrire|sign up|créer/i }).click();

    // Should not navigate away
    await expect(page).toHaveURL(/auth/);
  });

  test('validates password strength', async ({ page }) => {
    await goToAuth(page);
    const registerTab = page.getByRole('tab', { name: /inscription|register|sign up/i });
    if (await registerTab.isVisible().catch(() => false)) await registerTab.click();

    await page.getByPlaceholder(/email/i).fill(NEW_USER.email);
    await page.getByPlaceholder(/mot de passe|password/i).first().fill('123');
    await page.getByRole('button', { name: /inscription|s'inscrire|sign up|créer/i }).click();

    await expect(page).toHaveURL(/auth/);
  });
});
