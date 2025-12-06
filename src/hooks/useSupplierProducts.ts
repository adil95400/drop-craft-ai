import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  image_url: string | null;
  status: string;
  vendor: string;
  created_at: string;
}

export function useSupplierProducts(supplierId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ['supplier-products', supplierId, limit],
    queryFn: async () => {
      if (!supplierId) return { products: [], count: 0 };

      // Query products by supplier_id UUID or by vendor name
      const { data: products, error, count } = await supabase
        .from('products')
        .select('id, name, sku, price, cost_price, stock_quantity, image_url, status, vendor, created_at', { count: 'exact' })
        .or(`supplier_id.eq.${supplierId},vendor.ilike.%bts%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching supplier products:', error);
        throw error;
      }

      return {
        products: (products || []) as SupplierProduct[],
        count: count || 0
      };
    },
    enabled: !!supplierId,
    staleTime: 30000,
  });
}

export function useSupplierProductCount(supplierId: string | undefined) {
  return useQuery({
    queryKey: ['supplier-product-count', supplierId],
    queryFn: async () => {
      if (!supplierId) return 0;

      const { count, error } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .or(`supplier_id.eq.${supplierId},vendor.ilike.%bts%`);

      if (error) {
        console.error('Error counting supplier products:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!supplierId,
  });
}
