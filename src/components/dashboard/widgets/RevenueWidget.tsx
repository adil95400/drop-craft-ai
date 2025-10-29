import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useChartData } from '@/hooks/useDashboard';

interface RevenueWidgetProps {
  isCustomizing: boolean;
}

export function RevenueWidget({ isCustomizing }: RevenueWidgetProps) {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useChartData('month');

  const formattedChartData = chartData?.slice(-6).map(item => ({
    name: item.date.substring(0, 3),
    value: item.revenue
  })) || [];

  const revenueChange = stats?.revenueChange || 0;
  const isPositive = revenueChange >= 0;
  const avgBasket = stats?.ordersCount && stats.ordersCount > 0
    ? stats.monthlyRevenue / stats.ordersCount
    : 0;

  if (statsLoading || chartLoading) {
    return (
      <Card className={isCustomizing ? 'ring-2 ring-primary/50' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Revenus
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
          <DollarSign className="h-5 w-5 text-primary" />
          Revenus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">{(stats?.monthlyRevenue || 0).toFixed(0)}€</p>
            <p className="text-sm text-muted-foreground">Ce mois</p>
          </div>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="text-sm font-semibold">{isPositive ? '+' : ''}{revenueChange.toFixed(1)}%</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={formattedChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="pt-2 border-t text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Panier moyen</span>
            <span className="font-semibold">{avgBasket.toFixed(2)}€</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
