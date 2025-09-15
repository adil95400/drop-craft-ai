// OPTIMISATIONS PERFORMANCE POUR ÉVITER LES TIMEOUTS
// Lazy loading et optimisations TypeScript

import { lazy, ComponentType } from 'react'

// Helper pour créer des composants lazy avec fallback
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  return lazy(importFn)
}

// Lazy loading des composants lourds (commentés pour éviter les erreurs)
export const lazyComponents = {
  // Les composants seront chargés dynamiquement quand nécessaire
  // Dashboard: lazy(() => import('@/pages/Dashboard')),
  // Products: lazy(() => import('@/pages/Products')),
} as const

// Optimisation des re-renders
export const memoizedComponents = {
  // Evite les re-renders inutiles
  areEqual: <T extends Record<string, any>>(prevProps: T, nextProps: T): boolean => {
    const keys = Object.keys(prevProps)
    if (keys.length !== Object.keys(nextProps).length) return false
    
    return keys.every(key => prevProps[key] === nextProps[key])
  },
  
  // Comparaison shallow pour les props complexes
  shallowEqual: <T extends Record<string, any>>(obj1: T, obj2: T): boolean => {
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    
    if (keys1.length !== keys2.length) return false
    
    for (let key of keys1) {
      if (obj1[key] !== obj2[key]) return false
    }
    
    return true
  }
}

// Cache pour éviter les recalculs
export class PerformanceCache {
  private static cache = new Map<string, any>()
  private static maxSize = 100
  
  static get<T>(key: string): T | undefined {
    return this.cache.get(key)
  }
  
  static set<T>(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }
  
  static clear(): void {
    this.cache.clear()
  }
  
  static has(key: string): boolean {
    return this.cache.has(key)
  }
}

// Debounce pour les recherches
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle pour les événements fréquents
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}