import { supabase } from '@/integrations/supabase/client';
import { fetchAllRows, fetchPage, batchInsert, batchUpsert, type PaginatedResult } from '@/utils/supabasePagination';

interface ProductData {
  id: string;
  user_id: string;
  title?: string;
  description?: string;
  price?: number;
  cost_price?: number;
  sku?: string;
  category?: string;
  stock_quantity?: number;
  status?: string;
  image_url?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export class ProductsService {
  /**
   * Récupère tous les produits de l'utilisateur (avec pagination automatique)
   * Gère les catalogues de plus de 1000 produits
   */
  static async getProducts(userId: string, onProgress?: (loaded: number) => void): Promise<ProductData[]> {
    return fetchAllRows<ProductData>('products', userId, {
      pageSize: 500,
      orderBy: 'created_at',
      ascending: false,
      onProgress
    });
  }

  /**
   * Récupère une page de produits (pour affichage paginé)
   */
  static async getProductsPage(userId: string, page: number = 0, pageSize: number = 50): Promise<PaginatedResult<ProductData>> {
    return fetchPage<ProductData>('products', userId, page, { pageSize, orderBy: 'created_at', ascending: false });
  }

  /**
   * Récupère un produit par ID
   */
  static async getProduct(id: string, userId: string) {
    const { data, error } = await (supabase
      .from('products') as any)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data as ProductData;
  }

  /**
   * Crée un nouveau produit
   */
  static async createProduct(product: Partial<ProductData>) {
    const { data, error } = await (supabase
      .from('products') as any)
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data as ProductData;
  }

  /**
   * Met à jour un produit
   */
  static async updateProduct(id: string, userId: string, updates: Partial<ProductData>) {
    const { data, error } = await (supabase
      .from('products') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as ProductData;
  }

  /**
   * Supprime un produit
   */
  static async deleteProduct(id: string, userId: string) {
    const { error } = await (supabase
      .from('products') as any)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Met à jour le statut d'un produit
   */
  static async updateProductStatus(id: string, userId: string, status: string) {
    return this.updateProduct(id, userId, { status });
  }

  /**
   * Recherche des produits
   */
  static async searchProducts(userId: string, searchTerm: string) {
    const { data, error } = await (supabase
      .from('products') as any)
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ProductData[];
  }

  /**
   * Statistiques produits
   */
  static async getProductStats(userId: string) {
    const { data: products, error } = await (supabase
      .from('products') as any)
      .select('price, status, cost_price')
      .eq('user_id', userId);

    if (error) throw error;

    const productList = (products || []) as ProductData[];
    const stats = {
      total: productList.length,
      published: productList.filter(p => p.status === 'active').length,
      draft: productList.filter(p => p.status === 'draft').length,
      archived: productList.filter(p => p.status === 'archived').length,
      optimized: 0,
      totalValue: productList.reduce((sum, p) => sum + (p.price || 0), 0),
      avgPrice: productList.length > 0 
        ? productList.reduce((sum, p) => sum + (p.price || 0), 0) / productList.length 
        : 0,
      totalMargin: productList.reduce((sum, p) => {
        if (p.cost_price && p.price) {
          return sum + (p.price - p.cost_price);
        }
        return sum;
      }, 0)
    };

    return stats;
  }

  /**
   * Optimisation AI d'un produit
   */
  static async optimizeProduct(id: string, userId: string) {
    const product = await this.getProduct(id, userId);
    
    const optimizedData: Partial<ProductData> = {
      title: product.title,
      description: product.description,
      updated_at: new Date().toISOString()
    };

    return this.updateProduct(id, userId, optimizedData);
  }

  /**
   * Import en masse de produits
   */
  /**
   * Import en masse de produits avec gestion des gros volumes
   */
  static async bulkImport(
    products: Partial<ProductData>[], 
    onProgress?: (inserted: number, total: number) => void
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    return batchInsert<Partial<ProductData>>('products', products, { 
      batchSize: 100, 
      onProgress 
    });
  }

  /**
   * Upsert en masse (mise à jour ou insertion)
   */
  static async bulkUpsert(
    products: Partial<ProductData>[],
    onProgress?: (processed: number, total: number) => void
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    return batchUpsert<Partial<ProductData>>(
      'products', 
      products, 
      ['user_id', 'sku'], 
      { batchSize: 50, onProgress }
    );
  }

  /**
   * Suppression en masse
   */
  static async bulkDelete(ids: string[], userId: string) {
    const { error } = await (supabase
      .from('products') as any)
      .delete()
      .in('id', ids)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Mise à jour en masse du statut
   */
  static async bulkUpdateStatus(ids: string[], userId: string, status: string) {
    const { data, error } = await (supabase
      .from('products') as any)
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return data as ProductData[];
  }
}
