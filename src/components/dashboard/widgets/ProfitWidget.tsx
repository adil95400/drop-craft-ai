import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ProfitWidgetProps {
  timeRange: string;
  settings?: {
    showChart?: boolean;
    showBreakdown?: boolean;
  };
}

const profitData = [
  { month: 'Jan', revenue: 45000, costs: 32000, profit: 13000 },
  { month: 'Fév', revenue: 52000, costs: 35000, profit: 17000 },
  { month: 'Mar', revenue: 48000, costs: 33000, profit: 15000 },
  { month: 'Avr', revenue: 61000, costs: 38000, profit: 23000 },
  { month: 'Mai', revenue: 55000, costs: 36000, profit: 19000 },
  { month: 'Juin', revenue: 67000, costs: 41000, profit: 26000 },
];

export function ProfitWidget({ settings }: ProfitWidgetProps) {
  const showChart = settings?.showChart ?? true;
  const showBreakdown = settings?.showBreakdown ?? true;

  const totalRevenue = profitData.reduce((sum, d) => sum + d.revenue, 0);
  const totalCosts = profitData.reduce((sum, d) => sum + d.costs, 0);
  const totalProfit = profitData.reduce((sum, d) => sum + d.profit, 0);
  const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-4 w-4 text-green-500" />
          Marges & Profits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-green-500">
              {totalProfit.toLocaleString('fr-FR')} €
            </p>
            <p className="text-xs text-muted-foreground">Profit net</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-500">
              <TrendingUp className="h-4 w-4" />
              <span className="text-lg font-semibold">{profitMargin}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Marge</p>
          </div>
        </div>

        {showBreakdown && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">{totalRevenue.toLocaleString('fr-FR')} €</p>
                <p className="text-xs text-muted-foreground">Revenus</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">{totalCosts.toLocaleString('fr-FR')} €</p>
                <p className="text-xs text-muted-foreground">Coûts</p>
              </div>
            </div>
          </div>
        )}

        {showChart && (
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
                      fill={entry.profit > 20000 ? 'hsl(142 76% 36%)' : 'hsl(142 76% 50%)'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
