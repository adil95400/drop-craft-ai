/**
 * @module analytics
 * @description Unified analytics facade – GA4, Mixpanel & Hotjar.
 * Import `analytics` and call methods; they fan-out to all configured providers.
 */

import { getAnalyticsConfig } from './config'
import { initGA4, trackGA4PageView, trackGA4Event } from './ga4'
import { initMixpanel, trackMixpanelPageView, trackMixpanelEvent, identifyMixpanelUser, resetMixpanel } from './mixpanel'
import { initHotjar, trackHotjarPageView, trackHotjarEvent, identifyHotjarUser } from './hotjar'

let debug = false

function log(...args: unknown[]) {
  if (debug) console.debug('[analytics]', ...args)
}

/** Call once at app boot */
export function initAnalytics() {
  const cfg = getAnalyticsConfig()
  debug = !!cfg.debug

  if (cfg.ga4MeasurementId) {
    initGA4(cfg.ga4MeasurementId)
    log('GA4 initialised', cfg.ga4MeasurementId)
  }
  if (cfg.mixpanelToken) {
    initMixpanel(cfg.mixpanelToken)
    log('Mixpanel initialised')
  }
  if (cfg.hotjarSiteId) {
    initHotjar(cfg.hotjarSiteId)
    log('Hotjar initialised', cfg.hotjarSiteId)
  }

  if (!cfg.ga4MeasurementId && !cfg.mixpanelToken && !cfg.hotjarSiteId) {
    log('No analytics provider configured. Set VITE_GA_MEASUREMENT_ID, VITE_MIXPANEL_TOKEN, or VITE_HOTJAR_SITE_ID.')
  }
}

/** Track a virtual page view across all providers */
export function trackPageView(path: string, title?: string) {
  log('pageview', path)
  trackGA4PageView(path, title)
  trackMixpanelPageView(path)
  trackHotjarPageView(path)
}

/** Track a custom event across GA4 + Mixpanel + Hotjar */
export function trackEvent(name: string, properties?: Record<string, unknown>) {
  log('event', name, properties)
  trackGA4Event(name, properties)
  trackMixpanelEvent(name, properties)
  trackHotjarEvent(name)
}

/** Identify the current user across Mixpanel + Hotjar */
export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  log('identify', userId, traits)
  identifyMixpanelUser(userId, traits)
  identifyHotjarUser(userId, traits as Record<string, string | number | boolean>)
}

/** Reset user identity on logout */
export function resetAnalyticsUser() {
  log('reset')
  resetMixpanel()
}

export type { AnalyticsConfig } from './config'
