import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { TimeRange } from '@/hooks/useDashboardConfig';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useProductionData } from '@/hooks/useProductionData';
import { useMemo } from 'react';

interface ConversionWidgetProps {
  timeRange: TimeRange;
  settings: {
    showTrend?: boolean;
  };
  lastRefresh: Date;
}

export function ConversionWidget({ timeRange, settings, lastRefresh }: ConversionWidgetProps) {
  const { orders, customers, products, isLoadingOrders, isLoadingCustomers, isLoadingProducts } = useProductionData();

  const { conversionRate, previousRate, funnelSteps } = useMemo(() => {
    const totalProducts = products?.length || 0;
    const totalCustomers = customers?.length || 0;
    const totalOrders = orders?.length || 0;

    // Calculate estimated funnel based on real data
    const estimatedVisitors = Math.max(totalCustomers * 10, 1000);
    const productViews = Math.round(estimatedVisitors * 0.45);
    const cartAdds = Math.round(totalOrders * 2.5);
    const purchases = totalOrders;

    const rate = estimatedVisitors > 0 ? (purchases / estimatedVisitors) * 100 : 0;
    // Previous rate based on older orders (before this month)
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const prevMonthOrders = (orders || []).filter(o => new Date(o.created_at || '') < monthStart).length;
    const prevRate = estimatedVisitors > 0 ? (prevMonthOrders / estimatedVisitors) * 100 : rate * 0.85;

    return {
      conversionRate: rate.toFixed(2),
      previousRate: prevRate.toFixed(2),
      funnelSteps: [
        { name: 'Visiteurs (estimé)', value: estimatedVisitors, percentage: 100 },
        { name: 'Vues produit', value: productViews, percentage: (productViews / estimatedVisitors) * 100 },
        { name: 'Ajouts panier', value: cartAdds, percentage: (cartAdds / estimatedVisitors) * 100 },
        { name: 'Achats', value: purchases, percentage: rate },
      ]
    };
  }, [orders, customers, products]);

  const change = parseFloat(previousRate) > 0 
    ? ((parseFloat(conversionRate) - parseFloat(previousRate)) / parseFloat(previousRate)) * 100 
    : 0;
  const isPositive = change >= 0;

  const isLoading = isLoadingOrders || isLoadingCustomers || isLoadingProducts;

  if (isLoading) {
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
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Target className="h-5 w-5 text-purple-500" />
            </div>
            <span>Conversion</span>
          </div>
          {settings.showTrend && (
            <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs">
              {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {isPositive ? '+' : ''}{change.toFixed(1)}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{conversionRate}%</span>
          <span className="text-sm text-muted-foreground">taux de conversion</span>
        </div>

        <div className="space-y-3">
          {funnelSteps.map((step, index) => (
            <div key={step.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{step.name}</span>
                <span className="font-medium">{step.value.toLocaleString()}</span>
              </div>
              <Progress 
                value={step.percentage} 
                className="h-2"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </>
  );
}
