import React, { useState, useEffect } from 'react';
import { productionLogger } from '@/utils/productionLogger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Date picker removed for now
import {
  Brain,
  TrendingUp,
  Users,
  ShoppingBag,
  Target,
  Eye,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Filter,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar,
  ComposedChart,
  Scatter,
  ScatterChart
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIInsight {
  id: string;
  title: string;
  description: string;
  insight_type: 'opportunity' | 'trend' | 'anomaly' | 'recommendation';
  confidence_score: number;
  impact_score: number;
  priority: number;
  supporting_data: Record<string, any>;
  actionable_recommendations: string[];
  created_at: string;
  status: 'new' | 'acknowledged' | 'acted_upon';
}

interface AnalyticsMetrics {
  revenue_growth: number;
  customer_growth: number;
  product_performance: number;
  conversion_optimization: number;
  churn_prediction: number;
  lifetime_value: number;
  market_trends: number;
  competitive_position: number;
}

interface BusinessIntelligence {
  customer_segments: Array<{
    segment: string;
    count: number;
    revenue: number;
    growth: number;
    churn_risk: number;
  }>;
  product_intelligence: Array<{
    category: string;
    sales_velocity: number;
    profit_margin: number;
    demand_forecast: number;
    competition_level: number;
  }>;
  market_analysis: Array<{
    metric: string;
    current_value: number;
    predicted_value: number;
    confidence: number;
  }>;
}

export const AdvancedAnalytics: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [businessIntel, setBusinessIntel] = useState<BusinessIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const { toast } = useToast();

  // Data simulées pour les démonstrations
  const revenueAnalyticsData = [
    { date: '2024-01-01', actual: 12500, predicted: 12800, confidence: 0.85, trend: 'up' },
    { date: '2024-01-02', actual: 13200, predicted: 13100, confidence: 0.88, trend: 'up' },
    { date: '2024-01-03', actual: 11800, predicted: 12200, confidence: 0.82, trend: 'down' },
    { date: '2024-01-04', actual: 14500, predicted: 14200, confidence: 0.91, trend: 'up' },
    { date: '2024-01-05', actual: 13800, predicted: 13900, confidence: 0.87, trend: 'stable' },
    { date: '2024-01-06', actual: 15200, predicted: 15000, confidence: 0.93, trend: 'up' },
    { date: '2024-01-07', actual: 14100, predicted: 14500, confidence: 0.86, trend: 'down' }
  ];

  const customerBehaviorData = [
    { hour: '00h', purchases: 23, browsing: 145, cart_additions: 67 },
    { hour: '02h', purchases: 12, browsing: 89, cart_additions: 34 },
    { hour: '04h', purchases: 8, browsing: 56, cart_additions: 21 },
    { hour: '06h', purchases: 15, browsing: 112, cart_additions: 45 },
    { hour: '08h', purchases: 67, browsing: 234, cart_additions: 123 },
    { hour: '10h', purchases: 89, browsing: 345, cart_additions: 189 },
    { hour: '12h', purchases: 156, browsing: 567, cart_additions: 234 },
    { hour: '14h', purchases: 178, browsing: 623, cart_additions: 267 },
    { hour: '16h', purchases: 134, browsing: 489, cart_additions: 201 },
    { hour: '18h', purchases: 198, browsing: 678, cart_additions: 298 },
    { hour: '20h', purchases: 234, browsing: 789, cart_additions: 345 },
    { hour: '22h', purchases: 167, browsing: 456, cart_additions: 234 }
  ];

  const cohortAnalysisData = [
    { cohort: 'Jan 2024', month_0: 100, month_1: 85, month_2: 72, month_3: 64, month_4: 58 },
    { cohort: 'Feb 2024', month_0: 100, month_1: 88, month_2: 76, month_3: 68, month_4: 0 },
    { cohort: 'Mar 2024', month_0: 100, month_1: 91, month_2: 79, month_3: 0, month_4: 0 },
    { cohort: 'Apr 2024', month_0: 100, month_1: 89, month_2: 0, month_3: 0, month_4: 0 }
  ];

  const competitiveAnalysisData = [
    { metric: 'Prix Moyen', our_value: 45.2, competitor_avg: 48.7, market_position: 'favorable' },
    { metric: 'Temps de Livraison', our_value: 2.1, competitor_avg: 3.2, market_position: 'leader' },
    { metric: 'Note Satisfaction', our_value: 4.6, competitor_avg: 4.3, market_position: 'leader' },
    { metric: 'Variété Produits', our_value: 1247, competitor_avg: 1856, market_position: 'challenger' }
  ];

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch AI insights
      const { data: insightsData } = await supabase
        .from('business_intelligence_insights')
        .select('*')
        .order('priority', { ascending: false })
        .limit(10);

      if (insightsData) {
        const transformedInsights = insightsData.map(insight => ({
          ...insight,
          insight_type: (insight.insight_type || 'recommendation') as 'opportunity' | 'trend' | 'anomaly' | 'recommendation',
          actionable_recommendations: (insight.actionable_recommendations as string[]) || [],
          supporting_data: (insight.supporting_data as Record<string, any>) || {},
          status: (insight.status || 'new') as 'new' | 'acknowledged' | 'acted_upon'
        }));
        setInsights(transformedInsights);
      }

      // Simulate analytics metrics
      setMetrics({
        revenue_growth: 24.5,
        customer_growth: 18.2,
        product_performance: 87.3,
        conversion_optimization: 15.7,
        churn_prediction: 12.4,
        lifetime_value: 456.78,
        market_trends: 92.1,
        competitive_position: 78.9
      });

      // Simulate business intelligence data
      setBusinessIntel({
        customer_segments: [
          { segment: 'VIP Clients', count: 234, revenue: 125000, growth: 15.2, churn_risk: 5.1 },
          { segment: 'Clients Réguliers', count: 1456, revenue: 89000, growth: 8.7, churn_risk: 12.3 },
          { segment: 'Nouveaux Clients', count: 892, revenue: 34000, growth: 45.6, churn_risk: 28.9 },
          { segment: 'Clients Inactifs', count: 567, revenue: 5600, growth: -23.4, churn_risk: 78.2 }
        ],
        product_intelligence: [
          { category: 'Electronics', sales_velocity: 89.2, profit_margin: 23.4, demand_forecast: 15.6, competition_level: 87.3 },
          { category: 'Fashion', sales_velocity: 67.8, profit_margin: 45.2, demand_forecast: 8.9, competition_level: 92.1 },
          { category: 'Home & Garden', sales_velocity: 45.3, profit_margin: 34.7, demand_forecast: 12.3, competition_level: 65.4 },
          { category: 'Beauty', sales_velocity: 78.9, profit_margin: 56.1, demand_forecast: 22.1, competition_level: 78.8 }
        ],
        market_analysis: [
          { metric: 'Demande Saisonnière', current_value: 134.2, predicted_value: 156.8, confidence: 0.89 },
          { metric: 'Prix du Marché', current_value: 98.7, predicted_value: 102.3, confidence: 0.92 },
          { metric: 'Concurrence', current_value: 78.4, predicted_value: 82.1, confidence: 0.85 },
          { metric: 'Innovation', current_value: 67.2, predicted_value: 71.5, confidence: 0.78 }
        ]
      });

    } catch (error) {
      productionLogger.error('Failed to fetch analytics data', error as Error, 'AdvancedAnalytics');
      toast({
        title: "Erreur",
        description: "Impossible de charger les données d'analyse",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    const icons = {
      'opportunity': Target,
      'trend': TrendingUp,
      'anomaly': AlertTriangle,
      'recommendation': Lightbulb
    };
    return icons[type as keyof typeof icons] || Lightbulb;
  };

  const getInsightColor = (type: string) => {
    const colors = {
      'opportunity': 'bg-green-100 text-green-800',
      'trend': 'bg-blue-100 text-blue-800',
      'anomaly': 'bg-red-100 text-red-800',
      'recommendation': 'bg-yellow-100 text-yellow-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics IA</h1>
          <p className="text-muted-foreground">Intelligence artificielle pour l'analyse business avancée</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAnalyticsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* AI Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score IA Global</p>
                <p className="text-2xl font-bold">87.3</p>
                <div className="flex items-center gap-1 text-blue-600">
                  <Brain className="w-3 h-3" />
                  <span className="text-xs">Excellent</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prédiction CA</p>
                <p className="text-2xl font-bold">+24.5%</p>
                <div className="flex items-center gap-1 text-green-600">
                  <ArrowUpRight className="w-3 h-3" />
                  <span className="text-xs">Conf: 91%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Opportunités</p>
                <p className="text-2xl font-bold">{insights.filter(i => i.insight_type === 'opportunity').length}</p>
                <div className="flex items-center gap-1 text-purple-600">
                  <Target className="w-3 h-3" />
                  <span className="text-xs">À exploiter</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Anomalies</p>
                <p className="text-2xl font-bold">{insights.filter(i => i.insight_type === 'anomaly').length}</p>
                <div className="flex items-center gap-1 text-orange-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-xs">Attention</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Prédictions vs Réalité</CardTitle>
            <CardDescription>Analyse prédictive des revenus avec IA</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={revenueAnalyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    formatCurrency(value as number),
                    name === 'actual' ? 'Réel' : 'Prédit'
                  ]}
                  labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
                />
                <Area type="monotone" dataKey="predicted" fill="#E0E7FF" stroke="#6366F1" strokeOpacity={0.6} fillOpacity={0.3} />
                <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={3} />
                <Bar dataKey="confidence" fill="#10B981" opacity={0.3} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comportement Client (24h)</CardTitle>
            <CardDescription>Analyse des patterns d'activité horaire</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={customerBehaviorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="browsing" stackId="1" stroke="#E5E7EB" fill="#E5E7EB" />
                <Area type="monotone" dataKey="cart_additions" stackId="1" stroke="#FCD34D" fill="#FCD34D" />
                <Area type="monotone" dataKey="purchases" stackId="1" stroke="#10B981" fill="#10B981" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">Insights IA</TabsTrigger>
          <TabsTrigger value="segments">Segmentation</TabsTrigger>
          <TabsTrigger value="products">Intelligence Produit</TabsTrigger>
          <TabsTrigger value="competitive">Analyse Concurrentielle</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Insights Générés par IA</CardTitle>
              <CardDescription>Recommandations et analyses automatiques basées sur vos données</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight) => {
                  const InsightIcon = getInsightIcon(insight.insight_type);
                  return (
                    <div key={insight.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <InsightIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge className={getInsightColor(insight.insight_type)} variant="outline">
                            {insight.insight_type}
                          </Badge>
                          <Badge variant="outline">
                            Priorité {insight.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium">Confiance:</span>
                            <span className={`text-xs font-bold ${getConfidenceColor(insight.confidence_score)}`}>
                              {(insight.confidence_score * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium">Impact:</span>
                            <span className="text-xs font-bold text-purple-600">
                              {(insight.impact_score * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        {insight.actionable_recommendations?.length > 0 && (
                          <div className="bg-muted/30 p-3 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Recommandations:</p>
                            <ul className="text-xs space-y-1">
                              {insight.actionable_recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segmentation Client IA</CardTitle>
              <CardDescription>Analyse automatique des segments de clientèle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {businessIntel?.customer_segments.map((segment, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{segment.segment}</h4>
                      <Badge className={segment.churn_risk > 50 ? 'bg-red-100 text-red-800' : 
                                       segment.churn_risk > 25 ? 'bg-yellow-100 text-yellow-800' : 
                                       'bg-green-100 text-green-800'} variant="outline">
                        Risque: {segment.churn_risk.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Clients</p>
                        <p className="font-bold">{segment.count.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">CA</p>
                        <p className="font-bold">{formatCurrency(segment.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Croissance</p>
                        <p className={`font-bold ${segment.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {segment.growth > 0 ? '+' : ''}{segment.growth.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">CA/Client</p>
                        <p className="font-bold">{formatCurrency(segment.revenue / segment.count)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Intelligence Produit</CardTitle>
              <CardDescription>Analyse IA des performances et opportunités par catégorie</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {businessIntel?.product_intelligence.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{product.category}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Vélocité: {product.sales_velocity.toFixed(1)}%</span>
                        <span>Marge: {product.profit_margin.toFixed(1)}%</span>
                        <span>Demande: +{product.demand_forecast.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">Concurrence:</span>
                        <Badge className={product.competition_level > 80 ? 'bg-red-100 text-red-800' : 
                                         product.competition_level > 60 ? 'bg-yellow-100 text-yellow-800' : 
                                         'bg-green-100 text-green-800'} variant="outline">
                          {product.competition_level.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${product.sales_velocity}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Position Concurrentielle</CardTitle>
              <CardDescription>Analyse comparative automatisée vs marché</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {competitiveAnalysisData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{item.metric}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>Notre valeur: {typeof item.our_value === 'number' ? 
                          item.metric.includes('Prix') || item.metric.includes('Note') ? 
                          item.our_value.toFixed(1) : item.our_value.toLocaleString()
                          : item.our_value}
                        </span>
                        <span>Moyenne marché: {typeof item.competitor_avg === 'number' ? 
                          item.metric.includes('Prix') || item.metric.includes('Note') ? 
                          item.competitor_avg.toFixed(1) : item.competitor_avg.toLocaleString()
                          : item.competitor_avg}
                        </span>
                      </div>
                    </div>
                    <Badge className={
                      item.market_position === 'leader' ? 'bg-green-100 text-green-800' :
                      item.market_position === 'favorable' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    } variant="outline">
                      {item.market_position === 'leader' ? 'Leader' :
                       item.market_position === 'favorable' ? 'Favorable' : 'Challenger'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};