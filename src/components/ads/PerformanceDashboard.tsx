import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdsManagerNew } from '@/hooks/useAdsManagerNew';
import { TrendingUp, TrendingDown, DollarSign, MousePointerClick, Eye, Target, Lightbulb } from 'lucide-react';

export function PerformanceDashboard() {
  const { campaigns, suggestions, isLoadingSuggestions, applySuggestion } = useAdsManagerNew();

  const totalStats = campaigns?.reduce((acc: any, campaign: any) => ({
    spent: acc.spent + (campaign.spent_amount || 0),
    impressions: acc.impressions + (campaign.performance_metrics?.impressions || 0),
    clicks: acc.clicks + (campaign.performance_metrics?.clicks || 0),
    conversions: acc.conversions + (campaign.performance_metrics?.conversions || 0),
  }), { spent: 0, impressions: 0, clicks: 0, conversions: 0 }) || { spent: 0, impressions: 0, clicks: 0, conversions: 0 };

  const avgCTR = totalStats.impressions > 0 
    ? ((totalStats.clicks / totalStats.impressions) * 100).toFixed(2) 
    : '0.00';

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">Critique</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">Haute</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Moyenne</Badge>;
      default:
        return <Badge variant="secondary">Basse</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Performance Globale</h2>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de toutes vos campagnes
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Dépenses Totales</p>
              <p className="text-2xl font-bold">{totalStats.spent.toFixed(2)}€</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Impressions</p>
              <p className="text-2xl font-bold">{totalStats.impressions.toLocaleString()}</p>
            </div>
            <Eye className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Clics</p>
              <p className="text-2xl font-bold">{totalStats.clicks.toLocaleString()}</p>
            </div>
            <MousePointerClick className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">CTR Moyen</p>
              <p className="text-2xl font-bold">{avgCTR}%</p>
            </div>
            <Target className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Lightbulb className="h-6 w-6 text-yellow-500" />
          Suggestions d'Optimisation IA
        </h3>

        {isLoadingSuggestions ? (
          <p className="text-center py-8 text-muted-foreground">Chargement des suggestions...</p>
        ) : (!suggestions || suggestions.length === 0) ? (
          <p className="text-center py-8 text-muted-foreground">
            Aucune suggestion pour le moment. L'IA analyse vos campagnes en continu.
          </p>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion: any) => (
              <div key={suggestion.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{suggestion.title}</h4>
                      {getPriorityBadge(suggestion.priority)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {suggestion.description}
                    </p>
                    
                    {suggestion.expected_impact && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-muted-foreground">Impact estimé:</span>
                          <span className="font-semibold text-green-600">
                            +{suggestion.expected_impact.improvement}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {!suggestion.is_applied && (
                    <Badge 
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => applySuggestion(suggestion.id)}
                    >
                      Appliquer
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
