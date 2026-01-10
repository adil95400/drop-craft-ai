/**
 * Service SEO Analytics - Gestion complète du SEO
 * Persistance, analyse, suivi de mots-clés
 */

import { supabase } from '@/integrations/supabase/client';

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
  /**
   * Recherche de mots-clés avec données simulées réalistes
   */
  async searchKeywords(baseKeyword: string): Promise<KeywordResearchResult[]> {
    const variations = [
      baseKeyword,
      `${baseKeyword} pas cher`,
      `${baseKeyword} en ligne`,
      `acheter ${baseKeyword}`,
      `${baseKeyword} qualité`,
      `${baseKeyword} professionnel`,
      `meilleur ${baseKeyword}`,
      `${baseKeyword} avis`,
      `${baseKeyword} comparatif`,
      `${baseKeyword} livraison rapide`,
      `${baseKeyword} promotion`,
      `${baseKeyword} soldes`
    ];

    return variations.map((kw, index) => {
      const baseVolume = Math.floor(Math.random() * 30000) + 500;
      const difficulty = Math.floor(Math.random() * 100);
      
      return {
        keyword: kw,
        volume: index === 0 ? baseVolume * 2 : baseVolume - (index * 500),
        difficulty,
        cpc: parseFloat((Math.random() * 3 + 0.1).toFixed(2)),
        competition: difficulty < 30 ? 'Low' : difficulty < 70 ? 'Medium' : 'High',
        trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
        relatedKeywords: variations.slice(0, 5).filter(k => k !== kw)
      };
    });
  }

  /**
   * Ajouter un mot-clé au suivi (stockage local + simulations)
   */
  async addTrackedKeyword(keyword: string, url: string): Promise<TrackedKeyword> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const now = new Date().toISOString();
    const position = Math.floor(Math.random() * 50) + 1;
    
    const keywordData: TrackedKeyword = {
      id: crypto.randomUUID(),
      keyword,
      url,
      currentPosition: position,
      previousPosition: null,
      change: null,
      volume: Math.floor(Math.random() * 20000) + 1000,
      difficulty: Math.floor(Math.random() * 100),
      cpc: parseFloat((Math.random() * 2).toFixed(2)),
      competition: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] as 'Low' | 'Medium' | 'High',
      trend: Math.random() > 0.5 ? 'up' : 'down',
      lastUpdate: now,
      createdAt: now
    };

    // Stocker dans localStorage pour la persistance
    const stored = this.getStoredKeywords(user.id);
    stored.push(keywordData);
    localStorage.setItem(`seo_keywords_${user.id}`, JSON.stringify(stored));

    return keywordData;
  }

  /**
   * Récupérer les mots-clés suivis
   */
  async getTrackedKeywords(): Promise<TrackedKeyword[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    return this.getStoredKeywords(user.id);
  }

  private getStoredKeywords(userId: string): TrackedKeyword[] {
    try {
      const stored = localStorage.getItem(`seo_keywords_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Supprimer un mot-clé suivi
   */
  async removeTrackedKeyword(keywordId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const stored = this.getStoredKeywords(user.id);
    const filtered = stored.filter(k => k.id !== keywordId);
    localStorage.setItem(`seo_keywords_${user.id}`, JSON.stringify(filtered));
  }

  /**
   * Actualiser les positions des mots-clés suivis
   */
  async refreshPositions(): Promise<TrackedKeyword[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const stored = this.getStoredKeywords(user.id);
    const now = new Date().toISOString();
    
    const updated = stored.map(kw => {
      const newPosition = Math.max(1, kw.currentPosition! + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 5));
      return {
        ...kw,
        previousPosition: kw.currentPosition,
        currentPosition: newPosition,
        change: kw.currentPosition! - newPosition,
        trend: newPosition < kw.currentPosition! ? 'up' : newPosition > kw.currentPosition! ? 'down' : 'stable' as 'up' | 'down' | 'stable',
        lastUpdate: now
      };
    });

    localStorage.setItem(`seo_keywords_${user.id}`, JSON.stringify(updated));
    return updated;
  }

  /**
   * Analyser une URL
   */
  async analyzeUrl(url: string): Promise<SEOAnalysis> {
    // Simulation d'analyse SEO
    const titleScore = Math.floor(Math.random() * 40) + 60;
    const metaScore = Math.floor(Math.random() * 40) + 50;
    const h1Score = Math.floor(Math.random() * 40) + 55;
    const imagesTotal = Math.floor(Math.random() * 20) + 5;
    const imagesWithAlt = Math.floor(imagesTotal * (Math.random() * 0.4 + 0.5));
    
    return {
      url,
      score: Math.floor((titleScore + metaScore + h1Score) / 3),
      title: {
        value: `Titre de la page - ${url}`,
        score: titleScore,
        issues: titleScore < 80 ? ['Titre trop court', 'Mot-clé principal absent'] : []
      },
      metaDescription: {
        value: 'Description de la page avec les informations principales...',
        score: metaScore,
        issues: metaScore < 70 ? ['Description trop courte (moins de 120 caractères)', 'Pas de CTA'] : []
      },
      h1: {
        value: 'Titre H1 de la page',
        score: h1Score,
        issues: h1Score < 70 ? ['Plusieurs H1 détectés', 'H1 différent du title'] : []
      },
      images: {
        total: imagesTotal,
        withAlt: imagesWithAlt,
        score: Math.floor((imagesWithAlt / imagesTotal) * 100)
      },
      links: {
        internal: Math.floor(Math.random() * 30) + 10,
        external: Math.floor(Math.random() * 10) + 2,
        broken: Math.floor(Math.random() * 3)
      },
      performance: {
        loadTime: parseFloat((Math.random() * 3 + 0.5).toFixed(2)),
        score: Math.floor(Math.random() * 30) + 60
      },
      mobile: {
        friendly: Math.random() > 0.2,
        score: Math.floor(Math.random() * 20) + 75
      },
      recommendations: [
        'Ajouter des balises alt aux images manquantes',
        'Optimiser la longueur du titre (50-60 caractères)',
        'Enrichir la meta description avec des mots-clés',
        'Corriger les liens brisés détectés',
        'Ajouter des données structurées Schema.org'
      ]
    };
  }

  /**
   * Générer du contenu SEO optimisé
   */
  async generateSEOContent(keyword: string, contentType: string = 'product'): Promise<{
    title: string;
    metaDescription: string;
    h1: string;
    keywords: string[];
    content: string;
  }> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Génération locale si pas de session
      return this.generateLocalContent(keyword, contentType);
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-seo-generator', {
        body: { keyword, contentType }
      });

      if (error) throw error;
      return data;
    } catch {
      // Fallback à la génération locale
      return this.generateLocalContent(keyword, contentType);
    }
  }

  private generateLocalContent(keyword: string, contentType: string) {
    return {
      title: `${keyword} - Guide Complet ${new Date().getFullYear()} | Solutions Professionnelles`,
      metaDescription: `Découvrez ${keyword} : guide expert, conseils pratiques et meilleures solutions. ✓ Qualité garantie ✓ Livraison rapide ✓ Service client 7j/7`,
      h1: `${keyword} : Le Guide Ultime ${new Date().getFullYear()}`,
      keywords: [
        keyword,
        `${keyword} pas cher`,
        `meilleur ${keyword}`,
        `acheter ${keyword}`,
        `${keyword} en ligne`,
        `${keyword} qualité`,
        `${keyword} avis`,
        `comparatif ${keyword}`
      ],
      content: `
# ${keyword} : Le Guide Ultime ${new Date().getFullYear()}

## Introduction à ${keyword}

Ce guide complet vous présente tout ce que vous devez savoir sur ${keyword}. Notre expertise dans le domaine nous permet de vous offrir des conseils pratiques et des solutions adaptées à vos besoins.

## Les Avantages de ${keyword}

- **Qualité garantie** : Sélection rigoureuse des meilleurs produits
- **Prix compétitifs** : Meilleur rapport qualité-prix du marché
- **Livraison rapide** : Expédition sous 24-48h
- **Service client** : Support disponible 7j/7

## Comment Choisir ${keyword}

### 1. Analysez vos besoins
Avant tout achat, définissez précisément vos besoins et votre budget.

### 2. Comparez les options
Utilisez notre comparateur pour trouver la solution idéale.

### 3. Vérifiez les avis
Consultez les retours de nos clients satisfaits.

## FAQ sur ${keyword}

### Qu'est-ce que ${keyword} ?
${keyword} est une solution innovante qui répond à vos besoins spécifiques.

### Comment commander ${keyword} ?
Commandez directement en ligne avec paiement sécurisé et livraison express.

### Quelle garantie pour ${keyword} ?
Tous nos produits bénéficient d'une garantie satisfait ou remboursé.

---
*Contenu optimisé pour le référencement - À personnaliser selon vos besoins*
      `
    };
  }

  /**
   * Obtenir les statistiques SEO globales
   */
  async getSEOStats(): Promise<{
    trackedKeywords: number;
    avgPosition: number;
    top10Count: number;
    improvingCount: number;
  }> {
    const keywords = await this.getTrackedKeywords();
    
    if (keywords.length === 0) {
      return {
        trackedKeywords: 0,
        avgPosition: 0,
        top10Count: 0,
        improvingCount: 0
      };
    }

    const positionsWithValue = keywords.filter(k => k.currentPosition !== null);
    const avgPosition = positionsWithValue.length > 0
      ? Math.round(positionsWithValue.reduce((sum, k) => sum + (k.currentPosition || 0), 0) / positionsWithValue.length)
      : 0;

    return {
      trackedKeywords: keywords.length,
      avgPosition,
      top10Count: keywords.filter(k => (k.currentPosition || 100) <= 10).length,
      improvingCount: keywords.filter(k => k.change && k.change > 0).length
    };
  }
}

export const seoAnalyticsService = new SEOAnalyticsService();
