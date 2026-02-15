import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useShopifyImport() {
  const queryClient = useQueryClient();

  // Get product mappings from field_mappings table
  const { data: mappings, isLoading: isLoadingMappings } = useQuery({
    queryKey: ['shopify-product-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('field_mappings')
        .select('*')
        .eq('source_entity', 'shopify_product')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Get import jobs
  const { data: importJobs, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['shopify-import-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('source_platform', 'shopify')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    }
  });

  // Get import history (from activity_logs since import_history was dropped)
  const { data: importHistory } = useQuery({
    queryKey: ['shopify-import-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('entity_type', 'shopify_import')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []).map((entry: any) => ({
        id: entry.id,
        status: entry.severity === 'error' ? 'failed' : 'success',
        created_at: entry.created_at,
        action_type: entry.action || 'import',
        supplier_products: { name: entry.description || 'Import Shopify' },
      }));
    }
  });

  // Import single product
  const importSingle = useMutation({
    mutationFn: async (productId: string) => {
      const { data, error } = await supabase.functions.invoke('import-to-shopify', {
        body: { action: 'import_single', product_id: productId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopify-product-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['shopify-import-history'] });
      toast.success(`Produit importé vers Shopify avec succès`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur d'import: ${error.message}`);
    }
  });

  // Import bulk products
  const importBulk = useMutation({
    mutationFn: async ({ 
      productIds, 
      settings 
    }: { 
      productIds: string[]; 
      settings?: any 
    }) => {
      const { data, error } = await supabase.functions.invoke('import-to-shopify', {
        body: { 
          action: 'import_bulk', 
          product_ids: productIds,
          import_settings: settings
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shopify-import-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['shopify-product-mappings'] });
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(`Erreur d'import groupé: ${error.message}`);
    }
  });

  // Sync mapping (update Shopify with latest supplier data)
  const syncMapping = useMutation({
    mutationFn: async (mappingId: string) => {
      const { data, error } = await supabase.functions.invoke('import-to-shopify', {
        body: { action: 'sync_mapping', mapping_id: mappingId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopify-product-mappings'] });
      toast.success('Produit synchronisé avec Shopify');
    },
    onError: (error: Error) => {
      toast.error(`Erreur de synchronisation: ${error.message}`);
    }
  });

  // Check job status
  const checkJobStatus = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke('import-to-shopify', {
        body: { action: 'check_job_status', job_id: jobId }
      });

      if (error) throw error;
      return data.job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopify-import-jobs'] });
    }
  });

  return {
    mappings,
    isLoadingMappings,
    importJobs,
    isLoadingJobs,
    importHistory,
    importSingle: importSingle.mutate,
    isImportingSingle: importSingle.isPending,
    importBulk: importBulk.mutate,
    isImportingBulk: importBulk.isPending,
    syncMapping: syncMapping.mutate,
    isSyncing: syncMapping.isPending,
    checkJobStatus: checkJobStatus.mutate
  };
}
