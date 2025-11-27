import { useState, useMemo } from 'react'
import { UnifiedProduct } from './useUnifiedProducts'

export interface AuditFilters {
  noImage: boolean
  singleImage: boolean
  noDescription: boolean
  shortDescription: boolean
  shortTitle: boolean
  longTitle: boolean
  duplicateTitle: boolean
  noMetaTitle: boolean
  noMetaDescription: boolean
  noGTIN: boolean
  noSKU: boolean
  noBrand: boolean
  seoScoreMax: number
  noSalesInDays: number | null
  lowConversion: boolean
  outOfStock: boolean
  lowStock: boolean
  overstock: boolean
  missingCriticalFields: boolean
}

export const DEFAULT_AUDIT_FILTERS: AuditFilters = {
  noImage: false,
  singleImage: false,
  noDescription: false,
  shortDescription: false,
  shortTitle: false,
  longTitle: false,
  duplicateTitle: false,
  noMetaTitle: false,
  noMetaDescription: false,
  noGTIN: false,
  noSKU: false,
  noBrand: false,
  seoScoreMax: 100,
  noSalesInDays: null,
  lowConversion: false,
  outOfStock: false,
  lowStock: false,
  overstock: false,
  missingCriticalFields: false
}

export function useAuditFilters(products: UnifiedProduct[]) {
  const [filters, setFilters] = useState<AuditFilters>(DEFAULT_AUDIT_FILTERS)

  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Qualité images
    if (filters.noImage) {
      result = result.filter(p => !p.image_url && (!p.images || p.images.length === 0))
    }
    if (filters.singleImage) {
      result = result.filter(p => p.images && p.images.length === 1)
    }

    // Qualité contenu
    if (filters.noDescription) {
      result = result.filter(p => !p.description)
    }
    if (filters.shortDescription) {
      result = result.filter(p => p.description && p.description.length < 100)
    }
    if (filters.shortTitle) {
      result = result.filter(p => p.name && p.name.length < 20)
    }
    if (filters.longTitle) {
      result = result.filter(p => p.name && p.name.length > 70)
    }

    // Données produit
    if (filters.noSKU) {
      result = result.filter(p => !p.sku)
    }
    if (filters.noBrand) {
      result = result.filter(p => !p.category) // Utiliser category comme proxy pour brand
    }

    // Business
    if (filters.outOfStock) {
      result = result.filter(p => p.stock_quantity === 0)
    }
    if (filters.lowStock) {
      result = result.filter(p => p.stock_quantity > 0 && p.stock_quantity < 10)
    }

    // SEO Score
    if (filters.seoScoreMax < 100) {
      result = result.filter(p => {
        let seoScore = 0
        if (p.name && p.name.length >= 20 && p.name.length <= 70) seoScore += 40
        if (p.description && p.description.length >= 100) seoScore += 40
        if (p.sku) seoScore += 20
        return seoScore <= filters.seoScoreMax
      })
    }

    // AI Shopping
    if (filters.missingCriticalFields) {
      result = result.filter(p => 
        !p.name || !p.description || !p.category || (!p.image_url && !p.images?.length)
      )
    }

    return result
  }, [products, filters])

  const updateFilter = (updates: Partial<AuditFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }))
  }

  const resetFilters = () => {
    setFilters(DEFAULT_AUDIT_FILTERS)
  }

  const activeCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'seoScoreMax') return value < 100
      if (key === 'noSalesInDays') return value !== null
      return value === true
    }).length
  }, [filters])

  return {
    filters,
    filteredProducts,
    updateFilter,
    resetFilters,
    activeCount
  }
}
