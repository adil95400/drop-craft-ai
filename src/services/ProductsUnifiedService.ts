import { supabase } from '@/integrations/supabase/client'

export interface UnifiedProduct {
  id: string
  name: string
  description?: string
  price: number
  cost_price?: number
  status: 'active' | 'inactive'
  stock_quantity?: number
  sku?: string
  category?: string
  image_url?: string
  images?: string[]
  profit_margin?: number
  user_id: string
  source: 'products' | 'imported' | 'premium' | 'catalog' | 'shopify' | 'published' | 'feed' | 'supplier'
  variants?: ProductVariant[]
  created_at: string
  updated_at: string
  // AI Scores & Analytics
  ai_score?: number
  trend_score?: number
  competition_score?: number
  profit_potential?: number
  is_winner?: boolean
  is_trending?: boolean
  is_bestseller?: boolean
  view_count?: number
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

export class ProductsUnifiedService {
  /**
   * Charge tous les produits de toutes les tables
   */
  static async getAllProducts(userId: string, filters?: {
    search?: string
    category?: string
    status?: 'active' | 'inactive'
    minPrice?: number
    maxPrice?: number
    lowStock?: boolean
  }): Promise<UnifiedProduct[]> {
    const promises = [
      this.getProductsTable(userId, filters),
      this.getImportedProducts(userId, filters),
      this.getPremiumProducts(userId, filters),
      this.getCatalogProducts(filters),
      this.getShopifyProducts(userId, filters),
      this.getPublishedProducts(userId, filters),
      this.getFeedProducts(userId, filters),
      this.getSupplierProducts(userId, filters)
    ]

    const results = await Promise.allSettled(promises)

    const allProducts: UnifiedProduct[] = []
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allProducts.push(...result.value)
      }
    })

    return allProducts
  }

  /**
   * Table products
   */
  private static async getProductsTable(userId: string, filters?: any): Promise<UnifiedProduct[]> {
    let query = supabase.from('products').select('*').eq('user_id', userId)

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.category) query = query.eq('category', filters.category)
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
    }
    if (filters?.lowStock) query = query.lt('stock_quantity', 10)

    const { data, error } = await query.order('created_at', { ascending: false }).limit(10000)
    if (error) throw error

    return (data || []).map(p => ({
      ...p,
      name: p.name || 'Produit sans nom',
      status: p.status as 'active' | 'inactive',
      source: 'products' as const,
      images: p.image_url ? [p.image_url] : []
    }))
  }

  /**
   * Table imported_products
   */
  private static async getImportedProducts(userId: string, filters?: any): Promise<UnifiedProduct[]> {
    let query = supabase.from('imported_products').select('*').eq('user_id', userId)

    if (filters?.category) query = query.eq('category', filters.category)
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(10000)
    if (error) throw error

    return (data || []).map(p => ({
      id: p.id,
      name: p.name || 'Produit sans nom',
      description: p.description,
      price: p.price || 0,
      cost_price: p.cost_price,
      status: (p.status === 'published' ? 'active' : 'inactive') as 'active' | 'inactive',
      stock_quantity: p.stock_quantity,
      sku: p.sku,
      category: p.category,
      image_url: Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls[0] : undefined,
      images: Array.isArray(p.image_urls) ? p.image_urls : [],
      profit_margin: p.cost_price ? ((p.price - p.cost_price) / p.price * 100) : undefined,
      user_id: p.user_id,
      source: 'imported' as const,
      created_at: p.created_at,
      updated_at: p.updated_at
    }))
  }

  /**
   * Table premium_products
   */
  private static async getPremiumProducts(userId: string, filters?: any): Promise<UnifiedProduct[]> {
    const { data, error } = await supabase
      .from('premium_products')
      .select(`
        *,
        supplier:premium_suppliers!inner(
          id,
          connections:premium_supplier_connections!inner(
            user_id
          )
        )
      `)
      .eq('supplier.connections.user_id', userId)
      .eq('is_active', true)

    if (error) throw error

    return (data || []).map(p => ({
      id: p.id,
      name: p.name || 'Produit sans nom',
      description: p.description,
      price: p.price || 0,
      cost_price: p.cost_price,
      status: 'active' as const,
      stock_quantity: p.stock_quantity,
      sku: p.sku,
      category: p.category,
      image_url: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : undefined,
      images: Array.isArray(p.images) ? p.images : [],
      profit_margin: p.profit_margin,
      user_id: userId,
      source: 'premium' as const,
      created_at: p.created_at || new Date().toISOString(),
      updated_at: p.updated_at || new Date().toISOString()
    }))
  }

  /**
   * Table catalog_products (disponibles pour tous)
   */
  private static async getCatalogProducts(filters?: any): Promise<UnifiedProduct[]> {
    let query = supabase.from('catalog_products').select('*')

    if (filters?.category) query = query.eq('category', filters.category)
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(10000)
    if (error) throw error

    return (data || []).map(p => ({
      id: p.id,
      name: p.name || 'Produit sans nom',
      description: p.description,
      price: p.price || 0,
      cost_price: p.cost_price,
      status: 'active' as const,
      stock_quantity: p.stock_quantity,
      sku: p.sku,
      category: p.category,
      image_url: p.image_url,
      images: p.image_url ? [p.image_url] : [],
      profit_margin: p.profit_margin,
      user_id: 'catalog',
      source: 'catalog' as const,
      created_at: p.created_at || new Date().toISOString(),
      updated_at: p.updated_at || new Date().toISOString()
    }))
  }

  /**
   * Table shopify_products
   */
  private static async getShopifyProducts(userId: string, filters?: any): Promise<UnifiedProduct[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('shopify_products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10000)

      if (error) throw error

      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.title || p.name || 'Produit sans nom',
        description: p.description || p.body_html,
        price: p.price || p.variants?.[0]?.price || 0,
        cost_price: undefined,
        status: (p.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
        stock_quantity: p.inventory_quantity || p.variants?.[0]?.inventory_quantity,
        sku: p.sku || p.variants?.[0]?.sku,
        category: p.product_type || p.category,
        image_url: p.image_url || p.image?.src,
        images: Array.isArray(p.images) ? (p.images as any[]).map((img: any) => img?.src || img).filter(Boolean) : [],
        profit_margin: undefined,
        user_id: userId,
        source: 'shopify' as const,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error loading shopify_products:', error)
      return []
    }
  }

  /**
   * Table published_products
   */
  private static async getPublishedProducts(userId: string, filters?: any): Promise<UnifiedProduct[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('published_products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10000)

      if (error) throw error

      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.title || p.name || 'Produit sans nom',
        description: p.description,
        price: p.price || p.price_override || 0,
        cost_price: p.cost_price,
        status: 'active' as 'active' | 'inactive',
        stock_quantity: p.stock_quantity,
        sku: p.sku,
        category: p.category,
        image_url: p.image_url,
        images: p.image_url ? [p.image_url] : [],
        profit_margin: p.profit_margin,
        user_id: userId,
        source: 'published' as const,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error loading published_products:', error)
      return []
    }
  }

  /**
   * Table feed_products
   */
  private static async getFeedProducts(userId: string, filters?: any): Promise<UnifiedProduct[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('feed_products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10000)

      if (error) throw error

      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.optimized_title || p.title || 'Produit sans nom',
        description: p.optimized_description || p.description,
        price: p.feed_price || 0,
        cost_price: undefined,
        status: (p.is_excluded ? 'inactive' : 'active') as 'active' | 'inactive',
        stock_quantity: undefined,
        sku: p.sku,
        category: p.optimized_category,
        image_url: p.image_url,
        images: p.image_url ? [p.image_url] : [],
        profit_margin: undefined,
        user_id: userId,
        source: 'feed' as const,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error loading feed_products:', error)
      return []
    }
  }

  /**
   * Table supplier_products
   */
  private static async getSupplierProducts(userId: string, filters?: any): Promise<UnifiedProduct[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('supplier_products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10000)

      if (error) throw error

      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.name || 'Produit sans nom',
        description: p.description,
        price: p.price || 0,
        cost_price: p.wholesale_price || p.cost_price,
        status: (p.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
        stock_quantity: p.stock_quantity,
        sku: p.global_sku || p.external_sku,
        category: p.category,
        image_url: Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls[0] : undefined,
        images: Array.isArray(p.image_urls) ? p.image_urls : [],
        profit_margin: p.profit_margin,
        user_id: userId,
        source: 'supplier' as const,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error loading supplier_products:', error)
      return []
    }
  }

  /**
   * Créer/Mettre à jour un produit
   */
  static async upsertProduct(userId: string, product: Partial<UnifiedProduct>): Promise<UnifiedProduct> {
    const { data, error } = await supabase
      .from('products')
      .upsert({
        id: product.id,
        name: product.name!,
        description: product.description,
        price: product.price!,
        cost_price: product.cost_price,
        status: product.status || 'active',
        stock_quantity: product.stock_quantity,
        sku: product.sku,
        category: product.category,
        image_url: product.image_url,
        user_id: userId
      })
      .select()
      .single()

    if (error) throw error
    return { 
      ...data, 
      status: data.status as 'active' | 'inactive',
      source: 'products', 
      images: data.image_url ? [data.image_url] : [] 
    }
  }

  /**
   * Supprimer un produit (toutes les tables)
   */
  static async deleteProduct(userId: string, productId: string): Promise<void> {
    const promises = [
      supabase.from('products').delete().eq('id', productId).eq('user_id', userId),
      supabase.from('imported_products').delete().eq('id', productId).eq('user_id', userId)
    ]

    await Promise.allSettled(promises)
  }

  /**
   * Importer des produits en masse depuis imported_products vers products
   */
  static async consolidateProducts(userId: string): Promise<number> {
    const { data: imported, error } = await supabase
      .from('imported_products')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error

    const toInsert = (imported || []).map(p => ({
      id: p.id,
      name: p.name || 'Produit',
      description: p.description,
      price: p.price || 0,
      cost_price: p.cost_price,
      status: (p.status === 'published' ? 'active' : 'inactive') as 'active' | 'inactive',
      stock_quantity: p.stock_quantity,
      sku: p.sku,
      category: p.category,
      image_url: Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls[0] : null,
      user_id: userId
    }))

    if (toInsert.length === 0) return 0

    const { error: insertError } = await supabase
      .from('products')
      .upsert(toInsert, { onConflict: 'id' })

    if (insertError) throw insertError
    return toInsert.length
  }
}
