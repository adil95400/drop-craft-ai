import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, TrendingDown, Loader2, UserPlus, UserCheck } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { TimeRange } from '@/hooks/useDashboardConfig';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CustomersWidgetAdvancedProps {
  timeRange: TimeRange;
  settings: {
    showChart?: boolean;
    showTrend?: boolean;
  };
  lastRefresh: Date;
}

export function CustomersWidgetAdvanced({ timeRange, settings, lastRefresh }: CustomersWidgetAdvancedProps) {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  // Fetch real customer trend data from DB
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['customers-trend', lastRefresh.getTime()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      const result: { name: string; value: number }[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const start = new Date(d); start.setHours(0, 0, 0, 0);
        const end = new Date(d); end.setHours(23, 59, 59, 999);

        const { count } = await supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());

        result.push({ name: dayNames[d.getDay()], value: count || 0 });
      }
      return result;
    }
  });

  // Real new customers (last 7 days)
  const { data: newCustomersCount } = useQuery({
    queryKey: ['new-customers-7d', lastRefresh.getTime()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const { count } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', since.toISOString());
      return count || 0;
    }
  });

  const isLoading = statsLoading || trendLoading;
  const customersChange = stats?.customersChange || 0;
  const isPositive = customersChange >= 0;

  if (isLoading) {
    return (
      <CardContent className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </CardContent>
    );
  }

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-warning/10">
              <Users className="h-5 w-5 text-warning" />
            </div>
            <span>Clients</span>
          </div>
          {settings.showTrend && (
            <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs">
              {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {isPositive ? '+' : ''}{customersChange.toFixed(1)}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{stats?.customersCount || 0}</span>
          <span className="text-sm text-muted-foreground">clients</span>
        </div>

        {settings.showChart && (
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={trendData || []}>
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
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-success" />
            <div>
              <p className="font-semibold">+{newCustomersCount || 0}</p>
              <p className="text-xs text-muted-foreground">Nouveaux (7j)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-info" />
            <div>
              <p className="font-semibold">{stats?.customersCount || 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
}
