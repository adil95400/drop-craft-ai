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

// Configuration pour la limite de produits (augmentable si besoin)
export const PRODUCT_FETCH_LIMIT = 100000; // Support pour catalogues jusqu'à 100k produits

export interface ProductFetchOptions {
  includeEmptyNames?: boolean; // Inclure les produits sans nom (mode correction)
  includeGlobalProducts?: boolean; // Inclure les produits globaux (user_id vide)
  limit?: number; // Limite personnalisée (défaut: PRODUCT_FETCH_LIMIT)
}

export class ProductsUnifiedService {
  /**
   * Charge tous les produits de toutes les tables consolidées
   * 
   * Tables fusionnées (par ordre de priorité):
   * 1. products - Produits principaux de l'utilisateur
   * 2. imported_products - Produits importés depuis CSV/API
   * 3. premium_products - Produits premium depuis fournisseurs premium
   * 4. catalog_products - Catalogue global disponible pour tous
   * 5. shopify_products - Produits synchronisés depuis Shopify
   * 6. published_products - Produits publiés sur marketplace
   * 7. feed_products - Produits optimisés pour les flux (Google Shopping, etc.)
   * 8. supplier_products - Produits depuis les fournisseurs connectés
   * 
   * Options configurables:
   * - includeEmptyNames: inclure produits sans nom (défaut: true, pour mode audit/correction)
   * - includeGlobalProducts: inclure produits sans user_id (défaut: false)
   * - limit: limite de produits par table (défaut: 100000)
   */
  static async getAllProducts(
    userId: string, 
    filters?: {
      search?: string
      category?: string
      status?: 'active' | 'inactive'
      minPrice?: number
      maxPrice?: number
      lowStock?: boolean
    },
    options: ProductFetchOptions = {}
  ): Promise<UnifiedProduct[]> {
    const {
      includeEmptyNames = true, // Par défaut, on inclut tout pour permettre la correction
      includeGlobalProducts = false,
      limit = PRODUCT_FETCH_LIMIT
    } = options;

    // Lancer toutes les requêtes en parallèle pour maximiser les performances
    const promises = [
      this.getProductsTable(userId, filters, { includeEmptyNames, includeGlobalProducts, limit }),
      this.getImportedProducts(userId, filters, { includeEmptyNames, includeGlobalProducts, limit }),
      this.getPremiumProducts(userId, filters, { includeEmptyNames, includeGlobalProducts, limit }),
      this.getCatalogProducts(filters, { includeEmptyNames, limit }),
      this.getShopifyProducts(userId, filters, { includeEmptyNames, includeGlobalProducts, limit }),
      this.getPublishedProducts(userId, filters, { includeEmptyNames, includeGlobalProducts, limit }),
      this.getFeedProducts(userId, filters, { includeEmptyNames, includeGlobalProducts, limit }),
      this.getSupplierProducts(userId, filters, { includeEmptyNames, includeGlobalProducts, limit })
    ]

    const results = await Promise.allSettled(promises)

    const allProducts: UnifiedProduct[] = []
    
    // Consolider tous les résultats
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✓ Table ${index + 1}/8 loaded: ${result.value.length} products`)
        allProducts.push(...result.value)
      } else {
        console.error(`✗ Table ${index + 1}/8 failed:`, result.reason)
      }
    })

    console.log(`Total consolidated products: ${allProducts.length}`)
    return allProducts
  }

  /**
   * Table products - Produits principaux de l'utilisateur
   */
  private static async getProductsTable(userId: string, filters?: any, options?: ProductFetchOptions): Promise<UnifiedProduct[]> {
    const limit = options?.limit || PRODUCT_FETCH_LIMIT;
    
    let query = supabase.from('products').select('*')
    
    // Filtre user_id (sauf si on veut les produits globaux)
    if (!options?.includeGlobalProducts) {
      query = query.eq('user_id', userId)
    } else {
      query = query.or(`user_id.eq.${userId},user_id.is.null`)
    }

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.category) query = query.eq('category', filters.category)
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
    }
    if (filters?.lowStock) query = query.lt('stock_quantity', 10)

    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit)
    if (error) throw error

    return (data || []).map(p => ({
      ...p,
      name: p.name || 'Produit sans nom', // Garder le nom vide visible pour correction
      status: p.status as 'active' | 'inactive',
      source: 'products' as const,
      images: p.image_url ? [p.image_url] : []
    }))
  }

  /**
   * Table imported_products - Produits importés depuis CSV/API
   */
  private static async getImportedProducts(userId: string, filters?: any, options?: ProductFetchOptions): Promise<UnifiedProduct[]> {
    const limit = options?.limit || PRODUCT_FETCH_LIMIT;
    
    try {
      // D'abord essayer avec le user_id de l'utilisateur
      let query = supabase.from('imported_products').select('*')
      
      if (!options?.includeGlobalProducts) {
        query = query.eq('user_id', userId)
      } else {
        query = query.or(`user_id.eq.${userId},user_id.is.null`)
      }

      if (filters?.category) query = query.eq('category', filters.category)
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(limit)
      
      if (error) {
        console.error('Error fetching imported_products:', error)
        throw error
      }

      console.log(`✓ imported_products loaded: ${data?.length || 0} products for user ${userId}`)
      
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
    } catch (error) {
      console.error('getImportedProducts failed:', error)
      return []
    }
  }

  /**
   * Table premium_products - Produits premium depuis fournisseurs premium
   */
  private static async getPremiumProducts(userId: string, filters?: any, options?: ProductFetchOptions): Promise<UnifiedProduct[]> {
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
   * Table catalog_products - Catalogue global disponible pour tous les utilisateurs
   */
  private static async getCatalogProducts(filters?: any, options?: ProductFetchOptions): Promise<UnifiedProduct[]> {
    const limit = options?.limit || PRODUCT_FETCH_LIMIT;
    
    let query = supabase.from('catalog_products').select('*')

    if (filters?.category) query = query.eq('category', filters.category)
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit)
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
   * Table shopify_products - Produits synchronisés depuis Shopify
   * Note: Cette table n'a pas de colonne user_id, on récupère tous les produits
   */
  private static async getShopifyProducts(userId: string, filters?: any, options?: ProductFetchOptions): Promise<UnifiedProduct[]> {
    const limit = options?.limit || PRODUCT_FETCH_LIMIT;
    try {
      // Note: shopify_products n'a pas de user_id, récupérer via store_id ou tous
      const { data, error } = await (supabase as any)
        .from('shopify_products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.title || p.name || 'Produit sans nom',
        description: p.description || p.body_html,
        price: parseFloat(p.price) || (p.variants?.[0]?.price ? parseFloat(p.variants[0].price) : 0),
        cost_price: undefined,
        status: (p.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
        stock_quantity: p.inventory_quantity || p.variants?.[0]?.inventory_quantity,
        sku: p.sku || p.variants?.[0]?.sku,
        category: p.product_type || p.category,
        image_url: p.image_url || p.image?.src,
        images: Array.isArray(p.images) ? (p.images as any[]).map((img: any) => img?.src || img).filter(Boolean) : [],
        profit_margin: undefined,
        user_id: userId, // Assigné à l'utilisateur actuel
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
   * Table published_products - Produits publiés sur marketplace
   */
  private static async getPublishedProducts(userId: string, filters?: any, options?: ProductFetchOptions): Promise<UnifiedProduct[]> {
    const limit = options?.limit || PRODUCT_FETCH_LIMIT;
    try {
      const { data, error } = await (supabase as any)
        .from('published_products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

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
   * Table feed_products - Produits optimisés pour les flux (Google Shopping, etc.)
   */
  private static async getFeedProducts(userId: string, filters?: any, options?: ProductFetchOptions): Promise<UnifiedProduct[]> {
    const limit = options?.limit || PRODUCT_FETCH_LIMIT;
    try {
      const { data, error } = await (supabase as any)
        .from('feed_products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

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
   * Table supplier_products - Produits depuis les fournisseurs connectés
   */
  private static async getSupplierProducts(userId: string, filters?: any, options?: ProductFetchOptions): Promise<UnifiedProduct[]> {
    const limit = options?.limit || PRODUCT_FETCH_LIMIT;
    try {
      const { data, error } = await (supabase as any)
        .from('supplier_products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

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
   * Récupère un produit par ID depuis toutes les tables
   */
  static async getProductById(productId: string, userId: string): Promise<UnifiedProduct | null> {
    // Essayer de récupérer depuis chaque table
    const promises = [
      this.getFromTable('products', productId, userId),
      this.getFromTable('imported_products', productId, userId),
      this.getFromTable('premium_products', productId, userId),
      this.getFromTable('catalog_products', productId, 'catalog'),
      this.getFromTable('shopify_products', productId, userId),
      this.getFromTable('published_products', productId, userId),
      this.getFromTable('feed_products', productId, userId),
      this.getFromTable('supplier_products', productId, userId)
    ];

    const results = await Promise.allSettled(promises);
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        return result.value;
      }
    }
    
    return null;
  }

  /**
   * Helper: Récupère un produit d'une table spécifique
   */
  private static async getFromTable(
    table: string,
    productId: string,
    userId: string
  ): Promise<UnifiedProduct | null> {
    try {
      let query = (supabase as any).from(table).select('*').eq('id', productId);
      
      if (userId !== 'catalog') {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error || !data) return null;
      
      // Normaliser selon la table
      return this.normalizeProduct(data, table);
    } catch (error) {
      console.error(`Error fetching from ${table}:`, error);
      return null;
    }
  }

  /**
   * Helper: Normalise un produit selon sa source
   */
  private static normalizeProduct(data: any, source: string): UnifiedProduct {
    const baseProduct: UnifiedProduct = {
      id: data.id,
      name: data.name || data.title || 'Produit sans nom',
      description: data.description || data.body_html,
      price: data.price || 0,
      cost_price: data.cost_price || data.wholesale_price,
      status: (data.status === 'active' || data.status === 'published') ? 'active' : 'inactive',
      stock_quantity: data.stock_quantity || data.inventory_quantity,
      sku: data.sku || data.global_sku || data.external_sku,
      category: data.category || data.product_type,
      image_url: data.image_url || (Array.isArray(data.images) && data.images[0]) || (Array.isArray(data.image_urls) && data.image_urls[0]),
      images: Array.isArray(data.images) ? data.images : (Array.isArray(data.image_urls) ? data.image_urls : (data.image_url ? [data.image_url] : [])),
      profit_margin: data.profit_margin,
      user_id: data.user_id || 'catalog',
      source: this.mapSourceName(source),
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      // AI Scores
      ai_score: data.ai_score || data.virality_score,
      trend_score: data.trend_score || data.trending_score,
      competition_score: data.competition_score,
      is_winner: data.is_winner,
      is_trending: data.is_trending,
      is_bestseller: data.is_bestseller
    };
    
    return baseProduct;
  }

  /**
   * Helper: Mappe le nom de table vers le type source
   */
  private static mapSourceName(table: string): UnifiedProduct['source'] {
    const mapping: Record<string, UnifiedProduct['source']> = {
      'products': 'products',
      'imported_products': 'imported',
      'premium_products': 'premium',
      'catalog_products': 'catalog',
      'shopify_products': 'shopify',
      'published_products': 'published',
      'feed_products': 'feed',
      'supplier_products': 'supplier'
    };
    return mapping[table] || 'products';
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
