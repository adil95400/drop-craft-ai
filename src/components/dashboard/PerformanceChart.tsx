// GRAPHIQUE DE PERFORMANCE - Recharts optimisé avec lazy loading
import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Calendar,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChartData } from '@/hooks/useDashboard';

type Period = 'week' | 'month' | 'year';

const CustomTooltip = memo(({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground">
            {entry.name === 'Revenus' ? `${entry.value.toLocaleString('fr-FR')}€` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

const PerformanceChart = memo(() => {
  const [period, setPeriod] = useState<Period>('month');
  const { data: chartData, isLoading } = useChartData(period);

  // Données par défaut si pas de données
  const defaultData = [
    { name: 'Lun', revenus: 4000, commandes: 24 },
    { name: 'Mar', revenus: 3000, commandes: 18 },
    { name: 'Mer', revenus: 5000, commandes: 32 },
    { name: 'Jeu', revenus: 4500, commandes: 28 },
    { name: 'Ven', revenus: 6000, commandes: 45 },
    { name: 'Sam', revenus: 5500, commandes: 38 },
    { name: 'Dim', revenus: 4800, commandes: 30 }
  ];

  const data = chartData || defaultData;

  const periods: { value: Period; label: string }[] = [
    { value: 'week', label: '7 jours' },
    { value: 'month', label: '30 jours' },
    { value: 'year', label: '12 mois' }
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Performance
            {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
          </CardTitle>
          
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {periods.map((p) => (
              <Button
                key={p.value}
                size="sm"
                variant={period === p.value ? 'secondary' : 'ghost'}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "h-7 px-3 text-xs",
                  period === p.value && "bg-background shadow-sm"
                )}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCommandes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                vertical={false}
              />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenus"
                name="Revenus"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorRevenus)"
              />
              <Area
                type="monotone"
                dataKey="commandes"
                name="Commandes"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                fill="url(#colorCommandes)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Légende */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Revenus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
            <span className="text-sm text-muted-foreground">Commandes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

PerformanceChart.displayName = 'PerformanceChart';

export default PerformanceChart;
