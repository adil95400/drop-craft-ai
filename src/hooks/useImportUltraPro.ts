/**
 * useImportUltraPro - Wrapper de compatibilité
 * @deprecated Utiliser useImport directement - Ce fichier sera supprimé dans une version future
 * 
 * Ce hook redirige vers useImport et fournit une interface compatible
 * pour les composants existants pendant la phase de migration.
 */

import { useImport } from './useImport';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Type compatible avec l'ancien hook
export interface ImportedProduct {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  cost_price?: number | null;
  compare_at_price?: number | null;
  sku?: string | null;
  category?: string | null;
  brand?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  stock_quantity?: number | null;
  status: 'draft' | 'published' | 'archived';
  review_status?: 'pending' | 'approved' | 'rejected' | null;
  ai_optimized?: boolean | null;
  import_quality_score?: number | null;
  source_url?: string | null;
  source_platform?: string | null;
  user_id?: string | null;
  created_at: string;
  updated_at?: string | null;
  supplier_name?: string | null;
  supplier_sku?: string | null;
  supplier_price?: number | null;
  supplier_url?: string | null;
  weight?: number | null;
  weight_unit?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  tags?: string[] | null;
  currency?: string | null;
}

export interface ScheduledImport {
  id: string;
  name: string;
  source_type: string;
  schedule: string;
  is_active: boolean;
  last_run_at?: string | null;
  next_run_at?: string | null;
  created_at: string;
}

export interface AIJob {
  id: string;
  job_type: string;
  status: string;
  target_id?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export function useImportUltraPro() {
  const importHook = useImport();

  // Query products directly from database
  const { data: productsData, isLoading: isLoadingProducts, refetch: refetchProducts } = useQuery({
    queryKey: ['imported-products-ultrapro'],
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

  // Map products to ImportedProduct interface
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

  // Mock empty arrays for deprecated features
  const scheduledImports: ScheduledImport[] = [];
  const aiJobs: AIJob[] = [];

  return {
    // Products
    importedProducts,
    isLoadingProducts,
    
    // Import operations from useImport
    importFromCSV: importHook.importFromCsv,
    importFromURL: importHook.urlImport,
    isImporting: importHook.isImporting,
    importProgress: 0,
    
    // Deprecated/empty features (for compatibility)
    scheduledImports,
    aiJobs,
    activeBulkImport: null,
    bulkImportProgress: 0,
    
    // Product operations
    updateProduct: async (id: string, data: Partial<ImportedProduct>) => {
      console.warn('[DEPRECATED] useImportUltraPro.updateProduct - use direct Supabase calls');
      return { success: false };
    },
    deleteProduct: async (id: string) => {
      console.warn('[DEPRECATED] useImportUltraPro.deleteProduct - use direct Supabase calls');
      return { success: false };
    },
    
    // Bulk operations
    publishProducts: async (ids: string[]) => {
      console.warn('[DEPRECATED] useImportUltraPro.publishProducts - use direct Supabase calls');
      return { success: false };
    },
    archiveProducts: async (ids: string[]) => {
      console.warn('[DEPRECATED] useImportUltraPro.archiveProducts - use direct Supabase calls');
      return { success: false };
    },
    
    // Refresh
    refetch: refetchProducts,
  };
}

export default useImportUltraPro;
