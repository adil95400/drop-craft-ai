/**
 * Sprint 8: SEO Dashboard Hook
 * Fetches products from DB, scores them via SeoScoringEngine, and provides aggregated stats
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { scoreSeo, scoreBatch, type SeoInput, type SeoScoreResult } from '@/services/seo/SeoScoringEngine';

export interface ProductSeoScore {
  product_id: string;
  product_title: string;
  product_image: string | null;
  result: SeoScoreResult;
}

export function useSeoDashboard() {
  const { user } = useUnifiedAuth();

  const { data: products, isLoading } = useQuery({
    queryKey: ['seo-dashboard-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, title, description, seo_title, seo_description, images, tags, sku, category, price, url_slug')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const scored = useMemo(() => {
    if (!products || products.length === 0) return { products: [], stats: null };

    const inputs: SeoInput[] = products.map((p: any) => ({
      title: p.title || '',
      description: p.description || '',
      seo_title: p.seo_title,
      seo_description: p.seo_description,
      images: Array.isArray(p.images)
        ? p.images.map((img: any) => typeof img === 'string' ? { url: img } : { url: img.url || '', alt: img.alt })
        : [],
      tags: Array.isArray(p.tags) ? p.tags : [],
      sku: p.sku,
      category: p.category,
      price: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0,
      url_slug: p.url_slug,
    }));

    const { results, stats } = scoreBatch(inputs);

    const productScores: ProductSeoScore[] = products.map((p: any, i: number) => ({
      product_id: p.id,
      product_title: p.title || 'Sans titre',
      product_image: Array.isArray(p.images) && p.images.length > 0
        ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0]?.url)
        : null,
      result: results[i],
    }));

    return { products: productScores, stats };
  }, [products]);

  return {
    isLoading,
    products: scored.products,
    stats: scored.stats,
    totalProducts: products?.length ?? 0,
  };
}
