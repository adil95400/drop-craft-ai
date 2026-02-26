/**
 * @module analytics/config
 * @description Centralised analytics configuration.
 * All IDs are publishable / client-side safe.
 */

export interface AnalyticsConfig {
  /** Google Analytics 4 Measurement ID (G-XXXXXXXXXX) */
  ga4MeasurementId?: string
  /** Mixpanel project token */
  mixpanelToken?: string
  /** Hotjar Site ID (numeric string) */
  hotjarSiteId?: string
  /** Enable debug logging in dev */
  debug?: boolean
}

export function getAnalyticsConfig(): AnalyticsConfig {
  return {
    ga4MeasurementId: import.meta.env.VITE_GA_MEASUREMENT_ID || undefined,
    mixpanelToken: import.meta.env.VITE_MIXPANEL_TOKEN || undefined,
    hotjarSiteId: import.meta.env.VITE_HOTJAR_SITE_ID || undefined,
    debug: import.meta.env.DEV,
  }
}
