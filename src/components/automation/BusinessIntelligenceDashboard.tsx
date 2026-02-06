import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Lightbulb,
  Target,
  Activity,
  Eye
} from 'lucide-react';
import { usePriorityInsights, useInsightMetrics, useAcknowledgeInsight, useDismissInsight } from '@/hooks/useBusinessIntelligence';
import { Skeleton } from '@/components/ui/skeleton';

export function BusinessIntelligenceDashboard() {
  const { data: priorityInsights, isLoading: insightsLoading } = usePriorityInsights();
  const { data: metrics, isLoading: metricsLoading } = useInsightMetrics();
  const acknowledgeInsight = useAcknowledgeInsight();
  const dismissInsight = useDismissInsight();

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity': return <Lightbulb className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'prediction': return <Target className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'opportunity': return 'text-green-600 bg-green-100 border-green-200';
      case 'info': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Critique';
      case 'warning': return 'Attention';
      case 'opportunity': return 'Opportunité';
      case 'info': return 'Information';
      default: return severity;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'sales': return 'Ventes';
      case 'inventory': return 'Inventaire';
      case 'marketing': return 'Marketing';
      case 'customer': return 'Clients';
      case 'financial': return 'Financier';
      default: return category;
    }
  };

  if (insightsLoading || metricsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques d'intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Insights Total</p>
                <p className="text-2xl font-bold">{metrics?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Critiques</p>
                <p className="text-2xl font-bold text-red-600">{metrics?.critical || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Lightbulb className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Opportunités</p>
                <p className="text-2xl font-bold text-green-600">{(metrics?.total || 0) - (metrics?.critical || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux d'Action</p>
                <p className="text-2xl font-bold">{metrics?.total ? Math.round((metrics.acknowledged / metrics.total) * 100) : 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights prioritaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Insights Business Prioritaires
            <Badge variant="secondary" className="ml-auto">
              IA Prédictive
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!priorityInsights || priorityInsights.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun insight prioritaire</h3>
              <p className="text-muted-foreground mb-4">
                L'IA analyse vos données pour identifier des opportunités d'optimisation
              </p>
              <Button>
                <Activity className="h-4 w-4 mr-2" />
                Générer une analyse
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {priorityInsights.map((insight: any) => (
                <div key={insight.id} className={`p-4 border rounded-lg ${getSeverityColor(insight.trend || 'info')}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/80 rounded-lg">
                        {getInsightIcon(insight.category || 'general')}
                      </div>
                      <div>
                        <h4 className="font-semibold">{insight.metric_name}</h4>
                        <p className="text-sm opacity-80 mb-2">
                          {insight.category || 'Insight'}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-white/50">
                            {getCategoryLabel(insight.category)}
                          </Badge>
                          <Badge className={`text-xs ${getSeverityColor(insight.trend || 'info')}`}>
                            {getSeverityLabel(insight.trend || 'info')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">Confiance:</span>
                        <Progress value={insight.confidence_score || 0} className="w-16 h-2" />
                        <span className="text-sm">{insight.confidence_score || 0}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Valeur:</span>
                        <Progress value={insight.metric_value || 0} className="w-16 h-2" />
                        <span className="text-sm">{insight.metric_value || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  {insight.insights && (
                    <div className="mb-4">
                      <h5 className="font-medium mb-2">Recommandations:</h5>
                      <ul className="space-y-1">
                        {(Array.isArray(insight.insights) ? insight.insights : []).slice(0, 3).map((rec: string, index: number) => (
                          <li key={index} className="text-sm opacity-80 flex items-center gap-2">
                            <CheckCircle className="h-3 w-3" />
                            {typeof rec === 'string' ? rec : JSON.stringify(rec)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/50 hover:bg-white/80"
                      onClick={() => acknowledgeInsight.mutate(insight.id)}
                      disabled={acknowledgeInsight.isPending}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Vu
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/50 hover:bg-white/80"
                      onClick={() => dismissInsight.mutate(insight.id)}
                      disabled={dismissInsight.isPending}
                    >
                      Ignorer
                    </Button>
                    <Button
                      size="sm"
                      className="bg-white/90 hover:bg-white text-current"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Agir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}