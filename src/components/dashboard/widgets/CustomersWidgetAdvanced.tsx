import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, TrendingDown, Loader2, UserPlus, UserCheck } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { TimeRange } from '@/hooks/useDashboardConfig';
import { Badge } from '@/components/ui/badge';

interface CustomersWidgetAdvancedProps {
  timeRange: TimeRange;
  settings: {
    showChart?: boolean;
    showTrend?: boolean;
  };
  lastRefresh: Date;
}

export function CustomersWidgetAdvanced({ timeRange, settings, lastRefresh }: CustomersWidgetAdvancedProps) {
  const { data: stats, isLoading } = useDashboardStats();

  const customersChange = stats?.customersChange || 0;
  const isPositive = customersChange >= 0;

  // Mock trend data
  const trendData = [
    { name: 'Lun', value: 5 },
    { name: 'Mar', value: 8 },
    { name: 'Mer', value: 12 },
    { name: 'Jeu', value: 7 },
    { name: 'Ven', value: 15 },
    { name: 'Sam', value: 18 },
    { name: 'Dim', value: 10 },
  ];

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
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Users className="h-5 w-5 text-orange-500" />
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
            <LineChart data={trendData}>
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
            <UserPlus className="h-4 w-4 text-green-500" />
            <div>
              <p className="font-semibold">+24</p>
              <p className="text-xs text-muted-foreground">Nouveaux</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-blue-500" />
            <div>
              <p className="font-semibold">68%</p>
              <p className="text-xs text-muted-foreground">Fidèles</p>
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
}
