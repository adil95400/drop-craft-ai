import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useChartData } from '@/hooks/useDashboard';
import { TimeRange, getDateRange } from '@/hooks/useDashboardConfig';
import { Badge } from '@/components/ui/badge';

interface RevenueWidgetAdvancedProps {
  timeRange: TimeRange;
  settings: {
    showChart?: boolean;
    showTrend?: boolean;
    chartType?: 'line' | 'bar' | 'area' | 'pie';
  };
  lastRefresh: Date;
}

export function RevenueWidgetAdvanced({ timeRange, settings, lastRefresh }: RevenueWidgetAdvancedProps) {
  const period = timeRange === 'today' || timeRange === 'week' ? 'week' : timeRange === 'year' ? 'year' : 'month';
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useChartData(period);

  const formattedChartData = chartData?.map(item => ({
    name: item.date.substring(0, 3),
    revenue: item.revenue,
    orders: item.orders,
  })) || [];

  const revenueChange = stats?.revenueChange || 0;
  const isPositive = revenueChange >= 0;
  const avgBasket = stats?.ordersCount && stats.ordersCount > 0
    ? stats.monthlyRevenue / stats.ordersCount
    : 0;

  if (statsLoading || chartLoading) {
    return (
      <CardContent className="flex items-center justify-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </CardContent>
    );
  }

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <span>Revenus</span>
          </div>
          {settings.showTrend && (
            <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs">
              {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {isPositive ? '+' : ''}{revenueChange.toFixed(1)}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{(stats?.monthlyRevenue || 0).toLocaleString('fr-FR')}€</span>
          <span className="text-sm text-muted-foreground">ce mois</span>
        </div>

        {settings.showChart && formattedChartData.length > 0 && (
          <ResponsiveContainer width="100%" height={150}>
            {settings.chartType === 'bar' ? (
              <BarChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value.toLocaleString('fr-FR')}€`, 'Revenus']}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value.toLocaleString('fr-FR')}€`, 'Revenus']}
                />
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
          <div>
            <span className="text-muted-foreground">Panier moyen</span>
            <p className="font-semibold">{avgBasket.toFixed(2)}€</p>
          </div>
          <div>
            <span className="text-muted-foreground">Commandes</span>
            <p className="font-semibold">{stats?.ordersCount || 0}</p>
          </div>
        </div>
      </CardContent>
    </>
  );
}
