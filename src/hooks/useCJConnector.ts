import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export interface CJProduct {
  pid: string;
  productNameEn: string;
  productImage: string;
  sellPrice: number;
  categoryName?: string;
  productWeight?: number;
  productType?: string;
  sourceFrom?: string;
}

export function useCJConnector() {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<CJProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [setupRequired, setSetupRequired] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const callConnector = async (action: string, params: Record<string, any> = {}) => {
    const { data, error } = await supabase.functions.invoke('cj-aliexpress-connector', {
      body: { action, supplier: 'cj', ...params },
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
    keyword?: string;
    categoryId?: string;
    pageNum?: number;
    pageSize?: number;
  }) => {
    setIsLoading(true);
    try {
      const data = await callConnector('search_products', params);
      setProducts(data.products || []);
      setTotal(data.total || 0);
      return data;
    } catch (err: any) {
      toast({ title: 'Erreur recherche CJ', description: err.message, variant: 'destructive' });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getCategories = async () => {
    try {
      const data = await callConnector('get_categories');
      return data.categories || [];
    } catch (err: any) {
      toast({ title: 'Erreur catégories', description: err.message, variant: 'destructive' });
      return [];
    }
  };

  const importProducts = async (productIds: string[]) => {
    setIsLoading(true);
    try {
      const data = await callConnector('import_products', { product_ids: productIds });
      toast({
        title: '✅ Import réussi',
        description: `${data.imported_count} produit(s) importé(s) depuis CJ Dropshipping`,
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      return data;
    } catch (err: any) {
      toast({ title: 'Erreur import CJ', description: err.message, variant: 'destructive' });
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
    getCategories,
    importProducts,
  };
}
