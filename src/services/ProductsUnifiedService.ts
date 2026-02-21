/**
 * ProductsUnifiedService — Pure API V1 wrapper
 * Single source of truth: all product operations go through /v1/products
 * No direct Supabase table queries.
 */
import { productsApi, type ProductRecord, type PaginatedResponse } from '@/services/api/client'

export interface UnifiedProduct {
  id: string
  name: string
  description?: string
  price: number
  cost_price?: number
  status: 'active' | 'paused' | 'draft' | 'archived'
  stock_quantity?: number
  sku?: string
  category?: string
  image_url?: string
  images?: string[]
  videos?: string[]
  profit_margin?: number
  user_id: string
  source: 'products' | 'imported' | 'premium' | 'catalog' | 'shopify' | 'published' | 'feed' | 'supplier'
  variants?: ProductVariant[]
  source_url?: string
  brand?: string
  specifications?: Record<string, any>
  created_at: string
  updated_at: string
  // SEO
  seo_title?: string
  seo_description?: string
  tags?: string[]
  // Metadata
  barcode?: string
  weight?: number
  weight_unit?: string
  vendor?: string
  product_type?: string
  is_published?: boolean
  view_count?: number
  compare_at_price?: number
  // AI Scores & Analytics (computed server-side or by enrichment jobs)
  ai_score?: number
  trend_score?: number
  competition_score?: number
  profit_potential?: number
  is_winner?: boolean
  is_trending?: boolean
  is_bestseller?: boolean
  conversion_rate?: number
  last_optimized_at?: string
  // Multi-supplier
  supplier_ids?: string[]
  best_supplier_id?: string
  best_supplier_price?: number
  supplier_count?: number
}

export interface ProductVariant {
  id: string
  name: string
  sku?: string
  price?: number
  stock_quantity?: number
  attributes: Record<string, string>
}

function mapRecordToUnified(r: ProductRecord): UnifiedProduct {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    price: r.price,
    cost_price: r.cost_price || undefined,
    status: (['active', 'paused', 'draft', 'archived'].includes(r.status) ? r.status : 'draft') as UnifiedProduct['status'],
    stock_quantity: r.stock_quantity,
    sku: r.sku ?? undefined,
    category: r.category ?? undefined,
    image_url: r.images?.length > 0 ? r.images[0] : undefined,
    images: r.images ?? [],
    profit_margin: r.profit_margin ?? undefined,
    user_id: '', // Not returned by API for security, filled by caller if needed
    source: 'products',
    variants: (r.variants ?? []).map((v: any, i: number) => ({
      id: v.id || `v-${i}`,
      name: v.name || `Variant ${i + 1}`,
      sku: v.sku,
      price: v.price,
      stock_quantity: v.stock_quantity,
      attributes: v.attributes || {},
    })),
    brand: r.brand ?? undefined,
    created_at: r.created_at,
    updated_at: r.updated_at,
    seo_title: r.seo_title ?? undefined,
    seo_description: r.seo_description ?? undefined,
    tags: r.tags ?? [],
    barcode: r.barcode ?? undefined,
    weight: r.weight ?? undefined,
    weight_unit: r.weight_unit ?? undefined,
    vendor: r.vendor ?? undefined,
    product_type: r.product_type ?? undefined,
    is_published: r.is_published,
    view_count: r.view_count,
    compare_at_price: r.compare_at_price ?? undefined,
  }
}

export class ProductsUnifiedService {
  /**
   * List products via API V1 with server-side filtering & pagination
   */
  static async getAllProducts(
    _userId: string,
    filters?: {
      search?: string
      category?: string
      status?: 'active' | 'paused' | 'draft' | 'archived'
      lowStock?: boolean
    },
    options?: { page?: number; perPage?: number }
  ): Promise<UnifiedProduct[]> {
    const params: Record<string, string | number | undefined> = {
      page: options?.page ?? 1,
      per_page: options?.perPage ?? 100,
    }

    if (filters?.search) params.q = filters.search
    if (filters?.category) params.category = filters.category
    if (filters?.status) params.status = filters.status
    if (filters?.lowStock) params.low_stock = 'true'

    const resp = await productsApi.list(params as any)
    return (resp.items ?? []).map(mapRecordToUnified)
  }

  /**
   * Get a single product by ID
   */
  static async getProduct(productId: string): Promise<UnifiedProduct> {
    const r = await productsApi.get(productId)
    return mapRecordToUnified(r)
  }

  /**
   * Create or update a product
   */
  static async upsertProduct(_userId: string, product: Partial<UnifiedProduct> & { id?: string }): Promise<UnifiedProduct> {
    const body: any = {
      title: product.name,
      name: product.name,
      description: product.description,
      sku: product.sku,
      barcode: product.barcode,
      price: product.price,
      compare_at_price: product.compare_at_price,
      cost_price: product.cost_price,
      category: product.category,
      brand: product.brand,
      status: product.status,
      stock_quantity: product.stock_quantity,
      weight: product.weight,
      weight_unit: product.weight_unit,
      images: product.images,
      variants: product.variants,
      tags: product.tags,
      seo_title: product.seo_title,
      seo_description: product.seo_description,
      product_type: product.product_type,
      vendor: product.vendor,
    }

    // Remove undefined values
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k])

    if (product.id) {
      await productsApi.update(product.id, body)
      return await this.getProduct(product.id)
    } else {
      const resp = await productsApi.create(body)
      return await this.getProduct(resp.id)
    }
  }

  /**
   * Delete a product
   */
  static async deleteProduct(_userId: string, productId: string): Promise<void> {
    await productsApi.delete(productId)
  }

  /**
   * Bulk update products
   */
  static async bulkUpdate(productIds: string[], updates: Partial<ProductRecord>): Promise<number> {
    const resp = await productsApi.bulkUpdate(productIds, updates)
    return resp.updated
  }

  /**
   * Get product stats from API
   */
  static async getStats() {
    return productsApi.stats()
  }

  /**
   * @deprecated Use getAllProducts instead — consolidation is now server-side
   */
  static async consolidateProducts(_userId: string): Promise<number> {
    // No-op: all products are already unified in the products table
    return 0
  }
}
