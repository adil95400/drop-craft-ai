import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdSpyResult {
  id: string;
  platform: string;
  advertiser_name: string;
  product_name: string;
  product_image: string;
  ad_creative: string;
  landing_page: string;
  first_seen: string;
  last_seen: string;
  days_running: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  estimated_daily_spend: number;
  target_countries: string[];
  target_demographics: string;
  ad_copy: string;
  cta_type: string;
  winning_score: number;
  saturation_level: string;
  profit_potential: number;
}

export interface AdSpyFilters {
  keyword: string;
  platform: 'all' | 'Facebook' | 'Instagram' | 'TikTok';
  category: string;
  minDaysRunning: number;
  sortBy: 'engagement' | 'spend' | 'score' | 'days';
}

export interface AdSpyInsights {
  avg_engagement: number;
  avg_days_running: number;
  top_platforms: Record<string, number>;
  top_ctas: Record<string, number>;
}

export function useAdSpy() {
  const queryClient = useQueryClient();

  // Search ads mutation
  const searchAdsMutation = useMutation({
    mutationFn: async (filters: AdSpyFilters) => {
      console.log('[Ad Spy] Searching ads:', filters);
      
      const { data, error } = await supabase.functions.invoke('ad-spy-scanner', {
        body: {
          action: 'search_ads',
          keyword: filters.keyword,
          platform: filters.platform,
          category: filters.category,
          min_days_running: filters.minDaysRunning,
          sort_by: filters.sortBy,
          limit: 20
        }
      });

      if (error) {
        console.error('[Ad Spy] Error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      const count = data?.ads?.length || 0;
      toast.success(`🔍 ${count} publicités trouvées`);
      queryClient.invalidateQueries({ queryKey: ['ad-spy-results'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la recherche publicitaire');
    }
  });

  // Get trending ads
  const trendingAdsMutation = useMutation({
    mutationFn: async ({ platform, category }: { platform: string; category: string }) => {
      const { data, error } = await supabase.functions.invoke('ad-spy-scanner', {
        body: {
          action: 'trending_ads',
          platform,
          category,
          limit: 15
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`🔥 ${data?.ads?.length || 0} tendances publicitaires trouvées`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la récupération des tendances');
    }
  });

  // Analyze competitor
  const analyzeCompetitorMutation = useMutation({
    mutationFn: async (advertiserName: string) => {
      const { data, error } = await supabase.functions.invoke('ad-spy-scanner', {
        body: {
          action: 'analyze_competitor',
          keyword: advertiserName
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Analyse du concurrent terminée');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'analyse du concurrent');
    }
  });

  // Spy on specific product
  const spyProductMutation = useMutation({
    mutationFn: async (productName: string) => {
      const { data, error } = await supabase.functions.invoke('ad-spy-scanner', {
        body: {
          action: 'spy_product',
          keyword: productName
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Analyse produit complète');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'espionnage produit');
    }
  });

  return {
    // Search
    searchAds: searchAdsMutation.mutateAsync,
    isSearching: searchAdsMutation.isPending,
    searchResults: searchAdsMutation.data,
    
    // Trending
    getTrendingAds: trendingAdsMutation.mutateAsync,
    isLoadingTrending: trendingAdsMutation.isPending,
    trendingAds: trendingAdsMutation.data,
    
    // Competitor analysis
    analyzeCompetitor: analyzeCompetitorMutation.mutateAsync,
    isAnalyzingCompetitor: analyzeCompetitorMutation.isPending,
    competitorAnalysis: analyzeCompetitorMutation.data,
    
    // Product spy
    spyProduct: spyProductMutation.mutateAsync,
    isSpyingProduct: spyProductMutation.isPending,
    productSpy: spyProductMutation.data
  };
}

// Hook for ad collection management (like Minea's collections)
export function useAdCollections() {
  const queryClient = useQueryClient();

  const { data: collections, isLoading } = useQuery({
    queryKey: ['ad-collections'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('ad_collections')
        .select('*, ad_collection_items(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const createCollectionMutation = useMutation({
    mutationFn: async ({ name, description, color }: { name: string; description?: string; color?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('ad_collections')
        .insert({
          user_id: user.id,
          name,
          description,
          color: color || '#6366f1'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-collections'] });
      toast.success('Collection créée');
    }
  });

  const addToCollectionMutation = useMutation({
    mutationFn: async ({ collectionId, ad }: { collectionId: string; ad: AdSpyResult }) => {
      const { data, error } = await supabase
        .from('ad_collection_items')
        .insert({
          collection_id: collectionId,
          ad_id: ad.id,
          notes: ''
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-collections'] });
      toast.success('Publicité ajoutée à la collection');
    }
  });

  return {
    collections,
    isLoading,
    createCollection: createCollectionMutation.mutateAsync,
    isCreating: createCollectionMutation.isPending,
    addToCollection: addToCollectionMutation.mutateAsync,
    isAdding: addToCollectionMutation.isPending
  };
}
