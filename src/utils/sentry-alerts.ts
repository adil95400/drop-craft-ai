import * as Sentry from "@sentry/react";

// Alert severity levels
export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

// Alert categories for better organization
export type AlertCategory = 
  | 'authentication'
  | 'payment'
  | 'api'
  | 'database'
  | 'performance'
  | 'security'
  | 'business'
  | 'integration';

interface AlertConfig {
  level: AlertLevel;
  category: AlertCategory;
  message: string;
  context?: Record<string, any>;
  fingerprint?: string[];
  tags?: Record<string, string>;
  notify?: boolean;
}

// Map alert levels to Sentry severity
const levelToSeverity: Record<AlertLevel, Sentry.SeverityLevel> = {
  info: 'info',
  warning: 'warning',
  error: 'error',
  critical: 'fatal'
};

/**
 * Send an alert to Sentry with enhanced context and categorization
 */
export const sendAlert = (config: AlertConfig) => {
  const { level, category, message, context = {}, fingerprint, tags = {}, notify = true } = config;

  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn(`[ALERT:${level.toUpperCase()}] ${category}: ${message}`, context);
    return;
  }

  Sentry.withScope((scope) => {
    // Set severity
    scope.setLevel(levelToSeverity[level]);
    
    // Set category as tag
    scope.setTag('alert_category', category);
    scope.setTag('alert_level', level);
    scope.setTag('notify', String(notify));
    
    // Add custom tags
    Object.entries(tags).forEach(([key, value]) => {
      scope.setTag(key, value);
    });
    
    // Add context
    scope.setContext('alert_details', {
      category,
      level,
      timestamp: new Date().toISOString(),
      ...context
    });
    
    // Set fingerprint for grouping if provided
    if (fingerprint) {
      scope.setFingerprint(fingerprint);
    }
    
    // Capture the alert
    Sentry.captureMessage(`[${category.toUpperCase()}] ${message}`, levelToSeverity[level]);
  });
};

// ============ Pre-configured Alert Functions ============

/**
 * Authentication alerts
 */
export const authAlerts = {
  loginFailed: (email: string, reason?: string) => sendAlert({
    level: 'warning',
    category: 'authentication',
    message: `Login failed for user`,
    context: { email: email.substring(0, 3) + '***', reason },
    fingerprint: ['auth', 'login', 'failed'],
    tags: { action: 'login' }
  }),

  signupFailed: (reason: string) => sendAlert({
    level: 'warning',
    category: 'authentication',
    message: `Signup failed: ${reason}`,
    fingerprint: ['auth', 'signup', 'failed'],
    tags: { action: 'signup' }
  }),

  sessionExpired: (userId: string) => sendAlert({
    level: 'info',
    category: 'authentication',
    message: 'User session expired',
    context: { userId: userId.substring(0, 8) },
    fingerprint: ['auth', 'session', 'expired'],
    tags: { action: 'session' }
  }),

  mfaFailed: (userId: string) => sendAlert({
    level: 'warning',
    category: 'authentication',
    message: 'MFA verification failed',
    context: { userId: userId.substring(0, 8) },
    fingerprint: ['auth', 'mfa', 'failed'],
    tags: { action: 'mfa' }
  }),

  suspiciousActivity: (userId: string, details: Record<string, any>) => sendAlert({
    level: 'critical',
    category: 'authentication',
    message: 'Suspicious authentication activity detected',
    context: { userId: userId.substring(0, 8), ...details },
    fingerprint: ['auth', 'security', 'suspicious'],
    tags: { action: 'security' },
    notify: true
  })
};

/**
 * Payment alerts
 */
