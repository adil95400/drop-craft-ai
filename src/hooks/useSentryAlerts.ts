import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
let SentryRef: any = null;
import('@sentry/react').then(m => { SentryRef = m; }).catch(() => {});
import { 
  authAlerts, 
  paymentAlerts, 
  performanceAlerts, 
  trackMetric 
} from '@/utils/sentry-alerts';

/**
 * Hook for integrating Sentry alerts throughout the application
 */
export function useSentryAlerts() {
  const location = useLocation();

  // Track page load performance
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      trackMetric('page_view_duration', loadTime, 'millisecond', { route: location.pathname });
      
      // Alert if page load is slow (> 3 seconds)
      if (loadTime > 3000) {
        performanceAlerts.slowPageLoad(location.pathname, Math.round(loadTime));
      }
    };
  }, [location.pathname]);

  // Track route changes
  useEffect(() => {
    SentryRef?.addBreadcrumb?.({
      category: 'navigation',
      message: `Navigated to ${location.pathname}`,
      level: 'info',
      data: { pathname: location.pathname, search: location.search }
    });
  }, [location]);

  const onLoginSuccess = useCallback((userId: string, email: string) => {
    SentryRef?.setUser?.({ id: userId, email });
    trackMetric('login_success', 1, 'none', { method: 'email' });
  }, []);

  const onLoginFailure = useCallback((email: string, error: string) => {
    authAlerts.loginFailed(email, error);
    trackMetric('login_failure', 1, 'none');
  }, []);

  const onLogout = useCallback(() => {
    SentryRef?.setUser?.(null);
    trackMetric('logout', 1, 'none');
  }, []);

  const onSignupSuccess = useCallback((userId: string) => {
    trackMetric('signup_success', 1, 'none');
    SentryRef?.addBreadcrumb?.({
      category: 'auth',
      message: 'User signed up successfully',
      level: 'info'
    });
  }, []);

  const onSignupFailure = useCallback((reason: string) => {
    authAlerts.signupFailed(reason);
    trackMetric('signup_failure', 1, 'none');
  }, []);

  const onCheckoutStarted = useCallback((plan: string, amount: number) => {
    SentryRef?.addBreadcrumb?.({
      category: 'payment',
      message: `Checkout started for ${plan}`,
      level: 'info',
      data: { plan, amount }
    });
    trackMetric('checkout_started', 1, 'none', { plan });
  }, []);

  const onCheckoutCompleted = useCallback((userId: string, plan: string, amount: number) => {
    paymentAlerts.subscriptionCreated(userId, plan);
    trackMetric('checkout_completed', amount, 'none', { plan });
  }, []);

  const onCheckoutFailed = useCallback((userId: string, error: string) => {
    paymentAlerts.checkoutFailed(userId, error);
    trackMetric('checkout_failed', 1, 'none');
  }, []);

  const onSubscriptionCancelled = useCallback((userId: string, plan: string, reason?: string) => {
    paymentAlerts.subscriptionCancelled(userId, plan, reason);
    trackMetric('subscription_cancelled', 1, 'none', { plan });
  }, []);

  const onApiError = useCallback((endpoint: string, error: string, statusCode?: number) => {
    SentryRef?.addBreadcrumb?.({
      category: 'api',
      message: `API error: ${endpoint}`,
      level: 'error',
      data: { endpoint, error, statusCode }
    });
    
    if (statusCode && statusCode >= 500) {
      trackMetric('api_server_error', 1, 'none', { endpoint });
    } else {
      trackMetric('api_client_error', 1, 'none', { endpoint });
    }
  }, []);

  const onOrderPlaced = useCallback((orderId: string, total: number) => {
    SentryRef?.addBreadcrumb?.({
      category: 'business',
      message: `Order placed: ${orderId}`,
      level: 'info',
      data: { orderId, total }
    });
    trackMetric('order_placed', total, 'none');
  }, []);

  const onProductImported = useCallback((count: number, source: string) => {
    SentryRef?.addBreadcrumb?.({
      category: 'business',
      message: `Products imported: ${count} from ${source}`,
      level: 'info',
      data: { count, source }
    });
    trackMetric('products_imported', count, 'none', { source });
  }, []);

  return {
    // Auth events
    onLoginSuccess,
    onLoginFailure,
    onLogout,
    onSignupSuccess,
    onSignupFailure,
    
    // Payment events
    onCheckoutStarted,
    onCheckoutCompleted,
    onCheckoutFailed,
    onSubscriptionCancelled,
    
    // API events
    onApiError,
    
    // Business events
    onOrderPlaced,
    onProductImported,
  };
}

/**
 * Error boundary wrapper with Sentry integration
 */
export function withSentryErrorTracking(
  Component: React.ComponentType<Record<string, unknown>>,
  componentName: string
) {
  if (!SentryRef) return; return SentryRef.withErrorBoundary(Component, {
    beforeCapture: (scope) => {
      scope.setTag('component', componentName);
    }
  });
}
