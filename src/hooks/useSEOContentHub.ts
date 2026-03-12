import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[] | null;
  category: string | null;
  status: string;
  ai_generated: boolean;
  views: number;
  publish_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductSEOScore {
  id: string;
  product_id: string | null;
  overall_score: number | null;
  seo_score: number | null;
  title_score: number | null;
  description_score: number | null;
  images_score: number | null;
  attributes_score: number | null;
  pricing_score: number | null;
  issues: any;
  recommendations: any;
  last_analyzed_at: string | null;
  product?: {
    title: string;
    sku: string | null;
    image_url: string | null;
    description: string | null;
  };
}

export function useSEOContentHub() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Blog posts
  const { data: posts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: ['blog-posts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
    enabled: !!user?.id,
  });

  // SEO audits
  const { data: audits = [], isLoading: isLoadingAudits } = useQuery({
    queryKey: ['seo-audits', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('seo_audits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) { console.warn('seo_audits error:', error); return []; }
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  // Product SEO scores with product details
  const { data: productScores = [], isLoading: isLoadingScores } = useQuery({
    queryKey: ['product-seo-scores', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('product_scores')
        .select('*, products(title, sku, image_url, description)')
        .eq('user_id', user.id)
        .order('seo_score', { ascending: true })
        .limit(100);
      if (error) { console.warn('product_scores error:', error); return []; }
      return (data ?? []).map(d => ({
        ...d,
        product: d.products as any,
      })) as ProductSEOScore[];
    },
    enabled: !!user?.id,
  });

  // AI-generated content history
  const { data: aiContent = [], isLoading: isLoadingAI } = useQuery({
    queryKey: ['ai-generated-content', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('ai_generated_content')
        .select('*, products(title, sku)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) { console.warn('ai_generated_content error:', error); return []; }
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  // Generate blog post via AI
  const generatePost = useMutation({
    mutationFn: async (params: { topic: string; keywords?: string[]; tone?: string; category?: string }) => {
      const { data, error } = await supabase.functions.invoke('blog-ai-generate', {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Article généré avec succès !');
    },
    onError: (e: Error) => toast.error(`Erreur : ${e.message}`),
  });

  // Update post status
  const updatePost = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BlogPost> }) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Article mis à jour');
    },
  });

  // Delete post
  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Article supprimé');
    },
  });

  // Stats
  const avgSeoScore = productScores.length
    ? Math.round(productScores.reduce((a, s) => a + (s.seo_score || 0), 0) / productScores.length)
    : 0;

  const lowSeoProducts = productScores.filter(p => (p.seo_score ?? 0) < 50).length;
  const goodSeoProducts = productScores.filter(p => (p.seo_score ?? 0) >= 80).length;

  return {
    posts,
    audits,
    productScores,
    aiContent,
    isLoading: isLoadingPosts || isLoadingAudits || isLoadingScores || isLoadingAI,
    generatePost: generatePost.mutate,
    isGenerating: generatePost.isPending,
    updatePost: updatePost.mutate,
    deletePost: deletePost.mutate,
    stats: {
      totalPosts: posts.length,
      publishedPosts: posts.filter(p => p.status === 'published').length,
      draftPosts: posts.filter(p => p.status === 'draft').length,
      aiGenerated: posts.filter(p => p.ai_generated).length,
      avgSeoScore,
      totalAudits: audits.length,
      totalProductsScored: productScores.length,
      lowSeoProducts,
      goodSeoProducts,
      aiContentCount: aiContent.length,
    },
  };
}
