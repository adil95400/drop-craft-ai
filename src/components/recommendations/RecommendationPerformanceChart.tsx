import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, ShoppingCart, Zap } from 'lucide-react';

interface PerformanceChartProps {
  stats: {
    impressions: number;
    clicks: number;
    add_to_cart: number;
    purchases: number;
    by_strategy: Record<string, { impressions: number; clicks: number; purchases: number; revenue: number }>;
  } | null;
  recommendations: any[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const strategyLabels: Record<string, string> = {
  cross_sell: 'Cross-sell',
  upsell: 'Up-sell',
  bundle: 'Bundle',
  similar: 'Similaire',
  personalized: 'Personnalisé',
};

export function RecommendationPerformanceChart({ stats, recommendations }: PerformanceChartProps) {
  // Funnel data
  const funnelData = [
    { name: 'Impressions', value: stats?.impressions || 0, fill: 'hsl(var(--primary))' },
    { name: 'Clics', value: stats?.clicks || 0, fill: 'hsl(var(--chart-2))' },
    { name: 'Panier', value: stats?.add_to_cart || 0, fill: 'hsl(var(--chart-3))' },
    { name: 'Achats', value: stats?.purchases || 0, fill: 'hsl(var(--chart-4))' },
  ];

  // Strategy distribution pie
  const strategyData = Object.entries(stats?.by_strategy || {}).map(([key, data]) => ({
    name: strategyLabels[key] || key,
    value: data.impressions + data.clicks + data.purchases,
    impressions: data.impressions,
    clicks: data.clicks,
    purchases: data.purchases,
  })).filter(d => d.value > 0);

  // Confidence distribution
  const confidenceBuckets = [
    { range: '90-100%', count: 0 },
    { range: '70-89%', count: 0 },
    { range: '50-69%', count: 0 },
    { range: '<50%', count: 0 },
  ];
  recommendations.forEach((r: any) => {
    const score = (r.confidence_score || 0) * 100;
    if (score >= 90) confidenceBuckets[0].count++;
    else if (score >= 70) confidenceBuckets[1].count++;
    else if (score >= 50) confidenceBuckets[2].count++;
    else confidenceBuckets[3].count++;
  });

  // Revenue impact by strategy
  const revenueByStrategy = Object.entries(stats?.by_strategy || {}).map(([key, data]) => ({
    name: strategyLabels[key] || key,
    revenue: data.revenue || 0,
    conversions: data.purchases || 0,
  }));

  const totalRevenue = revenueByStrategy.reduce((s, d) => s + d.revenue, 0);
  const avgConfidence = recommendations.length > 0
    ? (recommendations.reduce((s: number, r: any) => s + (r.confidence_score || 0), 0) / recommendations.length * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Taux de clic</span>
            </div>
            <div className="text-2xl font-bold">
              {stats?.impressions ? ((stats.clicks / stats.impressions) * 100).toFixed(1) : '0'}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Taux conversion</span>
            </div>
            <div className="text-2xl font-bold">
              {stats?.clicks ? ((stats.purchases / stats.clicks) * 100).toFixed(1) : '0'}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Revenu total</span>
            </div>
            <div className="text-2xl font-bold">€{totalRevenue.toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Confiance moy.</span>
            </div>
            <div className="text-2xl font-bold">{avgConfidence.toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Funnel chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Entonnoir de conversion</CardTitle>
            <CardDescription>De l'impression à l'achat</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis type="category" dataKey="name" width={80} className="text-xs" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Strategy distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Répartition par stratégie</CardTitle>
            <CardDescription>Volume d'interactions par type</CardDescription>
          </CardHeader>
          <CardContent>
            {strategyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={strategyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {strategyData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                Aucune donnée de stratégie disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confidence distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribution de confiance</CardTitle>
            <CardDescription>Qualité des recommandations actives</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={confidenceBuckets}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="range" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Recommandations" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI model info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Modèle IA</CardTitle>
            <CardDescription>Configuration du moteur</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Algorithme</span>
              <Badge>Hybrid CF + IA</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Moteur</span>
              <Badge variant="secondary">GPT-5-mini</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Recommandations actives</span>
              <span className="font-semibold">{recommendations.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Stratégies actives</span>
              <span className="font-semibold">{Object.keys(stats?.by_strategy || {}).length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Co-achats analysés</span>
              <Badge variant="outline">Temps réel</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
