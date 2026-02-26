import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, TrendingUp, Users, Eye, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useProductionData } from '@/hooks/useProductionData';
import { useMemo } from 'react';

interface TrafficWidgetProps {
  timeRange: string;
  settings?: {
    showChart?: boolean;
    showSources?: boolean;
  };
}

export function TrafficWidget({ settings }: TrafficWidgetProps) {
  const showChart = settings?.showChart ?? true;
  const showSources = settings?.showSources ?? true;
  const { customers, orders, isLoadingCustomers, isLoadingOrders } = useProductionData();

  const { trafficData, sourceData, totalVisitors, totalPageViews } = useMemo(() => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    // Group orders by day of week to get real activity patterns
    const ordersByDay = new Array(7).fill(0);
    (orders || []).forEach(order => {
      const day = new Date(order.created_at).getDay();
      // Convert Sunday=0 to Monday-based index
      const idx = day === 0 ? 6 : day - 1;
      ordersByDay[idx]++;
    });

    const totalOrders = ordersByDay.reduce((s, v) => s + v, 0);
    const baseVisitors = Math.max((customers?.length || 0) * 5, 100);
    
    const traffic = days.map((day, index) => {
      // Use real order distribution if available, otherwise uniform
      const orderWeight = totalOrders > 0
        ? (ordersByDay[index] / Math.max(totalOrders, 1))
        : (index >= 5 ? 0.18 : 0.13); // Default weekend boost
      const visitors = Math.round(baseVisitors * orderWeight * 7);
      return {
        date: day,
        visitors: Math.max(visitors, Math.round(baseVisitors * 0.05)),
        pageViews: Math.round(Math.max(visitors, Math.round(baseVisitors * 0.05)) * 2.8)
      };
    });

    const totalV = traffic.reduce((sum, d) => sum + d.visitors, 0);
    const totalP = traffic.reduce((sum, d) => sum + d.pageViews, 0);

    const sources = [
      { name: 'Organique', value: 45, color: 'hsl(var(--primary))' },
      { name: 'Direct', value: 25, color: 'hsl(var(--secondary))' },
      { name: 'Social', value: 20, color: 'hsl(142 76% 36%)' },
      { name: 'Referral', value: 10, color: 'hsl(38 92% 50%)' },
    ];

    return { trafficData: traffic, sourceData: sources, totalVisitors: totalV, totalPageViews: totalP };
  }, [customers, orders]);

  const isLoading = isLoadingCustomers || isLoadingOrders;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4 text-primary" />
          Trafic du site (estimé)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Users className="h-3 w-3" />Visiteurs
            </div>
            <p className="text-2xl font-bold">{totalVisitors.toLocaleString()}</p>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Basé sur vos clients
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Eye className="h-3 w-3" />Pages vues
            </div>
            <p className="text-2xl font-bold">{totalPageViews.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">~2.8 pages/visite</p>
          </div>
        </div>

        {showChart && (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="visitors" stroke="hsl(var(--primary))" fill="url(#trafficGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {showSources && (
          <div className="flex items-center gap-4">
            <div className="h-20 w-20">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} innerRadius={25} outerRadius={35} paddingAngle={2} dataKey="value">
                    {sourceData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1">
              {sourceData.map((source) => (
                <div key={source.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: source.color }} />
                    <span>{source.name}</span>
                  </div>
                  <span className="font-medium">{source.value}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
