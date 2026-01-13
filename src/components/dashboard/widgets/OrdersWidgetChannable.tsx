/**
 * Widget Commandes style Channable
 * Design moderne avec statuts visuels
 */

import { motion } from 'framer-motion';
import { ShoppingCart, TrendingUp, TrendingDown, Loader2, Clock, XCircle, Truck, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useChartData } from '@/hooks/useDashboard';
import { TimeRange } from '@/hooks/useDashboardConfig';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface OrdersWidgetChannableProps {
  timeRange: TimeRange;
  settings: {
    showChart?: boolean;
    showTrend?: boolean;
    chartType?: 'line' | 'bar' | 'area' | 'pie';
  };
  lastRefresh: Date;
}

export function OrdersWidgetChannable({ timeRange, settings, lastRefresh }: OrdersWidgetChannableProps) {
  const { user } = useAuth();
  const period = timeRange === 'today' || timeRange === 'week' ? 'week' : timeRange === 'year' ? 'year' : 'month';
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useChartData(period);

  // Fetch real order status distribution
  const { data: statusDistribution, isLoading: statusLoading } = useQuery({
    queryKey: ['order-status-distribution-channable', user?.id],
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

  // Status data with Channable styling
  const statusData = [
    { 
      name: 'En attente', 
      value: (statusDistribution?.pending || 0) + (statusDistribution?.processing || 0), 
      icon: Clock, 
      color: 'text-warning',
      bg: 'bg-warning/10'
    },
    { 
      name: 'Expédiées', 
      value: (statusDistribution?.shipped || 0) + (statusDistribution?.delivered || 0), 
      icon: Truck, 
      color: 'text-success',
      bg: 'bg-success/10'
    },
    { 
      name: 'Annulées', 
      value: statusDistribution?.cancelled || 0, 
      icon: XCircle, 
      color: 'text-destructive',
      bg: 'bg-destructive/10'
    },
  ];

  if (statsLoading || chartLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center h-[250px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2.5 rounded-xl bg-gradient-to-br from-info/20 to-info/5 border border-info/20"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <ShoppingCart className="h-5 w-5 text-info" />
            </motion.div>
            <div>
              <h3 className="font-semibold">Commandes</h3>
              <p className="text-xs text-muted-foreground">Aujourd'hui</p>
            </div>
          </div>
          {settings.showTrend && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Badge 
                variant="outline"
                className={cn(
                  "text-xs font-medium",
                  isPositive 
                    ? "bg-success/10 text-success border-success/30" 
                    : "bg-destructive/10 text-destructive border-destructive/30"
                )}
              >
                {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {isPositive ? '+' : ''}{ordersChange.toFixed(1)}%
              </Badge>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4">
        {/* Main Value */}
        <motion.div 
          className="flex items-baseline gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-3xl font-bold">{stats?.ordersCount || 0}</span>
          <span className="text-sm text-muted-foreground">commandes</span>
        </motion.div>

        {/* Chart */}
        {settings.showChart && formattedChartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="orders" fill="hsl(var(--info))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Status Grid */}
        <motion.div 
          className="grid grid-cols-3 gap-2 pt-3 border-t"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {statusData.map((status, index) => {
            const Icon = status.icon;
            return (
              <motion.div 
                key={status.name} 
                className={cn("p-2 rounded-lg text-center", status.bg)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
              >
                <Icon className={cn("h-4 w-4 mx-auto mb-1", status.color)} />
                <p className="text-lg font-bold">{status.value}</p>
                <p className="text-[10px] text-muted-foreground truncate">{status.name}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
