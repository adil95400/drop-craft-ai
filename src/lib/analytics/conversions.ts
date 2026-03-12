/**
 * @module analytics/conversions
 * @description GA4 conversion events for business-critical actions.
 * Mark these as conversions in GA4 Admin > Events > Mark as conversion.
 * 
 * Convention: all conversion event names use snake_case per GA4 standard.
 */

import { trackEvent } from '@/lib/analytics'

// ─── Conversion event names (register these in GA4 as conversions) ───
export const CONVERSION_EVENTS = {
  // Auth
  SIGN_UP: 'sign_up',
  LOGIN: 'login',

  // Activation
  FIRST_PRODUCT_ADDED: 'first_product_added',
  FIRST_IMPORT_COMPLETED: 'first_import_completed',
  FIRST_ORDER_RECEIVED: 'first_order_received',
  FIRST_INTEGRATION_CONNECTED: 'first_integration_connected',

  // Revenue
  PLAN_UPGRADED: 'plan_upgraded',
  CHECKOUT_STARTED: 'begin_checkout',
  PURCHASE_COMPLETED: 'purchase',

  // Engagement
  AI_FEATURE_USED: 'ai_feature_used',
  PRODUCT_PUBLISHED: 'product_published',
  BULK_IMPORT_COMPLETED: 'bulk_import_completed',
} as const

// ─── Typed tracking helpers ─────────────────────────────────────

export function trackSignUp(method: 'email' | 'google' = 'email') {
  trackEvent(CONVERSION_EVENTS.SIGN_UP, { method })
}

export function trackLogin(method: 'email' | 'google' = 'email') {
  trackEvent(CONVERSION_EVENTS.LOGIN, { method })
}

export function trackFirstProductAdded(productId: string) {
  trackEvent(CONVERSION_EVENTS.FIRST_PRODUCT_ADDED, { product_id: productId })
}

export function trackImportCompleted(source: string, count: number) {
  trackEvent(CONVERSION_EVENTS.FIRST_IMPORT_COMPLETED, {
    import_source: source,
    items_count: count,
  })
}

export function trackBulkImportCompleted(source: string, count: number) {
  trackEvent(CONVERSION_EVENTS.BULK_IMPORT_COMPLETED, {
    import_source: source,
    items_count: count,
  })
}

export function trackFirstOrderReceived(orderId: string, value: number, currency = 'EUR') {
  trackEvent(CONVERSION_EVENTS.FIRST_ORDER_RECEIVED, {
    order_id: orderId,
    value,
    currency,
  })
}

export function trackIntegrationConnected(platform: string) {
  trackEvent(CONVERSION_EVENTS.FIRST_INTEGRATION_CONNECTED, { platform })
}

export function trackPlanUpgraded(fromPlan: string, toPlan: string, value: number, currency = 'EUR') {
  trackEvent(CONVERSION_EVENTS.PLAN_UPGRADED, {
    from_plan: fromPlan,
    to_plan: toPlan,
    value,
    currency,
  })
}

export function trackCheckoutStarted(plan: string, value: number, currency = 'EUR') {
  trackEvent(CONVERSION_EVENTS.CHECKOUT_STARTED, {
    plan,
    value,
    currency,
  })
}

export function trackPurchaseCompleted(transactionId: string, value: number, plan: string, currency = 'EUR') {
  trackEvent(CONVERSION_EVENTS.PURCHASE_COMPLETED, {
    transaction_id: transactionId,
    value,
    currency,
    items: [{ item_name: plan, price: value }],
  })
}

export function trackAIFeatureUsed(feature: string) {
  trackEvent(CONVERSION_EVENTS.AI_FEATURE_USED, { feature })
}

export function trackProductPublished(productId: string, platform: string) {
  trackEvent(CONVERSION_EVENTS.PRODUCT_PUBLISHED, {
    product_id: productId,
    platform,
  })
}
