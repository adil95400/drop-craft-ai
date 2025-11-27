import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarketplaceSupplier {
  id: string;
  name: string;
  logo_url?: string;
  description: string;
  sector: string;
  country: string;
  supplier_type: 'api' | 'xml' | 'csv' | 'manual';
  product_count: number;
  rating: number;
  tags: string[];
  is_featured: boolean;
  integration_complexity: 'easy' | 'medium' | 'hard';
  setup_time_minutes: number;
  min_order_value?: number;
  commission_rate?: number;
  shipping_countries: string[];
  is_connected?: boolean;
  connection_status?: string;
  last_sync_at?: string;
}

export interface MarketplaceStats {
  total_suppliers: number;
  connected_suppliers: number;
  total_products: number;
  featured_suppliers: number;
}

export function useMarketplaceSuppliers() {
  return useQuery({
    queryKey: ['marketplace-suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('supplier-marketplace-sync');
      
      if (error) {
        console.error('Error fetching marketplace suppliers:', error);
        throw error;
      }
      
      return {
        suppliers: (data?.suppliers || []) as MarketplaceSupplier[],
        stats: (data?.stats || {
          total_suppliers: 0,
          connected_suppliers: 0,
          total_products: 0,
          featured_suppliers: 0
        }) as MarketplaceStats
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
