/**
 * Hook to load dynamic landing page content from the database.
 * Falls back to static config if fetch fails.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  PLANS,
  TESTIMONIALS,
  SOCIAL_PROOF,
  type PlanConfig,
  type Testimonial,
} from '@/config/landingPageConfig';

interface LandingContent {
  section: string;
  content_key: string;
  content_value: Record<string, unknown>;
  sort_order: number;
}

async function fetchLandingContent(): Promise<LandingContent[]> {
  const { data, error } = await supabase
    .from('landing_content')
    .select('section, content_key, content_value, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as LandingContent[];
}

export function useLandingContent() {
  const { data: rawContent, isLoading } = useQuery({
    queryKey: ['landing-content'],
    queryFn: fetchLandingContent,
    staleTime: 10 * 60 * 1000, // 10 min cache
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  // Parse by section with static fallbacks
  const testimonials: Testimonial[] = (() => {
    if (!rawContent) return TESTIMONIALS;
    const items = rawContent
      .filter((c) => c.section === 'testimonials')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => c.content_value as unknown as Testimonial);
    return items.length > 0 ? items : TESTIMONIALS;
  })();

  const socialProof = (() => {
    if (!rawContent) return SOCIAL_PROOF;
    const item = rawContent.find((c) => c.section === 'social_proof' && c.content_key === 'metrics');
    return item ? (item.content_value as typeof SOCIAL_PROOF) : SOCIAL_PROOF;
  })();

  const plans: PlanConfig[] = (() => {
    if (!rawContent) return PLANS;
    const items = rawContent
      .filter((c) => c.section === 'pricing')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => c.content_value as unknown as PlanConfig);
    return items.length > 0 ? items : PLANS;
  })();

  return { testimonials, socialProof, plans, isLoading };
}
