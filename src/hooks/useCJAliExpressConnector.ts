import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type SupplierType = 'cj' | 'aliexpress';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost_price: number;
  image_url: string;
  category?: string;
  stock_quantity?: number;
  variants?: any[];
}

interface SearchParams {
  keyword?: string;
  categoryId?: string;
  pageNum?: number;
  pageSize?: number;
  minPrice?: number;
  maxPrice?: number;
}

export function useCJAliExpressConnector(supplier: SupplierType) {
  const queryClient = useQueryClient();

  // Search products
  const searchProducts = useMutation({
    mutationFn: async (params: SearchParams) => {
      const { data, error } = await supabase.functions.invoke('cj-aliexpress-connector', {
        body: { action: 'search_products', supplier, ...params }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onError: (error: Error) => {
      toast.error(`Erreur recherche ${supplier.toUpperCase()}`, {
        description: error.message
      });
    }
  });

  // Get product details
  const getProduct = useMutation({
    mutationFn: async (productId: string) => {
      const { data, error } = await supabase.functions.invoke('cj-aliexpress-connector', {
        body: { action: 'get_product', supplier, product_id: productId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.product;
    }
  });

  // Get product variants (CJ only)
  const getVariants = useMutation({
    mutationFn: async (productId: string) => {
      const { data, error } = await supabase.functions.invoke('cj-aliexpress-connector', {
        body: { action: 'get_variants', supplier, product_id: productId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.variants;
    }
  });

  // Check stock (CJ only)
  const checkStock = useMutation({
    mutationFn: async (variantId: string) => {
      const { data, error } = await supabase.functions.invoke('cj-aliexpress-connector', {
        body: { action: 'check_stock', supplier, variant_id: variantId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.stock;
    }
  });

  // Get shipping methods (CJ only)
  const getShipping = useMutation({
    mutationFn: async (params: {
      startCountryCode: string;
      endCountryCode: string;
      productWeight: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('cj-aliexpress-connector', {
        body: { action: 'get_shipping', supplier, ...params }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.methods;
    }
  });

  // Create order
  const createOrder = useMutation({
    mutationFn: async (params: { order_data: any; auto_confirm?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('cj-aliexpress-connector', {
        body: { action: 'create_order', supplier, ...params }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.order;
    },
    onSuccess: (order) => {
      toast.success(`Commande ${supplier.toUpperCase()} créée`, {
        description: `ID: ${order.orderId || order.order_id}`
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur commande ${supplier.toUpperCase()}`, {
        description: error.message
      });
    }
  });

  // Get order details
  const getOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.functions.invoke('cj-aliexpress-connector', {
        body: { action: 'get_order', supplier, order_id: orderId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.order;
    }
  });

  // Get tracking info
  const getTracking = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.functions.invoke('cj-aliexpress-connector', {
        body: { action: 'get_tracking', supplier, order_id: orderId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.tracking;
    }
  });

  // Sync products to catalog
  const syncProducts = useMutation({
    mutationFn: async (params: { supplier_id: string; limit?: number }) => {
      const { data, error } = await supabase.functions.invoke('cj-aliexpress-connector', {
        body: { action: 'sync_products', supplier, ...params }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.synced} produits synchronisés depuis ${supplier.toUpperCase()}`);
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur sync ${supplier.toUpperCase()}`, {
        description: error.message
      });
    }
  });

  // Get categories (CJ only)
  const getCategories = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cj-aliexpress-connector', {
        body: { action: 'get_categories', supplier }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.categories;
    }
  });

  return {
    // Search
    searchProducts: searchProducts.mutateAsync,
    searchResults: searchProducts.data,
    isSearching: searchProducts.isPending,

    // Product details
    getProduct: getProduct.mutateAsync,
    isLoadingProduct: getProduct.isPending,

    // Variants
    getVariants: getVariants.mutateAsync,
    isLoadingVariants: getVariants.isPending,

    // Stock
    checkStock: checkStock.mutateAsync,
    isCheckingStock: checkStock.isPending,

    // Shipping
    getShipping: getShipping.mutateAsync,
    isLoadingShipping: getShipping.isPending,

    // Orders
    createOrder: createOrder.mutateAsync,
    isCreatingOrder: createOrder.isPending,
    getOrder: getOrder.mutateAsync,
    getTracking: getTracking.mutateAsync,

    // Sync
    syncProducts: syncProducts.mutate,
    syncProductsAsync: syncProducts.mutateAsync,
    isSyncing: syncProducts.isPending,

    // Categories
    getCategories: getCategories.mutateAsync,
  };
}

// Hook to check connection status
export function useSupplierConnectionStatus(supplier: SupplierType) {
  return useQuery({
    queryKey: ['supplier-connection', supplier],
    queryFn: async (): Promise<{ connected: boolean; lastValidated: string | null }> => {
      const authResult = await supabase.auth.getUser();
      const user = authResult.data?.user;
      if (!user) return { connected: false, lastValidated: null };

      const supplierType = supplier === 'cj' ? 'cj_dropshipping' : 'aliexpress';

      // Use any cast to avoid deep type instantiation
      const result = await (supabase
        .from('supplier_credentials_vault') as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('supplier_type', supplierType)
        .maybeSingle();

      if (result.error || !result.data) {
        return { connected: false, lastValidated: null };
      }

      const creds = result.data;
      return {
        connected: creds.connection_status === 'active',
        lastValidated: creds.last_validation_at || null,
      };
    }
  });
}
