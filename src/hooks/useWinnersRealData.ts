import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WinnerProduct {
  id: string;
  name: string;
  category: string;
  score: number;
  trend: string;
  avgPrice: number;
  profit: number;
  competition: 'low' | 'medium' | 'high';
  orders: number;
  rating: number;
  image: string;
  source: string;
  socialProof: {
    tiktokViews?: number;
    instagramPosts?: number;
    facebookAds?: number;
  };
  detectedAt: string;
}

export interface WinnersMetrics {
  totalWinners: number;
  avgScore: number;
  avgTrend: string;
  potentialProfit: number;
  sources: {
    tiktok: number;
    instagram: number;
    amazon: number;
    catalog: number;
  };
  categories: string[];
  lastUpdated: string;
}

export interface WinnersResponse {
  success: boolean;
  products: WinnerProduct[];
  metrics: WinnersMetrics | null;
  meta: {
    dataSource: string;
    scrapedTrends: number;
    timestamp: string;
  };
}

export function useWinnersRealData(category?: string, limit: number = 20) {
  return useQuery({
    queryKey: ['winners-real-data', category, limit],
    queryFn: async (): Promise<WinnersResponse> => {
      const { data, error } = await supabase.functions.invoke('winners-real-data', {
        body: { action: 'get_winners', category, limit },
      });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });
}

export function useRefreshWinners() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { category?: string; limit?: number }) => {
      const { data, error } = await supabase.functions.invoke('winners-real-data', {
        body: { 
          action: 'get_winners', 
          category: params.category, 
          limit: params.limit || 20,
          forceRefresh: true 
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['winners-real-data'] });
      toast.success(`${data.products?.length || 0} produits gagnants analysés avec IA`);
    },
    onError: (error) => {
      toast.error(`Erreur lors de l'analyse: ${error.message}`);
    },
  });
}

export function useWinnersCategories() {
  return useQuery({
    queryKey: ['winners-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;

      const categories = [...new Set(data.map(p => p.category).filter(Boolean))];
      return categories;
    },
    staleTime: 30 * 60 * 1000,
  });
}
