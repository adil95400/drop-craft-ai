import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TrendData {
  product_name: string;
  category: string;
  trend_score: number;
  search_volume: number;
  growth_rate: number;
  saturation_level?: string;
  platforms?: string[];
}

interface ViralProduct {
  product_name: string;
  source_platform: string;
  source_url?: string;
  viral_score: number;
  views?: number;
  engagement_rate?: number;
  estimated_price?: number;
  profit_margin?: number;
  description?: string;
  hashtags?: string[];
}

interface SaturationData {
  niche: string;
  saturation_level: string;
  saturation_score: number;
  competitor_count: number;
  active_ads: number;
  search_demand?: number;
  recommendation?: string;
  alternative_niches?: string[];
}

interface SavedProduct {
  id: string;
  product_name: string;
  category: string;
  winning_score: number;
  trend_score: number;
  viral_score?: number;
  profit_margin?: number;
  search_volume?: number;
  saturation_level?: string;
  source_platform?: string;
  created_at: string;
}

export function useProductResearch() {
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [viralProducts, setViralProducts] = useState<ViralProduct[]>([]);
  const [saturationData, setSaturationData] = useState<SaturationData | null>(null);
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const { toast } = useToast();

  const scanTrends = async ({ keyword, category }: { keyword: string; category: string }) => {
    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('product-research-scanner', {
        body: {
          action: 'scan_trends',
          keyword,
          category
        }
      });

      if (error) throw error;

      setTrends(data.trends || []);
      toast({
        title: "✅ Scan terminé",
        description: `${data.trends?.length || 0} tendances trouvées pour "${keyword}"`,
      });
    } catch (error: any) {
      console.error('Error scanning trends:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de scanner les tendances",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const analyzeViralProduct = async ({ url }: { url: string }) => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('product-research-scanner', {
        body: {
          action: 'analyze_viral',
          url
        }
      });

      if (error) throw error;

      setViralProducts(prev => [data.product, ...prev]);
      toast({
        title: "✅ Analyse terminée",
        description: `Score viral: ${data.product.viral_score}%`,
      });
    } catch (error: any) {
      console.error('Error analyzing viral product:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'analyser le produit",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeSaturation = async ({ niche }: { niche: string }) => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('product-research-scanner', {
        body: {
          action: 'analyze_saturation',
          niche
        }
      });

      if (error) throw error;

      setSaturationData(data.saturation);
      toast({
        title: "✅ Analyse terminée",
        description: `Saturation: ${data.saturation.saturation_level.toUpperCase()}`,
      });
    } catch (error: any) {
      console.error('Error analyzing saturation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'analyser la saturation",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadSavedProducts = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data, error } = await supabase
        .from('product_research_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSavedProducts((data || []) as any);
    } catch (error: any) {
      console.error('Error loading saved products:', error);
    }
  };

  return {
    isScanning,
    isAnalyzing,
    trends,
    viralProducts,
    saturationData,
    savedProducts,
    scanTrends,
    analyzeViralProduct,
    analyzeSaturation,
    loadSavedProducts,
  };
}
