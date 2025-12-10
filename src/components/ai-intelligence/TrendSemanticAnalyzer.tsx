import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, Sparkles, RefreshCw, 
  Search, BarChart3, Zap, Target, Globe, 
  Calendar, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface TrendData {
  keyword: string;
  score: number;
  change: number;
  volume: number;
  competition: 'low' | 'medium' | 'high';
  relatedProducts: number;
  forecast: 'rising' | 'stable' | 'declining';
  seasonality: string;
}

interface SemanticCluster {
  name: string;
  keywords: string[];
  productCount: number;
  avgScore: number;
  trend: 'up' | 'down' | 'stable';
  opportunities: string[];
}

export function TrendSemanticAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<SemanticCluster | null>(null);
  const queryClient = useQueryClient();

  const { data: trends, isLoading: loadingTrends } = useQuery({
    queryKey: ['semantic-trends'],
    queryFn: async () => {
      // Simulate semantic analysis
      return [
        { keyword: 'écologique', score: 92, change: 15, volume: 12500, competition: 'medium' as const, relatedProducts: 45, forecast: 'rising' as const, seasonality: 'Toute l\'année' },
        { keyword: 'premium', score: 88, change: 8, volume: 8900, competition: 'high' as const, relatedProducts: 78, forecast: 'stable' as const, seasonality: 'Toute l\'année' },
        { keyword: 'connecté', score: 85, change: 22, volume: 15600, competition: 'high' as const, relatedProducts: 34, forecast: 'rising' as const, seasonality: 'Noël, Black Friday' },
        { keyword: 'minimaliste', score: 79, change: 12, volume: 6700, competition: 'low' as const, relatedProducts: 23, forecast: 'rising' as const, seasonality: 'Printemps' },
        { keyword: 'vintage', score: 76, change: -3, volume: 5400, competition: 'medium' as const, relatedProducts: 56, forecast: 'stable' as const, seasonality: 'Automne' },
        { keyword: 'artisanal', score: 74, change: 18, volume: 4200, competition: 'low' as const, relatedProducts: 19, forecast: 'rising' as const, seasonality: 'Fêtes' },
        { keyword: 'personnalisable', score: 71, change: 25, volume: 7800, competition: 'medium' as const, relatedProducts: 41, forecast: 'rising' as const, seasonality: 'Saint-Valentin, Noël' },
        { keyword: 'durable', score: 68, change: 10, volume: 9100, competition: 'high' as const, relatedProducts: 62, forecast: 'stable' as const, seasonality: 'Toute l\'année' }
      ] as TrendData[];
    }
  });

  const { data: clusters, isLoading: loadingClusters } = useQuery({
    queryKey: ['semantic-clusters'],
    queryFn: async () => {
      return [
        {
          name: 'Éco-responsable',
          keywords: ['écologique', 'durable', 'recyclé', 'bio', 'naturel'],
          productCount: 156,
          avgScore: 82,
          trend: 'up' as const,
          opportunities: ['Ajouter des certifications', 'Mettre en avant l\'origine', 'Créer des bundles éco']
        },
        {
          name: 'Tech & Innovation',
          keywords: ['connecté', 'smart', 'intelligent', 'automatique', 'digital'],
          productCount: 89,
          avgScore: 78,
          trend: 'up' as const,
          opportunities: ['Compatibilité IoT', 'Intégration app mobile', 'Features IA']
        },
        {
          name: 'Lifestyle Premium',
          keywords: ['premium', 'luxe', 'exclusif', 'haut de gamme', 'prestige'],
          productCount: 67,
          avgScore: 85,
          trend: 'stable' as const,
          opportunities: ['Packaging premium', 'Service VIP', 'Éditions limitées']
        },
        {
          name: 'Artisanat & Authentique',
          keywords: ['artisanal', 'fait main', 'traditionnel', 'authentique', 'local'],
          productCount: 43,
          avgScore: 72,
          trend: 'up' as const,
          opportunities: ['Storytelling artisan', 'Certificat d\'authenticité', 'Vidéos fabrication']
        }
      ] as SemanticCluster[];
    }
  });

  const { data: trendHistory } = useQuery({
    queryKey: ['trend-history'],
    queryFn: async () => {
      // Generate mock historical data
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
      return months.map(month => ({
        month,
        écologique: Math.floor(Math.random() * 30) + 70,
        premium: Math.floor(Math.random() * 20) + 75,
        connecté: Math.floor(Math.random() * 40) + 60,
        artisanal: Math.floor(Math.random() * 25) + 65
      }));
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      const { data, error } = await supabase.functions.invoke('ai-analyze-trends', {
        body: { type: 'semantic' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semantic-trends'] });
      queryClient.invalidateQueries({ queryKey: ['semantic-clusters'] });
      toast.success('Analyse sémantique terminée');
      setIsAnalyzing(false);
    },
    onError: () => {
      toast.error('Erreur lors de l\'analyse');
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

  const risingTrends = trends?.filter(t => t.forecast === 'rising').length || 0;
  const avgTrendScore = trends?.reduce((acc, t) => acc + t.score, 0) / (trends?.length || 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            Analyseur Sémantique des Tendances
          </h2>
          <p className="text-muted-foreground">
            Identification IA des tendances produits par analyse sémantique
          </p>
        </div>
        <Button 
          onClick={() => analyzeMutation.mutate()}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Analyser tendances
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tendances montantes</p>
                <p className="text-2xl font-bold text-green-500">{risingTrends}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score moyen</p>
                <p className="text-2xl font-bold">{avgTrendScore.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Globe className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clusters identifiés</p>
                <p className="text-2xl font-bold">{clusters?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Search className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mots-clés analysés</p>
                <p className="text-2xl font-bold">{trends?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Évolution des tendances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))'
                  }}
                />
                <Area type="monotone" dataKey="écologique" stackId="1" stroke="#22c55e" fill="#22c55e40" />
                <Area type="monotone" dataKey="premium" stackId="2" stroke="#3b82f6" fill="#3b82f640" />
                <Area type="monotone" dataKey="connecté" stackId="3" stroke="#f97316" fill="#f9731640" />
                <Area type="monotone" dataKey="artisanal" stackId="4" stroke="#a855f7" fill="#a855f740" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">Écologique</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm">Premium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-sm">Connecté</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-sm">Artisanal</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keywords Table */}
        <Card>
          <CardHeader>
            <CardTitle>Mots-clés tendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trends?.map(trend => (
              <div key={trend.keyword} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getTrendIcon(trend.forecast)}
                  <div>
                    <p className="font-medium">{trend.keyword}</p>
                    <p className="text-xs text-muted-foreground">
                      {trend.volume.toLocaleString()} recherches/mois
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getCompetitionColor(trend.competition)}>
                    {trend.competition}
                  </Badge>
                  <div className="text-right">
                    <p className="font-bold">{trend.score}%</p>
                    <p className={`text-xs ${trend.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {trend.change >= 0 ? '+' : ''}{trend.change}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Semantic Clusters */}
        <Card>
          <CardHeader>
            <CardTitle>Clusters sémantiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {clusters?.map(cluster => (
              <div 
                key={cluster.name}
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedCluster?.name === cluster.name ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedCluster(cluster)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{cluster.name}</h4>
                    {getTrendIcon(cluster.trend)}
                  </div>
                  <Badge variant="secondary">{cluster.productCount} produits</Badge>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {cluster.keywords.slice(0, 4).map(kw => (
                    <Badge key={kw} variant="outline" className="text-xs">{kw}</Badge>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Progress value={cluster.avgScore} className="flex-1 h-2" />
                  <span className="text-sm font-medium">{cluster.avgScore}%</span>
                </div>

                {selectedCluster?.name === cluster.name && (
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      Opportunités
                    </h5>
                    <ul className="space-y-1">
                      {cluster.opportunities.map((opp, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {opp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
