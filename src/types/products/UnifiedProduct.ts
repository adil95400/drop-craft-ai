/**
 * TYPE UNIFIÉ POUR TOUS LES PRODUITS
 * Normalisation de toutes les sources (products, imported_products, shopify_products, etc.)
 */

export interface UnifiedProduct {
  // Identifiants
  id: string
  source: 'products' | 'imported_products' | 'premium_products' | 'catalog_products' | 
          'shopify_products' | 'published_products' | 'feed_products' | 'supplier_products'
  externalId?: string
  userId: string
  
  // Informations de base
  name: string
  description?: string
  shortDescription?: string
  
  // Pricing
  price: number
  costPrice?: number
  currency?: string
  profitMargin?: number
  compareAtPrice?: number
  
  // Inventory
  sku?: string
  barcode?: string
  gtin?: string
  stockQuantity?: number
  inventoryStatus?: 'in_stock' | 'low_stock' | 'out_of_stock'
  
  // Classification
  category?: string
  subcategory?: string
  brand?: string
  tags?: string[]
  productType?: string
  
  // Media
  imageUrl?: string
  imageUrls?: string[]
  videoUrl?: string
  
  // SEO
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  slug?: string
  
  // Variants
  hasVariants?: boolean
  variantCount?: number
  variants?: ProductVariant[]
  
  // Supplier
  supplierId?: string
  supplierName?: string
  supplierUrl?: string
  supplierSku?: string
  
  // Status
  status: 'active' | 'inactive' | 'archived' | 'draft'
  publishedStatus?: 'published' | 'unpublished' | 'scheduled'
  
  // Performance
  salesCount?: number
  viewsCount?: number
  conversionRate?: number
  rating?: number
  reviewsCount?: number
  
  // AI & Intelligence
  aiScore?: number
  trendScore?: number
  competitionScore?: number
  qualityScore?: number
  
  // Multi-channel
  googleProductCategory?: string
  metaProductCategory?: string
  amazonProductCategory?: string
  condition?: 'new' | 'refurbished' | 'used'
  ageGroup?: 'adult' | 'kids' | 'infant'
  gender?: 'male' | 'female' | 'unisex'
  
  // Shipping
  weight?: number
  weightUnit?: 'kg' | 'g' | 'lb' | 'oz'
  dimensions?: {
    length?: number
    width?: number
    height?: number
    unit?: 'cm' | 'm' | 'in' | 'ft'
  }
  shippingTime?: string
  freeShipping?: boolean
  
  // Dates
  createdAt: string
  updatedAt: string
  publishedAt?: string
  lastSyncedAt?: string
  
  // Custom fields
  customFields?: Record<string, any>
  metadata?: Record<string, any>
}

export interface ProductVariant {
  id: string
  title: string
  price: number
  compareAtPrice?: number
  sku?: string
  barcode?: string
  inventoryQuantity?: number
  weight?: number
  imageUrl?: string
  options: Record<string, string> // { "Size": "M", "Color": "Red" }
  available: boolean
}

export interface ProductNormalizationConfig {
  includeSources: Array<UnifiedProduct['source']>
  includeInactive?: boolean
  includeArchived?: boolean
  minQualityScore?: number
  maxResults?: number
}

// Mapping des champs par source
export const SOURCE_FIELD_MAPPINGS: Record<UnifiedProduct['source'], Record<string, string>> = {
  products: {
    id: 'id',
    name: 'name',
    description: 'description',
    price: 'price',
    costPrice: 'cost_price',
    sku: 'sku',
    category: 'category',
    imageUrl: 'image_url',
    status: 'status',
    tags: 'tags'
  },
  imported_products: {
    id: 'id',
    name: 'name',
    description: 'description',
    price: 'price',
    costPrice: 'cost_price',
    sku: 'sku',
    category: 'category',
    imageUrl: 'image_url',
    imageUrls: 'image_urls',
    status: 'status',
    supplierId: 'supplier_id'
  },
  premium_products: {
    id: 'id',
    name: 'name',
    description: 'description',
    price: 'price',
    sku: 'sku',
    imageUrl: 'image_url',
    status: 'is_active'
  },
  catalog_products: {
    id: 'id',
    externalId: 'external_id',
    name: 'name',
    description: 'description',
    price: 'price',
    currency: 'currency',
    category: 'category',
    brand: 'brand',
    sku: 'sku',
    imageUrl: 'image_url',
    imageUrls: 'image_urls',
    rating: 'rating',
    reviewsCount: 'reviews_count'
  },
  shopify_products: {
    id: 'id',
    externalId: 'shopify_product_id',
    name: 'title',
    description: 'description',
    price: 'price',
    sku: 'sku',
    imageUrl: 'image_url',
    status: 'status',
    tags: 'tags'
  },
  published_products: {
    id: 'id',
    name: 'name',
    description: 'description',
    price: 'price',
    sku: 'sku',
    category: 'category',
    imageUrl: 'image_url',
    status: 'status'
  },
  feed_products: {
    id: 'id',
    name: 'name',
    description: 'description',
    price: 'price',
    sku: 'sku',
    imageUrl: 'image_url',
    status: 'status'
  },
  supplier_products: {
    id: 'id',
    externalId: 'external_product_id',
    name: 'name',
    description: 'description',
    price: 'price',
    costPrice: 'cost_price',
    sku: 'sku',
    category: 'category',
    imageUrl: 'image_url',
    imageUrls: 'image_urls',
    supplierId: 'supplier_id',
    supplierName: 'supplier_name'
  }
}
