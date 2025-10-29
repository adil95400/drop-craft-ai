import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, UserPlus, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useDashboardStats } from '@/hooks/useDashboardStats';

interface CustomerWidgetProps {
  isCustomizing: boolean;
}

export function CustomerWidget({ isCustomizing }: CustomerWidgetProps) {
  const { data: stats, isLoading } = useDashboardStats();

  const totalCustomers = stats?.customersCount || 0;
  const customersChange = stats?.customersChange || 0;

  if (isLoading) {
    return (
      <Card className={isCustomizing ? 'ring-2 ring-primary/50' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className={isCustomizing ? 'ring-2 ring-primary/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Clients
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Clients</p>
            <p className="text-2xl font-bold">{totalCustomers}</p>
          </div>
          <Progress value={Math.min((totalCustomers / 2000) * 100, 100)} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className={`flex items-center gap-1 ${customersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <UserPlus className="h-3 w-3" />
              <p className="text-xs">Évolution</p>
            </div>
            <p className="text-xl font-bold">{customersChange >= 0 ? '+' : ''}{customersChange.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-blue-600">
              <TrendingUp className="h-3 w-3" />
              <p className="text-xs">Commandes</p>
            </div>
            <p className="text-xl font-bold">{stats?.ordersCount || 0}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Panier moyen</span>
            <span className="font-semibold text-green-600">
              {stats?.ordersCount && stats.ordersCount > 0
                ? (stats.monthlyRevenue / stats.ordersCount).toFixed(2)
                : 0}€
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
