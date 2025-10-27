import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['imported_products']['Row'];
type ProductInsert = Database['public']['Tables']['imported_products']['Insert'];
type ProductUpdate = Database['public']['Tables']['imported_products']['Update'];

export class ProductsService {
  /**
   * Récupère tous les produits de l'utilisateur
   */
  static async getProducts(userId: string) {
    const { data, error } = await supabase
      .from('imported_products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Récupère un produit par ID
   */
  static async getProduct(id: string, userId: string) {
    const { data, error } = await supabase
      .from('imported_products')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Crée un nouveau produit
   */
  static async createProduct(product: ProductInsert) {
    const { data, error } = await supabase
      .from('imported_products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Met à jour un produit
   */
  static async updateProduct(id: string, userId: string, updates: ProductUpdate) {
    const { data, error } = await supabase
      .from('imported_products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Supprime un produit
   */
  static async deleteProduct(id: string, userId: string) {
    const { error } = await supabase
      .from('imported_products')
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
    const { data, error } = await supabase
      .from('imported_products')
      .select('*')
      .eq('user_id', userId)
      .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Statistiques produits
   */
  static async getProductStats(userId: string) {
    const { data: products, error } = await supabase
      .from('imported_products')
      .select('price, status, ai_optimized, cost_price')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      total: products.length,
      published: products.filter(p => p.status === 'published').length,
      draft: products.filter(p => p.status === 'draft').length,
      archived: products.filter(p => p.status === 'archived').length,
      optimized: products.filter(p => p.ai_optimized).length,
      totalValue: products.reduce((sum, p) => sum + (p.price || 0), 0),
      avgPrice: products.length > 0 
        ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length 
        : 0,
      totalMargin: products.reduce((sum, p) => {
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
    // Simuler l'optimisation AI
    const product = await this.getProduct(id, userId);
    
    const optimizedData: ProductUpdate = {
      ai_optimized: true,
      name: product.name, // L'AI améliorerait le titre
      description: product.description, // L'AI améliorerait la description
      updated_at: new Date().toISOString()
    };

    return this.updateProduct(id, userId, optimizedData);
  }

  /**
   * Import en masse de produits
   */
  static async bulkImport(products: ProductInsert[]) {
    const { data, error } = await supabase
      .from('imported_products')
      .insert(products)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Suppression en masse
   */
  static async bulkDelete(ids: string[], userId: string) {
    const { error } = await supabase
      .from('imported_products')
      .delete()
      .in('id', ids)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Mise à jour en masse du statut
   */
  static async bulkUpdateStatus(ids: string[], userId: string, status: string) {
    const { data, error } = await supabase
      .from('imported_products')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return data;
  }
}
