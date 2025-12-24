import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, TrendingUp, TrendingDown, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useChartData } from '@/hooks/useDashboard';
import { TimeRange } from '@/hooks/useDashboardConfig';
import { Badge } from '@/components/ui/badge';

interface OrdersWidgetAdvancedProps {
  timeRange: TimeRange;
  settings: {
    showChart?: boolean;
    showTrend?: boolean;
    chartType?: 'line' | 'bar' | 'area' | 'pie';
  };
  lastRefresh: Date;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function OrdersWidgetAdvanced({ timeRange, settings, lastRefresh }: OrdersWidgetAdvancedProps) {
  const period = timeRange === 'today' || timeRange === 'week' ? 'week' : timeRange === 'year' ? 'year' : 'month';
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useChartData(period);

  const formattedChartData = chartData?.map(item => ({
    name: item.date.substring(0, 3),
    orders: item.orders,
  })) || [];

  const ordersChange = stats?.ordersChange || 0;
  const isPositive = ordersChange >= 0;

  // Mock status distribution - in real app, fetch from DB
  const statusData = [
    { name: 'En attente', value: 12, icon: Clock, color: 'text-yellow-500' },
    { name: 'Expédiées', value: 45, icon: CheckCircle, color: 'text-green-500' },
    { name: 'Annulées', value: 3, icon: XCircle, color: 'text-red-500' },
  ];

  if (statsLoading || chartLoading) {
    return (
      <CardContent className="flex items-center justify-center h-[250px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </CardContent>
    );
  }

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
            </div>
            <span>Commandes</span>
          </div>
          {settings.showTrend && (
            <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs">
              {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {isPositive ? '+' : ''}{ordersChange.toFixed(1)}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{stats?.ordersCount || 0}</span>
          <span className="text-sm text-muted-foreground">commandes</span>
        </div>

        {settings.showChart && formattedChartData.length > 0 && (
          <ResponsiveContainer width="100%" height={120}>
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
              />
              <Bar dataKey="orders" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          {statusData.map((status) => {
            const Icon = status.icon;
            return (
              <div key={status.name} className="text-center">
                <Icon className={`h-4 w-4 mx-auto ${status.color}`} />
                <p className="text-lg font-bold">{status.value}</p>
                <p className="text-[10px] text-muted-foreground">{status.name}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </>
  );
}
