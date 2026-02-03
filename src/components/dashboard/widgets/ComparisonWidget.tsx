import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useProductionData } from '@/hooks/useProductionData';
import { useMemo } from 'react';

interface ComparisonWidgetProps {
  timeRange: string;
  settings?: {
    showChart?: boolean;
    comparisonType?: 'period' | 'year';
  };
}

export function ComparisonWidget({ settings }: ComparisonWidgetProps) {
  const showChart = settings?.showChart ?? true;
  const comparisonType = settings?.comparisonType ?? 'period';
  const { orders, customers, isLoadingOrders, isLoadingCustomers } = useProductionData();

  const { comparisonData, chartData } = useMemo(() => {
    const now = new Date();
    const currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(1);
    currentPeriodStart.setHours(0, 0, 0, 0);

    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
    
    const previousPeriodEnd = new Date(currentPeriodStart);
    previousPeriodEnd.setDate(0);

    // Current period data
    const currentOrders = (orders || []).filter(o => 
      new Date(o.created_at || '') >= currentPeriodStart
    );
    const previousOrders = (orders || []).filter(o => {
      const date = new Date(o.created_at || '');
      return date >= previousPeriodStart && date <= previousPeriodEnd;
    });

    const currentCustomers = (customers || []).filter(c => 
      new Date(c.created_at || '') >= currentPeriodStart
    );
    const previousCustomers = (customers || []).filter(c => {
      const date = new Date(c.created_at || '');
      return date >= previousPeriodStart && date <= previousPeriodEnd;
    });

    const currentRevenue = currentOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const previousRevenue = previousOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const currentAvg = currentOrders.length > 0 ? currentRevenue / currentOrders.length : 0;
    const previousAvg = previousOrders.length > 0 ? previousRevenue / previousOrders.length : 0;

    // Chart data by week
    const weeklyData: Record<string, { current: number; previous: number }> = {};
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
    
    (orders || []).forEach(order => {
      const date = new Date(order.created_at || '');
      const monthIndex = date.getMonth();
      const monthName = months[monthIndex] || 'Autre';
      const year = date.getFullYear();
      const currentYear = now.getFullYear();
      
      if (!weeklyData[monthName]) {
        weeklyData[monthName] = { current: 0, previous: 0 };
      }
      
      if (year === currentYear) {
        weeklyData[monthName].current += Number(order.total_amount || 0);
      } else if (year === currentYear - 1) {
        weeklyData[monthName].previous += Number(order.total_amount || 0);
      }
    });

    return {
      comparisonData: [
        { metric: 'Ventes', current: currentRevenue, previous: previousRevenue },
        { metric: 'Commandes', current: currentOrders.length, previous: previousOrders.length },
        { metric: 'Clients', current: currentCustomers.length, previous: previousCustomers.length },
        { metric: 'Panier moyen', current: Math.round(currentAvg), previous: Math.round(previousAvg) },
      ],
      chartData: Object.entries(weeklyData).slice(0, 6).map(([month, data]) => ({
        month,
        current: Math.round(data.current),
        previous: Math.round(data.previous)
      }))
    };
  }, [orders, customers]);

  const periodLabel = comparisonType === 'year' ? 'vs année précédente' : 'vs mois précédent';
  const isLoading = isLoadingOrders || isLoadingCustomers;

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
          <ArrowLeftRight className="h-4 w-4 text-indigo-500" />
          Comparaison {periodLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {comparisonData.map((item) => {
            const change = item.previous > 0 
              ? ((item.current - item.previous) / item.previous) * 100 
              : item.current > 0 ? 100 : 0;
            const isPositive = change > 0;
            const isNeutral = Math.abs(change) < 1;
            
            return (
              <div key={item.metric} className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{item.metric}</p>
                <div className="flex items-end justify-between">
                  <p className="text-lg font-bold">
                    {item.metric === 'Ventes' || item.metric === 'Panier moyen' 
                      ? `${item.current.toLocaleString('fr-FR')}€`
                      : item.current.toLocaleString('fr-FR')
                    }
                  </p>
                  <div className={`flex items-center gap-1 text-xs ${
                    isNeutral ? 'text-muted-foreground' : isPositive ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {isNeutral ? (
                      <Minus className="h-3 w-3" />
                    ) : isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(change).toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showChart && chartData.length > 0 && (
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value.toLocaleString('fr-FR')}€`]}
                />
                <Legend 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px' }}
                  formatter={(value: string) => <span>{value === 'current' ? 'Actuel' : 'Précédent'}</span>}
                />
                <Bar dataKey="previous" fill="hsl(var(--muted-foreground))" opacity={0.5} radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
