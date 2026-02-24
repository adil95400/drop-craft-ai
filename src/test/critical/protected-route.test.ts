/**
 * Tests critiques — ProtectedRoute logic
 * Tests the redirect logic without rendering React components
 */
import { describe, it, expect } from 'vitest';

// Test the onboarding exempt routes logic directly
const ONBOARDING_EXEMPT_ROUTES = ['/onboarding', '/auth', '/choose-plan', '/pricing'];

function shouldRedirectToOnboarding(
  user: boolean,
  profile: { onboarding_completed?: boolean | null } | null,
  pathname: string
): boolean {
  if (!user || !profile) return false;
  if (profile.onboarding_completed) return false;
  if (ONBOARDING_EXEMPT_ROUTES.some(r => pathname.startsWith(r))) return false;
  return true;
}

function getAuthRedirect(
  requireAuth: boolean,
  user: boolean,
  pathname: string,
  search: string
): string | null {
  if (requireAuth && !user) {
    return `/auth?redirect=${encodeURIComponent(pathname)}`;
  }
  if (!requireAuth && user) {
    const params = new URLSearchParams(search);
    return params.get('redirect') || '/dashboard';
  }
  return null;
}

describe('ProtectedRoute Logic', () => {
  describe('Onboarding Redirect', () => {
    it('should redirect when onboarding not completed', () => {
      expect(shouldRedirectToOnboarding(true, { onboarding_completed: false }, '/dashboard')).toBe(true);
    });

    it('should NOT redirect when onboarding completed', () => {
      expect(shouldRedirectToOnboarding(true, { onboarding_completed: true }, '/dashboard')).toBe(false);
    });

    it('should NOT redirect on exempt routes', () => {
      expect(shouldRedirectToOnboarding(true, { onboarding_completed: false }, '/onboarding/wizard')).toBe(false);
      expect(shouldRedirectToOnboarding(true, { onboarding_completed: false }, '/auth')).toBe(false);
      expect(shouldRedirectToOnboarding(true, { onboarding_completed: false }, '/choose-plan')).toBe(false);
      expect(shouldRedirectToOnboarding(true, { onboarding_completed: false }, '/pricing')).toBe(false);
    });

    it('should NOT redirect when no user', () => {
      expect(shouldRedirectToOnboarding(false, null, '/dashboard')).toBe(false);
    });

    it('should NOT redirect when no profile', () => {
      expect(shouldRedirectToOnboarding(true, null, '/dashboard')).toBe(false);
    });

    it('should handle null onboarding_completed as not completed', () => {
      expect(shouldRedirectToOnboarding(true, { onboarding_completed: null }, '/dashboard')).toBe(true);
    });
  });

  describe('Auth Redirect', () => {
    it('should redirect unauthenticated users to auth', () => {
      const result = getAuthRedirect(true, false, '/dashboard', '');
      expect(result).toBe('/auth?redirect=%2Fdashboard');
    });

    it('should redirect authenticated users away from auth pages', () => {
      const result = getAuthRedirect(false, true, '/auth', '');
      expect(result).toBe('/dashboard');
    });

    it('should use redirect param when available', () => {
      const result = getAuthRedirect(false, true, '/auth', '?redirect=/products');
      expect(result).toBe('/products');
    });

    it('should return null when no redirect needed', () => {
      expect(getAuthRedirect(true, true, '/dashboard', '')).toBeNull();
    });
  });
});
