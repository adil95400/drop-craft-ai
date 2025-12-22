import { supabase } from '@/integrations/supabase/client';

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
  supplier?: string;
  profit_margin?: number;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  created_at?: string;
  updated_at?: string;
}

export class PublishProductsService {
  /**
   * Publie un produit (active le statut)
   */
  static async publishProduct(productId: string, userId: string) {
    const { data: product, error: fetchError } = await (supabase
      .from('products') as any)
      .select('*')
      .eq('id', productId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !product) {
      throw new Error('Produit non trouvé');
    }

    // Mettre à jour le statut
    const { data: updatedProduct, error: updateError } = await (supabase
      .from('products') as any)
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      throw new Error('Erreur lors de la publication du produit');
    }

    return updatedProduct as ProductData;
  }

  /**
   * Publication en masse
   */
  static async bulkPublish(productIds: string[], userId: string) {
    const results = {
      success: [] as string[],
      errors: [] as { id: string; error: string }[],
    };

    for (const id of productIds) {
      try {
        await this.publishProduct(id, userId);
        results.success.push(id);
      } catch (error) {
        results.errors.push({
          id,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    return results;
  }

  /**
   * Synchronise le stock d'un produit
   */
  static async syncStock(productId: string, userId: string, newQuantity: number) {
    const { error: updateError } = await (supabase
      .from('products') as any)
      .update({
        stock_quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .eq('user_id', userId);

    if (updateError) {
      throw new Error('Erreur lors de la synchronisation du stock');
    }
  }

  /**
   * Dépublie un produit
   */
  static async unpublishProduct(productId: string, userId: string) {
    const { error: updateError } = await (supabase
      .from('products') as any)
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .eq('user_id', userId);

    if (updateError) {
      throw new Error('Erreur lors de la dépublication');
    }
  }

  /**
   * Calcule la marge bénéficiaire
   */
  private static calculateProfitMargin(
    price: number,
    costPrice: number | null
  ): number | null {
    if (!costPrice || costPrice === 0) return null;
    return ((price - costPrice) / price) * 100;
  }

  /**
   * Récupère les statistiques de publication
   */
  static async getPublishStats(userId: string) {
    const { data: products, error } = await (supabase
      .from('products') as any)
      .select('status')
      .eq('user_id', userId);

    if (error || !products) {
      throw new Error('Erreur lors de la récupération des statistiques');
    }

    const productList = products as ProductData[];
    return {
      total: productList.length,
      published: productList.filter((p) => p.status === 'active').length,
      draft: productList.filter((p) => p.status === 'draft').length,
      archived: productList.filter((p) => p.status === 'archived').length,
    };
  }
}
