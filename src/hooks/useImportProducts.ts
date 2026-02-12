/**
 * useImportProducts — Products list via API V1
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/services/api/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import type { ImportedProduct, AIJob, ScheduledImport } from '@/types/import';

export function useImportProducts() {
  const { user } = useUnifiedAuth();

  const { data: productsData, isLoading: isLoadingProducts, refetch } = useQuery({
    queryKey: ['imported-products', user?.id],
    queryFn: async () => {
      const resp = await productsApi.list({ per_page: 100 });
      return resp.items ?? [];
    },
    enabled: !!user?.id,
  });

  const importedProducts = useMemo<ImportedProduct[]>(() => {
    if (!productsData) return [];

    return productsData.map((p: any) => ({
      id: p.id,
      name: p.name || p.title || '',
      description: p.description,
      price: p.price ? Number(p.price) : null,
      cost_price: p.cost_price ? Number(p.cost_price) : null,
      compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
      sku: p.sku,
      category: p.category,
      brand: p.brand,
      image_url: p.images?.[0] || null,
      image_urls: p.images || null,
      stock_quantity: p.stock_quantity ?? 0,
      status: (p.status as 'draft' | 'published' | 'archived') || 'draft',
      review_status: null,
      ai_optimized: false,
      import_quality_score: null,
      source_url: p.supplier_url || null,
      source_platform: p.supplier || null,
      user_id: '',
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
      seo_keywords: null,
      tags: p.tags,
      currency: 'EUR',
    }));
  }, [productsData]);

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
