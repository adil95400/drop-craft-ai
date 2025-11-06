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
  source: 'products' | 'imported' | 'premium' | 'catalog'
  variants?: ProductVariant[]
  created_at: string
  updated_at: string
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
      this.getCatalogProducts(filters)
    ]

    const [products, imported, premium, catalog] = await Promise.allSettled(promises)

    const allProducts: UnifiedProduct[] = []
    
    if (products.status === 'fulfilled') allProducts.push(...products.value)
    if (imported.status === 'fulfilled') allProducts.push(...imported.value)
    if (premium.status === 'fulfilled') allProducts.push(...premium.value)
    if (catalog.status === 'fulfilled') allProducts.push(...catalog.value)

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

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error

    return (data || []).map(p => ({
      ...p,
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

    const { data, error } = await query.order('created_at', { ascending: false })
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

    const { data, error } = await query.limit(50)
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
