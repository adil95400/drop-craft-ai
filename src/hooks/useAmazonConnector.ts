import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export interface AmazonProduct {
  asin: string;
  title: string;
  price: number;
  original_price: number;
  currency: string;
  image_url: string | null;
  images: string[];
  product_url: string;
  brand: string;
  features: string[];
}

export function useAmazonConnector() {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<AmazonProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [setupRequired, setSetupRequired] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const callConnector = async (action: string, params: Record<string, any> = {}) => {
    const { data, error } = await supabase.functions.invoke('amazon-connector', {
      body: { action, ...params },
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
    keywords: string;
    category?: string;
    pageNum?: number;
    marketplace?: string;
  }) => {
    setIsLoading(true);
    try {
      const data = await callConnector('search_products', params);
      setProducts(data.products || []);
      setTotal(data.total || 0);
      return data;
    } catch (err: any) {
      toast({ title: 'Erreur recherche Amazon', description: err.message, variant: 'destructive' });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const importProducts = async (asins: string[]) => {
    setIsLoading(true);
    try {
      const data = await callConnector('import_products', { asins });
      toast({
        title: '✅ Import réussi',
        description: `${data.imported_count} produit(s) importé(s) depuis Amazon`,
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      return data;
    } catch (err: any) {
      toast({ title: 'Erreur import Amazon', description: err.message, variant: 'destructive' });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { products, total, isLoading, setupRequired, searchProducts, importProducts };
}
