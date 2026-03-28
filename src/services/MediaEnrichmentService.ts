/**
 * Media Enrichment Service
 * Multi-source image pipeline with scoring and AI generation
 */
import { supabase } from '@/integrations/supabase/client';

export interface MediaSet {
  id: string;
  product_id: string;
  total_assets: number;
  media_score: number;
  score_breakdown: {
    quantity: number;
    resolution: number;
    diversity: number;
    quality: number;
  };
  media_status: 'ready_to_publish' | 'needs_enrichment' | 'blocked';
  duplicates_removed: number;
  last_enriched_at: string;
}

export interface MediaAsset {
  id: string;
  media_set_id: string;
  product_id: string;
  url: string;
  original_url: string;
  source: string;
  asset_type: string;
  image_type: string;
  is_primary: boolean;
  width: number;
  height: number;
  position: number;
}

export class MediaEnrichmentService {
  /**
   * Collect media from all linked suppliers for a product
   */
  static async collectMedia(productId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('media-engine', {
      body: {
        action: 'collect',
        product_id: productId,
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Score media quality for a product
   */
  static async scoreMedia(productId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('media-engine', {
      body: {
        action: 'score',
        product_id: productId,
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Search for similar images across suppliers
   */
  static async searchSimilar(productId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('media-engine', {
      body: {
        action: 'search_similar',
        product_id: productId,
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Remove duplicate images from a product's media set
   */
  static async deduplicate(productId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('media-engine', {
      body: {
        action: 'deduplicate',
        product_id: productId,
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get media status for all products
   */
  static async getMediaDashboard() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('media-engine', {
      body: { action: 'status' },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get media assets for a product
   */
  static async getProductMedia(productId: string): Promise<MediaAsset[]> {
    const { data, error } = await supabase
      .from('product_media_assets' as any)
      .select('*')
      .eq('product_id', productId)
      .order('position');

    if (error) {
      console.warn('product_media_assets table may not exist yet:', error.message);
      return [];
    }
    return (data || []) as unknown as MediaAsset[];
  }

  /**
   * Batch enrich media for multiple products
   */
  static async batchEnrich(productIds: string[]) {
    const results = [];
    for (const pid of productIds) {
      try {
        const collectResult = await this.collectMedia(pid);
        const dedupeResult = await this.deduplicate(pid);
        const scoreResult = await this.scoreMedia(pid);
        results.push({
          product_id: pid,
          success: true,
          collected: collectResult?.collected || 0,
          duplicates_removed: dedupeResult?.removed || 0,
          score: scoreResult?.score || 0,
        });
      } catch (err: any) {
        results.push({ product_id: pid, success: false, error: err.message });
      }
    }
    return results;
  }

  /**
   * Generate AI-enhanced product images (background removal, lifestyle)
   */
  static async generateAIImage(productId: string, style: 'background_remove' | 'lifestyle' | 'infographic') {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('media-pipeline-processor', {
      body: {
        action: 'ai_enhance',
        product_id: productId,
        style,
      },
    });

    if (error) throw error;
    return data;
  }
}
