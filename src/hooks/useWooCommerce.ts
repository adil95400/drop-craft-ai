import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WooCommerceCredentials {
  store_url: string;
  consumer_key: string;
  consumer_secret: string;
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  price: number;
  regular_price: number;
  sale_price: number;
  sku: string;
  stock_quantity: number;
  stock_status: string;
  description: string;
  images: string[];
  categories: string[];
}

export interface WooCommerceOrder {
  id: number;
  number: string;
  status: string;
  total: number;
  currency: string;
  customer: string;
  email: string;
  items_count: number;
  date: string;
}

export function useWooCommerceTestConnection() {
  return useMutation({
    mutationFn: async (credentials: WooCommerceCredentials) => {
      const { data, error } = await supabase.functions.invoke('woocommerce-connector', {
        body: {
          action: 'test_connection',
          ...credentials
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Connection test failed');
      
      return data as { success: boolean; store_name: string; wc_version: string; currency: string };
    },
    onSuccess: (data) => {
      toast.success(`Connexion réussie à ${data.store_name}`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useWooCommerceGetProducts() {
  return useMutation({
    mutationFn: async (credentials: WooCommerceCredentials) => {
      const { data, error } = await supabase.functions.invoke('woocommerce-connector', {
        body: {
          action: 'get_products',
          ...credentials
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to fetch products');
      
      return data as { success: boolean; products: WooCommerceProduct[]; total: number };
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useWooCommerceGetOrders() {
  return useMutation({
    mutationFn: async (credentials: WooCommerceCredentials) => {
      const { data, error } = await supabase.functions.invoke('woocommerce-connector', {
        body: {
          action: 'get_orders',
          ...credentials
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to fetch orders');
      
      return data as { success: boolean; orders: WooCommerceOrder[]; total: number };
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useWooCommerceSyncInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: WooCommerceCredentials) => {
      const { data, error } = await supabase.functions.invoke('woocommerce-connector', {
        body: {
          action: 'sync_inventory',
          ...credentials
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Sync failed');
      
      return data as { success: boolean; synced: number; total: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`${data.synced} produits synchronisés depuis WooCommerce`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur sync: ${error.message}`);
    },
  });
}

export function useWooCommerceCreateProduct() {
  return useMutation({
    mutationFn: async ({ 
      credentials, 
      product 
    }: { 
      credentials: WooCommerceCredentials; 
      product: {
        name: string;
        price: number;
        description?: string;
        short_description?: string;
        sku?: string;
        stock_quantity?: number;
        images?: string[];
      }
    }) => {
      const { data, error } = await supabase.functions.invoke('woocommerce-connector', {
        body: {
          action: 'create_product',
          ...credentials,
          product_data: product
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to create product');
      
      return data as { success: boolean; product: { id: number; name: string; sku: string } };
    },
    onSuccess: (data) => {
      toast.success(`Produit créé: ${data.product.name}`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
