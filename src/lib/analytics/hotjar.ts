/**
 * @module analytics/hotjar
 * @description Hotjar heatmaps & session recording integration.
 */

declare global {
  interface Window {
    hj: (...args: unknown[]) => void
    _hjSettings: { hjid: number; hjsv: number }
  }
}

let initialised = false

export function initHotjar(siteId: string) {
  if (initialised || !siteId) return
  initialised = true

  const hjid = parseInt(siteId, 10)
  if (isNaN(hjid)) return

  // Official Hotjar snippet
  window.hj = window.hj || function () {
    // eslint-disable-next-line prefer-rest-params
    (window.hj as any).q = (window.hj as any).q || []
    ;(window.hj as any).q.push(arguments)
  }
  window._hjSettings = { hjid, hjsv: 6 }

  const script = document.createElement('script')
  script.async = true
  script.src = `https://static.hotjar.com/c/hotjar-${hjid}.js?sv=6`
  document.head.appendChild(script)
}

/** Trigger a Hotjar virtual pageview (for SPA navigation) */
export function trackHotjarPageView(path: string) {
  if (!initialised) return
  window.hj?.('stateChange', path)
}

/** Trigger a Hotjar event tag */
export function trackHotjarEvent(eventName: string) {
  if (!initialised) return
  window.hj?.('event', eventName)
}

/** Identify user in Hotjar */
export function identifyHotjarUser(userId: string, attrs?: Record<string, string | number | boolean>) {
  if (!initialised) return
  window.hj?.('identify', userId, attrs || {})
}
