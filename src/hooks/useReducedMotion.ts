/**
 * useReducedMotion - Hook for detecting user's reduced motion preference
 * Supports prefers-reduced-motion media query with SSR compatibility
 */
import { useState, useEffect } from 'react'

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check if window is available (SSR compatibility)
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches)

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    
    // Legacy browsers
    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  return prefersReducedMotion
}

// Utility function for conditional motion props
export function getMotionProps(
  prefersReducedMotion: boolean,
  motionProps: Record<string, any>
): Record<string, any> {
  if (prefersReducedMotion) {
    return {
      initial: false,
      animate: false,
      exit: false,
      whileHover: undefined,
      whileTap: undefined,
      transition: { duration: 0 },
    }
  }
  return motionProps
}
