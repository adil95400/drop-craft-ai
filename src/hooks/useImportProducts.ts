/**
 * useImportProducts - Hook simplifié pour les produits importés
 * Remplace useImportUltraPro (deprecated)
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ImportedProduct, AIJob, ScheduledImport } from '@/types/import';

export function useImportProducts() {
  const { data: productsData, isLoading: isLoadingProducts, refetch } = useQuery({
    queryKey: ['imported-products'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }
      return data || [];
    },
  });

  const importedProducts = useMemo<ImportedProduct[]>(() => {
    if (!productsData) return [];
    
    return productsData.map((p: any) => ({
      id: p.id,
      name: p.name || '',
      description: p.description,
      price: p.price ? Number(p.price) : null,
      cost_price: p.cost_price ? Number(p.cost_price) : null,
      compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
      sku: p.sku,
      category: p.category,
      brand: p.brand,
      image_url: p.image_url,
      image_urls: p.additional_images || null,
      stock_quantity: p.stock_quantity,
      status: (p.status as 'draft' | 'published' | 'archived') || 'draft',
      review_status: p.review_status || null,
      ai_optimized: p.ai_optimized || false,
      import_quality_score: p.import_quality_score || null,
      source_url: p.supplier_url || null,
      source_platform: p.supplier || null,
      user_id: p.user_id,
      created_at: p.created_at,
      updated_at: p.updated_at,
      supplier_name: p.supplier || null,
      supplier_sku: p.barcode || null,
      supplier_price: p.cost_price ? Number(p.cost_price) : null,
      supplier_url: p.supplier_url || null,
      weight: p.weight ? Number(p.weight) : null,
      weight_unit: p.weight_unit,
      seo_title: p.seo_title,
      seo_description: p.seo_description,
      seo_keywords: p.meta_keywords || null,
      tags: p.tags,
      currency: 'EUR',
    }));
  }, [productsData]);

  // Empty arrays for deprecated features (legacy compatibility)
  const scheduledImports: ScheduledImport[] = [];
  const aiJobs: AIJob[] = [];

  return {
    importedProducts,
    isLoadingProducts,
    scheduledImports,
    aiJobs,
    refetch,
  };
}

export default useImportProducts;
