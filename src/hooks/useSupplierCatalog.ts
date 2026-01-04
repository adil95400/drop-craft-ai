import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CatalogProduct {
  id: string;
  supplier_id: string | null;
  supplier_name: string;
  external_product_id: string;
  sku: string | null;
  title: string;
  description: string | null;
  price: number | null;
  cost_price: number | null;
  compare_at_price: number | null;
  currency: string;
  stock_quantity: number;
  category: string | null;
  brand: string | null;
  image_url: string | null;
  images: string[];
  variants: any[];
  attributes: Record<string, any>;
  weight: number | null;
  weight_unit: string;
  barcode: string | null;
  source_url: string | null;
  is_active: boolean;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export function useSupplierCatalog(supplierName?: string) {
  return useQuery({
    queryKey: ['supplier-catalog', supplierName],
    queryFn: async () => {
      let query = supabase
        .from('supplier_catalog')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (supplierName) {
        query = query.eq('supplier_name', supplierName);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CatalogProduct[];
    },
  });
}

export function useImportToMyProducts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (catalogProductIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Fetch catalog products
      const { data: catalogProducts, error: fetchError } = await supabase
        .from('supplier_catalog')
        .select('*')
        .in('id', catalogProductIds);

      if (fetchError) throw fetchError;

      // Transform to user products
      const userProducts = catalogProducts.map((cp: CatalogProduct) => ({
        user_id: user.id,
        title: cp.title,
        name: cp.title,
        description: cp.description,
        sku: `${cp.sku}-${Date.now()}`,
        barcode: cp.barcode,
        price: cp.price,
        cost_price: cp.cost_price,
        compare_at_price: cp.compare_at_price,
        category: cp.category,
        brand: cp.brand,
        supplier: cp.supplier_name,
        supplier_product_id: cp.external_product_id,
        supplier_url: cp.source_url,
        status: 'draft',
        stock_quantity: cp.stock_quantity,
        weight: cp.weight,
        weight_unit: cp.weight_unit,
        images: JSON.stringify(cp.images || []),
        image_url: cp.image_url,
        is_published: false,
      }));

      const { data, error } = await supabase
        .from('products')
        .insert(userProducts)
        .select('id');

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['unified-products'] });
      toast({
        title: 'Produits importés',
        description: `${data.length} produit(s) ajouté(s) à votre catalogue`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur d\'import',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    },
  });
}

export function useSyncSupplierCatalog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('b2b-sports-import', {
        body: { action: 'sync' },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Sync failed');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-catalog'] });
      toast({
        title: 'Catalogue synchronisé',
        description: `${data.synced} produits synchronisés depuis B2B Sports`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de synchronisation',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    },
  });
}
