/**
 * Types for catalog and product management
 * Re-exports from commerce domain for backward compatibility
 */
export type {
  Product as CatalogProduct,
  ProductVariant,
  ProductImage,
  ProductTag,
  ProductCollection,
  ProductCost,
  ProductPrice,
  ProductSEO,
  InventoryLevel,
  InventoryLocation,
  CommerceFilters as ProductFilter,
  CommerceStats as CatalogStats,
} from '@/domains/commerce/types'

export interface ProductSort {
  field: 'name' | 'price' | 'rating' | 'created_at' | 'sales_count'
  direction: 'asc' | 'desc'
}

export interface CatalogSearchParams {
  query?: string
  filters?: {
    category?: string
    brand?: string
    priceMin?: number
    priceMax?: number
    inStock?: boolean
    trending?: boolean
    bestseller?: boolean
    rating?: number
  }
  sort?: ProductSort
  page?: number
  limit?: number
}
