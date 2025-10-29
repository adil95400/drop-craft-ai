import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesWidgetProps {
  isCustomizing: boolean;
}

const mockData = [
  { name: 'Lun', value: 2400 },
  { name: 'Mar', value: 1398 },
  { name: 'Mer', value: 9800 },
  { name: 'Jeu', value: 3908 },
  { name: 'Ven', value: 4800 },
  { name: 'Sam', value: 3800 },
  { name: 'Dim', value: 4300 },
];

export function SalesWidget({ isCustomizing }: SalesWidgetProps) {
  return (
    <Card className={isCustomizing ? 'ring-2 ring-primary/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ventes
          </div>
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <ArrowUpRight className="h-4 w-4" />
            +24%
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-3xl font-bold">52.4K€</p>
          <p className="text-sm text-muted-foreground">Cette semaine</p>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={mockData}>
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
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
