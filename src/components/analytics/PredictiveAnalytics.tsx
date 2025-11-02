import React, { useState } from 'react';
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
  CheckCircle
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { useRealPredictiveAnalytics } from '@/hooks/useRealPredictiveAnalytics';

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
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const { insights, metrics, isLoading } = useRealPredictiveAnalytics();

  // Transform insights into the format needed by the charts
  const predictions = insights;
  const forecasts = {
    revenue: insights.filter(i => i.type === 'revenue').map((i, idx) => ({
      date: new Date(Date.now() + idx * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      predicted: i.value,
      confidence: i.confidence
    })),
    demand: insights.filter(i => i.type === 'inventory').map(i => ({
      product: i.title,
      predicted_sales: i.value,
      current_sales: Math.floor(i.value / (1 + i.change / 100)),
      growth: i.change
    })),
    inventory: insights.filter(i => i.type === 'inventory').map(i => ({
      product: i.title,
      current_stock: Math.floor(i.value),
      predicted_stockout: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      urgency: i.impact
    }))
  };
  const trends = insights.filter(i => i.type === 'trend').map(i => ({
    category: i.title,
    trend_score: i.confidence,
    market_potential: i.value
  }));

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
      case 'customer': return Target;
      default: return Brain;
    }
  };

  if (isLoading) {
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
        {predictions.map((insight) => {
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
                      {insight.change > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      {Math.abs(insight.change)}%
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
                <AreaChart data={forecasts.revenue}>
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
                {forecasts.demand.map((item, index) => (
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
                {forecasts.inventory.map((alert, index) => (
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
                <BarChart data={trends}>
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