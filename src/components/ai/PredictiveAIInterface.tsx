import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Eye, ShoppingCart, Calendar, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRealPredictiveAI, PredictiveInsight, SalesData } from '@/hooks/useRealPredictiveAI';

export const PredictiveAIInterface = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const {
    insights,
    salesData,
    isLoading,
    generatePrediction,
    isGenerating
  } = useRealPredictiveAI(selectedPeriod, selectedCategory);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sales_forecast':
        return <TrendingUp className="h-4 w-4" />;
      case 'demand_prediction':
        return <Eye className="h-4 w-4" />;
      case 'price_optimization':
        return <ShoppingCart className="h-4 w-4" />;
      case 'inventory_alert':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">IA Prédictive</h1>
          <p className="text-muted-foreground">
            Analyses prédictives et recommandations basées sur l'intelligence artificielle
          </p>
        </div>
        <Button onClick={() => generatePrediction()} disabled={isLoading || isGenerating}>
          {isLoading || isGenerating ? 'Analyse...' : 'Nouvelle Analyse'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 jours</SelectItem>
            <SelectItem value="30d">30 jours</SelectItem>
            <SelectItem value="90d">90 jours</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            <SelectItem value="electronics">Électronique</SelectItem>
            <SelectItem value="fashion">Mode</SelectItem>
            <SelectItem value="home">Maison</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sales Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Prévisions de Ventes</CardTitle>
          <CardDescription>
            Comparaison entre ventes réelles et prédictions IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
                  formatter={(value, name) => [
                    `${value}€`,
                    name === 'actual' ? 'Ventes réelles' : 
                    name === 'predicted' ? 'Prédictions' : 'Tendance'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  name="actual"
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="predicted"
                />
                <Line 
                  type="monotone" 
                  dataKey="trend" 
                  stroke="#f59e0b" 
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={false}
                  name="trend"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Predictive Insights */}
      <div className="grid gap-6">
        <h2 className="text-2xl font-semibold">Insights Prédictifs</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((insight) => (
            <Card key={insight.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(insight.type)}
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                  </div>
                  <Badge className={getImpactColor(insight.impact)}>
                    {insight.impact === 'high' ? 'Élevé' : 
                     insight.impact === 'medium' ? 'Moyen' : 'Faible'}
                  </Badge>
                </div>
                <CardDescription>{insight.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Confiance IA:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${insight.confidence}%` }}
                      />
                    </div>
                    <span className="font-medium">{insight.confidence}%</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Valeur actuelle:</span>
                    <p className="font-medium">{insight.current_value.toLocaleString()}€</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prédiction:</span>
                    <p className="font-medium">{insight.predicted_value.toLocaleString()}€</p>
                  </div>
                </div>
                
                <div>
                  <span className="text-muted-foreground text-sm">Délai:</span>
                  <p className="font-medium">{insight.timeframe}</p>
                </div>
                
                <div>
                  <span className="text-muted-foreground text-sm">Actions recommandées:</span>
                  <ul className="mt-1 space-y-1">
                    {insight.actionable_insights.map((action, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};