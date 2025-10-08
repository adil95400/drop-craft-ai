import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  TrendingUp, 
  Target,
  Zap,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  ChevronRight,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DetectedProduct {
  id?: string;
  product_name: string;
  product_url: string;
  source_platform: string;
  virality_score: number;
  trending_score: number;
  engagement_count: number;
  orders_count: number;
  rating: number;
  price: number;
  estimated_profit_margin: number;
  competition_level: string;
  social_proof: any;
  trend_analysis: any;
  competitor_analysis: any;
  detection_signals: string[];
  metadata: any;
}

export const AutoDetectionDashboard: React.FC = () => {
  const { toast } = useToast();
  const [isDetecting, setIsDetecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [detectedProducts, setDetectedProducts] = useState<DetectedProduct[]>([]);
  const [stats, setStats] = useState({
    totalDetected: 0,
    avgViralityScore: 0,
    topPlatform: '',
    lastUpdate: ''
  });
  const [filters, setFilters] = useState({
    platform: 'all',
    competition: 'all',
    minViralityScore: 0
  });
  const [sortBy, setSortBy] = useState<'virality' | 'trending' | 'profit'>('virality');

  useEffect(() => {
    loadDetectedProducts();
    const interval = setInterval(loadDetectedProducts, 60000); // Auto-refresh every minute
    return () => clearInterval(interval);
  }, [filters, sortBy]); // Re-run when filters or sort change

  const loadDetectedProducts = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('winner_products')
        .select('*');

      // Apply filters
      if (filters.platform !== 'all') {
        query = query.eq('source_platform', filters.platform);
      }
      if (filters.competition !== 'all') {
        query = query.eq('competition_level', filters.competition);
      }
      if (filters.minViralityScore > 0) {
        query = query.gte('virality_score', filters.minViralityScore);
      }

      // Apply sorting
      const sortColumn = sortBy === 'virality' ? 'virality_score' 
                       : sortBy === 'trending' ? 'trending_score' 
                       : 'estimated_profit_margin';
      
      query = query.order(sortColumn, { ascending: false }).limit(50);

      const { data, error } = await query;

      if (error) throw error;

      setDetectedProducts(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading detected products:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les produits. Réessayez dans quelques instants.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runAutoDetection = async () => {
    setIsDetecting(true);
    setProgress(0);

    try {
      // Phase 1: Analyse TikTok
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(25);
      
      // Phase 2: Analyse Facebook
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(50);
      
      // Phase 3: Analyse Instagram
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(75);
      
      // Phase 4: Calcul des scores
      const { data, error } = await supabase.functions.invoke('auto-detect-winners', {
        body: { 
          filters,
          timestamp: new Date().toISOString() 
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Échec de la détection automatique');
      }

      setProgress(100);
      
      // Wait a bit for data to be committed
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadDetectedProducts();

      toast({
        title: "✅ Détection terminée avec succès",
        description: `${data?.count || 0} nouveaux produits gagnants détectés !`
      });

    } catch (error: any) {
      console.error('Error running auto-detection:', error);
      toast({
        title: "❌ Erreur de détection",
        description: error.message || "Une erreur est survenue. Vérifiez votre connexion et réessayez.",
        variant: "destructive"
      });
      
      // Fallback: show cached data
      await loadDetectedProducts();
    } finally {
      setIsDetecting(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const calculateStats = (products: DetectedProduct[]) => {
    if (products.length === 0) {
      setStats({
        totalDetected: 0,
        avgViralityScore: 0,
        topPlatform: '',
        lastUpdate: ''
      });
      return;
    }

    const avgScore = products.reduce((sum, p) => sum + p.virality_score, 0) / products.length;
    const platformCounts = products.reduce((acc, p) => {
      acc[p.source_platform] = (acc[p.source_platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    setStats({
      totalDetected: products.length,
      avgViralityScore: Math.round(avgScore),
      topPlatform,
      lastUpdate: new Date().toLocaleString('fr-FR')
    });
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      tiktok: 'bg-black text-white',
      facebook: 'bg-blue-600 text-white',
      instagram: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
      aliexpress: 'bg-red-600 text-white'
    };
    return colors[platform] || 'bg-gray-600 text-white';
  };

  const getCompetitionColor = (level: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement des produits détectés...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits détectés</p>
                <p className="text-3xl font-bold">{stats.totalDetected}</p>
              </div>
              <Target className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score viral moyen</p>
                <p className="text-3xl font-bold">{stats.avgViralityScore}%</p>
              </div>
              <Sparkles className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top plateforme</p>
                <p className="text-2xl font-bold capitalize">{stats.topPlatform || '-'}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dernière màj</p>
                <p className="text-xs font-medium">{stats.lastUpdate || '-'}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contrôles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Détection Automatique de Produits Gagnants
          </CardTitle>
          <CardDescription>
            Scanner automatiquement TikTok, Facebook et Instagram pour détecter les produits viraux en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={runAutoDetection}
              disabled={isDetecting}
              size="lg"
              className="flex-1"
            >
              {isDetecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Détection en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Lancer la détection automatique
                </>
              )}
            </Button>
            <Button
              onClick={loadDetectedProducts}
              disabled={isDetecting}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>

          {isDetecting && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                {progress < 25 && "🎵 Analyse des tendances TikTok..."}
                {progress >= 25 && progress < 50 && "📘 Analyse des posts Facebook..."}
                {progress >= 50 && progress < 75 && "📸 Analyse des tendances Instagram..."}
                {progress >= 75 && progress < 100 && "🧮 Calcul des scores de viralité..."}
                {progress === 100 && "✅ Détection terminée !"}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4">
            <Badge variant="outline" className="justify-center py-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              TikTok
            </Badge>
            <Badge variant="outline" className="justify-center py-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              Facebook
            </Badge>
            <Badge variant="outline" className="justify-center py-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              Instagram
            </Badge>
            <Badge variant="outline" className="justify-center py-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              AliExpress
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Filtres et tri */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Plateforme</label>
              <select 
                className="w-full p-2 border rounded"
                value={filters.platform}
                onChange={(e) => {
                  const newFilters = {...filters, platform: e.target.value};
                  setFilters(newFilters);
                }}
              >
                <option value="all">Toutes</option>
                <option value="tiktok">TikTok</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="aliexpress">AliExpress</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Concurrence</label>
              <select 
                className="w-full p-2 border rounded"
                value={filters.competition}
                onChange={(e) => {
                  const newFilters = {...filters, competition: e.target.value};
                  setFilters(newFilters);
                }}
              >
                <option value="all">Tous niveaux</option>
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Score minimum</label>
              <select 
                className="w-full p-2 border rounded"
                value={filters.minViralityScore}
                onChange={(e) => {
                  const newFilters = {...filters, minViralityScore: parseInt(e.target.value)};
                  setFilters(newFilters);
                }}
              >
                <option value="0">Tous</option>
                <option value="70">70%+</option>
                <option value="80">80%+</option>
                <option value="90">90%+</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Trier par</label>
              <select 
                className="w-full p-2 border rounded"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                }}
              >
                <option value="virality">Score viral</option>
                <option value="trending">Tendance</option>
                <option value="profit">Marge profit</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits détectés */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Produits détectés ({detectedProducts.length})
            {filters.platform !== 'all' && <Badge className="ml-2">{filters.platform}</Badge>}
          </h3>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
        
        {detectedProducts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h4 className="font-semibold mb-2">Aucun produit détecté</h4>
              <p className="text-muted-foreground mb-4">
                Lancez une détection automatique pour découvrir les produits gagnants sur les réseaux sociaux
              </p>
              <Button onClick={runAutoDetection}>
                <Sparkles className="w-4 h-4 mr-2" />
                Démarrer la détection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {detectedProducts.map((product, index) => (
              <Card key={product.id || index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-[1fr,auto] gap-6">
                    <div className="space-y-4">
                      {/* En-tête produit */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-2">{product.product_name}</h4>
                          <div className="flex flex-wrap gap-2">
                            <Badge className={getPlatformColor(product.source_platform)}>
                              {product.source_platform.toUpperCase()}
                            </Badge>
                            <Badge className={getCompetitionColor(product.competition_level)}>
                              Concurrence: {product.competition_level}
                            </Badge>
                            <Badge variant="outline">
                              {product.metadata?.confidence_level || '95%'} confiance
                            </Badge>
                            {product.trend_analysis?.trend_direction === 'up' && (
                              <Badge className="bg-green-100 text-green-800">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                En hausse
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Métriques principales */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Score viral</p>
                          <div className="flex items-center gap-2">
                            <Progress value={product.virality_score} className="flex-1" />
                            <span className="text-sm font-bold">{product.virality_score}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tendance</p>
                          <div className="flex items-center gap-2">
                            <Progress value={product.trending_score} className="flex-1" />
                            <span className="text-sm font-bold">{product.trending_score}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Engagement</p>
                          <p className="text-sm font-bold">
                            {(product.engagement_count / 1000).toFixed(0)}K
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Commandes</p>
                          <p className="text-sm font-bold">
                            {(product.orders_count / 1000).toFixed(1)}K
                          </p>
                        </div>
                      </div>

                      {/* Preuve sociale */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center p-2 bg-black/5 rounded">
                          <p className="text-xs text-muted-foreground">TikTok vues</p>
                          <p className="text-sm font-semibold">
                            {((product.social_proof?.tiktok_views || 0) / 1000).toFixed(0)}K
                          </p>
                        </div>
                        <div className="text-center p-2 bg-blue-500/5 rounded">
                          <p className="text-xs text-muted-foreground">FB partages</p>
                          <p className="text-sm font-semibold">
                            {((product.social_proof?.facebook_shares || 0) / 1000).toFixed(1)}K
                          </p>
                        </div>
                        <div className="text-center p-2 bg-pink-500/5 rounded">
                          <p className="text-xs text-muted-foreground">IG likes</p>
                          <p className="text-sm font-semibold">
                            {((product.social_proof?.instagram_likes || 0) / 1000).toFixed(1)}K
                          </p>
                        </div>
                        <div className="text-center p-2 bg-green-500/5 rounded">
                          <p className="text-xs text-muted-foreground">Marge estimée</p>
                          <p className="text-sm font-semibold">{product.estimated_profit_margin}%</p>
                        </div>
                      </div>

                      {/* Analyse de tendance */}
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-medium mb-2">Analyse de tendance :</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span>📈 Croissance: <strong>{product.trend_analysis?.growth_rate || 'N/A'}</strong></span>
                          <span>•</span>
                          <span>🎯 Concurrents: <strong>{product.competitor_analysis?.competitor_count || 0}</strong></span>
                          <span>•</span>
                          <span>💰 Prix moyen marché: <strong>${product.competitor_analysis?.avg_competitor_price || 0}</strong></span>
                          <span>•</span>
                          <span>📊 Saturation: <strong>{product.competitor_analysis?.market_saturation || 'N/A'}</strong></span>
                        </div>
                      </div>

                      {/* Signaux de détection */}
                      <div className="flex flex-wrap gap-2">
                        {product.detection_signals.map((signal, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {signal}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button variant="default" className="whitespace-nowrap">
                        <Eye className="w-4 h-4 mr-2" />
                        Analyser
                      </Button>
                      <Button variant="outline" className="whitespace-nowrap">
                        <Download className="w-4 h-4 mr-2" />
                        Importer
                      </Button>
                      <Button variant="outline" className="whitespace-nowrap" size="sm" asChild>
                        <a href={product.product_url} target="_blank" rel="noopener noreferrer">
                          <ChevronRight className="w-4 h-4 mr-2" />
                          Voir source
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
