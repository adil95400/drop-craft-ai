/**
 * Widget Clients style Channable
 * Design moderne avec métriques de fidélité
 */

import { motion } from 'framer-motion';
import { Users, TrendingUp, TrendingDown, Loader2, UserPlus, UserCheck, Heart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { TimeRange } from '@/hooks/useDashboardConfig';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CustomersWidgetChannableProps {
  timeRange: TimeRange;
  settings: {
    showChart?: boolean;
    showTrend?: boolean;
  };
  lastRefresh: Date;
}

export function CustomersWidgetChannable({ timeRange, settings, lastRefresh }: CustomersWidgetChannableProps) {
  const { data: stats, isLoading } = useDashboardStats();

  const customersChange = stats?.customersChange || 0;
  const isPositive = customersChange >= 0;

  // Mock trend data with more realistic values
  const trendData = [
    { name: 'Lun', value: 5, new: 2 },
    { name: 'Mar', value: 8, new: 4 },
    { name: 'Mer', value: 12, new: 6 },
    { name: 'Jeu', value: 7, new: 3 },
    { name: 'Ven', value: 15, new: 8 },
    { name: 'Sam', value: 18, new: 10 },
    { name: 'Dim', value: 10, new: 5 },
  ];

  // Customer metrics
  const customerMetrics = [
    { 
      label: 'Nouveaux', 
      value: '+24', 
      icon: UserPlus, 
      color: 'text-success',
      bg: 'bg-success/10'
    },
    { 
      label: 'Fidèles', 
      value: '68%', 
      icon: Heart, 
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    { 
      label: 'Actifs', 
      value: '89%', 
      icon: UserCheck, 
      color: 'text-info',
      bg: 'bg-info/10'
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
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
              className="p-2.5 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/20"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Users className="h-5 w-5 text-warning" />
            </motion.div>
            <div>
              <h3 className="font-semibold">Clients</h3>
              <p className="text-xs text-muted-foreground">Base client active</p>
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
                {isPositive ? '+' : ''}{customersChange.toFixed(1)}%
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
          <span className="text-3xl font-bold">{stats?.customersCount || 0}</span>
          <span className="text-sm text-muted-foreground">clients</span>
        </motion.div>

        {/* Chart */}
        {settings.showChart && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--warning))" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--warning))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="new" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Metrics Grid */}
        <motion.div 
          className="grid grid-cols-3 gap-2 pt-3 border-t"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {customerMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div 
                key={metric.label} 
                className={cn("p-2 rounded-lg text-center", metric.bg)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
              >
                <Icon className={cn("h-4 w-4 mx-auto mb-1", metric.color)} />
                <p className="text-lg font-bold">{metric.value}</p>
                <p className="text-[10px] text-muted-foreground truncate">{metric.label}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
