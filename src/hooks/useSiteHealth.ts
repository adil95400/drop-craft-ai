import { useQuery } from '@tanstack/react-query';
import { shopOptiApi } from '@/services/api/ShopOptiApiClient';

export interface SiteHealthData {
  overall: number;
  seo: number;
  images: number;
  content: number;
  translations: number;
  lastOptimization: string;
  optimizationCount: number;
  improvement: number;
  nextOptimization: string;
}

const DEFAULT_HEALTH: SiteHealthData = {
  overall: 0, seo: 0, images: 0, content: 0, translations: 0,
  lastOptimization: 'Jamais', optimizationCount: 0, improvement: 0, nextOptimization: 'Non planifiée'
};

export function useSiteHealth() {
  const { data: siteHealth, isLoading } = useQuery({
    queryKey: ['site-health'],
    queryFn: async (): Promise<SiteHealthData> => {
      const res = await shopOptiApi.request<SiteHealthData>('/seo/site-health');
      return res.data || DEFAULT_HEALTH;
    },
    refetchInterval: 30000,
  });

  return { siteHealth: siteHealth || DEFAULT_HEALTH, isLoading };
}
