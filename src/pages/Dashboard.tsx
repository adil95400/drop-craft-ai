import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { FeatureStatusDashboard } from '@/components/dashboard/FeatureStatusDashboard';
import { RealTimeAnalytics } from '@/components/dashboard/RealTimeAnalytics';
import { RealTimeKPIs } from '@/components/dashboard/RealTimeKPIs';
import { SmartAlerts } from '@/components/dashboard/SmartAlerts';
import { PerformanceTestRunner } from '@/components/monitoring/PerformanceTestRunner';
import { EnrichmentDashboardWidget } from '@/components/enrichment';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { TrendingUp, TrendingDown, Package, ShoppingCart, Users, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Tableau de bord</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Vue d'ensemble de votre activité</p>
      </div>

      {/* Smart Alerts - Prominent at top */}
      <SmartAlerts />

      {/* Real-Time KPIs */}
      <RealTimeKPIs />

      {/* Static Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const isPositive = metric.trend >= 0;
          
          const getMetricLink = (title: string) => {
            switch(title) {
              case 'Revenus totaux': return '/analytics';
              case 'Commandes': return '/dashboard/orders';
              case 'Produits': return '/products';
              case 'Clients': return '/dashboard/customers';
              default: return '#';
            }
          };
          
          return (
            <Card 
              key={metric.title} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
              onClick={() => window.location.href = getMetricLink(metric.title)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
                <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium truncate pr-2">{metric.title}</CardTitle>
                <Icon className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${metric.color}`} />
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="text-base sm:text-lg lg:text-2xl font-bold truncate">
                  {metric.format ? metric.format(metric.value) : metric.value}
                </div>
                <p className="text-[9px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {isPositive ? (
                    <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600 flex-shrink-0" />
                  )}
                  <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(metric.trend)}%
                  </span>
                  <span className="hidden sm:inline">vs. mois dernier</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Widget d'enrichissement produits */}
      <EnrichmentDashboardWidget />

      {/* Tabbed Analytics Section */}
      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList>
          <TabsTrigger value="realtime">Temps réel</TabsTrigger>
          <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="realtime">
          <RealTimeAnalytics />
        </TabsContent>
        
        <TabsContent value="features">
          <FeatureStatusDashboard />
        </TabsContent>
        
        <TabsContent value="performance">
          <PerformanceTestRunner />
        </TabsContent>
      </Tabs>
    </div>
  );
}