import * as Sentry from "@sentry/react";

// Initialize Sentry
export const initSentry = () => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      
      beforeSend(event) {
        // Filter out development errors
        if (import.meta.env.DEV) {
          return null;
        }
        return event;
      },
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