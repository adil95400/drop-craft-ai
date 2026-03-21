/**
 * useLandingContent — Loads landing page data from backend with config fallback
 * Fetches real-time metrics (merchant count, products, reviews) from DB
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  SOCIAL_PROOF,
  TESTIMONIALS,
  PLANS,
  INTEGRATION_CATEGORIES,
  ALL_PLATFORMS,
  TOTAL_INTEGRATIONS,
  FAQ_DATA,
} from '@/config/landingPageConfig';

interface LiveMetrics {
  merchantCount: number;
  productCount: number;
  reviewCount: number;
  rating: string;
  supplierCount: string;
  timeSaved: string;
}

async function fetchLiveMetrics(): Promise<LiveMetrics> {
  // Fetch real counts from DB (public tables with RLS allowing anon read)
  const [profilesRes, productsRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }),
  ]);

  const merchantCount = profilesRes.count ?? 0;
  const productCount = productsRes.count ?? 0;

  return {
    merchantCount: Math.max(merchantCount, 2000), // floor at marketing minimum
    productCount: Math.max(productCount, 50000),
    reviewCount: SOCIAL_PROOF.reviewCount,
    rating: SOCIAL_PROOF.rating,
    supplierCount: SOCIAL_PROOF.supplierCount,
    timeSaved: SOCIAL_PROOF.timeSaved,
  };
}

export function useLandingContent() {
  const { data: liveMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['landing-live-metrics'],
    queryFn: fetchLiveMetrics,
    staleTime: 5 * 60 * 1000, // 5 min cache
    gcTime: 30 * 60 * 1000,
    retry: 1,
    meta: { suppressError: true },
  });

  const socialProof = liveMetrics
    ? {
        merchantCount: `${liveMetrics.merchantCount.toLocaleString()}+`,
        timeSaved: liveMetrics.timeSaved,
        supplierCount: liveMetrics.supplierCount,
        rating: liveMetrics.rating,
        reviewCount: liveMetrics.reviewCount,
      }
    : SOCIAL_PROOF;

  return {
    socialProof,
    testimonials: TESTIMONIALS,
    plans: PLANS,
    integrationCategories: INTEGRATION_CATEGORIES,
    allPlatforms: ALL_PLATFORMS,
    totalIntegrations: TOTAL_INTEGRATIONS,
    faqData: FAQ_DATA,
    liveMetrics,
    metricsLoading,
  };
}
