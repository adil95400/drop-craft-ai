/**
 * B2B Supplier Connector Hook
 * Production-ready integration with AliExpress, CJ Dropshipping, 1688, Alibaba
 * Provides unified API for supplier operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
export interface SupplierCredentials {
  supplierId: string;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  email?: string;
  partnerId?: string;
}

export interface SupplierConnection {
  id: string;
  user_id: string;
  premium_supplier_id: string;
  connection_status: 'active' | 'inactive' | 'error' | 'pending';
  last_sync_at: string | null;
  sync_enabled: boolean;
  settings: Record<string, unknown> | null;
  credentials_encrypted: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  external_id: string;
  title: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  currency: string;
  images: string[];
  variants: SupplierVariant[];
  stock: number;
  shipping_time: string | null;
  rating: number | null;
  reviews_count: number | null;
  category: string | null;
  source_url: string;
}

export interface SupplierVariant {
  id: string;
  name: string;
  options: { name: string; value: string }[];
  price: number;
  stock: number;
  sku: string | null;
  image: string | null;
}

export interface SupplierReliabilityScore {
  overall: number;
  delivery: number;
  quality: number;
  communication: number;
  pricing: number;
  reviews_analyzed: number;
  recommendation: 'excellent' | 'good' | 'fair' | 'caution';
}

export interface SupplierSearchParams {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  shippingZone?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'orders' | 'newest';
  page?: number;
  limit?: number;
}

export interface SupplierComparisonResult {
  productId: string;
  suppliers: {
    supplierId: string;
    supplierName: string;
    price: number;
    shippingCost: number;
    totalCost: number;
    shippingTime: string;
    stock: number;
    reliabilityScore: number;
    margin: number;
    marginPercent: number;
  }[];
  bestValue: string;
  fastestShipping: string;
  highestMargin: string;
}

// Supported B2B suppliers with API capabilities
export const B2B_SUPPLIERS = {
  aliexpress: {
    name: 'AliExpress',
    apiEndpoint: 'aliexpress-api',
    supportsSearch: true,
    supportsOrders: true,
    supportsTracking: true,
    requiredCredentials: ['app_key', 'app_secret'],
  },
  cjdropshipping: {
    name: 'CJ Dropshipping',
    apiEndpoint: 'supplier-api-connector',
    supportsSearch: true,
    supportsOrders: true,
    supportsTracking: true,
    requiredCredentials: ['api_key', 'email'],
  },
  alibaba: {
    name: 'Alibaba',
    apiEndpoint: 'supplier-api-connector',
    supportsSearch: true,
    supportsOrders: false,
    supportsTracking: false,
    requiredCredentials: ['app_key', 'app_secret'],
  },
  '1688': {
    name: '1688.com',
    apiEndpoint: 'supplier-api-connector',
    supportsSearch: true,
    supportsOrders: false,
    supportsTracking: false,
    requiredCredentials: ['app_key', 'app_secret'],
  },
  temu: {
    name: 'Temu',
    apiEndpoint: 'temu-connector',
    supportsSearch: true,
    supportsOrders: false,
    supportsTracking: false,
    requiredCredentials: [],
  },
  spocket: {
    name: 'Spocket',
    apiEndpoint: 'supplier-api-connector',
    supportsSearch: true,
    supportsOrders: true,
    supportsTracking: true,
    requiredCredentials: ['api_key'],
  },
} as const;

export type B2BSupplierId = keyof typeof B2B_SUPPLIERS;

export function useB2BSupplierConnector() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active connections
  const { data: connections, isLoading: isLoadingConnections } = useQuery({
    queryKey: ['b2b-supplier-connections'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('premium_supplier_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SupplierConnection[];
    },
  });

  // Connect to a supplier
  const connectMutation = useMutation({
    mutationFn: async (credentials: SupplierCredentials) => {
      const { data, error } = await supabase.functions.invoke('supplier-connect', {
        body: {
          supplier_id: credentials.supplierId,
          api_key: credentials.apiKey,
          settings: {
            api_secret: credentials.apiSecret,
            access_token: credentials.accessToken,
            email: credentials.email,
            partner_id: credentials.partnerId,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['b2b-supplier-connections'] });
      toast({
        title: 'Fournisseur connecté',
        description: `${B2B_SUPPLIERS[variables.supplierId as B2BSupplierId]?.name || variables.supplierId} a été connecté avec succès`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Test connection
  const testConnectionMutation = useMutation({
    mutationFn: async (supplierId: B2BSupplierId) => {
      const supplier = B2B_SUPPLIERS[supplierId];
      
      const { data, error } = await supabase.functions.invoke(supplier.apiEndpoint, {
        body: { action: 'check_credentials', supplier_id: supplierId },
      });

      if (error) throw error;
      return data;
    },
  });

  // Search products across suppliers
  const searchProductsMutation = useMutation({
    mutationFn: async (params: SupplierSearchParams & { suppliers?: B2BSupplierId[] }) => {
      const targetSuppliers = params.suppliers || ['aliexpress', 'cjdropshipping'];
      const results: { supplier: string; products: SupplierProduct[] }[] = [];

      await Promise.all(
        targetSuppliers.map(async (supplierId) => {
          const supplier = B2B_SUPPLIERS[supplierId];
          if (!supplier?.supportsSearch) return;

          try {
            const { data, error } = await supabase.functions.invoke(supplier.apiEndpoint, {
              body: {
                action: 'search_products',
                supplier_id: supplierId,
                keywords: params.query,
                category_id: params.category,
                min_price: params.minPrice,
                max_price: params.maxPrice,
                page_no: params.page || 1,
                page_size: params.limit || 20,
                sort: params.sortBy,
              },
            });

            if (!error && data?.products) {
              results.push({ supplier: supplierId, products: data.products });
            }
          } catch (e) {
            console.error(`Search error for ${supplierId}:`, e);
          }
        })
      );

      return results;
    },
  });

  // Get product details
  const getProductMutation = useMutation({
    mutationFn: async ({ supplierId, productId }: { supplierId: B2BSupplierId; productId: string }) => {
      const supplier = B2B_SUPPLIERS[supplierId];

      const { data, error } = await supabase.functions.invoke(supplier.apiEndpoint, {
        body: {
          action: 'get_product',
          supplier_id: supplierId,
          product_id: productId,
          include_reviews: true,
          include_shipping: true,
        },
      });

      if (error) throw error;
      return data as SupplierProduct;
    },
  });

  // Compare suppliers for a product
  const compareSuppliersMutation = useMutation({
    mutationFn: async ({ productTitle, sellingPrice }: { productTitle: string; sellingPrice: number }) => {
      const { data, error } = await supabase.functions.invoke('compare-supplier-prices', {
        body: {
          product_title: productTitle,
          selling_price: sellingPrice,
          suppliers: Object.keys(B2B_SUPPLIERS),
        },
      });

      if (error) throw error;
      return data as SupplierComparisonResult;
    },
  });

  // Calculate reliability score
  const getReliabilityScore = useMutation({
    mutationFn: async (supplierId: string) => {
      const { data, error } = await supabase.functions.invoke('supplier-scorer', {
        body: { supplier_id: supplierId },
      });

      if (error) throw error;
      return data as SupplierReliabilityScore;
    },
  });

  // Sync products from supplier
  const syncProductsMutation = useMutation({
    mutationFn: async (supplierId: B2BSupplierId) => {
      const { data, error } = await supabase.functions.invoke('supplier-catalog-sync', {
        body: { supplier_id: supplierId, full_sync: false },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, supplierId) => {
      queryClient.invalidateQueries({ queryKey: ['b2b-supplier-connections'] });
      toast({
        title: 'Synchronisation lancée',
        description: `Synchronisation des produits ${B2B_SUPPLIERS[supplierId]?.name} en cours`,
      });
    },
  });

  // Disconnect supplier
  const disconnectMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('premium_supplier_connections')
        .update({ connection_status: 'inactive' })
        .eq('id', connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-supplier-connections'] });
      toast({ title: 'Fournisseur déconnecté' });
    },
  });

  // Helper: Check if supplier is connected
  const isConnected = (supplierId: string) => {
    return connections?.some(
      (c) => c.premium_supplier_id === supplierId && c.connection_status === 'active'
    );
  };

  // Helper: Get connection for supplier
  const getConnection = (supplierId: string) => {
    return connections?.find(
      (c) => c.premium_supplier_id === supplierId && c.connection_status === 'active'
    );
  };

  return {
    // Data
    connections,
    isLoadingConnections,
    B2B_SUPPLIERS,

    // Actions
    connect: connectMutation.mutateAsync,
    isConnecting: connectMutation.isPending,

    testConnection: testConnectionMutation.mutateAsync,
    isTesting: testConnectionMutation.isPending,

    searchProducts: searchProductsMutation.mutateAsync,
    isSearching: searchProductsMutation.isPending,
    searchResults: searchProductsMutation.data,

    getProduct: getProductMutation.mutateAsync,
    isLoadingProduct: getProductMutation.isPending,

    compareSuppliers: compareSuppliersMutation.mutateAsync,
    isComparing: compareSuppliersMutation.isPending,
    comparisonResult: compareSuppliersMutation.data,

    getReliabilityScore: getReliabilityScore.mutateAsync,
    isLoadingReliability: getReliabilityScore.isPending,

    syncProducts: syncProductsMutation.mutate,
    isSyncing: syncProductsMutation.isPending,

    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,

    // Helpers
    isConnected,
    getConnection,
  };
}
