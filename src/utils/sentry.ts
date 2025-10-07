import * as Sentry from "@sentry/react";

// Initialize Sentry with advanced configuration
export const initSentry = () => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0,
      replaysOnErrorSampleRate: import.meta.env.PROD ? 1.0 : 0,
      
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      beforeSend(event, hint) {
        // Filter out development errors
        if (import.meta.env.DEV) {
          console.warn('Sentry event (dev mode):', event, hint);
          return null;
        }

        // Filter out certain error types
        const error = hint.originalException;
        if (error instanceof Error) {
          // Ignore network errors that are user-caused
          if (error.message.includes('NetworkError') || 
              error.message.includes('Failed to fetch')) {
            return null;
          }
        }

        // Add custom tags
        event.tags = {
          ...event.tags,
          buildTime: import.meta.env.VITE_BUILD_TIME || 'unknown',
        };

        return event;
      },

      beforeBreadcrumb(breadcrumb) {
        // Filter out noisy breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
          return null;
        }
        return breadcrumb;
      },
    });

    // Set initial context
    Sentry.setContext('app', {
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      environment: import.meta.env.MODE,
    });
  }
};

// Custom error boundary with Sentry integration
export const SentryErrorBoundary = Sentry.withErrorBoundary;

// Log custom errors
export const logError = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
      tags: {
        section: context?.section || 'unknown'
      }
    });
  } else {
    console.error('Error:', error, context);
  }
};

// Log custom events
export const logEvent = (message: string, level: Sentry.SeverityLevel = 'info', extra?: Record<string, any>) => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level.toUpperCase()}]`, message, extra);
  }
};

// User identification
export const setUser = (user: { id: string; email?: string; role?: string }) => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }
};

// Clear user on logout
export const clearUser = () => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(null);
  }
};