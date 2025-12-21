import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ImportHistory {
  id: string;
  user_id: string;
  import_job_id: string;
  supplier_product_id: string | null;
  shopify_product_id: string | null;
  action_type: 'create' | 'update' | 'skip' | 'error';
  status: 'success' | 'failed' | 'skipped';
  error_message: string | null;
  import_data: any;
  created_at: string;
  // Compatibility mappings for legacy code
  job_type?: string;
  supplier_id?: string;
  successful_imports?: number;
  failed_imports?: number;
}

export const useImportHistory = () => {
  return useQuery({
    queryKey: ['import-history'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('import_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Map data to include compatibility fields
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        job_type: item.action_type || 'import',
        supplier_id: item.supplier_product_id,
        successful_imports: item.status === 'success' ? 1 : 0,
        failed_imports: item.status === 'failed' ? 1 : 0
      }));
      
      return mappedData as ImportHistory[];
    },
  });
};
