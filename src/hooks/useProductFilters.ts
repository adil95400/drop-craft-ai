import { useState, useMemo } from 'react'
import { UnifiedProduct } from './useUnifiedProducts'

export interface FilterState {
  search: string
  category: string
  status: 'all' | 'active' | 'inactive'
  priceRange: [number, number]
  sortBy: 'name' | 'price' | 'created_at' | 'stock_quantity'
  sortOrder: 'asc' | 'desc'
  source: 'all' | 'products' | 'imported' | 'premium' | 'catalog' | 'shopify' | 'published' | 'feed' | 'supplier'
  lowStock: boolean
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  category: 'all',
  status: 'all',
  priceRange: [0, 10000],
  sortBy: 'created_at',
  sortOrder: 'desc',
  source: 'all',
  lowStock: false
}

export function useProductFilters(products: UnifiedProduct[]) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)

  // Catégories uniques
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [products])

  // Produits filtrés et triés
  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    // Recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        p.category?.toLowerCase().includes(searchLower)
      )
    }

    // Catégorie
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(p => p.category === filters.category)
    }

    // Statut
    if (filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status)
    }

    // Source
    if (filters.source !== 'all') {
      filtered = filtered.filter(p => p.source === filters.source)
    }

    // Prix
    filtered = filtered.filter(p =>
      p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    )

    // Stock faible
    if (filters.lowStock) {
      filtered = filtered.filter(p => (p.stock_quantity || 0) < 10)
    }

    // Tri
    filtered.sort((a, b) => {
      let aVal: any = a[filters.sortBy]
      let bVal: any = b[filters.sortBy]

      // Gestion des valeurs undefined
      if (aVal === undefined) aVal = filters.sortOrder === 'asc' ? Infinity : -Infinity
      if (bVal === undefined) bVal = filters.sortOrder === 'asc' ? Infinity : -Infinity

      if (typeof aVal === 'string') {
        return filters.sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      return filters.sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    return filtered
  }, [products, filters])

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  const hasActiveFilters = useMemo(() => {
    return JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)
  }, [filters])

  return {
    filters,
    filteredProducts,
    categories,
    updateFilter,
    resetFilters,
    hasActiveFilters
  }
}
