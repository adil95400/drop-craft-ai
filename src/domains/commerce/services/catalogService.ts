import { supabase } from '@/integrations/supabase/client'
import { CatalogProduct, CommerceFilters } from '../types'

export class CatalogService {
  private static instance: CatalogService
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly cacheTimeout = 10 * 60 * 1000 // 10 minutes

  public static getInstance(): CatalogService {
    if (!CatalogService.instance) {
      CatalogService.instance = new CatalogService()
    }
    return CatalogService.instance
  }

  async getProducts(filters?: CommerceFilters): Promise<{ products: CatalogProduct[]; total: number }> {
    const cacheKey = `catalog_products_${JSON.stringify(filters || {})}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    try {
      let query = supabase
        .from('catalog_products')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      if (filters?.supplier) {
        query = query.eq('supplier_name', filters.supplier)
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }
      if (filters?.priceRange) {
        query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1])
      }

      // Apply sorting
      if (filters?.sortBy) {
        query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data, error, count } = await query.limit(50)

      if (error) throw error

      const result = {
        products: (data || []).map(product => ({
          ...product,
          supplier_id: product.supplier_id || 'unknown',
          supplier_name: product.supplier_name || 'Unknown Supplier'
        })) as CatalogProduct[],
        total: count || 0
      }

      this.cache.set(cacheKey, { data: result, timestamp: Date.now() })
      return result
    } catch (error) {
      console.error('Catalog products fetch failed:', error)
      throw error
    }
  }

  async getProduct(id: string): Promise<CatalogProduct | null> {
    const cacheKey = `catalog_product_${id}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    try {
      const { data, error } = await supabase
        .from('catalog_products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      this.cache.set(cacheKey, { data, timestamp: Date.now() })
      return data
    } catch (error) {
      console.error('Catalog product fetch failed:', error)
      throw error
    }
  }

  async getMarketplaceProducts(filters?: CommerceFilters): Promise<{ products: CatalogProduct[]; total: number }> {
    try {
      const { data, error } = await supabase.rpc('get_marketplace_products', {
        category_filter: filters?.category,
        search_term: filters?.search,
        limit_count: 50
      })

      if (error) throw error

      return {
        products: (data || []).map((product: any) => ({
          ...product,
          supplier_id: product.supplier_id || product.external_id || 'unknown',
          supplier_name: product.supplier_name || product.brand || 'Unknown Supplier'
        })) as CatalogProduct[],
        total: data?.length || 0
      }
    } catch (error) {
      console.error('Marketplace products fetch failed:', error)
      throw error
    }
  }

  async importProduct(productId: string): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get catalog product details
      const catalogProduct = await this.getProduct(productId)
      if (!catalogProduct) throw new Error('Product not found')

      // Import to user's products
      const { data, error } = await supabase
        .from('products')
        .insert([{
          user_id: user.id,
          name: catalogProduct.name,
          description: catalogProduct.description,
          price: catalogProduct.price,
          cost_price: catalogProduct.cost_price || catalogProduct.price * 0.7,
          category: catalogProduct.category,
          sku: catalogProduct.sku || `IMP-${Date.now()}`,
          image_url: catalogProduct.image_url,
          tags: catalogProduct.tags,
          supplier: catalogProduct.supplier_name,
          status: 'active',
          stock_quantity: 100,
          profit_margin: catalogProduct.profit_margin
        }])
        .select()
        .single()

      if (error) throw error

      // Clear cache to refresh data
      this.clearCache()
      return data
    } catch (error) {
      console.error('Product import failed:', error)
      throw error
    }
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

export const catalogService = CatalogService.getInstance()