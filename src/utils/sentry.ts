/**
 * Sentry initialization & helpers.
 * Error/event logging delegates to the canonical logger in src/lib/logger.ts
 */
let Sentry: any = null;
import('@sentry/react').then(m => { Sentry = m; }).catch(() => {});
import { logger } from '@/lib/logger';

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
        if (import.meta.env.DEV) return null;

        const error = hint.originalException;
        if (error instanceof Error) {
          if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            return null;
          }
        }

        event.tags = { ...event.tags, buildTime: import.meta.env.VITE_BUILD_TIME || 'unknown' };
        return event;
      },

      beforeBreadcrumb(breadcrumb) {
        if (breadcrumb.category === 'console' && breadcrumb.level === 'log') return null;
        return breadcrumb;
      },
    });

    Sentry.setContext('app', {
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      environment: import.meta.env.MODE,
    });
  }
};

export const SentryErrorBoundary = Sentry.withErrorBoundary;

export const logError = (error: Error, context?: Record<string, unknown>) => {
  logger.error(error.message, error, context);
};

export const logEvent = (message: string, level: string = 'info', extra?: Record<string, unknown>) => {
  if (level === 'error' || level === 'fatal') {
    logger.error(message, undefined, extra);
  } else if (level === 'warning') {
    logger.warn(message, extra);
  } else {
    logger.info(message, extra);
  }
};

export const setUser = (user: { id: string; email?: string; role?: string }) => {
  logger.setUser(user.id, user.email);
};

export const clearUser = () => {
  logger.clearUser();
};
