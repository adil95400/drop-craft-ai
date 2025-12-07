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
      // Use the new secure catalog products function with rate limiting and anti-scraping
      const { data, error } = await supabase.rpc('get_catalog_products_with_ratelimit', {
        category_filter: filters?.category || null,
        search_term: filters?.search || null,
        limit_count: 100000, // Support pour catalogues jusqu'à 100k produits
        user_ip: null,
        user_agent_param: typeof navigator !== 'undefined' ? navigator.userAgent : null
      })

      if (error) throw error

      // Apply client-side filters that aren't handled by the function
      let filteredData = data || []
      
      if (filters?.supplier) {
        filteredData = filteredData.filter(product => 
          product.supplier_name?.toLowerCase().includes(filters.supplier.toLowerCase())
        )
      }
      
      if (filters?.priceRange) {
        filteredData = filteredData.filter(product =>
          product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
        )
      }

      // Apply client-side sorting
      if (filters?.sortBy) {
        filteredData.sort((a, b) => {
          const aVal = a[filters.sortBy as keyof typeof a]
          const bVal = b[filters.sortBy as keyof typeof b]
          if (filters.sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1
          } else {
            return aVal < bVal ? 1 : -1
          }
        })
      }

      const count = filteredData.length

      const result = {
        products: filteredData.map((product: any) => ({
          ...product,
          supplier_id: product.external_id || 'unknown',
          supplier_name: product.supplier_name || 'Unknown Supplier',
          created_at: product.created_at || product.last_updated || new Date().toISOString(),
          updated_at: product.updated_at || product.last_updated || new Date().toISOString()
        })) as CatalogProduct[],
        total: count
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
      // Use the new secure function with rate limiting for single product access
      const { data, error } = await supabase.rpc('get_catalog_products_with_ratelimit', {
        category_filter: null,
        search_term: null,
        limit_count: 1000, // Get more to find specific product
        user_ip: null,
        user_agent_param: typeof navigator !== 'undefined' ? navigator.userAgent : null
      })

      if (error) throw error
      
      const product = data?.find(p => p.id === id)
      if (!product) {
        throw new Error('Product not found')
      }

      // Map to ensure all required fields are present
      const mappedProduct: any = {
        ...product,
        supplier_id: product.external_id || 'unknown',
        supplier_name: product.supplier_name || 'Unknown Supplier',
        created_at: (product as any).created_at || (product as any).last_updated || new Date().toISOString(),
        updated_at: (product as any).updated_at || (product as any).last_updated || new Date().toISOString()
      }
      
      this.cache.set(cacheKey, { data: mappedProduct, timestamp: Date.now() })
      return mappedProduct as CatalogProduct
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
        limit_count: 100000
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