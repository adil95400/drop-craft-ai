/**
 * ProductsService — Pure API V1 delegate
 * All methods proxy to productsApi. No direct Supabase queries.
 */
import { productsApi, type ProductRecord } from '@/services/api/client'

export class ProductsService {
  static async getProducts(_userId: string): Promise<any[]> {
    const resp = await productsApi.list({ per_page: 500 })
    return resp.items ?? []
  }

  static async getProductsPage(_userId: string, page = 0, pageSize = 50) {
    const resp = await productsApi.list({ page: page + 1, per_page: pageSize })
    return {
      data: resp.items ?? [],
      total: resp.meta?.total ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((resp.meta?.total ?? 0) / pageSize),
    }
  }

  static async getProduct(id: string, _userId: string) {
    return productsApi.get(id)
  }

  static async createProduct(product: Partial<ProductRecord>) {
    return productsApi.create(product)
  }

  static async updateProduct(id: string, _userId: string, updates: Partial<ProductRecord>) {
    return productsApi.update(id, updates)
  }

  static async deleteProduct(id: string, _userId: string) {
    return productsApi.delete(id)
  }

  static async updateProductStatus(id: string, _userId: string, status: string) {
    return productsApi.update(id, { status } as any)
  }

  static async searchProducts(_userId: string, searchTerm: string) {
    const resp = await productsApi.list({ q: searchTerm, per_page: 100 })
    return resp.items ?? []
  }

  static async getProductStats(_userId: string) {
    return productsApi.stats()
  }

  static async optimizeProduct(id: string, _userId: string) {
    // Will connect to /v1/ai/enrichments
    return productsApi.get(id)
  }

  static async bulkDelete(ids: string[], _userId: string) {
    return productsApi.bulkUpdate(ids, { status: 'archived' } as any)
  }

  static async bulkUpdateStatus(ids: string[], _userId: string, status: string) {
    return productsApi.bulkUpdate(ids, { status } as any)
  }
}
