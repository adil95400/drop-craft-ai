import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AliExpressProduct {
  product_id: string;
  title: string;
  price: number;
  original_price: number;
  discount_rate: number;
  rating: number;
  review_count: number;
  image_urls: string[];
  video_urls: string[];
  category: string;
  tags: string[];
  supplier_name: string;
  shipping_time: string;
  min_order_quantity: number;
  description?: string;
  source_url: string;
  stock_quantity?: number;
  sku: string;
  specifications?: Record<string, string>;
}

export function useScrapeAliExpressProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (url: string) => {
      const { data, error } = await supabase.functions.invoke('aliexpress-scraper', {
        body: {
          action: 'scrape_product',
          url
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to scrape product');
      
      return data as { success: boolean; product: AliExpressProduct; saved_id?: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] });
      toast.success('Produit importé depuis AliExpress');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useSearchAliExpressProducts() {
  return useMutation({
    mutationFn: async ({ 
      keywords, 
      category, 
      limit = 20 
    }: { 
      keywords?: string; 
      category?: string; 
      limit?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('aliexpress-scraper', {
        body: {
          action: 'search_products',
          keywords,
          category,
          limit
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Search failed');
      
      return data as { success: boolean; products: Partial<AliExpressProduct>[]; total: number };
    },
    onError: (error: Error) => {
      toast.error(`Erreur recherche: ${error.message}`);
    },
  });
}

export function useBulkImportAliExpress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (urls: string[]) => {
      const { data, error } = await supabase.functions.invoke('aliexpress-scraper', {
        body: {
          action: 'bulk_import',
          urls
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Bulk import failed');
      
      return data as { 
        success: boolean; 
        imported: number; 
        failed: number; 
        products: AliExpressProduct[];
        errors: Array<{ url: string; error: string }>;
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] });
      toast.success(`${data.imported} produits importés, ${data.failed} échecs`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur import: ${error.message}`);
    },
  });
}

export function useAliExpressImportHistory() {
  return useQuery({
    queryKey: ['aliexpress-imports'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('imported_products')
        .select('*')
        .eq('user_id', user.id)
        .eq('source_platform', 'aliexpress')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });
}
