/**
 * Tests critiques — Vérification du rendu de l'application
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
  },
}));

// Mock Sentry
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  withErrorBoundary: (Component: any) => Component,
  ErrorBoundary: ({ children }: any) => children,
  withScope: vi.fn(),
  captureException: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
  startSpan: vi.fn((_, cb) => cb?.({})),
  browserTracingIntegration: vi.fn(),
  replayIntegration: vi.fn(),
  feedbackIntegration: vi.fn(),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: any) => children,
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

describe('Application Core', () => {
  it('should export a valid App component', async () => {
    const module = await import('@/App');
    expect(module.default).toBeDefined();
    expect(typeof module.default).toBe('function');
  });

  it('should have ErrorBoundary component available', async () => {
    const { ErrorBoundary } = await import('@/components/common/ErrorBoundary');
    expect(ErrorBoundary).toBeDefined();
  });

  it('should have OptimizedErrorBoundary with HOC', async () => {
    const { OptimizedErrorBoundary, withErrorBoundary } = await import('@/components/common/OptimizedErrorBoundary');
    expect(OptimizedErrorBoundary).toBeDefined();
    expect(withErrorBoundary).toBeDefined();
  });
});

describe('Route Configuration', () => {
  it('should have CoreRoutes defined', async () => {
    const { CoreRoutes } = await import('@/routes/CoreRoutes');
    expect(CoreRoutes).toBeDefined();
  });

  it('should have all critical routes registered', async () => {
    // Import the module registry to validate routes exist
    const { MODULE_REGISTRY } = await import('@/config/modules');
    expect(MODULE_REGISTRY).toBeDefined();
    
    // Verify critical dashboard modules exist
    const criticalPaths = ['billing', 'subscription', 'profile', 'products', 'analytics'];
    criticalPaths.forEach(path => {
      const hasModule = Object.values(MODULE_REGISTRY).some(
        (mod: any) => mod.path?.includes(path) || mod.id?.includes(path)
      );
      expect(hasModule, `Missing critical route: ${path}`).toBe(true);
    });
  });
});
