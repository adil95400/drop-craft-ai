import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueWidgetProps {
  isCustomizing: boolean;
}

const mockData = [
  { name: 'Jan', value: 12400 },
  { name: 'Fév', value: 13980 },
  { name: 'Mar', value: 18000 },
  { name: 'Avr', value: 15908 },
  { name: 'Mai', value: 19800 },
  { name: 'Juin', value: 22800 },
];

export function RevenueWidget({ isCustomizing }: RevenueWidgetProps) {
  return (
    <Card className={isCustomizing ? 'ring-2 ring-primary/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Revenus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">103.2K€</p>
            <p className="text-sm text-muted-foreground">6 derniers mois</p>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-semibold">+32%</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="pt-2 border-t text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Panier moyen</span>
            <span className="font-semibold">62.50€</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
