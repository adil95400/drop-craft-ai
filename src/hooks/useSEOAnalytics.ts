import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SEOMetrics {
  id: string;
  url: string;
  title: string;
  metaDescription: string;
  keywords: string[];
  h1Count: number;
  h2Count: number;
  h3Count: number;
  imageCount: number;
  imagesWithAlt: number;
  internalLinks: number;
  externalLinks: number;
  wordCount: number;
  readabilityScore: number;
  pageSizeKB: number;
  loadTimeMs: number;
  mobileOptimized: boolean;
  httpsEnabled: boolean;
  structuredData: boolean;
  seoScore: number;
  lastAnalyzed: Date;
  createdAt: Date;
}

interface SEORanking {
  id: string;
  keyword: string;
  url: string;
  position: number;
  previousPosition: number | null;
  searchVolume: number;
  difficulty: number;
  ctr: number;
  impressions: number;
  clicks: number;
  country: string;
  device: 'desktop' | 'mobile';
  lastChecked: Date;
}

export const useSEOAnalytics = () => {
  const [metrics, setMetrics] = useState<SEOMetrics[]>([]);
  const [rankings, setRankings] = useState<SEORanking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch SEO metrics
  const fetchMetrics = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      // Simulate fetching from database
      const mockMetrics: SEOMetrics[] = [
        {
          id: '1',
          url: 'https://monsite.com',
          title: 'Coques iPhone 15 - Protection Premium | Mon Site',
          metaDescription: 'Découvrez notre collection de coques iPhone 15. Protection optimale, designs uniques et qualité garantie.',
          keywords: ['coque iphone 15', 'protection iphone', 'accessoires apple'],
          h1Count: 1,
          h2Count: 4,
          h3Count: 8,
          imageCount: 12,
          imagesWithAlt: 10,
          internalLinks: 15,
          externalLinks: 3,
          wordCount: 850,
          readabilityScore: 78,
          pageSizeKB: 456,
          loadTimeMs: 1200,
          mobileOptimized: true,
          httpsEnabled: true,
          structuredData: true,
          seoScore: 87,
          lastAnalyzed: new Date('2024-01-15'),
          createdAt: new Date('2024-01-10')
        },
        {
          id: '2',
          url: 'https://monsite.com/protection-ecran',
          title: 'Protection Écran iPhone - Verre Trempé Premium',
          metaDescription: 'Protection écran iPhone de qualité professionnelle. Verre trempé résistant aux chocs et rayures.',
          keywords: ['protection écran iphone', 'verre trempé', 'film protecteur'],
          h1Count: 1,
          h2Count: 3,
          h3Count: 6,
          imageCount: 8,
          imagesWithAlt: 6,
          internalLinks: 12,
          externalLinks: 2,
          wordCount: 650,
          readabilityScore: 82,
          pageSizeKB: 320,
          loadTimeMs: 980,
          mobileOptimized: true,
          httpsEnabled: true,
          structuredData: false,
          seoScore: 74,
          lastAnalyzed: new Date('2024-01-14'),
          createdAt: new Date('2024-01-08')
        }
      ];

      setMetrics(mockMetrics);
    } catch (err) {
      setError('Erreur lors du chargement des métriques');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les métriques SEO',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch ranking data
  const fetchRankings = async () => {
    if (!user) return;

    try {
      const mockRankings: SEORanking[] = [
        {
          id: '1',
          keyword: 'coque iphone 15',
          url: 'https://monsite.com',
          position: 8,
          previousPosition: 12,
          searchVolume: 22000,
          difficulty: 65,
          ctr: 4.2,
          impressions: 45600,
          clicks: 1920,
          country: 'FR',
          device: 'desktop',
          lastChecked: new Date()
        },
        {
          id: '2',
          keyword: 'protection écran iphone',
          url: 'https://monsite.com/protection-ecran',
          position: 15,
          previousPosition: 18,
          searchVolume: 18000,
          difficulty: 58,
          ctr: 2.1,
          impressions: 28900,
          clicks: 607,
          country: 'FR',
          device: 'mobile',
          lastChecked: new Date()
        }
      ];

      setRankings(mockRankings);
    } catch (err) {
      setError('Erreur lors du chargement des classements');
    }
  };

  // Analyze URL
  const analyzeURL = async (url: string) => {
    setLoading(true);
    try {
      // Simulate API call for SEO analysis
      await new Promise(resolve => setTimeout(resolve, 3000));

      const newMetric: SEOMetrics = {
        id: Math.random().toString(36).substr(2, 9),
        url,
        title: `Nouvelle page analysée - ${url}`,
        metaDescription: 'Description générée automatiquement lors de l\'analyse',
        keywords: ['mot-clé-1', 'mot-clé-2', 'mot-clé-3'],
        h1Count: 1,
        h2Count: Math.floor(Math.random() * 5) + 1,
        h3Count: Math.floor(Math.random() * 8) + 2,
        imageCount: Math.floor(Math.random() * 15) + 5,
        imagesWithAlt: Math.floor(Math.random() * 10) + 3,
        internalLinks: Math.floor(Math.random() * 20) + 5,
        externalLinks: Math.floor(Math.random() * 5) + 1,
        wordCount: Math.floor(Math.random() * 1000) + 300,
        readabilityScore: Math.floor(Math.random() * 40) + 60,
        pageSizeKB: Math.floor(Math.random() * 500) + 200,
        loadTimeMs: Math.floor(Math.random() * 2000) + 500,
        mobileOptimized: Math.random() > 0.2,
        httpsEnabled: Math.random() > 0.1,
        structuredData: Math.random() > 0.4,
        seoScore: Math.floor(Math.random() * 30) + 70,
        lastAnalyzed: new Date(),
        createdAt: new Date()
      };

      setMetrics(prev => [...prev, newMetric]);
      
      toast({
        title: 'Analyse terminée',
        description: `L'analyse SEO de ${url} est complète`,
      });

      return newMetric;
    } catch (err) {
      toast({
        title: 'Erreur d\'analyse',
        description: 'Impossible d\'analyser cette URL',
        variant: 'destructive'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Track keyword rankings
  const trackKeyword = async (keyword: string, url: string) => {
    try {
      const newRanking: SEORanking = {
        id: Math.random().toString(36).substr(2, 9),
        keyword,
        url,
        position: Math.floor(Math.random() * 100) + 1,
        previousPosition: null,
        searchVolume: Math.floor(Math.random() * 50000) + 1000,
        difficulty: Math.floor(Math.random() * 100),
        ctr: parseFloat((Math.random() * 10).toFixed(1)),
        impressions: Math.floor(Math.random() * 100000),
        clicks: Math.floor(Math.random() * 5000),
        country: 'FR',
        device: Math.random() > 0.5 ? 'desktop' : 'mobile',
        lastChecked: new Date()
      };

      setRankings(prev => [...prev, newRanking]);
      
      toast({
        title: 'Mot-clé ajouté au suivi',
        description: `"${keyword}" est maintenant suivi`,
      });

      return newRanking;
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le mot-clé au suivi',
        variant: 'destructive'
      });
      throw err;
    }
  };

  // Calculate overall SEO health
  const getSEOHealth = () => {
    if (metrics.length === 0) return { score: 0, status: 'No data' };

    const avgScore = metrics.reduce((sum, metric) => sum + metric.seoScore, 0) / metrics.length;
    
    let status = 'Poor';
    if (avgScore >= 90) status = 'Excellent';
    else if (avgScore >= 80) status = 'Good';
    else if (avgScore >= 70) status = 'Fair';
    else if (avgScore >= 60) status = 'Needs Work';

    return { score: Math.round(avgScore), status };
  };

  // Get ranking trends
  const getRankingTrends = () => {
    return rankings.map(ranking => ({
      ...ranking,
      trend: ranking.previousPosition 
        ? ranking.position < ranking.previousPosition ? 'up' : ranking.position > ranking.previousPosition ? 'down' : 'stable'
        : 'new'
    }));
  };

  useEffect(() => {
    if (user) {
      fetchMetrics();
      fetchRankings();
    }
  }, [user]);

  return {
    metrics,
    rankings,
    loading,
    error,
    analyzeURL,
    trackKeyword,
    getSEOHealth,
    getRankingTrends,
    refetch: () => {
      fetchMetrics();
      fetchRankings();
    }
  };
};