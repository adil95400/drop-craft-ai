/**
 * Service SEO Analytics - Gestion complète du SEO
 * Opérations via Supabase direct
 */
import { supabase } from '@/integrations/supabase/client';

export interface TrackedKeyword {
  id: string; keyword: string; url: string; currentPosition: number | null;
  previousPosition: number | null; change: number | null; volume: number;
  difficulty: number; cpc: number; competition: 'Low' | 'Medium' | 'High';
  trend: 'up' | 'down' | 'stable'; lastUpdate: string; createdAt: string;
}

export interface KeywordResearchResult {
  keyword: string; volume: number; difficulty: number; cpc: number;
  competition: 'Low' | 'Medium' | 'High'; trend: 'up' | 'down' | 'stable'; relatedKeywords: string[];
}

export interface SEOAnalysis {
  url: string; score: number;
  title: { value: string; score: number; issues: string[] };
  metaDescription: { value: string; score: number; issues: string[] };
  h1: { value: string; score: number; issues: string[] };
  images: { total: number; withAlt: number; score: number };
  links: { internal: number; external: number; broken: number };
  performance: { loadTime: number; score: number };
  mobile: { friendly: boolean; score: number };
  recommendations: string[];
}

class SEOAnalyticsService {
  async searchKeywords(baseKeyword: string): Promise<KeywordResearchResult[]> {
    // Return basic keyword suggestions - real implementation would use an SEO API
    return [
      { keyword: baseKeyword, volume: 1000, difficulty: 50, cpc: 1.5, competition: 'Medium', trend: 'stable', relatedKeywords: [`${baseKeyword} pas cher`, `meilleur ${baseKeyword}`] },
      { keyword: `${baseKeyword} en ligne`, volume: 500, difficulty: 30, cpc: 0.8, competition: 'Low', trend: 'up', relatedKeywords: [] },
    ];
  }

  async addTrackedKeyword(keyword: string, url: string): Promise<TrackedKeyword> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await (supabase.from('seo_tracked_keywords') as any)
      .insert({ user_id: user.id, keyword, url })
      .select().single();
    if (error) throw error;

    return {
      id: data.id, keyword: data.keyword, url: data.url || '',
      currentPosition: data.current_position, previousPosition: data.previous_position,
      change: data.change, volume: data.volume || 0, difficulty: data.difficulty || 0,
      cpc: data.cpc || 0, competition: data.competition || 'Medium',
      trend: data.trend || 'stable', lastUpdate: data.last_update || data.created_at,
      createdAt: data.created_at,
    };
  }

  async getTrackedKeywords(): Promise<TrackedKeyword[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await (supabase.from('seo_tracked_keywords') as any)
      .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;

    return (data || []).map((d: any) => ({
      id: d.id, keyword: d.keyword, url: d.url || '',
      currentPosition: d.current_position, previousPosition: d.previous_position,
      change: d.change, volume: d.volume || 0, difficulty: d.difficulty || 0,
      cpc: Number(d.cpc) || 0, competition: d.competition || 'Medium',
      trend: d.trend || 'stable', lastUpdate: d.last_update || d.created_at,
      createdAt: d.created_at,
    }));
  }

  async removeTrackedKeyword(keywordId: string): Promise<void> {
    const { error } = await (supabase.from('seo_tracked_keywords') as any).delete().eq('id', keywordId);
    if (error) throw error;
  }

  async refreshPositions(): Promise<TrackedKeyword[]> {
    // In a real implementation, this would call an SEO API to get updated positions
    return this.getTrackedKeywords();
  }

  async analyzeUrl(url: string): Promise<SEOAnalysis> {
    // Basic client-side analysis placeholder
    return {
      url, score: 50,
      title: { value: '', score: 0, issues: ['Titre non analysé - connectez un service SEO'] },
      metaDescription: { value: '', score: 0, issues: ['Meta description non analysée'] },
      h1: { value: '', score: 0, issues: ['H1 non analysé'] },
      images: { total: 0, withAlt: 0, score: 0 },
      links: { internal: 0, external: 0, broken: 0 },
      performance: { loadTime: 0, score: 0 },
      mobile: { friendly: true, score: 80 },
      recommendations: ['Connectez un service SEO (ex: Ahrefs, SEMRush) pour une analyse complète'],
    };
  }

  async generateSEOContent(_keyword: string, _contentType: string = 'product') {
    return { title: '', metaDescription: '', h1: '', keywords: [] as string[], content: 'Génération de contenu SEO disponible prochainement via IA' };
  }

  async getSEOStats() {
    const keywords = await this.getTrackedKeywords();
    const withPosition = keywords.filter(k => k.currentPosition !== null);
    return {
      trackedKeywords: keywords.length,
      avgPosition: withPosition.length > 0 ? withPosition.reduce((s, k) => s + (k.currentPosition || 0), 0) / withPosition.length : 0,
      top10Count: withPosition.filter(k => (k.currentPosition || 999) <= 10).length,
      improvingCount: keywords.filter(k => k.trend === 'up').length,
    };
  }
}

export const seoAnalyticsService = new SEOAnalyticsService();
