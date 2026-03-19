import { supabase } from '@/integrations/supabase/client';

export interface PublicationLog {
  id: string;
  user_id: string;
  product_id: string | null;
  channel_type: string;
  channel_id: string;
  channel_name: string;
  action: string;
  status: string;
  external_id: string | null;
  external_url: string | null;
  error_message: string | null;
  metadata: Record<string, any>;
  duration_ms: number | null;
  created_at: string;
}

export interface ScheduledPublication {
  id: string;
  product_id: string | null;
  channel_type: string;
  channel_id: string;
  channel_name: string;
  status: string;
  scheduled_at: string;
  published_at: string | null;
  error_message: string | null;
  custom_message: string | null;
  created_at: string;
}

export class PublishProductsService {
  /**
   * Publish a product to one or more marketplace stores via the edge function
   */
  static async publishToStores(productId: string, storeIds: string[]) {
    const { data, error } = await supabase.functions.invoke('marketplace-publish', {
      body: { productId, storeIds }
    });
    if (error) throw new Error(error.message || 'Publication failed');
    return data;
  }

  /**
   * Publish a product to social media channels
   */
  static async publishToSocial(productId: string, channels: string[], customMessage?: string, scheduleAt?: string) {
    const { data, error } = await supabase.functions.invoke('social-media-publish', {
      body: { productId, channels, customMessage, scheduleAt }
    });
    if (error) throw new Error(error.message || 'Social publication failed');
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
    const results = { success: [] as string[], errors: [] as { id: string; error: string }[] };
    for (const productId of productIds) {
      try {
        await this.publishToStores(productId, storeIds);
        results.success.push(productId);
      } catch (error) {
        results.errors.push({ id: productId, error: error instanceof Error ? error.message : 'Erreur inconnue' });
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
   * Unpublish a product
   */
  static async unpublishProduct(productId: string, userId: string) {
    const { error: updateError } = await supabase
      .from('products')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('user_id', userId);
    if (updateError) throw new Error('Erreur lors de la dépublication');

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
   * Get user's available stores (from stores table + integrations table)
   */
  static async getUserStores(userId: string) {
    const { data: stores } = await supabase
      .from('stores')
      .select('id, name, platform, status')
      .eq('user_id', userId)
      .eq('status', 'active');

    const { data: integrations } = await supabase
      .from('integrations')
      .select('id, platform_name, platform, store_url, connection_status')
      .eq('user_id', userId)
      .eq('connection_status', 'connected');

    return [
      ...(stores || []).map(s => ({ id: s.id, name: s.name, platform: s.platform, status: s.status })),
      ...(integrations || []).map(i => ({ id: i.id, name: i.platform_name || i.platform, platform: i.platform, status: 'active' as const })),
    ];
  }

  /**
   * Get publication logs for a product or all products
   */
  static async getPublicationLogs(userId: string, productId?: string, limit = 50): Promise<PublicationLog[]> {
    let query = (supabase.from('publication_logs') as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (productId) query = query.eq('product_id', productId);

    const { data, error } = await query;
    if (error) throw new Error('Erreur lors de la récupération des logs');
    return data || [];
  }

  /**
   * Get scheduled publications
   */
  static async getScheduledPublications(userId: string): Promise<ScheduledPublication[]> {
    const { data, error } = await (supabase.from('scheduled_publications') as any)
      .select('*')
      .eq('user_id', userId)
      .in('status', ['scheduled', 'publishing'])
      .order('scheduled_at', { ascending: true });

    if (error) throw new Error('Erreur lors de la récupération des publications planifiées');
    return data || [];
  }

  /**
   * Cancel a scheduled publication
   */
  static async cancelScheduledPublication(publicationId: string) {
    const { error } = await (supabase.from('scheduled_publications') as any)
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', publicationId);
    if (error) throw new Error('Erreur lors de l\'annulation');
  }

  /**
   * Get publication stats across all channels
   */
  static async getPublicationStats(userId: string) {
    const { data: logs, error } = await (supabase.from('publication_logs') as any)
      .select('channel_type, channel_id, status')
      .eq('user_id', userId);

    if (error) return { total: 0, byChannel: {}, byStatus: {} };

    const list = logs || [];
    const byChannel: Record<string, { success: number; failed: number; pending: number }> = {};
    const byStatus = { success: 0, failed: 0, pending: 0 };

    for (const log of list) {
      const key = log.channel_id;
      if (!byChannel[key]) byChannel[key] = { success: 0, failed: 0, pending: 0 };
      byChannel[key][log.status as 'success' | 'failed' | 'pending']++;
      byStatus[log.status as 'success' | 'failed' | 'pending']++;
    }

    return { total: list.length, byChannel, byStatus };
  }
}
