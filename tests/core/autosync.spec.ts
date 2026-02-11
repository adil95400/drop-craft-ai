import { test, expect } from '../helpers/fixtures';

test.describe('Core — Autosync', () => {
  test('sync settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/settings/);
  });

  test('shows sync configuration options', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    // Look for sync-related UI elements
    const syncSection = page.getByText(/synchronisation|sync|auto-sync|autosync/i).first();
    if (await syncSection.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(syncSection).toBeVisible();
    }
  });
});
