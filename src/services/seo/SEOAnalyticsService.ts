/**
 * Service SEO Analytics - Gestion complète du SEO
 * Toutes les opérations passent par le backend FastAPI
 */

import { shopOptiApi } from '@/services/api/ShopOptiApiClient';

export interface TrackedKeyword {
  id: string;
  keyword: string;
  url: string;
  currentPosition: number | null;
  previousPosition: number | null;
  change: number | null;
  volume: number;
  difficulty: number;
  cpc: number;
  competition: 'Low' | 'Medium' | 'High';
  trend: 'up' | 'down' | 'stable';
  lastUpdate: string;
  createdAt: string;
}

export interface KeywordResearchResult {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  competition: 'Low' | 'Medium' | 'High';
  trend: 'up' | 'down' | 'stable';
  relatedKeywords: string[];
}

export interface SEOAnalysis {
  url: string;
  score: number;
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
    const res = await shopOptiApi.request<KeywordResearchResult[]>('/seo/keywords/research', {
      method: 'POST',
      body: { keyword: baseKeyword }
    });
    return res.data || [];
  }

  async addTrackedKeyword(keyword: string, url: string): Promise<TrackedKeyword> {
    const res = await shopOptiApi.request<TrackedKeyword>('/seo/keywords/track', {
      method: 'POST',
      body: { keyword, url }
    });
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to add keyword');
    return res.data;
  }

  async getTrackedKeywords(): Promise<TrackedKeyword[]> {
    const res = await shopOptiApi.request<TrackedKeyword[]>('/seo/keywords/tracked');
    return res.data || [];
  }

  async removeTrackedKeyword(keywordId: string): Promise<void> {
    await shopOptiApi.request(`/seo/keywords/tracked/${keywordId}`, { method: 'DELETE' });
  }

  async refreshPositions(): Promise<TrackedKeyword[]> {
    const res = await shopOptiApi.request<TrackedKeyword[]>('/seo/keywords/refresh', { method: 'POST' });
    return res.data || [];
  }

  async analyzeUrl(url: string): Promise<SEOAnalysis> {
    const res = await shopOptiApi.request<SEOAnalysis>('/seo/analyze', {
      method: 'POST',
      body: { url }
    });
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to analyze URL');
    return res.data;
  }

  async generateSEOContent(keyword: string, contentType: string = 'product'): Promise<{
    title: string;
    metaDescription: string;
    h1: string;
    keywords: string[];
    content: string;
  }> {
    const res = await shopOptiApi.request<{
      title: string;
      metaDescription: string;
      h1: string;
      keywords: string[];
      content: string;
    }>('/seo/content/generate', {
      method: 'POST',
      body: { keyword, contentType }
    });
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to generate content');
    return res.data;
  }

  async getSEOStats(): Promise<{
    trackedKeywords: number;
    avgPosition: number;
    top10Count: number;
    improvingCount: number;
  }> {
    const res = await shopOptiApi.request<{
      trackedKeywords: number;
      avgPosition: number;
      top10Count: number;
      improvingCount: number;
    }>('/seo/stats');
    return res.data || { trackedKeywords: 0, avgPosition: 0, top10Count: 0, improvingCount: 0 };
  }
}

export const seoAnalyticsService = new SEOAnalyticsService();
