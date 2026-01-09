import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Prediction {
  id: string;
  type: 'revenue' | 'orders' | 'customers' | 'inventory';
  title: string;
  currentValue: number;
  predictedValue: number;
  changePercent: number;
  confidence: number;
  timeframe: string;
  insight: string;
  recommendation: string;
}

interface AIInsight {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action: string;
}

export function PredictionsPanel() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([
    {
      id: '1',
      type: 'revenue',
      title: 'Chiffre d\'affaires prévu',
      currentValue: 45680,
      predictedValue: 52840,
      changePercent: 15.7,
      confidence: 87,
      timeframe: '30 jours',
      insight: 'Tendance haussière détectée basée sur les ventes des 3 derniers mois',
      recommendation: 'Augmenter le stock des produits best-sellers pour répondre à la demande'
    },
    {
      id: '2',
      type: 'orders',
      title: 'Commandes prévues',
      currentValue: 234,
      predictedValue: 278,
      changePercent: 18.8,
      confidence: 82,
      timeframe: '30 jours',
      insight: 'Pic de commandes attendu autour du 15 du mois',
      recommendation: 'Préparer la logistique pour gérer l\'augmentation du volume'
    },
    {
      id: '3',
      type: 'customers',
      title: 'Nouveaux clients',
      currentValue: 89,
      predictedValue: 112,
      changePercent: 25.8,
      confidence: 75,
      timeframe: '30 jours',
      insight: 'Croissance organique stable avec potentiel d\'acquisition',
      recommendation: 'Lancer une campagne de parrainage pour accélérer la croissance'
    },
    {
      id: '4',
      type: 'inventory',
      title: 'Ruptures de stock prévues',
      currentValue: 5,
      predictedValue: 12,
      changePercent: 140,
      confidence: 91,
      timeframe: '14 jours',
      insight: '7 produits risquent une rupture basé sur la vélocité actuelle',
      recommendation: 'Commander immédiatement les références identifiées'
    }
  ]);

  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const generateAIInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-predictions', {
        body: { 
          type: 'insights',
          context: {
            predictions,
            period: '30 jours'
          }
        }
      });

      if (error) throw error;

      if (data?.insights) {
        setAiInsights(data.insights);
        toast({
          title: "Insights générés",
          description: "L'IA a analysé vos données et généré des recommandations"
        });
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      // Fallback avec des insights par défaut
      setAiInsights([
        {
          category: 'Opportunité',
          priority: 'high',
          title: 'Potentiel de croissance identifié',
          description: 'Les tendances actuelles suggèrent une opportunité de croissance de 20% sur le trimestre prochain.',
          impact: '+15 000€ de CA potentiel',
          action: 'Augmenter le budget marketing de 10%'
        },
        {
          category: 'Risque',
          priority: 'high',
          title: 'Rupture de stock imminente',
          description: '3 produits best-sellers risquent une rupture dans les 7 prochains jours.',
          impact: '-2 500€ de manque à gagner',
          action: 'Passer commande fournisseur urgent'
        },
        {
          category: 'Optimisation',
          priority: 'medium',
          title: 'Marge améliorable',
          description: 'Certains produits ont une marge inférieure à la moyenne du marché.',
          impact: '+8% de marge possible',
          action: 'Réviser la stratégie de pricing sur 12 produits'
        }
      ]);
      toast({
        title: "Insights générés (mode démo)",
        description: "Données de démonstration affichées"
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const refreshPredictions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-predictions', {
        body: { type: 'predictions' }
      });

      if (error) throw error;

      if (data?.predictions) {
        setPredictions(data.predictions);
      }
      
      toast({
        title: "Prédictions actualisées",
        description: "Les prévisions ont été recalculées avec les dernières données"
      });
    } catch (error) {
      console.error('Error refreshing predictions:', error);
      toast({
        title: "Prédictions actualisées (mode démo)",
        description: "Données de démonstration utilisées"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue': return <DollarSign className="h-5 w-5" />;
      case 'orders': return <ShoppingCart className="h-5 w-5" />;
      case 'customers': return <Users className="h-5 w-5" />;
      case 'inventory': return <Package className="h-5 w-5" />;
      default: return <TrendingUp className="h-5 w-5" />;
    }
  };

  const formatValue = (value: number, type: string) => {
    if (type === 'revenue') {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
    }
    return value.toLocaleString('fr-FR');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Prédictions IA
          </h2>
          <p className="text-muted-foreground">
            Prévisions basées sur l'analyse de vos données historiques
          </p>
        </div>
        <Button onClick={refreshPredictions} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="predictions" className="gap-2">
            <Target className="h-4 w-4" />
            Prévisions
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Zap className="h-4 w-4" />
            Insights IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          {/* Prediction Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {predictions.map((prediction) => (
              <Card key={prediction.id} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  prediction.changePercent > 0 ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-muted">
                        {getTypeIcon(prediction.type)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{prediction.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {prediction.timeframe}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={prediction.changePercent > 0 ? 'default' : 'destructive'}>
                      {prediction.changePercent > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {prediction.changePercent > 0 ? '+' : ''}{prediction.changePercent.toFixed(1)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm text-muted-foreground">Actuel</p>
                      <p className="text-lg font-semibold">
                        {formatValue(prediction.currentValue, prediction.type)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Prévu</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatValue(prediction.predictedValue, prediction.type)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Confiance</span>
                      <span className="font-medium">{prediction.confidence}%</span>
                    </div>
                    <Progress value={prediction.confidence} className="h-2" />
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Insight:</span> {prediction.insight}
                    </p>
                    <p className="text-sm text-primary">
                      <span className="font-medium">Recommandation:</span> {prediction.recommendation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {aiInsights.length === 0 ? (
            <Card className="p-8 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Générer des insights IA</h3>
              <p className="text-muted-foreground mb-4">
                Laissez l'IA analyser vos données pour découvrir des opportunités et des risques
              </p>
              <Button onClick={generateAIInsights} disabled={isGeneratingInsights}>
                {isGeneratingInsights ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer les insights
                  </>
                )}
              </Button>
            </Card>
          ) : (
            <>
              <div className="flex justify-end">
                <Button variant="outline" onClick={generateAIInsights} disabled={isGeneratingInsights}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingInsights ? 'animate-spin' : ''}`} />
                  Régénérer
                </Button>
              </div>
              <div className="grid gap-4">
                {aiInsights.map((insight, index) => (
                  <Card key={index} className="relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full ${
                      insight.priority === 'high' ? 'bg-red-500' : 
                      insight.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {insight.category === 'Risque' ? (
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                          ) : insight.category === 'Opportunité' ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          ) : (
                            <Zap className="h-5 w-5 text-yellow-500" />
                          )}
                          <div>
                            <Badge variant="outline" className="mb-1">{insight.category}</Badge>
                            <CardTitle className="text-base">{insight.title}</CardTitle>
                          </div>
                        </div>
                        <Badge variant={getPriorityColor(insight.priority) as any}>
                          {insight.priority === 'high' ? 'Urgent' : 
                           insight.priority === 'medium' ? 'Moyen' : 'Faible'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                      <div className="flex gap-4 text-sm">
                        <div className="flex-1 p-2 rounded bg-muted">
                          <span className="text-muted-foreground">Impact:</span>
                          <p className="font-medium">{insight.impact}</p>
                        </div>
                        <div className="flex-1 p-2 rounded bg-primary/10">
                          <span className="text-muted-foreground">Action:</span>
                          <p className="font-medium text-primary">{insight.action}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
