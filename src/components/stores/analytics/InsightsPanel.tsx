import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAnalyticsInsights, useAcknowledgeInsightMutation } from '@/hooks/useMultiStoreAnalytics';
import { AlertCircle, CheckCircle, TrendingUp, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function InsightsPanel() {
  const { data: insights, isLoading } = useAnalyticsInsights(false);
  const acknowledgeMutation = useAcknowledgeInsightMutation();
  const { toast } = useToast();

  const handleAcknowledge = async (insightId: string) => {
    try {
      await acknowledgeMutation.mutateAsync(insightId);
      toast({
        title: 'Insight marqué comme lu',
        description: 'L\'insight a été marqué comme traité.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer l\'insight comme lu.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Chargement des insights...</div>;
  }

  if (!insights || insights.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-success" />
          <div>
            <p className="font-medium">Tout va bien !</p>
            <p className="text-sm text-muted-foreground">Aucun insight nécessitant votre attention.</p>
          </div>
        </div>
      </Card>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'success':
        return <TrendingUp className="h-5 w-5 text-success" />;
      default:
        return <Lightbulb className="h-5 w-5 text-primary" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Insights IA</h3>
        <Badge variant="secondary">{insights.length} nouveaux</Badge>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => (
          <Card key={insight.id} className="p-4">
            <div className="flex items-start gap-3">
              {getSeverityIcon(insight.severity)}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{insight.title}</h4>
                      <Badge variant={getSeverityColor(insight.severity) as any}>
                        {insight.insight_category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                    {insight.store_name && (
                      <p className="text-xs text-muted-foreground">Magasin: {insight.store_name}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAcknowledge(insight.id)}
                    disabled={acknowledgeMutation.isPending}
                  >
                    Marquer comme lu
                  </Button>
                </div>
                
                {insight.recommended_actions && insight.recommended_actions.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium">Actions recommandées:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {insight.recommended_actions.map((action: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span>•</span>
                          <span>{typeof action === 'string' ? action : action.action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span>Confiance: {(Number(insight.confidence_level) * 100).toFixed(0)}%</span>
                  <span>Impact: {(Number(insight.impact_score) * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
