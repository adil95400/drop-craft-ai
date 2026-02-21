import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CatalogProduct {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  compare_at_price: number | null;
  image_urls: string[] | null;
  category: string | null;
  supplier_name: string | null;
  source_platform: string | null;
  source_url: string | null;
  is_imported: boolean;
  status: string | null;
  created_at: string;
}

export function useProductSourcing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch catalog products (available for sourcing)
  const { data: catalogProducts, isLoading: isLoadingCatalog } = useQuery({
    queryKey: ['catalog-products'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('products') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as CatalogProduct[];
    },
  });

  // Fetch supplier connections for platforms
  const { data: platforms, isLoading: isLoadingPlatforms } = useQuery({
    queryKey: ['supplier-platforms'],
    queryFn: async () => {
      const result: any = await supabase
        .from('supplier_connections' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (result.error) throw result.error;
      
      // Default platforms with connection status
      const defaultPlatforms = [
        { name: 'AliExpress', logo: '🛒', active: false, products: '200M+' },
        { name: 'Amazon', logo: '📦', active: false, products: '12M+' },
        { name: 'CJ Dropshipping', logo: '🚚', active: false, products: '500K+' },
        { name: 'Temu', logo: '🎁', active: false, products: '10M+' },
        { name: 'Alibaba', logo: '🏭', active: false, products: '50M+' },
        { name: '1688.com', logo: '🇨🇳', active: false, products: '80M+' }
      ];

      // Mark connected platforms as active
      const connections = result.data || [];
      return defaultPlatforms.map(p => ({
        ...p,
        active: connections.some((c: any) => 
          c.supplier_name?.toLowerCase().includes(p.name.toLowerCase()) && c.is_active
        )
      }));
    },
  });

  // Fetch favorite products
  const { data: favorites, isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['favorite-products'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('products') as any)
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CatalogProduct[];
    },
  });

  // Calculate margin for a product
  const calculateMargin = (price: number | null, supplierPrice: number | null) => {
    if (!price || !supplierPrice || price === 0) return 0;
    return Math.round(((price - supplierPrice) / price) * 100);
  };

  // Import product to store
  const importProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await (supabase
        .from('products') as any)
        .update({ status: 'active' })
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
      toast({
        title: "Produit importé",
        description: "Le produit a été ajouté à votre boutique",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'importer le produit",
        variant: "destructive",
      });
    },
  });

  // Add to favorites
  const addToFavoritesMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await (supabase
        .from('products') as any)
        .update({ status: 'draft' })
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-products'] });
      toast({
        title: "Ajouté aux favoris",
        description: "Le produit a été ajouté à vos favoris",
      });
    },
  });

  // Search products
  const searchProducts = async (query: string) => {
    if (!query.trim()) return catalogProducts;
    
    const { data, error } = await (supabase
      .from('products') as any)
      .select('*')
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data as CatalogProduct[];
  };

  return {
    catalogProducts,
    isLoadingCatalog,
    platforms,
    isLoadingPlatforms,
    favorites,
    isLoadingFavorites,
    calculateMargin,
    importProduct: importProductMutation.mutate,
    isImporting: importProductMutation.isPending,
    addToFavorites: addToFavoritesMutation.mutate,
    searchProducts,
  };
}
