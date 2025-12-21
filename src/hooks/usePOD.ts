import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePOD = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createProduct = useMutation({
    mutationFn: async (productData: any) => {
      const { data, error } = await supabase.functions.invoke('pod-manager', {
        body: { action: 'create_product', product_data: productData }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pod-products'] });
      toast({ title: '🎨 Produit POD créé' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  const generateMockups = useMutation({
    mutationFn: async ({ productId, views }: any) => {
      const { data, error } = await supabase.functions.invoke('pod-manager', {
        body: { action: 'generate_mockups', product_id: productId, views }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: '📸 Mockups générés' });
    }
  });

  const placeOrder = useMutation({
    mutationFn: async (orderData: any) => {
      const { data, error } = await supabase.functions.invoke('pod-manager', {
        body: { action: 'place_order', order_data: orderData }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pod-orders'] });
      toast({ title: '📦 Commande POD placée' });
    }
  });

  const getCatalog = useQuery({
    queryKey: ['pod-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('pod-manager', {
        body: { action: 'get_catalog' }
      });
      if (error) throw error;
      return data?.catalog || [];
    }
  });

  // Use products table filtered by a POD tag/category instead of non-existent pod_products table
  const getProducts = useQuery({
    queryKey: ['pod-products'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await (supabase
        .from('products') as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('product_type', 'pod')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const generateDesign = useMutation({
    mutationFn: async ({ prompt, productType, style }: any) => {
      const { data, error } = await supabase.functions.invoke('ai-visual-generator', {
        body: { 
          action: 'generate_design', 
          prompt, 
          product_type: productType,
          style 
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: '🎨 Design généré par IA' });
    }
  });

  return {
    createProduct,
    generateMockups,
    placeOrder,
    getCatalog,
    getProducts,
    generateDesign
  };
};
