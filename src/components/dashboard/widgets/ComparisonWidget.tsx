import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ComparisonWidgetProps {
  timeRange: string;
  settings?: {
    showChart?: boolean;
    comparisonType?: 'period' | 'year';
  };
}

const comparisonData = [
  { metric: 'Ventes', current: 45000, previous: 38000 },
  { metric: 'Commandes', current: 320, previous: 280 },
  { metric: 'Clients', current: 156, previous: 142 },
  { metric: 'Panier moyen', current: 140, previous: 135 },
];

const chartData = [
  { month: 'Jan', current: 12000, previous: 10500 },
  { month: 'Fév', current: 15000, previous: 12000 },
  { month: 'Mar', current: 11000, previous: 13000 },
  { month: 'Avr', current: 18000, previous: 15000 },
  { month: 'Mai', current: 16000, previous: 14500 },
  { month: 'Juin', current: 21000, previous: 17000 },
];

export function ComparisonWidget({ settings }: ComparisonWidgetProps) {
  const showChart = settings?.showChart ?? true;
  const comparisonType = settings?.comparisonType ?? 'period';

  const periodLabel = comparisonType === 'year' ? 'vs année précédente' : 'vs période précédente';

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
            const change = ((item.current - item.previous) / item.previous) * 100;
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

        {showChart && (
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
                  formatter={(value) => value === 'current' ? 'Actuel' : 'Précédent'}
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
