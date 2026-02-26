/**
 * @module analytics/ga4
 * @description Google Analytics 4 integration via gtag.js
 */

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

let initialised = false

export function initGA4(measurementId: string) {
  if (initialised || !measurementId) return
  initialised = true

  // Load gtag.js
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', measurementId, {
    send_page_view: false, // we handle page views manually for SPA
  })
}

export function trackGA4PageView(path: string, title?: string) {
  if (!initialised) return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  })
}

export function trackGA4Event(name: string, params?: Record<string, unknown>) {
  if (!initialised) return
  window.gtag('event', name, params)
}
