import { useState, useEffect } from 'react'

/**
 * Hook pour debouncer une valeur
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook pour debouncer un callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)

  const debouncedCallback = (...args: Parameters<T>) => {
    if (timer) {
      clearTimeout(timer)
    }

    const newTimer = setTimeout(() => {
      callback(...args)
    }, delay)

    setTimer(newTimer)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [timer])

  return debouncedCallback
}

/**
 * Hook pour throttle une valeur
 */
export function useThrottle<T>(value: T, interval: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now())

  useEffect(() => {
    const now = Date.now()
    
    if (now - lastUpdated >= interval) {
      setThrottledValue(value)
      setLastUpdated(now)
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value)
        setLastUpdated(Date.now())
      }, interval - (now - lastUpdated))

      return () => clearTimeout(timer)
    }
  }, [value, interval, lastUpdated])

  return throttledValue
}
