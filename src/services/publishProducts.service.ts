import { supabase } from '@/integrations/supabase/client';

export class PublishProductsService {
  /**
   * Publish a product to one or more stores via the edge function
   */
  static async publishToStores(productId: string, storeIds: string[]) {
    const { data, error } = await supabase.functions.invoke('marketplace-publish', {
      body: { productId, storeIds }
    });

    if (error) throw new Error(error.message || 'Publication failed');
    return data;
  }

  /**
   * Publish a product locally (set status to active)
   */
  static async publishProduct(productId: string, userId: string) {
    const { data, error } = await supabase
      .from('products')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error('Erreur lors de la publication du produit');
    return data;
  }

  /**
   * Bulk publish products to stores
   */
  static async bulkPublishToStores(productIds: string[], storeIds: string[]) {
    const results = {
      success: [] as string[],
      errors: [] as { id: string; error: string }[],
    };

    for (const productId of productIds) {
      try {
        await this.publishToStores(productId, storeIds);
        results.success.push(productId);
      } catch (error) {
        results.errors.push({
          id: productId,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    return results;
  }

  /**
   * Bulk publish (status only, no store push)
   */
  static async bulkPublish(productIds: string[], userId: string) {
    const results = { success: [] as string[], errors: [] as { id: string; error: string }[] };

    for (const id of productIds) {
      try {
        await this.publishProduct(id, userId);
        results.success.push(id);
      } catch (error) {
        results.errors.push({ id, error: error instanceof Error ? error.message : 'Erreur' });
      }
    }

    return results;
  }

  /**
   * Sync stock for a product
   */
  static async syncStock(productId: string, userId: string, newQuantity: number) {
    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: newQuantity, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('user_id', userId);

    if (error) throw new Error('Erreur lors de la synchronisation du stock');
  }

  /**
   * Unpublish a product (set status to archived, mark store links as unpublished)
   */
  static async unpublishProduct(productId: string, userId: string) {
    const { error: updateError } = await supabase
      .from('products')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('user_id', userId);

    if (updateError) throw new Error('Erreur lors de la dépublication');

    // Also mark all store links as unpublished
    await supabase
      .from('product_store_links')
      .update({ published: false, sync_status: 'pending', updated_at: new Date().toISOString() })
      .eq('product_id', productId);
  }

  /**
   * Get publish stats for user
   */
  static async getPublishStats(userId: string) {
    const { data: products, error } = await supabase
      .from('products')
      .select('status')
      .eq('user_id', userId);

    if (error) throw new Error('Erreur lors de la récupération des statistiques');

    const list = products || [];
    return {
      total: list.length,
      published: list.filter((p) => p.status === 'active').length,
      draft: list.filter((p) => p.status === 'draft').length,
      archived: list.filter((p) => p.status === 'archived').length,
    };
  }

  /**
   * Get store links for a product
   */
  static async getProductStoreLinks(productId: string) {
    const { data, error } = await supabase
      .from('product_store_links')
      .select('*, stores(*)')
      .eq('product_id', productId);

    if (error) throw new Error('Erreur lors de la récupération des liens boutique');
    return data || [];
  }

  /**
   * Get user's available stores
   */
  static async getUserStores(userId: string) {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) throw new Error('Erreur lors de la récupération des boutiques');
    return data || [];
  }
}
