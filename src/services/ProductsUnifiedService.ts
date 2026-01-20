import { supabase } from '@/integrations/supabase/client'
import { fetchAllRecords } from '@/utils/supabaseUnlimited'

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
    try {
      // Use unlimited fetch to bypass Supabase 1000 row limit
      const { data, error } = await fetchAllRecords<any>('products', {
        select: '*',
        userId: options?.includeGlobalProducts ? undefined : userId,
        orderBy: { column: 'created_at', ascending: false },
        filters: {
          ...(filters?.status && { status: filters.status }),
          ...(filters?.category && { category: filters.category })
        }
      });

      if (error) throw error;

      let products = data || [];

      // Apply search filter client-side (for better performance with LIKE queries)
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        products = products.filter((p: any) => 
          (p.name?.toLowerCase().includes(searchLower)) ||
          (p.title?.toLowerCase().includes(searchLower)) ||
          (p.sku?.toLowerCase().includes(searchLower))
        );
      }

      // Apply lowStock filter client-side
      if (filters?.lowStock) {
        products = products.filter((p: any) => (p.stock_quantity || 0) < 10);
      }

      console.log(`✓ products table loaded: ${products.length} products for user ${userId}`);

      return products.map((p: any) => ({
        id: p.id,
        name: p.name || p.title || 'Produit sans nom',
        description: p.description || undefined,
        price: p.price || 0,
        cost_price: p.cost_price || undefined,
        status: (p.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
        stock_quantity: p.stock_quantity || undefined,
        sku: p.sku || undefined,
        category: p.category || undefined,
        image_url: p.image_url || undefined,
        images: p.image_url ? [p.image_url] : [],
        profit_margin: (p as any).profit_margin || undefined,
        user_id: p.user_id,
        source: 'products' as const,
        variants: [] as ProductVariant[],
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString()
      }));
    } catch (error) {
      console.error('getProductsTable failed:', error);
      return [];
    }
  }

  /**
   * Table imported_products - Produits importés depuis CSV/API
   */
  private static async getImportedProducts(userId: string, filters?: any, options?: ProductFetchOptions): Promise<UnifiedProduct[]> {
    try {
      // Use unlimited fetch to bypass Supabase 1000 row limit
      const { data, error } = await fetchAllRecords<any>('imported_products', {
        select: '*',
        userId: options?.includeGlobalProducts ? undefined : userId,
        orderBy: { column: 'created_at', ascending: false },
        filters: {
          ...(filters?.category && { category: filters.category })
        }
      });
      
      if (error) {
        console.error('Error fetching imported_products:', error)
        throw error
      }

      let products = data || [];

      // Apply search filter client-side
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        products = products.filter((p: any) => 
          (p.name?.toLowerCase().includes(searchLower)) ||
          (p.sku?.toLowerCase().includes(searchLower))
        );
      }

      console.log(`✓ imported_products loaded: ${products.length} products for user ${userId}`)
      
      return products.map((p: any) => {
        // Parse variants from imported product
        const variants: ProductVariant[] = Array.isArray(p.variants) 
          ? p.variants.map((v: any, idx: number) => ({
              id: v.sku || v.id || `variant-${idx}`,
              name: v.name || 'Variante',
              sku: v.sku || undefined,
              price: v.price || undefined,
              stock_quantity: v.stock || v.stock_quantity || undefined,
              attributes: v.attributes || {},
              image: v.image || undefined
            }))
          : [];

        // Clean image URLs - remove any corrupted JSON strings
        const cleanImages = (Array.isArray(p.image_urls) ? p.image_urls : [])
          .filter((img: string) => 
            typeof img === 'string' && 
            img.startsWith('http') && 
            !img.includes('":[') && 
            !img.includes('blob:')
          );

        // Clean video URLs - filter valid URLs
        const cleanVideos = (Array.isArray(p.video_urls) ? p.video_urls : [])
          .filter((vid: string) => 
            typeof vid === 'string' && 
            vid.startsWith('http') && 
            !vid.includes('blob:')
          );

        return {
          id: p.id,
          name: p.name || p.product_id || 'Produit sans nom',
          description: p.description || undefined,
          price: p.price || 0,
          cost_price: p.cost_price || undefined,
          status: (p.status === 'published' || p.status === 'imported' || p.status === 'active' || p.status === 'draft' ? 'active' : 'inactive') as 'active' | 'inactive',
          stock_quantity: p.stock_quantity || undefined,
          sku: p.sku || undefined,
          category: p.category || undefined,
          image_url: cleanImages.length > 0 ? cleanImages[0] : undefined,
          images: cleanImages,
          videos: cleanVideos,
          profit_margin: p.cost_price && p.price ? ((p.price - p.cost_price) / p.price * 100) : undefined,
          user_id: p.user_id,
          source: 'imported' as const,
          source_url: p.source_url || undefined,
          brand: p.brand || p.supplier_name || undefined,
          specifications: p.specifications || undefined,
          variants,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || p.created_at || new Date().toISOString()
        };
      })
    } catch (error) {
      console.error('getImportedProducts failed:', error)
      return []
    }
  }

  /**
   * Table premium_products - NON EXISTANTE - Retourner tableau vide
   * Cette table n'existe pas dans la base de données actuelle
   */
  private static async getPremiumProducts(userId: string, filters?: any, options?: ProductFetchOptions): Promise<UnifiedProduct[]> {
    // Table premium_products n'existe pas - retourner un tableau vide silencieusement
    return []
  }

  /**
   * Table catalog_products - Catalogue global disponible pour tous les utilisateurs
   */
  private static async getCatalogProducts(filters?: any, options?: ProductFetchOptions): Promise<UnifiedProduct[]> {
    try {
      // Use unlimited fetch to bypass Supabase 1000 row limit
      const { data, error } = await fetchAllRecords<any>('catalog_products', {
        select: '*',
        orderBy: { column: 'created_at', ascending: false },
        filters: {
          ...(filters?.category && { category: filters.category })
        }
      });

      if (error) throw error;

      let products = data || [];

      // Apply search filter client-side
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        products = products.filter((p: any) => 
          (p.title?.toLowerCase().includes(searchLower)) ||
          (p.name?.toLowerCase().includes(searchLower))
        );
      }

      console.log(`✓ catalog_products loaded: ${products.length} products`);

      return products.map((p: any) => ({
        id: p.id,
        name: p.title || p.name || 'Produit sans nom',
        description: p.description || undefined,
        price: p.price || 0,
        cost_price: p.cost_price || undefined,
        status: 'active' as 'active' | 'inactive',
        stock_quantity: p.stock_quantity || undefined,
        sku: p.sku || undefined,
        category: p.category || undefined,
        image_url: Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls[0] : undefined,
        images: Array.isArray(p.image_urls) ? p.image_urls : [],
        profit_margin: p.profit_margin || undefined,
        user_id: p.user_id || 'catalog',
        source: 'catalog' as const,
        variants: [] as ProductVariant[],
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString()
      }));
    } catch (error) {
      console.error('getCatalogProducts failed:', error);
      return [];
    }
  }

  /**
   * Table shopify_products - Produits synchronisés depuis Shopify
   */
  private static async getShopifyProducts(userId: string, filters?: any, options?: ProductFetchOptions): Promise<UnifiedProduct[]> {
    // Table shopify_products n'existe pas - retourner un tableau vide silencieusement
    // Les produits Shopify sont gérés via l'API Shopify directement
    return []
  }

  /**
   * Table published_products - NON EXISTANTE - Retourner tableau vide
   * Cette table n'existe pas dans la base de données actuelle
   */
  private static async getPublishedProducts(userId: string, filters?: any, options?: ProductFetchOptions): Promise<UnifiedProduct[]> {
    // Table published_products n'existe pas - retourner un tableau vide silencieusement
    return []
  }

  /**
   * Table feed_products - Produits optimisés pour les flux (Google Shopping, etc.)
   */
  private static async getFeedProducts(userId: string, filters?: any, options?: ProductFetchOptions): Promise<UnifiedProduct[]> {
    try {
      // Use unlimited fetch to bypass Supabase 1000 row limit
      const { data, error } = await fetchAllRecords<any>('feed_products', {
        select: '*',
        userId,
        orderBy: { column: 'created_at', ascending: false }
      });

      if (error) throw error;

      console.log(`✓ feed_products loaded: ${(data || []).length} products for user ${userId}`);

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
      }));
    } catch (error) {
      console.error('Error loading feed_products:', error);
      return [];
    }
  }

  /**
   * Table supplier_products - Produits depuis les fournisseurs connectés (extension Chrome)
   * Note: Les produits sont importés avec le champ 'title' et le prix en centimes
   */
  private static async getSupplierProducts(userId: string, filters?: any, options?: ProductFetchOptions): Promise<UnifiedProduct[]> {
    try {
      // Use unlimited fetch to bypass Supabase 1000 row limit
      const { data, error } = await fetchAllRecords<any>('supplier_products', {
        select: '*',
        userId,
        orderBy: { column: 'created_at', ascending: false },
        filters: {
          ...(filters?.category && { category: filters.category })
        }
      });

      if (error) {
        console.error('Error fetching supplier_products:', error);
        throw error;
      }

      let products = data || [];

      // Apply search filter client-side
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        products = products.filter((p: any) => 
          (p.title?.toLowerCase().includes(searchLower)) ||
          (p.description?.toLowerCase().includes(searchLower)) ||
          (p.sku?.toLowerCase().includes(searchLower))
        );
      }

      console.log(`✓ supplier_products loaded: ${products.length} products for user ${userId}`);

      return products.map((p: any) => {
        // Le prix peut être en centimes (ex: 59899 = 598.99€) ou en euros
        // On détecte si le prix est > 1000 on divise par 100
        let price = p.price || 0;
        if (price > 10000) {
          price = price / 100;
        }
        
        // L'image peut être dans image_url (string) ou images (array)
        const imageUrl = p.image_url || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : undefined);
        const images = Array.isArray(p.images) && p.images.length > 0 
          ? p.images 
          : (p.image_url ? [p.image_url] : []);

        return {
          id: p.id,
          name: p.title || p.name || 'Produit sans nom',
          description: p.description,
          price: price,
          cost_price: p.cost_price ? (p.cost_price > 10000 ? p.cost_price / 100 : p.cost_price) : undefined,
          status: (p.is_active === false ? 'inactive' : 'active') as 'active' | 'inactive',
          stock_quantity: p.stock_quantity,
          sku: p.sku || p.global_sku || p.external_sku,
          category: p.category,
          image_url: imageUrl,
          images: images,
          profit_margin: p.profit_margin,
          user_id: userId,
          source: 'supplier' as const,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString(),
          // Champs additionnels pour supplier_products
          ai_score: p.ai_score,
          is_winner: p.is_winner,
          is_trending: p.is_trending
        };
      });
    } catch (error) {
      console.error('Error loading supplier_products:', error);
      return [];
    }
  }

  /**
   * Créer/Mettre à jour un produit
   */
  static async upsertProduct(userId: string, product: Partial<UnifiedProduct>): Promise<UnifiedProduct> {
    const { data, error } = await (supabase as any)
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
      id: data.id,
      name: data.name || 'Produit sans nom',
      description: data.description || undefined,
      price: data.price || 0,
      cost_price: data.cost_price || undefined,
      status: (data.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
      stock_quantity: data.stock_quantity || undefined,
      sku: data.sku || undefined,
      category: data.category || undefined,
      image_url: data.image_url || undefined,
      images: data.image_url ? [data.image_url] : [],
      user_id: data.user_id,
      source: 'products' as const,
      variants: [] as ProductVariant[],
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
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
      // Pour catalog_products, ne pas filtrer par user_id
      const isCatalog = table === 'catalog_products';
      
      let query = (supabase as any).from(table).select('*').eq('id', productId);
      
      // Ne pas appliquer le filtre user_id pour le catalog
      if (!isCatalog && userId !== 'catalog') {
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
    const { data: imported, error } = await (supabase as any)
      .from('imported_products')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error

    const toInsert = (imported || []).map((p: any) => ({
      id: p.id,
      name: p.name || p.product_id || 'Produit',
      description: p.description || undefined,
      price: p.price || 0,
      cost_price: p.cost_price || undefined,
      status: (p.status === 'published' || p.status === 'imported' ? 'active' : 'inactive') as 'active' | 'inactive',
      stock_quantity: p.stock_quantity || undefined,
      sku: p.sku || undefined,
      category: p.category || undefined,
      image_url: Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls[0] : null,
      user_id: userId
    }))

    if (toInsert.length === 0) return 0

    const { error: insertError } = await (supabase as any)
      .from('products')
      .upsert(toInsert, { onConflict: 'id' })

    if (insertError) throw insertError
    return toInsert.length
  }
}
