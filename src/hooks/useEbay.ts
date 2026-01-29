import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EbayProduct {
  item_id: string;
  title: string;
  price: number;
  currency: string;
  condition: string;
  seller: string;
  seller_rating: number;
  shipping_cost: number;
  location: string;
  images: string[];
  category: string;
  description: string;
  bids: number;
  watchers: number;
  time_left: string;
  buy_it_now: boolean;
  url: string;
}

export function useScrapeEbayProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ url, item_id, site = 'com' }: { url?: string; item_id?: string; site?: string }) => {
      const { data, error } = await supabase.functions.invoke('ebay-connector', {
        body: {
          action: 'scrape_product',
          url,
          item_id,
          site
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to scrape product');
      
      return data as { success: boolean; product: EbayProduct; saved_id?: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
      toast.success('Produit importé depuis eBay');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useSearchEbayProducts() {
  return useMutation({
    mutationFn: async ({ 
      keywords, 
      category, 
      site = 'com',
      limit = 20 
    }: { 
      keywords?: string; 
      category?: string; 
      site?: string;
      limit?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('ebay-connector', {
        body: {
          action: 'search_products',
          keywords,
          category,
          site,
          limit
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Search failed');
      
      return data as { success: boolean; products: Partial<EbayProduct>[]; total: number };
    },
    onError: (error: Error) => {
      toast.error(`Erreur recherche: ${error.message}`);
    },
  });
}

export function useEbayTrending() {
  return useMutation({
    mutationFn: async ({ 
      category, 
      site = 'com',
      limit = 20 
    }: { 
      category?: string; 
      site?: string;
      limit?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('ebay-connector', {
        body: {
          action: 'get_trending',
          category,
          site,
          limit
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to fetch trending');
      
      return data as { success: boolean; products: Partial<EbayProduct>[]; category: string; total: number };
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useBulkImportEbay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ item_ids, site = 'com' }: { item_ids: string[]; site?: string }) => {
      const { data, error } = await supabase.functions.invoke('ebay-connector', {
        body: {
          action: 'bulk_import',
          item_ids,
          site
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Bulk import failed');
      
      return data as { 
        success: boolean; 
        imported: number; 
        failed: number; 
        products: EbayProduct[];
        errors: Array<{ item_id: string; error: string }>;
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

export function useEbayPriceMonitor() {
  return useMutation({
    mutationFn: async ({ 
      item_id, 
      target_price,
      site = 'com' 
    }: { 
      item_id: string; 
      target_price: number;
      site?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('ebay-connector', {
        body: {
          action: 'monitor_price',
          item_id,
          target_price,
          site
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to set up monitoring');
      
      return data as { success: boolean; monitoring_id: string; item_id: string; target_price: number };
    },
    onSuccess: (data) => {
      toast.success(`Surveillance de prix activée pour l'article ${data.item_id}`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
