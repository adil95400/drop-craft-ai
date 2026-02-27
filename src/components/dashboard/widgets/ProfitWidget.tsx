import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useProductionData } from '@/hooks/useProductionData';
import { useMemo } from 'react';

interface ProfitWidgetProps {
  timeRange: string;
  settings?: {
    showChart?: boolean;
    showBreakdown?: boolean;
  };
}

export function ProfitWidget({ settings }: ProfitWidgetProps) {
  const showChart = settings?.showChart ?? true;
  const showBreakdown = settings?.showBreakdown ?? true;
  const { orders, isLoadingOrders, products } = useProductionData();

  const profitData = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    // Group orders by month
    const monthlyData: Record<string, { revenue: number; costs: number }> = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at || '');
      const monthKey = date.toLocaleDateString('fr-FR', { month: 'short' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, costs: 0 };
      }
      
      const revenue = Number(order.total_amount || 0);
      // Estimate costs as 60% of revenue (you can adjust based on your business model)
      const costs = revenue * 0.6;
      
      monthlyData[monthKey].revenue += revenue;
      monthlyData[monthKey].costs += costs;
    });

    return Object.entries(monthlyData).slice(-6).map(([month, data]) => ({
      month,
      revenue: Math.round(data.revenue),
      costs: Math.round(data.costs),
      profit: Math.round(data.revenue - data.costs)
    }));
  }, [orders]);

  const totalRevenue = profitData.reduce((sum, d) => sum + d.revenue, 0);
  const totalCosts = profitData.reduce((sum, d) => sum + d.costs, 0);
  const totalProfit = profitData.reduce((sum, d) => sum + d.profit, 0);
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  if (isLoadingOrders) {
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
          <Wallet className="h-4 w-4 text-success" />
          Marges & Profits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-success">
              {totalProfit.toLocaleString('fr-FR')} €
            </p>
            <p className="text-xs text-muted-foreground">Profit net</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-success">
              <TrendingUp className="h-4 w-4" />
              <span className="text-lg font-semibold">{profitMargin}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Marge</p>
          </div>
        </div>

        {showBreakdown && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-success" />
              <div>
                <p className="text-sm font-medium">{totalRevenue.toLocaleString('fr-FR')} €</p>
                <p className="text-xs text-muted-foreground">Revenus</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-sm font-medium">{totalCosts.toLocaleString('fr-FR')} €</p>
                <p className="text-xs text-muted-foreground">Coûts</p>
              </div>
            </div>
          </div>
        )}

        {showChart && profitData.length > 0 && (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value.toLocaleString('fr-FR')} €`]}
                />
                <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                  {profitData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.profit > 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {profitData.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune donnée de profit disponible
          </p>
        )}
      </CardContent>
    </Card>
  );
}
