import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useChartData } from '@/hooks/useDashboard';

interface SalesWidgetProps {
  isCustomizing: boolean;
}

export function SalesWidget({ isCustomizing }: SalesWidgetProps) {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useChartData('week');

  const formattedChartData = chartData?.map(item => ({
    name: item.date.substring(0, 3),
    value: item.revenue
  })) || [];

  const revenueChange = stats?.revenueChange || 0;
  const isPositive = revenueChange >= 0;

  if (statsLoading || chartLoading) {
    return (
      <Card className={isCustomizing ? 'ring-2 ring-primary/50' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ventes
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
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ventes
          </div>
          <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {isPositive ? '+' : ''}{revenueChange.toFixed(1)}%
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-3xl font-bold">{(stats?.monthlyRevenue || 0).toFixed(0)}€</p>
          <p className="text-sm text-muted-foreground">Ce mois</p>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={formattedChartData}>
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
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
