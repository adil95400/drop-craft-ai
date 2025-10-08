import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { winnersService } from '@/domains/winners/services/winnersService';
import { WinnersSearchParams, WinnerProduct } from '@/domains/winners/types';
import { useToast } from '@/hooks/use-toast';

// Client-side cache with TTL
const clientCache = new Map<string, { data: any; timestamp: number }>();
const CLIENT_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export const useWinnersOptimized = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState<WinnersSearchParams>(() => {
    const saved = localStorage.getItem('winners-last-search');
    return saved ? JSON.parse(saved) : { query: 'trending products', limit: 30 };
  });
  const [filteredProducts, setFilteredProducts] = useState<WinnerProduct[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Save search params to localStorage
  useEffect(() => {
    localStorage.setItem('winners-last-search', JSON.stringify(searchParams));
  }, [searchParams]);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('winners-favorites');
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)));
    }
  }, []);

  // Main search query with client cache
  const { data: response, isLoading } = useQuery({
    queryKey: ['winners', searchParams],
    queryFn: async () => {
      const cacheKey = JSON.stringify(searchParams);
      const cached = clientCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL) {
        console.log('Using client cache');
        return cached.data;
      }

      const data = await winnersService.searchWinners(searchParams);
      clientCache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  // Filter and sort products client-side
  useEffect(() => {
    if (!response?.products) {
      setFilteredProducts([]);
      return;
    }

    let filtered = [...response.products];

    // Apply client-side filters
    if (searchParams.minScore) {
      filtered = filtered.filter(p => (p.final_score || 0) >= searchParams.minScore!);
    }
    if (searchParams.maxPrice) {
      filtered = filtered.filter(p => p.price <= searchParams.maxPrice!);
    }

    setFilteredProducts(filtered);
  }, [response, searchParams]);

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: (params: WinnersSearchParams) => {
      setSearchParams(params);
      return winnersService.searchWinners(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['winners'] });
    }
  });

  // Import mutation with optimistic updates
  const importMutation = useMutation({
    mutationFn: winnersService.importProduct,
    onMutate: async (product) => {
      // Optimistic update
      toast({
        title: "Import en cours...",
        description: product.title
      });
    },
    onSuccess: (data, product) => {
      toast({
        title: "✅ Produit importé !",
        description: `${product.title} ajouté à votre catalogue`
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur d'import",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Trends analysis
  const trendsMutation = useMutation({
    mutationFn: winnersService.analyzeTrends,
    onSuccess: (data) => {
      toast({
        title: "📊 Analyse terminée",
        description: `${data.trends?.length || 0} tendances détectées`
      });
    }
  });

  // Favorites management
  const toggleFavorite = useCallback((productId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
        toast({ title: "Retiré des favoris" });
      } else {
        newFavorites.add(productId);
        toast({ title: "Ajouté aux favoris" });
      }
      localStorage.setItem('winners-favorites', JSON.stringify(Array.from(newFavorites)));
      return newFavorites;
    });
  }, [toast]);

  // Prefetch next page
  const prefetchNextPage = useCallback(() => {
    const nextParams = { ...searchParams, limit: (searchParams.limit || 30) + 20 };
    queryClient.prefetchQuery({
      queryKey: ['winners', nextParams],
      queryFn: () => winnersService.searchWinners(nextParams)
    });
  }, [searchParams, queryClient]);

  // Calculate stats
  const stats = {
    totalAnalyzed: response?.meta?.total || 0,
    winnersDetected: filteredProducts.length,
    averageScore: filteredProducts.length > 0 
      ? filteredProducts.reduce((sum, p) => sum + (p.final_score || 0), 0) / filteredProducts.length 
      : 0,
    successRate: response?.meta?.total ? (filteredProducts.length / response.meta.total) * 100 : 0
  };

  return {
    products: filteredProducts,
    response,
    stats,
    searchParams,
    isLoading: isLoading || searchMutation.isPending,
    isImporting: importMutation.isPending,
    favorites,
    search: searchMutation.mutate,
    importProduct: importMutation.mutate,
    analyzeTrends: trendsMutation.mutate,
    toggleFavorite,
    prefetchNextPage,
    setSearchParams
  };
};
