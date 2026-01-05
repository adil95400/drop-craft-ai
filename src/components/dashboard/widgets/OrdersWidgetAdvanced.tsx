import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, TrendingUp, TrendingDown, Loader2, Clock, XCircle, Truck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useChartData } from '@/hooks/useDashboard';
import { TimeRange } from '@/hooks/useDashboardConfig';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OrdersWidgetAdvancedProps {
  timeRange: TimeRange;
  settings: {
    showChart?: boolean;
    showTrend?: boolean;
    chartType?: 'line' | 'bar' | 'area' | 'pie';
  };
  lastRefresh: Date;
}

export function OrdersWidgetAdvanced({ timeRange, settings, lastRefresh }: OrdersWidgetAdvancedProps) {
  const { user } = useAuth();
  const period = timeRange === 'today' || timeRange === 'week' ? 'week' : timeRange === 'year' ? 'year' : 'month';
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useChartData(period);

  // Fetch real order status distribution
  const { data: statusDistribution, isLoading: statusLoading } = useQuery({
    queryKey: ['order-status-distribution', user?.id],
    queryFn: async () => {
      if (!user?.id) return { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('status')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const counts = {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      };
      
      orders?.forEach(order => {
        const status = order.status as keyof typeof counts;
        if (status in counts) {
          counts[status]++;
        }
      });
      
      return counts;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000
  });

  const formattedChartData = chartData?.map(item => ({
    name: item.date.substring(0, 3),
    orders: item.orders,
  })) || [];

  const ordersChange = stats?.ordersChange || 0;
  const isPositive = ordersChange >= 0;

  // Real status distribution from database
  const statusData = [
    { name: 'En attente', value: (statusDistribution?.pending || 0) + (statusDistribution?.processing || 0), icon: Clock, color: 'text-yellow-500' },
    { name: 'Expédiées', value: (statusDistribution?.shipped || 0) + (statusDistribution?.delivered || 0), icon: Truck, color: 'text-green-500' },
    { name: 'Annulées', value: statusDistribution?.cancelled || 0, icon: XCircle, color: 'text-red-500' },
  ];

  if (statsLoading || chartLoading || statusLoading) {
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
