/**
 * Hook pour gérer les favoris produits persistants
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCallback, useMemo } from 'react';

interface ProductFavorite {
  id: string;
  user_id: string;
  product_id: string;
  product_type: string;
  product_data: Record<string, unknown> | null;
  created_at: string;
}

export function useProductFavorites(productType: string = 'supplier_product') {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all favorites
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['product-favorites', productType],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_product_favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_type', productType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ProductFavorite[];
    },
    staleTime: 30 * 1000,
  });

  // Create a Set for O(1) lookups
  const favoriteIds = useMemo(() => 
    new Set(favorites.map(f => f.product_id)), 
    [favorites]
  );

  const addFavorite = useMutation({
    mutationFn: async ({ productId, productData }: { productId: string; productData?: Record<string, unknown> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('user_product_favorites')
        .insert([{
          user_id: user.id,
          product_id: productId,
          product_type: productType,
          product_data: (productData || null) as any,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-favorites', productType] });
      toast({
        title: "Ajouté aux favoris",
        description: "Le produit a été ajouté à vos favoris",
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast({
          title: "Déjà en favoris",
          description: "Ce produit est déjà dans vos favoris",
        });
      } else {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  // Remove from favorites
  const removeFavorite = useMutation({
    mutationFn: async (productId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('user_product_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('product_type', productType);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-favorites', productType] });
      toast({
        title: "Retiré des favoris",
        description: "Le produit a été retiré de vos favoris",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle favorite
  const toggleFavorite = useCallback((productId: string, productData?: Record<string, unknown>) => {
    if (favoriteIds.has(productId)) {
      removeFavorite.mutate(productId);
    } else {
      addFavorite.mutate({ productId, productData });
    }
  }, [favoriteIds, addFavorite, removeFavorite]);

  // Check if product is favorite
  const isFavorite = useCallback((productId: string) => {
    return favoriteIds.has(productId);
  }, [favoriteIds]);

  return {
    favorites,
    favoriteIds,
    isLoading,
    isFavorite,
    toggleFavorite,
    addFavorite: addFavorite.mutate,
    removeFavorite: removeFavorite.mutate,
    isAdding: addFavorite.isPending,
    isRemoving: removeFavorite.isPending,
  };
}
