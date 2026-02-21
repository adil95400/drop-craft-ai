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
      // Query products table (canonical)
      let query = (supabase
        .from('products') as any)
        .select('*', { count: 'exact' })

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`)
      }

      const { data, error, count } = await query.limit(1000)

      if (error) throw error

      // Apply client-side filters that aren't handled by the query
      let filteredData = data || []
      
      if (filters?.supplier) {
        filteredData = filteredData.filter((product: any) => 
          product.supplier_name?.toLowerCase().includes(filters.supplier!.toLowerCase())
        )
      }
      
      if (filters?.priceRange) {
        filteredData = filteredData.filter((product: any) =>
          (product.price || 0) >= filters.priceRange![0] && (product.price || 0) <= filters.priceRange![1]
        )
      }

      // Apply client-side sorting
      if (filters?.sortBy) {
        filteredData.sort((a: any, b: any) => {
          const aVal = a[filters.sortBy as keyof typeof a]
          const bVal = b[filters.sortBy as keyof typeof b]
          if (filters.sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1
          } else {
            return aVal < bVal ? 1 : -1
          }
        })
      }

      const result = {
        products: filteredData.map((product: any) => ({
          id: product.id,
          name: product.title,
          title: product.title,
          description: product.description,
          price: product.price || 0,
          cost_price: product.compare_at_price || (product.price ? product.price * 0.7 : 0),
          category: product.category,
          image_url: product.image_urls?.[0],
          image_urls: product.image_urls,
          supplier_id: product.id,
          supplier_name: product.supplier_name || 'Unknown Supplier',
          source_platform: product.source_platform,
          source_url: product.source_url,
          status: product.status,
          external_id: product.id,
          currency: 'EUR',
          availability_status: product.status === 'available' ? 'in_stock' : 'out_of_stock',
          created_at: product.created_at || new Date().toISOString(),
          updated_at: product.updated_at || new Date().toISOString()
        })) as unknown as CatalogProduct[],
        total: count || filteredData.length
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
      const { data: product, error } = await (supabase
        .from('products') as any)
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!product) throw new Error('Product not found')

      // Map to ensure all required fields are present
      const mappedProduct = {
        id: product.id,
        name: product.title,
        title: product.title,
        description: product.description,
        price: product.price || 0,
        cost_price: product.compare_at_price || (product.price ? product.price * 0.7 : 0),
        category: product.category,
        image_url: product.image_urls?.[0],
        image_urls: product.image_urls,
        supplier_id: product.id,
        supplier_name: product.supplier_name || 'Unknown Supplier',
        source_platform: product.source_platform,
        source_url: product.source_url,
        status: product.status,
        external_id: product.id,
        currency: 'EUR',
        availability_status: product.status === 'available' ? 'in_stock' : 'out_of_stock',
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString()
      } as unknown as CatalogProduct
      
      this.cache.set(cacheKey, { data: mappedProduct, timestamp: Date.now() })
      return mappedProduct
    } catch (error) {
      console.error('Catalog product fetch failed:', error)
      throw error
    }
  }

  async getMarketplaceProducts(filters?: CommerceFilters): Promise<{ products: CatalogProduct[]; total: number }> {
    try {
      let query = (supabase
        .from('products') as any)
        .select('*', { count: 'exact' })
        .eq('status', 'active')

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`)
      }

      const { data, error, count } = await query.limit(1000)

      if (error) throw error

      return {
        products: (data || []).map((product: any) => ({
          id: product.id,
          name: product.title,
          title: product.title,
          description: product.description,
          price: product.price || 0,
          cost_price: product.compare_at_price || (product.price ? product.price * 0.7 : 0),
          category: product.category,
          image_url: product.image_urls?.[0],
          image_urls: product.image_urls,
          supplier_id: product.id,
          supplier_name: product.supplier_name || 'Unknown Supplier',
          source_platform: product.source_platform,
          source_url: product.source_url,
          status: product.status,
          external_id: product.id,
          currency: 'EUR',
          availability_status: product.status === 'available' ? 'in_stock' : 'out_of_stock',
          created_at: product.created_at,
          updated_at: product.updated_at
        })) as unknown as CatalogProduct[],
        total: count || data?.length || 0
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
          title: (catalogProduct as any).name || (catalogProduct as any).title,
          name: (catalogProduct as any).name || (catalogProduct as any).title,
          description: catalogProduct.description,
          price: catalogProduct.price,
          cost_price: catalogProduct.cost_price || catalogProduct.price * 0.7,
          category: catalogProduct.category,
          sku: `IMP-${Date.now()}`,
          image_url: catalogProduct.image_url,
          supplier: catalogProduct.supplier_name,
          status: 'active',
          stock_quantity: 100
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
