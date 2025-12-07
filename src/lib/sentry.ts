import * as Sentry from '@sentry/react';

// Initialize Sentry for error monitoring
export function initSentry() {
  // Only initialize in production with valid DSN
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn || import.meta.env.DEV) {
    console.log('Sentry: Skipped initialization (dev mode or no DSN)');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    
    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Performance sampling
    tracesSampleRate: 0.1, // 10% of transactions
    
    // Session Replay sampling
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% on error
    
    // Filter out noise
    beforeSend(event, hint) {
      // Ignore ResizeObserver errors (common browser noise)
      if (event.message?.includes('ResizeObserver')) {
        return null;
      }
      
      // Ignore chunk loading errors (network issues)
      if (event.message?.includes('Loading chunk')) {
        return null;
      }
      
      return event;
    },
    
    // Additional options
    maxBreadcrumbs: 50,
    attachStacktrace: true,
    normalizeDepth: 5,
  });

  console.log('✅ Sentry initialized for error monitoring');
}

// Utility functions for manual error reporting
export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

export function clearUser() {
  Sentry.setUser(null);
}

export function addBreadcrumb(
  category: string,
  message: string,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
  });
}

// Error boundary component for React
export const SentryErrorBoundary = Sentry.ErrorBoundary;
