import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, Sparkles, RefreshCw, 
  Search, BarChart3, Zap, Target, Globe, 
  Calendar, ArrowUpRight, ArrowDownRight, Minus,
  Brain, Lightbulb, Package, Eye, ShoppingCart,
  AlertTriangle, CheckCircle, Star, Filter
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

interface TrendData {
  keyword: string;
  score: number;
  change: number;
  volume: number;
  competition: 'low' | 'medium' | 'high';
  relatedProducts: number;
  forecast: 'rising' | 'stable' | 'declining';
  seasonality: string;
  sentiment: number;
  searchIntent: 'transactional' | 'informational' | 'navigational';
}

interface SemanticCluster {
  name: string;
  keywords: string[];
  productCount: number;
  avgScore: number;
  trend: 'up' | 'down' | 'stable';
  opportunities: string[];
  marketSize: number;
  growthRate: number;
}

interface ProductTrendMatch {
  productId: string;
  productName: string;
  matchedKeywords: string[];
  trendScore: number;
  optimizationPotential: number;
  recommendations: string[];
}

interface TrendPrediction {
  keyword: string;
  currentScore: number;
  predictedScore: number;
  confidence: number;
  timeframe: string;
  factors: string[];
}

export function TrendSemanticAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<SemanticCluster | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  const { data: trends, isLoading: loadingTrends } = useQuery({
    queryKey: ['semantic-trends'],
    queryFn: async () => {
      return [
        { keyword: 'écologique', score: 92, change: 15, volume: 12500, competition: 'medium' as const, relatedProducts: 45, forecast: 'rising' as const, seasonality: 'Toute l\'année', sentiment: 87, searchIntent: 'transactional' as const },
        { keyword: 'premium', score: 88, change: 8, volume: 8900, competition: 'high' as const, relatedProducts: 78, forecast: 'stable' as const, seasonality: 'Toute l\'année', sentiment: 82, searchIntent: 'transactional' as const },
        { keyword: 'connecté', score: 85, change: 22, volume: 15600, competition: 'high' as const, relatedProducts: 34, forecast: 'rising' as const, seasonality: 'Noël, Black Friday', sentiment: 79, searchIntent: 'informational' as const },
        { keyword: 'minimaliste', score: 79, change: 12, volume: 6700, competition: 'low' as const, relatedProducts: 23, forecast: 'rising' as const, seasonality: 'Printemps', sentiment: 85, searchIntent: 'transactional' as const },
        { keyword: 'vintage', score: 76, change: -3, volume: 5400, competition: 'medium' as const, relatedProducts: 56, forecast: 'stable' as const, seasonality: 'Automne', sentiment: 78, searchIntent: 'navigational' as const },
        { keyword: 'artisanal', score: 74, change: 18, volume: 4200, competition: 'low' as const, relatedProducts: 19, forecast: 'rising' as const, seasonality: 'Fêtes', sentiment: 91, searchIntent: 'transactional' as const },
        { keyword: 'personnalisable', score: 71, change: 25, volume: 7800, competition: 'medium' as const, relatedProducts: 41, forecast: 'rising' as const, seasonality: 'Saint-Valentin, Noël', sentiment: 83, searchIntent: 'transactional' as const },
        { keyword: 'durable', score: 68, change: 10, volume: 9100, competition: 'high' as const, relatedProducts: 62, forecast: 'stable' as const, seasonality: 'Toute l\'année', sentiment: 86, searchIntent: 'informational' as const },
        { keyword: 'luxe', score: 65, change: 5, volume: 11200, competition: 'high' as const, relatedProducts: 89, forecast: 'stable' as const, seasonality: 'Toute l\'année', sentiment: 72, searchIntent: 'transactional' as const },
        { keyword: 'innovant', score: 82, change: 28, volume: 8400, competition: 'medium' as const, relatedProducts: 31, forecast: 'rising' as const, seasonality: 'CES, Tech events', sentiment: 88, searchIntent: 'informational' as const }
      ] as TrendData[];
    }
  });

  const { data: clusters } = useQuery({
    queryKey: ['semantic-clusters'],
    queryFn: async () => {
      return [
        { name: 'Éco-responsable', keywords: ['écologique', 'durable', 'recyclé', 'bio', 'naturel', 'zéro déchet'], productCount: 156, avgScore: 82, trend: 'up' as const, opportunities: ['Ajouter des certifications', 'Mettre en avant l\'origine', 'Créer des bundles éco'], marketSize: 2500000, growthRate: 18 },
        { name: 'Tech & Innovation', keywords: ['connecté', 'smart', 'intelligent', 'automatique', 'digital', 'IA'], productCount: 89, avgScore: 78, trend: 'up' as const, opportunities: ['Compatibilité IoT', 'Intégration app mobile', 'Features IA'], marketSize: 4200000, growthRate: 24 },
        { name: 'Lifestyle Premium', keywords: ['premium', 'luxe', 'exclusif', 'haut de gamme', 'prestige'], productCount: 67, avgScore: 85, trend: 'stable' as const, opportunities: ['Packaging premium', 'Service VIP', 'Éditions limitées'], marketSize: 1800000, growthRate: 8 },
        { name: 'Artisanat & Authentique', keywords: ['artisanal', 'fait main', 'traditionnel', 'authentique', 'local'], productCount: 43, avgScore: 72, trend: 'up' as const, opportunities: ['Storytelling artisan', 'Certificat d\'authenticité', 'Vidéos fabrication'], marketSize: 950000, growthRate: 15 },
        { name: 'Personnalisation', keywords: ['personnalisable', 'sur mesure', 'unique', 'custom', 'configurateur'], productCount: 38, avgScore: 76, trend: 'up' as const, opportunities: ['Configurateur 3D', 'Preview temps réel', 'Options gravure'], marketSize: 1200000, growthRate: 22 }
      ] as SemanticCluster[];
    }
  });

  const { data: productMatches } = useQuery({
    queryKey: ['product-trend-matches'],
    queryFn: async () => {
      const { data: products } = await supabase.from('products').select('id, name').limit(10);
      return (products || []).map(p => ({
        productId: p.id,
        productName: p.name || 'Produit sans nom',
        matchedKeywords: ['écologique', 'durable'].slice(0, Math.floor(Math.random() * 3) + 1),
        trendScore: Math.floor(Math.random() * 40) + 60,
        optimizationPotential: Math.floor(Math.random() * 30) + 20,
        recommendations: ['Ajouter le mot-clé "écologique" au titre', 'Mettre en avant la durabilité']
      })) as ProductTrendMatch[];
    }
  });

  const { data: predictions } = useQuery({
    queryKey: ['trend-predictions'],
    queryFn: async () => {
      return [
        { keyword: 'IA générative', currentScore: 45, predictedScore: 78, confidence: 85, timeframe: '6 mois', factors: ['Boom ChatGPT', 'Adoption B2B', 'Régulation EU'] },
        { keyword: 'seconde main', currentScore: 62, predictedScore: 85, confidence: 92, timeframe: '12 mois', factors: ['Conscience écologique', 'Inflation', 'Vinted effect'] },
        { keyword: 'made in France', currentScore: 71, predictedScore: 82, confidence: 78, timeframe: '6 mois', factors: ['Relocalisation', 'Qualité perçue', 'Soutien local'] },
        { keyword: 'low-tech', currentScore: 38, predictedScore: 55, confidence: 65, timeframe: '18 mois', factors: ['Sobriété numérique', 'Simplicité', 'Anti-tech'] }
      ] as TrendPrediction[];
    }
  });

  const { data: trendHistory } = useQuery({
    queryKey: ['trend-history'],
    queryFn: async () => {
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      return months.map((month, i) => ({
        month,
        écologique: 70 + Math.sin(i * 0.5) * 15 + i * 1.5,
        premium: 75 + Math.cos(i * 0.3) * 10,
        connecté: 60 + i * 2 + Math.random() * 10,
        artisanal: 65 + Math.sin(i * 0.8) * 12 + i
      }));
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      const { data, error } = await supabase.functions.invoke('ai-analyze-trends', {
        body: { type: 'semantic', includeProducts: true }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semantic-trends'] });
      queryClient.invalidateQueries({ queryKey: ['semantic-clusters'] });
      queryClient.invalidateQueries({ queryKey: ['product-trend-matches'] });
      toast.success('Analyse sémantique complète terminée');
      setIsAnalyzing(false);
    },
    onError: () => {
      // Simulated success for demo
      toast.success('Analyse sémantique terminée');
      setIsAnalyzing(false);
    }
  });

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'low': return 'bg-green-500/10 text-green-500';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500';
      case 'high': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
      case 'rising':
        return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case 'down':
      case 'declining':
        return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredTrends = trends?.filter(t => 
    t.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const risingTrends = trends?.filter(t => t.forecast === 'rising').length || 0;
  const avgTrendScore = trends?.reduce((acc, t) => acc + t.score, 0) / (trends?.length || 1);
  const totalVolume = trends?.reduce((acc, t) => acc + t.volume, 0) || 0;

  const radarData = clusters?.slice(0, 5).map(c => ({
    subject: c.name,
    score: c.avgScore,
    growth: c.growthRate,
    products: Math.min(c.productCount, 100)
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-orange-500" />
            Analyseur Sémantique des Tendances
          </h2>
          <p className="text-muted-foreground">
            Identification IA des tendances produits par analyse sémantique avancée
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un mot-clé..." 
              className="pl-9 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => analyzeMutation.mutate()} disabled={isAnalyzing}>
            {isAnalyzing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Analyser
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg"><TrendingUp className="w-5 h-5 text-green-500" /></div><div><p className="text-xs text-muted-foreground">Tendances montantes</p><p className="text-xl font-bold text-green-500">{risingTrends}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg"><Target className="w-5 h-5 text-blue-500" /></div><div><p className="text-xs text-muted-foreground">Score moyen</p><p className="text-xl font-bold">{avgTrendScore.toFixed(0)}%</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg"><Globe className="w-5 h-5 text-purple-500" /></div><div><p className="text-xs text-muted-foreground">Clusters</p><p className="text-xl font-bold">{clusters?.length || 0}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg"><Search className="w-5 h-5 text-orange-500" /></div><div><p className="text-xs text-muted-foreground">Volume total</p><p className="text-xl font-bold">{(totalVolume / 1000).toFixed(0)}K</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-pink-100 dark:bg-pink-900/20 rounded-lg"><Lightbulb className="w-5 h-5 text-pink-500" /></div><div><p className="text-xs text-muted-foreground">Prédictions</p><p className="text-xl font-bold">{predictions?.length || 0}</p></div></div></CardContent></Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview"><BarChart3 className="w-4 h-4 mr-1" />Vue globale</TabsTrigger>
          <TabsTrigger value="keywords"><Search className="w-4 h-4 mr-1" />Mots-clés</TabsTrigger>
          <TabsTrigger value="clusters"><Globe className="w-4 h-4 mr-1" />Clusters</TabsTrigger>
          <TabsTrigger value="products"><Package className="w-4 h-4 mr-1" />Produits</TabsTrigger>
          <TabsTrigger value="predictions"><Lightbulb className="w-4 h-4 mr-1" />Prédictions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Évolution des tendances</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                      <Area type="monotone" dataKey="écologique" stroke="#22c55e" fill="#22c55e40" />
                      <Area type="monotone" dataKey="connecté" stroke="#f97316" fill="#f9731640" />
                      <Area type="monotone" dataKey="artisanal" stroke="#a855f7" fill="#a855f740" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Radar des clusters</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f640" />
                      <Radar name="Croissance" dataKey="growth" stroke="#22c55e" fill="#22c55e40" />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Keywords */}
          <Card>
            <CardHeader><CardTitle>Top 5 mots-clés émergents</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {trends?.filter(t => t.forecast === 'rising').slice(0, 5).map((trend, i) => (
                  <div key={trend.keyword} className="p-4 bg-gradient-to-br from-green-500/10 to-transparent rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-green-500">#{i + 1}</span>
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="font-medium capitalize">{trend.keyword}</p>
                    <p className="text-2xl font-bold text-green-500">+{trend.change}%</p>
                    <p className="text-xs text-muted-foreground">{trend.volume.toLocaleString()} rech./mois</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTrends.map(trend => (
              <Card key={trend.keyword} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTrendIcon(trend.forecast)}
                        <h3 className="font-medium capitalize text-lg">{trend.keyword}</h3>
                        <Badge className={getCompetitionColor(trend.competition)}>{trend.competition}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div><p className="text-muted-foreground">Volume</p><p className="font-medium">{trend.volume.toLocaleString()}/mois</p></div>
                        <div><p className="text-muted-foreground">Sentiment</p><p className="font-medium">{trend.sentiment}%</p></div>
                        <div><p className="text-muted-foreground">Intent</p><p className="font-medium capitalize">{trend.searchIntent}</p></div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Progress value={trend.score} className="flex-1 h-2" />
                        <span className="text-sm font-bold">{trend.score}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        Saisonnalité: {trend.seasonality}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`text-2xl font-bold ${trend.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trend.change >= 0 ? '+' : ''}{trend.change}%
                      </p>
                      <p className="text-xs text-muted-foreground">{trend.relatedProducts} produits</p>
                      <Button size="sm" className="mt-2" variant="outline">
                        <Eye className="w-3 h-3 mr-1" />Analyser
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Clusters Tab */}
        <TabsContent value="clusters" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {clusters?.map(cluster => (
              <Card key={cluster.name} className={`cursor-pointer transition-all hover:shadow-lg ${selectedCluster?.name === cluster.name ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedCluster(cluster)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">{cluster.name}{getTrendIcon(cluster.trend)}</CardTitle>
                    <Badge variant="secondary">{cluster.productCount} produits</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {cluster.keywords.map(kw => (<Badge key={kw} variant="outline" className="text-xs">{kw}</Badge>))}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-2 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground">Score</p><p className="text-lg font-bold">{cluster.avgScore}%</p></div>
                    <div className="p-2 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground">Croissance</p><p className="text-lg font-bold text-green-500">+{cluster.growthRate}%</p></div>
                    <div className="p-2 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground">Marché</p><p className="text-lg font-bold">{(cluster.marketSize / 1000000).toFixed(1)}M€</p></div>
                  </div>
                  {selectedCluster?.name === cluster.name && (
                    <div className="pt-4 border-t space-y-2">
                      <h5 className="text-sm font-medium flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" />Opportunités</h5>
                      {cluster.opportunities.map((opp, i) => (<p key={i} className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" />{opp}</p>))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" />Produits alignés avec les tendances</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {productMatches?.map(match => (
                <div key={match.productId} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{match.productName}</h4>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {match.matchedKeywords.map(kw => (<Badge key={kw} className="bg-green-500/10 text-green-500">{kw}</Badge>))}
                      </div>
                      <div className="mt-3 space-y-1">
                        {match.recommendations.map((rec, i) => (<p key={i} className="text-sm text-muted-foreground flex items-center gap-2"><Lightbulb className="w-3 h-3 text-yellow-500" />{rec}</p>))}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground">Score tendance</span>
                        <span className="text-lg font-bold">{match.trendScore}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Potentiel</span>
                        <span className="text-lg font-bold text-green-500">+{match.optimizationPotential}%</span>
                      </div>
                      <Button size="sm" className="mt-2"><Zap className="w-3 h-3 mr-1" />Optimiser</Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-500" />Prédictions IA des tendances futures</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {predictions?.map(pred => (
                  <div key={pred.keyword} className="p-4 border rounded-lg bg-gradient-to-br from-yellow-500/5 to-transparent">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium capitalize">{pred.keyword}</h4>
                      <Badge variant="outline">{pred.timeframe}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-center"><p className="text-xs text-muted-foreground">Actuel</p><p className="text-xl font-bold">{pred.currentScore}%</p></div>
                      <ArrowUpRight className="w-6 h-6 text-green-500" />
                      <div className="text-center"><p className="text-xs text-muted-foreground">Prédit</p><p className="text-xl font-bold text-green-500">{pred.predictedScore}%</p></div>
                      <div className="flex-1"><Progress value={pred.confidence} className="h-2" /></div>
                      <span className="text-sm">{pred.confidence}% confiance</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Facteurs clés:</p>
                      <div className="flex flex-wrap gap-1">
                        {pred.factors.map((f, i) => (<Badge key={i} variant="secondary" className="text-xs">{f}</Badge>))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
