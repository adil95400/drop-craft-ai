import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Brain, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  Calendar,
  Package,
  Lightbulb
} from 'lucide-react';
import { useSalesIntelligence } from '@/hooks/useSalesIntelligence';

interface SalesIntelligenceDashboardProps {
  className?: string;
}

export function SalesIntelligenceDashboard({ className }: SalesIntelligenceDashboardProps) {
  const {
    forecasts,
    stats,
    isLoadingForecasts,
    isGenerating,
    generateForecast,
    formatCurrency,
    getPriorityColor,
    getConfidenceLevel
  } = useSalesIntelligence();

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedType, setSelectedType] = useState<'forecast' | 'trend_analysis' | 'price_optimization'>('forecast');

  const handleGenerateForecast = () => {
    generateForecast({
      timePeriod: selectedPeriod,
      analysisType: selectedType
    });
  };

  const latestForecast = forecasts[0];

  if (isLoadingForecasts) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 animate-spin" />
            <span>Chargement de l'intelligence des ventes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Intelligence des Ventes</h2>
          <p className="text-muted-foreground">Prédictions IA et analyse prédictive des performances</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Année</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="forecast">Prédiction ventes</SelectItem>
              <SelectItem value="trend_analysis">Analyse tendances</SelectItem>
              <SelectItem value="price_optimization">Optimisation prix</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerateForecast} disabled={isGenerating}>
            <Brain className="w-4 h-4 mr-2" />
            {isGenerating ? 'Génération...' : 'Analyser avec IA'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Analyses totales</p>
                <p className="text-2xl font-bold">{stats.totalForecasts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Confiance moyenne</p>
                <p className="text-2xl font-bold">{stats.avgConfidenceScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Haute précision</p>
                <p className="text-2xl font-bold">{stats.highConfidenceForecasts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Cette semaine</p>
                <p className="text-2xl font-bold">{stats.recentForecasts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {latestForecast && (
        <Tabs defaultValue="predictions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="predictions">Prédictions</TabsTrigger>
            <TabsTrigger value="insights">Insights Marché</TabsTrigger>
            <TabsTrigger value="actions">Actions Recommandées</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Prédictions de Ventes
                  <Badge variant="outline" className={getConfidenceLevel(latestForecast.confidence_score).color}>
                    Confiance: {getConfidenceLevel(latestForecast.confidence_score).level}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 3 Months */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">3 Mois</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Revenus</span>
                          <span className="font-medium">
                            {formatCurrency(latestForecast.predictions['3_months'].revenue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Commandes</span>
                          <span className="font-medium">{latestForecast.predictions['3_months'].orders}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Croissance</span>
                          <Badge variant={latestForecast.predictions['3_months'].growth_rate >= 0 ? "default" : "destructive"}>
                            {latestForecast.predictions['3_months'].growth_rate >= 0 ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {latestForecast.predictions['3_months'].growth_rate.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 6 Months */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">6 Mois</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Revenus</span>
                          <span className="font-medium">
                            {formatCurrency(latestForecast.predictions['6_months'].revenue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Commandes</span>
                          <span className="font-medium">{latestForecast.predictions['6_months'].orders}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Croissance</span>
                          <Badge variant={latestForecast.predictions['6_months'].growth_rate >= 0 ? "default" : "destructive"}>
                            {latestForecast.predictions['6_months'].growth_rate >= 0 ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {latestForecast.predictions['6_months'].growth_rate.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 12 Months */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">12 Mois</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Revenus</span>
                          <span className="font-medium">
                            {formatCurrency(latestForecast.predictions['12_months'].revenue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Commandes</span>
                          <span className="font-medium">{latestForecast.predictions['12_months'].orders}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Croissance</span>
                          <Badge variant={latestForecast.predictions['12_months'].growth_rate >= 0 ? "default" : "destructive"}>
                            {latestForecast.predictions['12_months'].growth_rate >= 0 ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {latestForecast.predictions['12_months'].growth_rate.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Score de Confiance</h4>
                  <Progress value={latestForecast.confidence_score} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    L'IA est confiante à {latestForecast.confidence_score}% dans ces prédictions basées sur les données historiques et les tendances du marché.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Insights Marché
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Tendances Saisonnières
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {latestForecast.market_insights.seasonal_trends}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Patterns de Demande
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {latestForecast.market_insights.demand_patterns}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Position Concurrentielle
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {latestForecast.market_insights.competitive_position}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Actions Recommandées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {latestForecast.recommended_actions.map((action, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className={`mt-1 ${action.priority === 'high' ? 'text-red-500' : action.priority === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                        {action.priority === 'high' && <AlertTriangle className="h-5 w-5" />}
                        {action.priority === 'medium' && <Target className="h-5 w-5" />}
                        {action.priority === 'low' && <CheckCircle className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={action.priority === 'high' ? 'destructive' : action.priority === 'medium' ? 'default' : 'secondary'}>
                            {action.priority === 'high' ? 'Priorité Élevée' : action.priority === 'medium' ? 'Priorité Moyenne' : 'Priorité Faible'}
                          </Badge>
                        </div>
                        <h4 className="font-semibold mb-1">{action.action}</h4>
                        <p className="text-sm text-muted-foreground">{action.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}