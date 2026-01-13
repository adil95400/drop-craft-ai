/**
 * Widget Revenus style Channable
 * Design moderne avec gradient et animations
 */

import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Loader2, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useChartData } from '@/hooks/useDashboard';
import { TimeRange } from '@/hooks/useDashboardConfig';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RevenueWidgetChannableProps {
  timeRange: TimeRange;
  settings: {
    showChart?: boolean;
    showTrend?: boolean;
    chartType?: 'line' | 'bar' | 'area' | 'pie';
  };
  lastRefresh: Date;
}

export function RevenueWidgetChannable({ timeRange, settings, lastRefresh }: RevenueWidgetChannableProps) {
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
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header avec gradient */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2.5 rounded-xl bg-gradient-to-br from-success/20 to-success/5 border border-success/20"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <DollarSign className="h-5 w-5 text-success" />
            </motion.div>
            <div>
              <h3 className="font-semibold">Revenus</h3>
              <p className="text-xs text-muted-foreground">Ce mois</p>
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
                {isPositive ? '+' : ''}{revenueChange.toFixed(1)}%
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
          <span className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {(stats?.monthlyRevenue || 0).toLocaleString('fr-FR')}€
          </span>
          {isPositive && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center text-success text-sm"
            >
              <ArrowUpRight className="h-4 w-4" />
            </motion.span>
          )}
        </motion.div>

        {/* Chart */}
        {settings.showChart && formattedChartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ResponsiveContainer width="100%" height={120}>
              {settings.chartType === 'bar' ? (
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
                    formatter={(value: number) => [`${value.toLocaleString('fr-FR')}€`, 'Revenus']}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={formattedChartData}>
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
                    formatter={(value: number) => [`${value.toLocaleString('fr-FR')}€`, 'Revenus']}
                  />
                  <defs>
                    <linearGradient id="colorRevenueChannable" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--success))" 
                    fill="url(#colorRevenueChannable)"
                    strokeWidth={2}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-2 gap-3 pt-3 border-t"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-2 rounded-lg bg-muted/50">
            <span className="text-xs text-muted-foreground block">Panier moyen</span>
            <p className="font-semibold text-sm">{avgBasket.toFixed(2)}€</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <span className="text-xs text-muted-foreground block">Commandes</span>
            <p className="font-semibold text-sm">{stats?.ordersCount || 0}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
