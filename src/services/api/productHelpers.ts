/**
 * Product data helpers for non-product modules.
 * Provides thin wrappers around productsApi for analytics, admin, and monitoring hooks.
 */
import { productsApi, type ProductRecord } from '@/services/api/client'

/** Fetch product count via API stats */
export async function getProductCount(): Promise<number> {
  try {
    const stats = await productsApi.stats()
    return stats.total ?? 0
  } catch {
    return 0
  }
}

/** Fetch product list via API (lightweight) */
export async function getProductList(limit = 100): Promise<ProductRecord[]> {
  try {
    const resp = await productsApi.list({ per_page: limit })
    return resp.items ?? []
  } catch {
    return []
  }
}

/** Fetch product stats via API */
export async function getProductStats() {
  try {
    return await productsApi.stats()
  } catch {
    return { total: 0, active: 0, draft: 0, inactive: 0, low_stock: 0, out_of_stock: 0, total_value: 0, total_cost: 0, total_profit: 0, avg_price: 0, profit_margin: 0 }
  }
}

/** Create a product duplicate via API */
export async function duplicateProduct(product: {
  name: string
  description?: string
  price: number
  cost_price?: number
  sku?: string
  category?: string
  stock_quantity?: number
  image_url?: string
}) {
  return productsApi.create({
    name: `${product.name} (copie)`,
    title: `${product.name} (copie)`,
    description: product.description,
    price: product.price,
    cost_price: product.cost_price ?? 0,
    sku: product.sku ? `${product.sku}-COPY` : undefined,
    category: product.category,
    stock_quantity: product.stock_quantity ?? 0,
    status: 'draft',
    images: product.image_url ? [product.image_url] : [],
  } as any)
}