export const paymentAlerts = {
  checkoutFailed: (userId: string, error: string) => sendAlert({
    level: 'error',
    category: 'payment',
    message: `Checkout failed: ${error}`,
    context: { userId: userId.substring(0, 8), error },
    fingerprint: ['payment', 'checkout', 'failed'],
    tags: { action: 'checkout' },
    notify: true
  }),

  subscriptionCreated: (userId: string, plan: string) => sendAlert({
    level: 'info',
    category: 'payment',
    message: `New subscription created: ${plan}`,
    context: { userId: userId.substring(0, 8), plan },
    fingerprint: ['payment', 'subscription', 'created'],
    tags: { action: 'subscription', plan }
  }),

  subscriptionCancelled: (userId: string, plan: string, reason?: string) => sendAlert({
    level: 'warning',
    category: 'payment',
    message: `Subscription cancelled: ${plan}`,
    context: { userId: userId.substring(0, 8), plan, reason },
    fingerprint: ['payment', 'subscription', 'cancelled'],
    tags: { action: 'cancellation', plan }
  }),

  paymentFailed: (userId: string, amount: number, error: string) => sendAlert({
    level: 'error',
    category: 'payment',
    message: `Payment failed: ${error}`,
    context: { userId: userId.substring(0, 8), amount, error },
    fingerprint: ['payment', 'transaction', 'failed'],
    tags: { action: 'payment' },
    notify: true
  }),

  refundProcessed: (userId: string, amount: number) => sendAlert({
    level: 'info',
    category: 'payment',
    message: `Refund processed: ${amount}€`,
    context: { userId: userId.substring(0, 8), amount },
    fingerprint: ['payment', 'refund', 'processed'],
    tags: { action: 'refund' }
  }),

  chargebackReceived: (userId: string, amount: number) => sendAlert({
    level: 'critical',
    category: 'payment',
    message: `Chargeback received: ${amount}€`,
    context: { userId: userId.substring(0, 8), amount },
    fingerprint: ['payment', 'chargeback', 'received'],
    tags: { action: 'chargeback' },
    notify: true
  })
};

/**
 * API alerts
 */
export const apiAlerts = {
  rateLimit: (endpoint: string, userId?: string) => sendAlert({
    level: 'warning',
    category: 'api',
    message: `Rate limit reached: ${endpoint}`,
    context: { endpoint, userId: userId?.substring(0, 8) },
    fingerprint: ['api', 'rate-limit', endpoint],
    tags: { endpoint }
  }),

  externalApiError: (service: string, error: string, statusCode?: number) => sendAlert({
    level: 'error',
    category: 'api',
    message: `External API error: ${service}`,
    context: { service, error, statusCode },
    fingerprint: ['api', 'external', service],
    tags: { service, statusCode: String(statusCode) },
    notify: true
  }),

  integrationFailure: (integration: string, error: string) => sendAlert({
    level: 'error',
    category: 'integration',
    message: `Integration failure: ${integration}`,
    context: { integration, error },
    fingerprint: ['integration', 'failure', integration],
    tags: { integration },
    notify: true
  })
};

/**
 * Database alerts
 */
export const dbAlerts = {
  queryTimeout: (query: string, duration: number) => sendAlert({
    level: 'warning',
    category: 'database',
    message: `Query timeout: ${duration}ms`,
    context: { query: query.substring(0, 100), duration },
    fingerprint: ['database', 'timeout'],
    tags: { type: 'timeout' }
  }),

  connectionError: (error: string) => sendAlert({
    level: 'critical',
    category: 'database',
    message: `Database connection error`,
    context: { error },
    fingerprint: ['database', 'connection', 'error'],
    tags: { type: 'connection' },
    notify: true
  }),

  rlsViolation: (table: string, userId?: string) => sendAlert({
    level: 'error',
    category: 'security',
    message: `RLS policy violation on ${table}`,
    context: { table, userId: userId?.substring(0, 8) },
    fingerprint: ['database', 'rls', table],
    tags: { table, type: 'rls' },
    notify: true
  })
};

/**
 * Performance alerts
 */
export const performanceAlerts = {
  slowPageLoad: (route: string, duration: number) => sendAlert({
    level: 'warning',
    category: 'performance',
    message: `Slow page load: ${route} (${duration}ms)`,
    context: { route, duration },
    fingerprint: ['performance', 'slow-load', route],
    tags: { route, type: 'page-load' }
  }),

  highMemoryUsage: (usage: number) => sendAlert({
    level: 'warning',
    category: 'performance',
    message: `High memory usage: ${usage}MB`,
    context: { memoryMB: usage },
    fingerprint: ['performance', 'memory'],
    tags: { type: 'memory' }
  }),

  longTransaction: (name: string, duration: number) => sendAlert({
    level: 'warning',
    category: 'performance',
    message: `Long transaction: ${name} (${duration}ms)`,
    context: { transaction: name, duration },
    fingerprint: ['performance', 'transaction', name],
    tags: { transaction: name }
  })
};

