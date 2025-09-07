import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain,
  TrendingUp,
  Target,
  Users,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Lightbulb,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Star,
  ArrowRight,
  Eye,
  Sparkles
} from 'lucide-react';

interface BusinessInsight {
  id: string;
  insight_type: string;
  title: string;
  category: string;
  description: string;
  confidence_score: number;
  impact_score: number;
  priority: 'high' | 'medium' | 'low';
  actionable_recommendations: string[];
  supporting_data: any;
  ai_analysis: {
    insights: string[];
    predictions: string[];
  };
  status: 'new' | 'acknowledged' | 'acted_upon';
  created_at: string;
  expires_at?: string;
}

export function BusinessIntelligenceDashboard() {
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<BusinessInsight | null>(null);
  const [analysisType, setAnalysisType] = useState('product_optimization');
  const { toast } = useToast();

  const analysisOptions = [
    { value: 'product_optimization', label: 'Optimisation Produits', icon: ShoppingCart, color: 'text-blue-600' },
    { value: 'price_strategy', label: 'Stratégie Prix', icon: DollarSign, color: 'text-green-600' },
    { value: 'demand_forecast', label: 'Prédiction Demande', icon: TrendingUp, color: 'text-orange-600' },
    { value: 'market_analysis', label: 'Analyse Marché', icon: BarChart3, color: 'text-purple-600' },
    { value: 'customer_segmentation', label: 'Segmentation Client', icon: Users, color: 'text-pink-600' }
  ];

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('business_intelligence_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: BusinessInsight[] = (data || []).map(item => ({
        id: item.id,
        insight_type: item.insight_type,
        title: item.title,
        category: item.category,
        description: item.description,
        confidence_score: item.confidence_score,
        impact_score: item.impact_score,
        priority: typeof item.priority === 'number' ? 
          (item.priority >= 8 ? 'high' : item.priority >= 5 ? 'medium' : 'low') :
          item.priority as 'high' | 'medium' | 'low',
        actionable_recommendations: Array.isArray(item.actionable_recommendations) ? 
          (item.actionable_recommendations as any[]).map(rec => String(rec)) : 
          typeof item.actionable_recommendations === 'string' ? [item.actionable_recommendations] : 
          item.actionable_recommendations ? [String(item.actionable_recommendations)] : [],
        supporting_data: item.supporting_data || {},
        ai_analysis: typeof item.ai_analysis === 'object' && item.ai_analysis ? 
          {
            insights: Array.isArray((item.ai_analysis as any).insights) ? (item.ai_analysis as any).insights : [],
            predictions: Array.isArray((item.ai_analysis as any).predictions) ? (item.ai_analysis as any).predictions : []
          } : { insights: [], predictions: [] },
        status: (item.status as 'new' | 'acknowledged' | 'acted_upon') || 'new',
        created_at: item.created_at,
        expires_at: item.expires_at || undefined
      }));
      
      setInsights(transformedData);
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const generateInsights = async () => {
    if (!analysisType) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('business-intelligence-engine', {
        body: {
          user_id: user.id,
          analysis_type: analysisType,
          time_range: '30d'
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Analyse générée",
        description: "Nouveaux insights business disponibles",
      });

      await fetchInsights();
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer l'analyse",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const acknowledgeInsight = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('business_intelligence_insights')
        .update({ 
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', insightId);

      if (error) throw error;
      await fetchInsights();
    } catch (error) {
      console.error('Error acknowledging insight:', error);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Target className="w-4 h-4 text-yellow-500" />;
      default: return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getAnalysisIcon = (type: string) => {
    const option = analysisOptions.find(opt => opt.value === type);
    if (option) {
      const Icon = option.icon;
      return <Icon className={`w-5 h-5 ${option.color}`} />;
    }
    return <Brain className="w-5 h-5 text-blue-600" />;
  };

  const highPriorityInsights = insights.filter(i => i.priority === 'high').length;
  const avgConfidence = insights.length > 0 ? 
    Math.round(insights.reduce((sum, i) => sum + i.confidence_score, 0) / insights.length) : 0;
  const newInsights = insights.filter(i => i.status === 'new').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Intelligence Business IA
          </h2>
          <p className="text-muted-foreground">
            Insights automatiques et recommandations stratégiques
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={analysisType} onValueChange={setAnalysisType}>
            <SelectTrigger className="w-[200px]">
              <Lightbulb className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {analysisOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className={`w-4 h-4 ${option.color}`} />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={generateInsights} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Analyse...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Analyser
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Insights</p>
                <p className="text-2xl font-bold">{insights.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priorité Haute</p>
                <p className="text-2xl font-bold">{highPriorityInsights}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confiance IA</p>
                <p className="text-2xl font-bold">{avgConfidence}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nouveaux</p>
                <p className="text-2xl font-bold">{newInsights}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">Insights Récents</TabsTrigger>
          <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics IA</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun insight disponible</h3>
                  <p className="text-muted-foreground mb-4">
                    Lancez votre première analyse pour obtenir des recommandations IA
                  </p>
                  <Button onClick={generateInsights} disabled={isLoading}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Commencer l'analyse
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {insights.map((insight) => (
                <Card key={insight.id} className="cursor-pointer hover:shadow-lg transition-shadow" 
                      onClick={() => setSelectedInsight(insight)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getAnalysisIcon(insight.insight_type)}
                        <div className="flex-1">
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {insight.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                          {getPriorityIcon(insight.priority)}
                          <span className="ml-1 capitalize">{insight.priority}</span>
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {new Date(insight.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Confidence and Impact Scores */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Confiance</span>
                          <span>{insight.confidence_score}%</span>
                        </div>
                        <Progress value={insight.confidence_score} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Impact</span>
                          <span>{insight.impact_score}%</span>
                        </div>
                        <Progress value={insight.impact_score} className="h-2" />
                      </div>
                    </div>

                    {/* Top Recommendations */}
                    <div>
                      <h4 className="font-medium mb-2 text-sm">Recommandations clés</h4>
                      <ul className="space-y-1">
                        {insight.actionable_recommendations.slice(0, 2).map((rec, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {insight.status === 'new' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            acknowledgeInsight(insight.id);
                          }}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Prendre en compte
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <ArrowRight className="w-3 h-3 mr-1" />
                        Voir détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations">
          <div className="space-y-4">
            {insights.filter(i => i.actionable_recommendations.length > 0).map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getAnalysisIcon(insight.insight_type)}
                    {insight.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insight.actionable_recommendations.map((recommendation, index) => (
                      <Alert key={index}>
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Action {index + 1}:</strong> {recommendation}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance des Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Taux de mise en œuvre</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <Progress value={75} />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">ROI moyen des actions</span>
                    <span className="font-medium text-green-600">+23%</span>
                  </div>
                  <Progress value={85} />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Précision des prédictions</span>
                    <span className="font-medium">89%</span>
                  </div>
                  <Progress value={89} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendances d'Analyse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisOptions.map((option, index) => (
                    <div key={option.value} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <option.icon className={`w-4 h-4 ${option.color}`} />
                        <span className="text-sm">{option.label}</span>
                      </div>
                      <Badge variant="outline">
                        {insights.filter(i => i.insight_type === option.value).length}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detailed Insight Modal would go here */}
    </div>
  );
}