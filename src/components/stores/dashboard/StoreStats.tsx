import { Card } from '@/components/ui/card';
import { Store, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { StoreStats as StoreStatsType } from '@/hooks/useUnifiedStores';

interface StoreStatsProps {
  stats: StoreStatsType[];
  isLoading?: boolean;
}

export function StoreStats({ stats, isLoading }: StoreStatsProps) {
  const totalStores = stats.length;
  const activeStores = stats.filter(s => s.is_active).length;
  const totalIntegrations = stats.reduce((sum, s) => sum + s.total_integrations, 0);
  const activeIntegrations = stats.reduce((sum, s) => sum + s.active_integrations, 0);

  const statsData = [
    {
      label: 'Boutiques Totales',
      value: totalStores,
      icon: Store,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      label: 'Boutiques Actives',
      value: activeStores,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Intégrations Totales',
      value: totalIntegrations,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Intégrations Actives',
      value: activeIntegrations,
      icon: ShoppingCart,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
