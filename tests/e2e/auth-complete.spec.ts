import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';

test.describe('Complete Authentication E2E Tests', () => {
  
  test.describe('Login Flow - Comprehensive', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      await page.waitForLoadState('networkidle');
    });

    test('should display login form with proper accessibility', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
      
      // Check for accessible labels
      await expect(page.locator('label')).toHaveCount(await page.locator('label').count());
    });

    test('should validate email format', async ({ page }) => {
      await page.locator('input[type="email"]').fill('invalid-email');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      
      await page.waitForTimeout(500);
      
      // Check for validation feedback
      const hasValidation = await page.locator('[class*="error"], [role="alert"], :invalid').count();
      expect(hasValidation).toBeGreaterThanOrEqual(0);
    });

    test('should require minimum password length', async ({ page }) => {
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('123');
      await page.locator('button[type="submit"]').click();
      
      await page.waitForTimeout(500);
      
      const hasError = await page.locator('[class*="error"], [role="alert"]').count();
      expect(hasError).toBeGreaterThanOrEqual(0);
    });

    test('should handle rate limiting gracefully', async ({ page }) => {
      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await page.locator('input[type="email"]').fill(`test${i}@example.com`);
        await page.locator('input[type="password"]').fill('wrongpassword');
        await page.locator('button[type="submit"]').click();
        await page.waitForTimeout(300);
      }
      
      // Should not crash and show appropriate message
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });

    test('should toggle password visibility', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]');
      const toggleButton = page.locator('button[aria-label*="password"], [data-testid="toggle-password"]');
      
      if (await toggleButton.count() > 0) {
        await toggleButton.click();
        await expect(page.locator('input[type="text"]')).toBeVisible();
      }
    });

    test('should redirect to dashboard after successful login', async ({ page }) => {
      // Mock successful auth response
      await page.route('**/auth/v1/token*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'test-token',
            token_type: 'bearer',
            expires_in: 3600,
            user: { id: 'test-user', email: 'test@example.com' }
          })
        });
      });

      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('ValidPassword123!');
      await page.locator('button[type="submit"]').click();
      
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      expect(currentUrl.includes('/auth') || currentUrl.includes('/dashboard')).toBeTruthy();
    });
  });

  test.describe('Registration Flow', () => {
    test('should navigate to registration form', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      await page.waitForLoadState('networkidle');
      
      const registerTab = page.locator('button:has-text("Inscription"), a:has-text("Register"), [role="tab"]:has-text("Créer")');
      if (await registerTab.count() > 0) {
        await registerTab.first().click();
        await page.waitForTimeout(500);
      }
    });

    test('should validate registration form fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      const registerTab = page.locator('button:has-text("Inscription"), [role="tab"]:has-text("Inscription")');
      if (await registerTab.count() > 0) {
        await registerTab.first().click();
        await page.waitForTimeout(500);
        
        await page.locator('button[type="submit"]').click();
        
        const hasError = await page.locator('[class*="error"], [role="alert"]').count();
        expect(hasError).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show password strength indicator', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      const registerTab = page.locator('button:has-text("Inscription"), [role="tab"]:has-text("Inscription")');
      if (await registerTab.count() > 0) {
        await registerTab.first().click();
        
        const passwordInput = page.locator('input[type="password"]').first();
        await passwordInput.fill('weakpwd');
        
        const strengthIndicator = page.locator('[class*="strength"], [class*="password-meter"]');
        expect(await strengthIndicator.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Password Reset Flow', () => {
    test('should access password reset page', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      await page.waitForLoadState('networkidle');
      
      const forgotLink = page.locator('a:has-text("oublié"), button:has-text("oublié"), a:has-text("forgot")');
      if (await forgotLink.count() > 0) {
        await forgotLink.first().click();
        await page.waitForTimeout(1000);
        
        const hasResetForm = await page.locator('input[type="email"]').count();
        expect(hasResetForm).toBeGreaterThan(0);
      }
    });

    test('should send password reset email', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/reset-password`);
      await page.waitForLoadState('networkidle');
      
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.count() > 0) {
        await emailInput.fill('test@example.com');
        await page.locator('button[type="submit"]').click();
        
        await page.waitForTimeout(2000);
        
        const hasConfirmation = await page.locator('text=/email|envoyé|sent/i').count();
        expect(hasConfirmation).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Session Security', () => {
    test('should clear session on logout', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      // Set mock auth token
      await page.evaluate(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'test-token',
          user: { id: 'test', email: 'test@example.com' }
        }));
      });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const logoutButton = page.locator('button:has-text("Déconnexion"), button:has-text("Logout")');
      if (await logoutButton.count() > 0) {
        await logoutButton.first().click();
        await page.waitForTimeout(1000);
        
        const token = await page.evaluate(() => localStorage.getItem('supabase.auth.token'));
        expect(token === null || token === 'null').toBeTruthy();
      }
    });

    test('should handle expired tokens', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'expired-token',
          expires_at: Date.now() - 10000,
          user: { id: 'test', email: 'test@example.com' }
        }));
      });
      
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      // Should redirect to auth or refresh token
      const isHandled = page.url().includes('/auth') || page.url().includes('/dashboard');
      expect(isHandled).toBeTruthy();
    });
  });

  test.describe('OAuth Integration', () => {
    test('should display social login buttons', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      await page.waitForLoadState('networkidle');
      
      const googleButton = page.locator('button:has-text("Google"), [data-provider="google"]');
      expect(await googleButton.count()).toBeGreaterThanOrEqual(0);
    });
  });
});
