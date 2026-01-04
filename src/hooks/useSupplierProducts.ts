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

      // Query products by supplier column using wildcard select to avoid column name issues
      const { data: products, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('supplier', supplierId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching supplier products:', error);
        throw error;
      }

      const transformedProducts: SupplierProduct[] = (products || []).map((p) => ({
        id: p.id,
        name: p.title || p.name || '',
        sku: p.sku || '',
        price: p.price || 0,
        cost_price: p.cost_price || 0,
        stock_quantity: p.stock_quantity || 0,
        image_url: p.image_url,
        status: p.status || 'active',
        vendor: p.supplier || '',
        created_at: p.created_at || ''
      }));

      return {
        products: transformedProducts,
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
        .eq('supplier', supplierId);

      if (error) {
        console.error('Error counting supplier products:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!supplierId,
  });
}
