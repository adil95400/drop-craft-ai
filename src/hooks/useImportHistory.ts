import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ImportHistory {
  id: string;
  source_url: string;
  platform: string;
  status: 'success' | 'failed' | 'partial';
  products_imported: number;
  products_failed: number;
  error_message: string | null;
  settings: any;
  created_at: string;
}

export const useImportHistory = () => {
  return useQuery({
    queryKey: ['import-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ImportHistory[];
    },
  });
};
