import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCustomerBehavior } from '@/hooks/useCustomerBehavior';
import { Trash2, TrendingUp, AlertCircle } from 'lucide-react';
import { CustomerBehaviorData } from '@/services/CustomerBehaviorAnalytics';

interface CustomerAnalysisCardProps {
  analysis: CustomerBehaviorData;
}

export function CustomerAnalysisCard({ analysis }: CustomerAnalysisCardProps) {
  const { deleteAnalysis, getSegmentColor, formatLifetimeValue, getBehaviorIcon } = useCustomerBehavior();

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg">
              {analysis.customer_name || analysis.customer_email}
            </h3>
            <Badge className={getSegmentColor(analysis.customer_segment)}>
              {analysis.customer_segment.toUpperCase()}
            </Badge>
            <span className="text-2xl">{getBehaviorIcon(analysis.engagement_level)}</span>
          </div>
          <p className="text-sm text-muted-foreground">{analysis.customer_email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Analysé le {new Date(analysis.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => deleteAnalysis(analysis.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Score Comportemental</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{analysis.behavioral_score}</p>
            <Progress value={analysis.behavioral_score} className="flex-1 h-2" />
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Valeur Vie</p>
          <p className="text-2xl font-bold">{formatLifetimeValue(analysis.lifetime_value)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Risque Churn</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{analysis.churn_probability}%</p>
            {(analysis.churn_probability || 0) >= 50 && (
              <AlertCircle className="h-5 w-5 text-orange-500" />
            )}
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Prochain Achat</p>
          <p className="text-2xl font-bold">
            {analysis.predicted_next_purchase_days 
              ? `${analysis.predicted_next_purchase_days}j`
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-muted rounded-lg">
        <div>
          <p className="text-sm text-muted-foreground">Commandes</p>
          <p className="text-xl font-semibold">{analysis.total_orders}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Dépensé</p>
          <p className="text-xl font-semibold">{analysis.total_spent}€</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Panier Moyen</p>
          <p className="text-xl font-semibold">
            {analysis.avg_order_value ? `${analysis.avg_order_value.toFixed(2)}€` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Insights */}
      {analysis.key_insights && Array.isArray(analysis.key_insights) && analysis.key_insights.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Insights Clés
          </h4>
          <ul className="space-y-1">
            {analysis.key_insights.map((insight: string, index: number) => (
              <li key={index} className="text-sm text-muted-foreground">
                • {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Actions */}
      {analysis.recommended_actions && Array.isArray(analysis.recommended_actions) && analysis.recommended_actions.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Actions Recommandées</h4>
          <ul className="space-y-1">
            {analysis.recommended_actions.map((action: string, index: number) => (
              <li key={index} className="text-sm text-muted-foreground">
                ✓ {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}