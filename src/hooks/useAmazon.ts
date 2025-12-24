import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AmazonProduct {
  asin: string;
  title: string;
  price: number;
  original_price: number;
  currency: string;
  rating: number;
  reviews_count: number;
  images: string[];
  category: string;
  brand: string;
  description: string;
  features: string[];
  availability: string;
  seller: string;
  url: string;
}

export function useScrapeAmazonProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ url, asin, marketplace = 'com' }: { url?: string; asin?: string; marketplace?: string }) => {
      const { data, error } = await supabase.functions.invoke('amazon-connector', {
        body: {
          action: 'scrape_product',
          url,
          asin,
          marketplace
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to scrape product');
      
      return data as { success: boolean; product: AmazonProduct; saved_id?: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
      toast.success('Produit importé depuis Amazon');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useSearchAmazonProducts() {
  return useMutation({
    mutationFn: async ({ 
      keywords, 
      category, 
      marketplace = 'com',
      limit = 20 
    }: { 
      keywords?: string; 
      category?: string; 
      marketplace?: string;
      limit?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('amazon-connector', {
        body: {
          action: 'search_products',
          keywords,
          category,
          marketplace,
          limit
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Search failed');
      
      return data as { success: boolean; products: Partial<AmazonProduct>[]; total: number };
    },
    onError: (error: Error) => {
      toast.error(`Erreur recherche: ${error.message}`);
    },
  });
}

export function useAmazonBestsellers() {
  return useMutation({
    mutationFn: async ({ 
      category, 
      marketplace = 'com',
      limit = 20 
    }: { 
      category?: string; 
      marketplace?: string;
      limit?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('amazon-connector', {
        body: {
          action: 'get_bestsellers',
          category,
          marketplace,
          limit
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to fetch bestsellers');
      
      return data as { success: boolean; products: Partial<AmazonProduct>[]; category: string; total: number };
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useBulkImportAmazon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ asins, marketplace = 'com' }: { asins: string[]; marketplace?: string }) => {
      const { data, error } = await supabase.functions.invoke('amazon-connector', {
        body: {
          action: 'bulk_import',
          asins,
          marketplace
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Bulk import failed');
      
      return data as { 
        success: boolean; 
        imported: number; 
        failed: number; 
        products: AmazonProduct[];
        errors: Array<{ asin: string; error: string }>;
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
      toast.success(`${data.imported} produits importés, ${data.failed} échecs`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur import: ${error.message}`);
    },
  });
}
