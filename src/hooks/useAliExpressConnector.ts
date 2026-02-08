import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export interface AliExpressProduct {
  product_id: string;
  title: string;
  sale_price: number;
  original_price: number;
  currency: string;
  image_url: string;
  images: string[];
  product_url: string;
  commission_rate?: string;
  evaluate_rate?: string;
  shop_url?: string;
  video_url?: string;
  category?: string;
}

export function useAliExpressConnector() {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<AliExpressProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [setupRequired, setSetupRequired] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const callConnector = async (action: string, params: Record<string, any> = {}) => {
    const { data, error } = await supabase.functions.invoke('cj-aliexpress-connector', {
      body: { action, supplier: 'aliexpress', ...params },
    });

    if (error) throw new Error(error.message);
    if (data?.setup_required) {
      setSetupRequired(true);
      throw new Error(data.error);
    }
    if (!data?.success) throw new Error(data?.error || 'Unknown error');
    return data;
  };

  const searchProducts = async (params: {
    keywords?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    pageNo?: number;
    pageSize?: number;
    sort?: string;
  }) => {
    setIsLoading(true);
    try {
      const data = await callConnector('search_products', params);
      setProducts(data.products || []);
      setTotal(data.total || 0);
      return data;
    } catch (err: any) {
      toast({ title: 'Erreur recherche', description: err.message, variant: 'destructive' });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getHotProducts = async (params: { categoryId?: string; pageNo?: number; pageSize?: number } = {}) => {
    setIsLoading(true);
    try {
      const data = await callConnector('hot_products', params);
      setProducts(data.products || []);
      setTotal(data.total || 0);
      return data;
    } catch (err: any) {
      toast({ title: 'Erreur produits tendance', description: err.message, variant: 'destructive' });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const importProducts = async (productIds: string[]) => {
    setIsLoading(true);
    try {
      const data = await callConnector('import_products', { product_ids: productIds });
      toast({
        title: '✅ Import réussi',
        description: `${data.imported_count} produit(s) importé(s) depuis AliExpress`,
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      return data;
    } catch (err: any) {
      toast({ title: 'Erreur import', description: err.message, variant: 'destructive' });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    products,
    total,
    isLoading,
    setupRequired,
    searchProducts,
    getHotProducts,
    importProducts,
  };
}
