import React, { useState, useEffect } from 'react';
import { logError } from '@/utils/consoleCleanup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown,
  Brain, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  LineChart,
  PieChart,
  Zap
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface PredictiveInsight {
  id: string;
  type: 'revenue' | 'inventory' | 'demand' | 'trend';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  timeframe: '7d' | '30d' | '90d';
  predicted_value: number;
  current_value: number;
  change_percent: number;
  recommendations: string[];
}

interface PredictiveData {
  revenue_forecast: Array<{ date: string; predicted: number; actual?: number; confidence: number }>;
  demand_forecast: Array<{ product: string; predicted_sales: number; current_sales: number; growth: number }>;
  inventory_alerts: Array<{ product: string; current_stock: number; predicted_stockout: string; urgency: string }>;
  trend_analysis: Array<{ category: string; trend_score: number; market_potential: number }>;
}

export function PredictiveAnalytics() {
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [data, setData] = useState<PredictiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPredictiveData();
    }
  }, [user, selectedTimeframe]);

  const fetchPredictiveData = async () => {
    try {
      setLoading(true);

      // Simuler des données prédictives
      const mockInsights: PredictiveInsight[] = [
        {
          id: '1',
          type: 'revenue',
          title: 'Croissance du CA prévue',
          description: 'Une augmentation de 23% des revenus est attendue dans les 30 prochains jours',
          confidence: 89,
          impact: 'high',
          timeframe: '30d',
          predicted_value: 45230,
          current_value: 36750,
          change_percent: 23,
          recommendations: [
            'Augmenter le stock des produits tendance',
            'Préparer une campagne marketing ciblée',
            'Optimiser la chaîne logistique'
          ]
        },
        {
          id: '2',
          type: 'demand',
          title: 'Pic de demande détecté',
          description: 'La catégorie Électronique va connaître un pic dans 7 jours',
          confidence: 94,
          impact: 'high',
          timeframe: '7d',
          predicted_value: 156,
          current_value: 89,
          change_percent: 75,
          recommendations: [
            'Réapprovisionner en urgence',
            'Ajuster les prix dynamiquement',
            'Préparer le service client'
          ]
        },
        {
          id: '3',
          type: 'inventory',
          title: 'Risque de rupture stock',
          description: '5 produits risquent une rupture dans les 14 jours',
          confidence: 76,
          impact: 'medium',
          timeframe: '30d',
          predicted_value: 5,
          current_value: 8,
          change_percent: -38,
          recommendations: [
            'Commande automatique activée',
            'Contacter les fournisseurs prioritaires',
            'Mettre en place des substituts'
          ]
        },
        {
          id: '4',
          type: 'trend',
          title: 'Nouvelle tendance émergente',
          description: 'La niche "Maison connectée" montre un potentiel élevé',
          confidence: 82,
          impact: 'medium',
          timeframe: '90d',
          predicted_value: 120,
          current_value: 45,
          change_percent: 167,
          recommendations: [
            'Explorer les produits IoT',
            'Analyser la concurrence',
            'Tester avec un petit catalogue'
          ]
        }
      ];

      const mockData: PredictiveData = {
        revenue_forecast: [
          { date: '2024-01', predicted: 32000, actual: 31500, confidence: 95 },
          { date: '2024-02', predicted: 35000, actual: 34200, confidence: 92 },
          { date: '2024-03', predicted: 38000, actual: 37800, confidence: 94 },
          { date: '2024-04', predicted: 42000, confidence: 89 },
          { date: '2024-05', predicted: 45000, confidence: 86 },
          { date: '2024-06', predicted: 48000, confidence: 83 }
        ],
        demand_forecast: [
          { product: 'iPhone 15', predicted_sales: 45, current_sales: 32, growth: 41 },
          { product: 'Samsung TV', predicted_sales: 23, current_sales: 18, growth: 28 },
          { product: 'AirPods Pro', predicted_sales: 67, current_sales: 52, growth: 29 },
          { product: 'MacBook Air', predicted_sales: 34, current_sales: 28, growth: 21 }
        ],
        inventory_alerts: [
          { product: 'iPhone 15', current_stock: 12, predicted_stockout: '2024-01-15', urgency: 'high' },
          { product: 'AirPods Pro', current_stock: 8, predicted_stockout: '2024-01-20', urgency: 'medium' },
          { product: 'Samsung TV', current_stock: 15, predicted_stockout: '2024-01-25', urgency: 'low' }
        ],
        trend_analysis: [
          { category: 'Maison connectée', trend_score: 95, market_potential: 87 },
          { category: 'Électronique portable', trend_score: 88, market_potential: 92 },
          { category: 'Gaming', trend_score: 82, market_potential: 78 },
          { category: 'Fitness Tech', trend_score: 76, market_potential: 85 }
        ]
      };

      setInsights(mockInsights);
      setData(mockData);

    } catch (error) {
      logError(error, 'PredictiveAnalytics.fetchPredictiveData');
      toast({
        title: "Erreur",
        description: "Impossible de charger les analyses prédictives",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue': return TrendingUp;
      case 'demand': return Target;
      case 'inventory': return AlertTriangle;
      case 'trend': return Brain;
      default: return BarChart3;
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
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
      {/* Timeframe Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <Brain className="mr-2 h-5 w-5 text-primary" />
            Analyses Prédictives IA
          </h3>
          <p className="text-sm text-muted-foreground">
            Prédictions et insights basés sur l'intelligence artificielle
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((period) => (
            <Button
              key={period}
              size="sm"
              variant={selectedTimeframe === period ? 'default' : 'outline'}
              onClick={() => setSelectedTimeframe(period)}
            >
              {period === '7d' && '7 jours'}
              {period === '30d' && '30 jours'}
              {period === '90d' && '90 jours'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {insights.map((insight) => {
          const Icon = getTypeIcon(insight.type);
          return (
            <Card key={insight.id} className={`border-l-4 ${
              insight.impact === 'high' ? 'border-l-red-500' :
              insight.impact === 'medium' ? 'border-l-orange-500' :
              'border-l-green-500'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className={getImpactColor(insight.impact)}>
                    {insight.confidence}% confiance
                  </Badge>
                </div>
                <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold flex items-center">
                      {insight.change_percent > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      {Math.abs(insight.change_percent)}%
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {insight.timeframe}
                    </Badge>
                  </div>
                  <Progress value={insight.confidence} className="h-1" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="forecast" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forecast">Prévisions</TabsTrigger>
          <TabsTrigger value="demand">Demande</TabsTrigger>
          <TabsTrigger value="inventory">Stocks</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prévision des Revenus</CardTitle>
              <CardDescription>
                Évolution prédite du chiffre d'affaires avec niveaux de confiance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data?.revenue_forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatCurrency(value), 
                      name === 'predicted' ? 'Prédiction' : 'Réel'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="predicted" 
                    stackId="1"
                    stroke="#8884d8" 
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={{ fill: '#82ca9d' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demand" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prévisions de Demande</CardTitle>
              <CardDescription>
                Prédiction des ventes par produit dans la période sélectionnée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.demand_forecast.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{item.product}</h4>
                      <p className="text-sm text-muted-foreground">
                        Ventes actuelles: {item.current_sales} unités
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-lg font-bold">{item.predicted_sales} unités</div>
                      <div className="flex items-center text-sm">
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-green-600">+{item.growth}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertes Stock Prédictives</CardTitle>
              <CardDescription>
                Prédiction des ruptures de stock et recommandations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.inventory_alerts.map((alert, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${
                    alert.urgency === 'high' ? 'border-red-200 bg-red-50' :
                    alert.urgency === 'medium' ? 'border-orange-200 bg-orange-50' :
                    'border-green-200 bg-green-50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium flex items-center">
                          {alert.urgency === 'high' && <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />}
                          {alert.urgency === 'medium' && <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />}
                          {alert.urgency === 'low' && <CheckCircle className="h-4 w-4 text-green-500 mr-2" />}
                          {alert.product}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Stock actuel: {alert.current_stock} unités
                        </p>
                        <p className="text-sm font-medium">
                          Rupture prévue: {new Date(alert.predicted_stockout).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={
                        alert.urgency === 'high' ? 'destructive' :
                        alert.urgency === 'medium' ? 'secondary' : 'default'
                      }>
                        {alert.urgency === 'high' ? 'Critique' :
                         alert.urgency === 'medium' ? 'Attention' : 'Normal'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des Tendances</CardTitle>
              <CardDescription>
                Détection des tendances émergentes et opportunités de marché
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.trend_analysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="trend_score" fill="#8884d8" name="Score Tendance" />
                  <Bar dataKey="market_potential" fill="#82ca9d" name="Potentiel Marché" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}