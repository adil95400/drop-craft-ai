import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Brain, 
  AlertTriangle, 
  TrendingUp,
  Heart,
  Eye,
  ShoppingCart,
  Target
} from 'lucide-react';
import { useCustomerBehavior } from '@/hooks/useCustomerBehavior';

interface CustomerBehaviorDashboardProps {
  className?: string;
}

export function CustomerBehaviorDashboard({ className }: CustomerBehaviorDashboardProps) {
  const {
    analyses,
    stats,
    isLoadingAnalyses,
    isAnalyzing,
    analyzeBehavior,
    getChurnRiskLevel,
    formatLifetimeValue,
    getBehaviorIcon
  } = useCustomerBehavior();

  const [selectedBehaviorType, setSelectedBehaviorType] = useState<'purchase_pattern' | 'browsing_behavior' | 'engagement' | 'churn_risk'>('purchase_pattern');

  const handleAnalyzeBehavior = () => {
    analyzeBehavior({
      behaviorType: selectedBehaviorType
    });
  };

  const latestAnalysis = analyses[0];

  if (isLoadingAnalyses) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 animate-spin" />
            <span>Chargement de l'analyse comportementale...</span>
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
          <h2 className="text-2xl font-bold text-foreground">Analyse Comportementale Client</h2>
          <p className="text-muted-foreground">Intelligence IA des patterns et segmentation clients</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedBehaviorType} onValueChange={(value: any) => setSelectedBehaviorType(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="purchase_pattern">Patterns d'achat</SelectItem>
              <SelectItem value="browsing_behavior">Comportement navigation</SelectItem>
              <SelectItem value="engagement">Engagement</SelectItem>
              <SelectItem value="churn_risk">Risque de churn</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAnalyzeBehavior} disabled={isAnalyzing}>
            <Brain className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analyse...' : 'Analyser avec IA'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Analyses totales</p>
                <p className="text-2xl font-bold">{stats.totalAnalyses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Score comportemental moyen</p>
                <p className="text-2xl font-bold">{stats.avgBehavioralScore}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">LTV moyenne</p>
                <p className="text-2xl font-bold">{formatLifetimeValue(stats.avgLifetimeValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Clients à risque</p>
                <p className="text-2xl font-bold">{stats.highRiskCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {latestAnalysis && (
        <Tabs defaultValue="segments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="segments">Segmentation</TabsTrigger>
            <TabsTrigger value="churn">Analyse Churn</TabsTrigger>
            <TabsTrigger value="ltv">Lifetime Value</TabsTrigger>
            <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
          </TabsList>

          <TabsContent value="segments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Segmentation Automatique des Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestAnalysis.analysis_data?.customer_segments && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(latestAnalysis.analysis_data.customer_segments).map(([segment, data]: [string, any]) => (
                      <Card key={segment}>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <h4 className="font-semibold mb-2 capitalize">{segment}</h4>
                            <div className="text-3xl font-bold mb-2">{data.count}</div>
                            <p className="text-xs text-muted-foreground">{data.characteristics}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="churn">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Analyse du Risque de Churn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestAnalysis.analysis_data?.churn_analysis && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-red-600 mb-1">
                            {latestAnalysis.analysis_data.churn_analysis.high_risk_customers}
                          </div>
                          <p className="text-sm text-muted-foreground">Clients à haut risque</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold mb-1">
                            {stats.avgChurnProbability}%
                          </div>
                          <p className="text-sm text-muted-foreground">Probabilité moyenne</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Badge variant="outline" className={getChurnRiskLevel(stats.avgChurnProbability).color}>
                            {getChurnRiskLevel(stats.avgChurnProbability).level}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">Niveau de risque</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Indicateurs de Churn</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {latestAnalysis.analysis_data.churn_analysis.churn_indicators?.map((indicator: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm">{indicator}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Stratégies de Rétention</h4>
                      <div className="space-y-2">
                        {latestAnalysis.analysis_data.churn_analysis.retention_strategies?.map((strategy: string, index: number) => (
                          <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                            <Target className="h-4 w-4 text-green-600 mt-0.5" />
                            <span className="text-sm">{strategy}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ltv">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Analyse de la Lifetime Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestAnalysis.analysis_data?.ltv_analysis && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {formatLifetimeValue(latestAnalysis.analysis_data.ltv_analysis.average_ltv)}
                          </div>
                          <p className="text-sm text-muted-foreground">LTV Moyenne</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-lg font-bold mb-1">
                            {latestAnalysis.analysis_data.ltv_analysis.top_value_segment}
                          </div>
                          <p className="text-sm text-muted-foreground">Segment le plus rentable</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Opportunités de croissance</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Opportunités de Croissance LTV</h4>
                      <div className="space-y-2">
                        {latestAnalysis.analysis_data.ltv_analysis.growth_opportunities?.map((opportunity: string, index: number) => (
                          <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                            <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                            <span className="text-sm">{opportunity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Recommandations Personnalisées
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestAnalysis.recommendations && (
                  <div className="space-y-3">
                    {(latestAnalysis.recommendations as any[]).map((rec, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                        <div className={`mt-1 ${rec.priority === 'high' ? 'text-red-500' : rec.priority === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                          {rec.priority === 'high' && <AlertTriangle className="h-5 w-5" />}
                          {rec.priority === 'medium' && <Target className="h-5 w-5" />}
                          {rec.priority === 'low' && <TrendingUp className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                              {rec.priority === 'high' ? 'Priorité Élevée' : rec.priority === 'medium' ? 'Priorité Moyenne' : 'Priorité Faible'}
                            </Badge>
                            {rec.customer_id && (
                              <Badge variant="outline">Client: {rec.customer_id.slice(0, 8)}</Badge>
                            )}
                          </div>
                          <p className="font-medium mb-1">{rec.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Behavioral Insights */}
      {latestAnalysis?.analysis_data?.behavioral_insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Insights Comportementaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Patterns d'Achat
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {latestAnalysis.analysis_data.behavioral_insights.purchase_patterns}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Comportement Saisonnier
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {latestAnalysis.analysis_data.behavioral_insights.seasonal_behavior}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Sensibilité Prix
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {latestAnalysis.analysis_data.behavioral_insights.price_sensitivity}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}