import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealAdsManager } from '@/hooks/useRealAdsManager';
import { TrendingUp, TrendingDown, DollarSign, MousePointerClick, Eye, Target, Lightbulb } from 'lucide-react';

export function PerformanceDashboard() {
  const { campaigns, metrics, platformPerformance } = useRealAdsManager();

  if (!metrics) return null;

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
          Performance par Plateforme
        </h3>

        {platformPerformance.length > 0 && (
          <div className="space-y-4">
            {platformPerformance.map((platform, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium capitalize">{platform.platform}</h4>
                  <Badge variant="outline">{platform.campaigns} campagnes</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Dépensé</p>
                    <p className="font-medium">{formatCurrency(platform.spent)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-medium">{formatCurrency(platform.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ROAS</p>
                    <p className="font-medium">{platform.roas.toFixed(2)}x</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};
