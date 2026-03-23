import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAbandonedCarts } from '@/hooks/useAbandonedCarts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized';
import {
  ShoppingCart, TrendingUp, Headphones, DollarSign,
  ArrowUpRight, ArrowDownRight, Percent, Users
} from 'lucide-react';

export function MarketingSupportOverview() {
  const { stats: cartStats } = useAbandonedCarts();
  const { user } = useAuthOptimized();

  const { data: upsellStats } = useQuery({
    queryKey: ['upsell-stats', user?.id],
    queryFn: async () => {
      if (!user) return { total: 0, active: 0 };
      const { data } = await supabase
        .from('automation_workflows')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('action_type', 'upsell');
      const items = data || [];
      return { total: items.length, active: items.filter(w => w.is_active).length };
    },
    enabled: !!user?.id,
  });

  const { data: supportStats } = useQuery({
    queryKey: ['support-stats-overview', user?.id],
    queryFn: async () => {
      if (!user) return { openTickets: 0, resolved: 0, avgResponseTime: '—' };
      // Mock stats - would connect to real ticket system
      return { openTickets: 3, resolved: 47, avgResponseTime: '< 2min' };
    },
    enabled: !!user?.id,
  });

  const kpis = [
    {
      title: 'Paniers abandonnés',
      value: cartStats.total,
      subtitle: `${cartStats.recoveryRate}% récupérés`,
      icon: ShoppingCart,
      trend: cartStats.recoveryRate > 15 ? 'up' : 'down',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Valeur récupérable',
      value: `€${cartStats.totalValue.toLocaleString()}`,
      subtitle: `€${cartStats.recoveredValue.toLocaleString()} récupérés`,
      icon: DollarSign,
      trend: 'up',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Règles Upsell actives',
      value: upsellStats?.active || 0,
      subtitle: `${upsellStats?.total || 0} total configurées`,
      icon: TrendingUp,
      trend: 'up',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Taux de conversion',
      value: `${cartStats.recoveryRate}%`,
      subtitle: 'Paniers → Commandes',
      icon: Percent,
      trend: cartStats.recoveryRate > 10 ? 'up' : 'down',
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: 'Tickets support',
      value: supportStats?.openTickets || 0,
      subtitle: `${supportStats?.resolved || 0} résolus ce mois`,
      icon: Headphones,
      trend: 'up',
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      title: 'Temps réponse IA',
      value: supportStats?.avgResponseTime || '—',
      subtitle: 'Réponse automatique moyenne',
      icon: Users,
      trend: 'up',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <div className="flex items-center gap-1.5">
                    {kpi.trend === 'up' ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span className="text-xs text-muted-foreground">{kpi.subtitle}</span>
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg ${kpi.bgColor}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Automation Pipeline Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pipeline d'automatisation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-warning" />
                <span className="font-medium text-sm">Récupération paniers</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">En attente</span>
                  <Badge variant="outline">{cartStats.pending}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contactés</span>
                  <Badge variant="secondary">{cartStats.contacted}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Récupérés</span>
                  <Badge className="bg-success/20 text-success border-success/30">{cartStats.recovered}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Upsell / Cross-sell</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Règles actives</span>
                  <Badge variant="outline">{upsellStats?.active || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Déclenchées (7j)</span>
                  <Badge variant="secondary">—</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conversions</span>
                  <Badge className="bg-success/20 text-success border-success/30">—</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-violet-500" />
                <span className="font-medium text-sm">Support IA</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tickets ouverts</span>
                  <Badge variant="outline">{supportStats?.openTickets || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Résolus auto</span>
                  <Badge variant="secondary">{supportStats?.resolved || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temps réponse</span>
                  <Badge className="bg-info/20 text-info border-info/30">{supportStats?.avgResponseTime}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
