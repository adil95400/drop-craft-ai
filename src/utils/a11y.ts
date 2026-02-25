/**
 * Accessibility utilities (WCAG 2.1 AA)
 */

/**
 * Announce a message to screen readers via the live region (WCAG 4.1.3)
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const el = document.getElementById('a11y-announcer');
  if (!el) return;
  
  el.setAttribute('aria-live', priority);
  // Clear then set to ensure announcement fires even for repeated messages
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = message;
  });
}

/**
 * Check if the user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Generate a unique ID for ARIA relationships
 */
let idCounter = 0;
export function generateAriaId(prefix = 'a11y'): string {
  return `${prefix}-${++idCounter}`;
}
