import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCustomerBehavior } from '@/hooks/useCustomerBehavior';
import { Users, Crown, Heart, AlertTriangle, Sparkles, UserX } from 'lucide-react';

export function SegmentationView() {
  const { analyses, getSegmentColor } = useCustomerBehavior();

  const segmentStats = analyses.reduce((acc, analysis) => {
    const segment = analysis.customer_segment;
    if (!acc[segment]) {
      acc[segment] = { count: 0, totalValue: 0 };
    }
    acc[segment].count++;
    acc[segment].totalValue += analysis.lifetime_value || 0;
    return acc;
  }, {} as Record<string, { count: number; totalValue: number }>);

  const segmentConfig = {
    vip: { icon: Crown, label: 'VIP', description: 'Clients à très haute valeur' },
    champion: { icon: Sparkles, label: 'Champions', description: 'Meilleurs clients actifs' },
    loyal: { icon: Heart, label: 'Fidèles', description: 'Clients réguliers engagés' },
    new: { icon: Users, label: 'Nouveaux', description: 'Récemment acquis' },
    at_risk: { icon: AlertTriangle, label: 'À Risque', description: 'Risque de désengagement' },
    dormant: { icon: UserX, label: 'Dormants', description: 'Inactifs depuis longtemps' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Segmentation Clients</h2>
        <Badge variant="outline">{analyses.length} clients analysés</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(segmentConfig).map(([key, config]) => {
          const stats = segmentStats[key] || { count: 0, totalValue: 0 };
          const Icon = config.icon;
          const avgValue = stats.count > 0 ? stats.totalValue / stats.count : 0;

          return (
            <Card key={key} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getSegmentColor(key)}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{config.label}</h3>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Clients</span>
                  <span className="text-2xl font-bold">{stats.count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valeur Moyenne</span>
                  <span className="text-lg font-semibold">
                    {avgValue > 0 ? `${Math.round(avgValue)}€` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valeur Totale</span>
                  <span className="text-lg font-semibold">
                    {stats.totalValue > 0 ? `${Math.round(stats.totalValue)}€` : 'N/A'}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Customer List by Segment */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Clients par Segment</h3>
        {Object.entries(segmentConfig).map(([key, config]) => {
          const customers = analyses.filter(a => a.customer_segment === key);
          if (customers.length === 0) return null;

          return (
            <Card key={key} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getSegmentColor(key)}>
                  {config.label} ({customers.length})
                </Badge>
              </div>
              <div className="grid gap-2">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {customer.customer_name || customer.customer_email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Score: {customer.behavioral_score} • 
                        LTV: {customer.lifetime_value ? `${Math.round(customer.lifetime_value)}€` : 'N/A'}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {customer.engagement_level}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}