/**
 * Business alerts
 */
export const businessAlerts = {
  lowStock: (productId: string, productName: string, quantity: number) => sendAlert({
    level: 'warning',
    category: 'business',
    message: `Low stock alert: ${productName}`,
    context: { productId, productName, quantity },
    fingerprint: ['business', 'stock', 'low'],
    tags: { type: 'stock' }
  }),

  orderFailed: (orderId: string, reason: string) => sendAlert({
    level: 'error',
    category: 'business',
    message: `Order processing failed: ${orderId}`,
    context: { orderId, reason },
    fingerprint: ['business', 'order', 'failed'],
    tags: { type: 'order' },
    notify: true
  }),

  highReturnRate: (productId: string, rate: number) => sendAlert({
    level: 'warning',
    category: 'business',
    message: `High return rate detected: ${rate}%`,
    context: { productId, returnRate: rate },
    fingerprint: ['business', 'returns', 'high-rate'],
    tags: { type: 'returns' }
  }),

  supplierIssue: (supplierId: string, issue: string) => sendAlert({
    level: 'warning',
    category: 'business',
    message: `Supplier issue: ${issue}`,
    context: { supplierId, issue },
    fingerprint: ['business', 'supplier', 'issue'],
    tags: { type: 'supplier' }
  })
};

/**
 * Security alerts
 */
export const securityAlerts = {
  bruteForceDetected: (ip: string, attempts: number) => sendAlert({
    level: 'critical',
    category: 'security',
    message: `Brute force attack detected`,
    context: { ip: ip.substring(0, 8) + '***', attempts },
    fingerprint: ['security', 'brute-force'],
    tags: { type: 'brute-force' },
    notify: true
  }),

  dataExportRequested: (userId: string) => sendAlert({
    level: 'info',
    category: 'security',
    message: `GDPR data export requested`,
    context: { userId: userId.substring(0, 8) },
    fingerprint: ['security', 'gdpr', 'export'],
    tags: { type: 'gdpr' }
  }),

  adminAction: (adminId: string, action: string, target?: string) => sendAlert({
    level: 'info',
    category: 'security',
    message: `Admin action: ${action}`,
    context: { adminId: adminId.substring(0, 8), action, target },
    fingerprint: ['security', 'admin', action],
    tags: { type: 'admin', action }
  }),

  apiKeyCompromised: (keyPrefix: string) => sendAlert({
    level: 'critical',
    category: 'security',
    message: `API key potentially compromised`,
    context: { keyPrefix },
    fingerprint: ['security', 'api-key', 'compromised'],
    tags: { type: 'api-key' },
    notify: true
  })
};

/**
 * Track custom metrics for alerting thresholds
 */
export const trackMetric = (name: string, value: number, unit: string = '', tags: Record<string, string> = {}) => {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.log(`[METRIC] ${name}: ${value}${unit}`, tags);
    return;
  }

  // Log as breadcrumb for context
  Sentry.addBreadcrumb({
    category: 'metric',
    message: `${name}: ${value}${unit}`,
    level: 'info',
    data: { value, unit, ...tags }
  });
};

/**
 * Start a performance transaction for monitoring
 */
export const startTransaction = (name: string, operation: string) => {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    const start = performance.now();
    return {
      finish: () => {
        const duration = performance.now() - start;
        console.log(`[TRANSACTION] ${name} (${operation}): ${duration.toFixed(2)}ms`);
      },
      setTag: (key: string, value: string) => {
        console.log(`[TRANSACTION TAG] ${key}: ${value}`);
      }
    };
  }

  return Sentry.startInactiveSpan({ name, op: operation });
};
