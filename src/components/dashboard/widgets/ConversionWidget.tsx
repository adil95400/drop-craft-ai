import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { TimeRange } from '@/hooks/useDashboardConfig';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ConversionWidgetProps {
  timeRange: TimeRange;
  settings: {
    showTrend?: boolean;
  };
  lastRefresh: Date;
}

export function ConversionWidget({ timeRange, settings, lastRefresh }: ConversionWidgetProps) {
  // Mock conversion data - in real app, calculate from analytics
  const conversionRate = 3.2;
  const previousRate = 2.8;
  const change = ((conversionRate - previousRate) / previousRate) * 100;
  const isPositive = change >= 0;

  const funnelSteps = [
    { name: 'Visiteurs', value: 10000, percentage: 100 },
    { name: 'Vues produit', value: 4500, percentage: 45 },
    { name: 'Ajouts panier', value: 800, percentage: 8 },
    { name: 'Achats', value: 320, percentage: 3.2 },
  ];

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
