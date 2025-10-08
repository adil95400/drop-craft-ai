import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Activity } from "lucide-react";
import { WinnerProduct } from "@/domains/winners/types";

interface WinnersTrendChartProps {
  products: WinnerProduct[];
}

export const WinnersTrendChart = ({ products }: WinnersTrendChartProps) => {
  // Generate trend data from products
  const trendData = [
    { day: 'Lun', score: 72, demand: 65, sales: 45 },
    { day: 'Mar', score: 78, demand: 71, sales: 52 },
    { day: 'Mer', score: 85, demand: 78, sales: 61 },
    { day: 'Jeu', score: 81, demand: 75, sales: 58 },
    { day: 'Ven', score: 88, demand: 82, sales: 68 },
    { day: 'Sam', score: 92, demand: 88, sales: 75 },
    { day: 'Dim', score: 95, demand: 91, sales: 82 }
  ];

  // Calculate average metrics
  const avgScore = products.reduce((sum, p) => sum + (p.trending_score || 0), 0) / products.length || 0;
  const avgDemand = products.reduce((sum, p) => sum + (p.market_demand || 0), 0) / products.length || 0;

  const categoryData = [
    { category: 'Tech', count: Math.floor(products.length * 0.3), avgScore: 85 },
    { category: 'Mode', count: Math.floor(products.length * 0.25), avgScore: 78 },
    { category: 'Maison', count: Math.floor(products.length * 0.2), avgScore: 82 },
    { category: 'Sport', count: Math.floor(products.length * 0.15), avgScore: 76 },
    { category: 'Beauté', count: Math.floor(products.length * 0.1), avgScore: 88 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Trend Evolution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Évolution des Tendances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="day" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorScore)"
                name="Score"
              />
              <Area 
                type="monotone" 
                dataKey="demand" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorDemand)"
                name="Demande"
              />
            </AreaChart>
          </ResponsiveContainer>
          
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Score Moyen</p>
              <p className="text-2xl font-bold text-primary">{avgScore.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Demande Moyenne</p>
              <p className="text-2xl font-bold text-emerald-600">{avgDemand.toFixed(1)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Distribution par Catégorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="category" className="text-xs" />
              <YAxis yAxisId="left" className="text-xs" />
              <YAxis yAxisId="right" orientation="right" className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Produits"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avgScore" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Score Moyen"
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Top Catégories</p>
            <div className="space-y-2">
              {categoryData.slice(0, 3).map((cat, idx) => (
                <div key={cat.category} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{['🥇', '🥈', '🥉'][idx]}</span>
                    {cat.category}
                  </span>
                  <span className="font-semibold">{cat.count} produits</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
