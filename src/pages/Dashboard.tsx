import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { TrendingUp, TrendingDown, Package, ShoppingCart, Users, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  const metrics = [
    {
      title: 'Revenus totaux',
      value: stats?.monthlyRevenue || 0,
      format: (v: number) => `${v.toLocaleString('fr-FR')} €`,
      trend: stats?.revenueChange || 0,
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Commandes',
      value: stats?.ordersCount || 0,
      trend: stats?.ordersChange || 0,
      icon: ShoppingCart,
      color: 'text-blue-600'
    },
    {
      title: 'Produits',
      value: stats?.productsCount || 0,
      trend: stats?.productsChange || 0,
      icon: Package,
      color: 'text-purple-600'
    },
    {
      title: 'Clients',
      value: stats?.customersCount || 0,
      trend: stats?.customersChange || 0,
      icon: Users,
      color: 'text-orange-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble de votre activité</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const isPositive = metric.trend >= 0;
          
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metric.format ? metric.format(metric.value) : metric.value}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(metric.trend)}%
                  </span>
                  vs. mois dernier
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>Les dernières actions sur votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Aucune activité récente
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
