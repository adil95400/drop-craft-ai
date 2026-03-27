import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useMemo } from 'react';

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

export interface TrackedKeywordRow {
  id: string;
  keyword: string;
  url: string | null;
  current_position: number | null;
  previous_position: number | null;
  change: number | null;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  competition: string | null;
  trend: string | null;
  last_update: string | null;
  created_at: string;
}

export interface SEOKeywordUI {
  keyword: string;
  volume: number;
  difficulty: number;
  position: number;
  change: number;
  cpc: number;
  intent: string;
  url: string;
  trend: number[];
}

export interface TechnicalIssue {
  id: string;
  category: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  pages: number;
  recommendation: string;
}

export interface ContentCalendarItem {
  id: string;
  title: string;
  status: string;
  date: string;
  type: string;
  keywords: string[];
  priority: string;
}

function guessIntent(keyword: string): string {
  const kw = keyword.toLowerCase();
  if (kw.includes('acheter') || kw.includes('prix') || kw.includes('promo') || kw.includes('pas cher')) return 'transactional';
  if (kw.includes('meilleur') || kw.includes('comparatif') || kw.includes('avis') || kw.includes('vs')) return 'commercial';
  return 'informational';
}

function generateDeterministicTrend(keyword: string): number[] {
  const seed = keyword.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from({ length: 12 }, (_, i) => {
    const base = 20 + (seed % 40);
    const growth = (i / 12) * (seed % 30);
    const variation = ((seed * (i + 1)) % 13) - 6;
    return Math.max(5, Math.round(base + growth + variation));
  });
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

  // ─── Tracked Keywords from DB ─────────────────────────────────────
  const { data: trackedKeywordsRaw = [], isLoading: isLoadingKeywords } = useQuery({
    queryKey: ['seo-tracked-keywords', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('seo_tracked_keywords')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) { console.warn('seo_tracked_keywords error:', error); return []; }
      return (data ?? []) as TrackedKeywordRow[];
    },
    enabled: !!user?.id,
  });

  // Map tracked keywords to UI format
  const trackedKeywords = useMemo<SEOKeywordUI[]>(() => {
    return trackedKeywordsRaw.map(k => ({
      keyword: k.keyword,
      volume: k.volume ?? 0,
      difficulty: k.difficulty ?? 50,
      position: k.current_position ?? 99,
      change: k.change ?? 0,
      cpc: Number(k.cpc) || 0,
      intent: guessIntent(k.keyword),
      url: k.url || '/',
      trend: generateDeterministicTrend(k.keyword),
    }));
  }, [trackedKeywordsRaw]);

  // ─── Technical Issues derived from product scores ──────────────────
  const technicalIssues = useMemo<TechnicalIssue[]>(() => {
    const issues: TechnicalIssue[] = [];
    const noDesc = productScores.filter(p => !p.product?.description || p.product.description.length < 50).length;
    const noImages = productScores.filter(p => !p.product?.image_url).length;
    const lowTitle = productScores.filter(p => (p.title_score ?? 100) < 40).length;
    const lowDesc = productScores.filter(p => (p.description_score ?? 100) < 40).length;
    const lowAttr = productScores.filter(p => (p.attributes_score ?? 100) < 40).length;

    if (noDesc > 0) issues.push({ id: 'no-desc', category: 'contenu', severity: 'critical', title: `${noDesc} descriptions produits trop courtes ou manquantes`, pages: noDesc, recommendation: 'Réécrire avec l\'IA pour du contenu unique et optimisé SEO' });
    if (noImages > 0) issues.push({ id: 'no-img', category: 'contenu', severity: 'critical', title: `${noImages} produits sans image`, pages: noImages, recommendation: 'Ajouter des images haute qualité avec attributs alt descriptifs' });
    if (lowTitle > 0) issues.push({ id: 'low-title', category: 'contenu', severity: 'warning', title: `${lowTitle} titres produits mal optimisés`, pages: lowTitle, recommendation: 'Optimiser les titres avec des mots-clés pertinents (50-70 caractères)' });
    if (lowDesc > 0) issues.push({ id: 'low-desc', category: 'contenu', severity: 'warning', title: `${lowDesc} descriptions avec score SEO faible`, pages: lowDesc, recommendation: 'Enrichir les descriptions avec des mots-clés et du contenu unique' });
    if (lowAttr > 0) issues.push({ id: 'low-attr', category: 'technique', severity: 'info', title: `${lowAttr} produits avec attributs incomplets`, pages: lowAttr, recommendation: 'Compléter les attributs (poids, dimensions, matériaux, etc.)' });

    // Always show these structural issues
    issues.push({ id: 'schema', category: 'technique', severity: 'warning', title: 'Données structurées Product JSON-LD recommandées', pages: productScores.length, recommendation: 'Ajouter le schema Product JSON-LD sur toutes les fiches produit' });

    return issues;
  }, [productScores]);

  // ─── Content Calendar from blog posts ─────────────────────────────
  const contentCalendar = useMemo<ContentCalendarItem[]>(() => {
    return posts
      .filter(p => p.publish_date || p.status === 'draft')
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        title: p.title,
        status: p.status === 'published' ? 'published' : p.status === 'draft' ? 'draft' : 'scheduled',
        date: p.publish_date || p.created_at,
        type: 'blog',
        keywords: p.tags?.slice(0, 3) || [],
        priority: p.ai_generated ? 'medium' : 'high',
      }));
  }, [posts]);

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
    trackedKeywords,
    technicalIssues,
    contentCalendar,
    isLoading: isLoadingPosts || isLoadingAudits || isLoadingScores || isLoadingAI || isLoadingKeywords,
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
      trackedKeywordsCount: trackedKeywords.length,
    },
  };
}
