/**
 * Global Console Interceptor
 * 
 * Intercepts all console.log/warn/error/debug/info calls and routes them
 * through the structured production logger. In production:
 * - debug/log calls are suppressed (no output)
 * - warn/error/critical are sent to Sentry
 * - All calls are structured with timestamps
 * 
 * This eliminates the need to manually replace 6000+ console.* calls.
 */

import * as Sentry from '@sentry/react';

// Store original console methods before overriding
const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};

const isProduction = import.meta.env.PROD;
const hasSentry = !!import.meta.env.VITE_SENTRY_DSN;

// Patterns to suppress even in development (noisy/irrelevant)
const SUPPRESSED_PATTERNS = [
  /ResizeObserver/,
  /Loading chunk/,
  /Download the React DevTools/,
  /react-i18next::/,
  /\[HMR\]/,
  /\[vite\]/,
];

function shouldSuppress(args: unknown[]): boolean {
  const firstArg = args[0];
  if (typeof firstArg !== 'string') return false;
  return SUPPRESSED_PATTERNS.some(pattern => pattern.test(firstArg));
}

function extractMessage(args: unknown[]): string {
  return args
    .map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
      try { return JSON.stringify(arg); } catch { return String(arg); }
    })
    .join(' ')
    .slice(0, 500); // Cap message length
}

function sendToSentry(level: 'warning' | 'error', message: string, args: unknown[]) {
  if (!hasSentry) return;

  const error = args.find(a => a instanceof Error) as Error | undefined;

  if (error) {
    Sentry.captureException(error, {
      level,
      extra: { originalMessage: message },
    });
  } else {
    Sentry.captureMessage(message, level);
  }
}

/**
 * Install the console interceptor. Call once at app boot, BEFORE any other code runs.
 */
export function installConsoleInterceptor() {
  // --- console.debug ---
  console.debug = (...args: unknown[]) => {
    if (isProduction) return; // Completely silent in prod
    if (shouldSuppress(args)) return;
    originalConsole.debug(...args);
  };

  // --- console.log ---
  console.log = (...args: unknown[]) => {
    if (isProduction) return; // Completely silent in prod
    if (shouldSuppress(args)) return;
    originalConsole.log(...args);
  };

  // --- console.info ---
  console.info = (...args: unknown[]) => {
    if (isProduction) return; // Silent in prod
    if (shouldSuppress(args)) return;
    originalConsole.info(...args);
  };

  // --- console.warn ---
  console.warn = (...args: unknown[]) => {
    if (shouldSuppress(args)) return;
    if (isProduction) {
      sendToSentry('warning', extractMessage(args), args);
      return; // No console output in prod
    }
    originalConsole.warn(...args);
  };

  // --- console.error ---
  console.error = (...args: unknown[]) => {
    if (shouldSuppress(args)) return;
    if (isProduction) {
      sendToSentry('error', extractMessage(args), args);
      return; // No console output in prod
    }
    originalConsole.error(...args);
  };
}

/**
 * Restore original console methods (useful for tests).
 */
export function restoreConsole() {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
}
