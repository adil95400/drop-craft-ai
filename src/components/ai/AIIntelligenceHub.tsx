import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  TrendingUp, 
  Zap, 
  Target,
  DollarSign,
  Sparkles,
  RefreshCw,
  Award,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb
} from 'lucide-react';
import { motion } from 'framer-motion';

interface WinningProduct {
  id: string;
  product_name: string;
  category: string;
  winning_score: number;
  demand_score: number;
  competition_score: number;
  profitability_score: number;
  recommended_price: number;
  market_saturation: string;
}

interface Prediction {
  id: string;
  entity_name: string;
  prediction_type: string;
  current_value: number;
  predicted_value: number;
  confidence_score: number;
  trend_direction: string;
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  insight_type: string;
  priority: number;
  impact_level: string;
  estimated_revenue_impact: number;
  confidence_score: number;
}

export default function AIIntelligenceHub() {
  const [winningProducts, setWinningProducts] = useState<WinningProduct[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [winnersRes, predictionsRes, insightsRes] = await Promise.all([
        (supabase as any).from('winning_products').select('*').order('winning_score', { ascending: false }).limit(10),
        (supabase as any).from('trend_predictions').select('*').order('created_at', { ascending: false }).limit(10),
        (supabase as any).from('ai_insights').select('*').eq('status', 'active').order('priority', { ascending: false }).limit(10)
      ]);

      setWinningProducts(winnersRes.data || []);
      setPredictions(predictionsRes.data || []);
      setInsights(insightsRes.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeWinningProducts = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-intelligence', {
        body: { action: 'analyze_winning_products' }
      });

      if (error) throw error;
      
      toast({
        title: '🎯 Analyse terminée',
        description: `${data.winners_found} produits gagnants identifiés sur ${data.total_analyzed} analysés`,
      });
      
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const generatePredictions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-intelligence', {
        body: { action: 'generate_predictions', timeframe: '30d' }
      });

      if (error) throw error;
      
      toast({
        title: '📈 Prédictions générées',
        description: `${data.predictions.length} prédictions de tendances créées`,
      });
      
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const generateInsights = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-intelligence', {
        body: { action: 'generate_insights' }
      });

      if (error) throw error;
      
      toast({
        title: '💡 Insights générés',
        description: `${data.total_insights} insights IA créés`,
      });
      
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getImpactColor = (level: string) => {
    const colors: Record<string, string> = {
      'critical': 'bg-red-500',
      'high': 'bg-orange-500',
      'medium': 'bg-yellow-500',
      'low': 'bg-blue-500'
    };
    return colors[level] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            Intelligence IA
          </h1>
          <p className="text-muted-foreground mt-2">
            Prédictions, recommandations et optimisations alimentées par l'IA
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generatePredictions}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Prédictions
          </Button>
          <Button variant="outline" onClick={generateInsights}>
            <Lightbulb className="h-4 w-4 mr-2" />
            Insights
          </Button>
          <Button 
            onClick={analyzeWinningProducts}
            disabled={analyzing}
            className="bg-gradient-primary"
          >
            {analyzing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Analyser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Award className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Produits gagnants</p>
              <p className="text-2xl font-bold">{winningProducts.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prédictions</p>
              <p className="text-2xl font-bold">{predictions.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Insights actifs</p>
              <p className="text-2xl font-bold">{insights.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Impact estimé</p>
              <p className="text-2xl font-bold">
                ${insights.reduce((sum, i) => sum + (i.estimated_revenue_impact || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="winners">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="winners">
            <Award className="h-4 w-4 mr-2" />
            Produits Gagnants
          </TabsTrigger>
          <TabsTrigger value="predictions">
            <TrendingUp className="h-4 w-4 mr-2" />
            Prédictions
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Lightbulb className="h-4 w-4 mr-2" />
            Insights IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="winners" className="mt-6">
          {winningProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {winningProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{product.product_name}</h3>
                        <Badge variant="outline">{product.category}</Badge>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getScoreColor(product.winning_score)}`}>
                          {product.winning_score}
                        </div>
                        <p className="text-xs text-muted-foreground">Score</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Demande</p>
                        <p className="font-semibold">{product.demand_score}/100</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Compétition</p>
                        <p className="font-semibold">{product.competition_score}/100</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rentabilité</p>
                        <p className="font-semibold">{product.profitability_score}/100</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Saturation</p>
                        <Badge variant={product.market_saturation === 'low' ? 'default' : 'secondary'}>
                          {product.market_saturation}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Prix recommandé</p>
                        <p className="text-lg font-bold text-primary">
                          ${product.recommended_price}
                        </p>
                      </div>
                      <Button size="sm" className="bg-gradient-primary">
                        <Target className="h-4 w-4 mr-2" />
                        Importer
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun produit gagnant</h3>
              <p className="text-muted-foreground mb-6">
                Lancez une analyse pour identifier les meilleurs produits
              </p>
              <Button onClick={analyzeWinningProducts} className="bg-gradient-primary">
                <Sparkles className="h-4 w-4 mr-2" />
                Analyser maintenant
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="predictions" className="mt-6">
          {predictions.length > 0 ? (
            <div className="space-y-4">
              {predictions.map((prediction, index) => (
                <motion.div
                  key={prediction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg">{prediction.entity_name}</h3>
                          {prediction.trend_direction === 'up' ? (
                            <ArrowUpRight className="h-5 w-5 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">
                          {prediction.prediction_type.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {Math.round(prediction.predicted_value)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          vs {Math.round(prediction.current_value)} actuel
                        </p>
                        <Badge className="mt-2" variant="outline">
                          {Math.round(prediction.confidence_score * 100)}% confiance
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucune prédiction</h3>
              <p className="text-muted-foreground mb-6">
                Générez des prédictions pour anticiper les tendances
              </p>
              <Button onClick={generatePredictions} className="bg-gradient-primary">
                <Sparkles className="h-4 w-4 mr-2" />
                Générer des prédictions
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          {insights.length > 0 ? (
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${getImpactColor(insight.impact_level)}/10`}>
                        {insight.insight_type === 'opportunity' ? (
                          <Zap className={`h-6 w-6 ${getImpactColor(insight.impact_level).replace('bg-', 'text-')}`} />
                        ) : insight.insight_type === 'risk' ? (
                          <AlertCircle className={`h-6 w-6 ${getImpactColor(insight.impact_level).replace('bg-', 'text-')}`} />
                        ) : (
                          <CheckCircle2 className={`h-6 w-6 ${getImpactColor(insight.impact_level).replace('bg-', 'text-')}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg">{insight.title}</h3>
                          <Badge className={getImpactColor(insight.impact_level)}>
                            {insight.impact_level}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{insight.description}</p>
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Impact estimé</p>
                            <p className="font-bold text-green-500">
                              +${insight.estimated_revenue_impact?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Confiance</p>
                            <p className="font-bold">
                              {Math.round(insight.confidence_score * 100)}%
                            </p>
                          </div>
                          <Button size="sm" className="ml-auto">
                            Voir les actions
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Lightbulb className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun insight</h3>
              <p className="text-muted-foreground mb-6">
                Générez des insights pour optimiser votre business
              </p>
              <Button onClick={generateInsights} className="bg-gradient-primary">
                <Sparkles className="h-4 w-4 mr-2" />
                Générer des insights
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}