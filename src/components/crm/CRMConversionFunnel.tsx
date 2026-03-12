/**
 * CRMConversionFunnel — Entonnoir de conversion + vélocité pipeline
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCRMDeals } from '@/hooks/useCRMDeals';
import { useCRMLeads } from '@/hooks/useCRMLeads';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { TrendingUp, Clock, Target, DollarSign, Percent, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--primary))', '#8b5cf6', '#f59e0b', '#f97316', '#22c55e', '#ef4444'];

export function CRMConversionFunnel() {
  const { deals, stats: dealStats, isLoading: dealsLoading } = useCRMDeals();
  const { leads, stats: leadStats, isLoading: leadsLoading } = useCRMLeads();

  if (dealsLoading || leadsLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // Funnel stages
  const funnelStages = [
    { label: 'Leads', count: leadStats.total, color: COLORS[0] },
    { label: 'Qualifiés', count: leadStats.qualified + leadStats.contacted, color: COLORS[1] },
    { label: 'Proposition', count: dealStats.proposal, color: COLORS[2] },
    { label: 'Négociation', count: dealStats.negotiation, color: COLORS[3] },
    { label: 'Gagné', count: dealStats.won, color: COLORS[4] },
  ];

  const maxCount = Math.max(...funnelStages.map(s => s.count), 1);

  // Conversion rates between stages
  const conversionRates = funnelStages.slice(1).map((stage, i) => {
    const prev = funnelStages[i].count;
    return {
      from: funnelStages[i].label,
      to: stage.label,
      rate: prev > 0 ? ((stage.count / prev) * 100).toFixed(1) : '0',
    };
  });

  // Win/loss distribution
  const winLossData = [
    { name: 'Gagnés', value: dealStats.won, fill: '#22c55e' },
    { name: 'Perdus', value: dealStats.lost, fill: '#ef4444' },
    { name: 'En cours', value: dealStats.total - dealStats.won - dealStats.lost, fill: 'hsl(var(--primary))' },
  ].filter(d => d.value > 0);

  const winRate = dealStats.total > 0
    ? ((dealStats.won / dealStats.total) * 100).toFixed(1)
    : '0';

  // Pipeline velocity (simplified: weighted value / active deals)
  const activeDeals = dealStats.total - dealStats.won - dealStats.lost;
  const velocity = activeDeals > 0 ? dealStats.weightedValue / activeDeals : 0;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Taux de conversion', value: `${winRate}%`, icon: Percent, color: 'text-green-600' },
          { label: 'Vélocité pipeline', value: formatCurrency(velocity), icon: Clock, color: 'text-blue-600' },
          { label: 'Valeur pondérée', value: formatCurrency(dealStats.weightedValue), icon: Target, color: 'text-purple-600' },
          { label: 'Panier moyen deal', value: formatCurrency(dealStats.avgDealSize), icon: DollarSign, color: 'text-amber-600' },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <kpi.icon className="h-3.5 w-3.5" /> {kpi.label}
              </div>
              <p className={cn("text-2xl font-bold", kpi.color)}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Entonnoir de conversion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelStages.map((stage, i) => {
              const widthPct = Math.max((stage.count / maxCount) * 100, 8);
              return (
                <div key={stage.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{stage.label}</span>
                    <span className="text-muted-foreground">{stage.count}</span>
                  </div>
                  <div className="relative h-8 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-700 ease-out flex items-center justify-end pr-2"
                      style={{ width: `${widthPct}%`, backgroundColor: stage.color }}
                    >
                      {widthPct > 20 && (
                        <span className="text-xs font-medium text-white">{stage.count}</span>
                      )}
                    </div>
                  </div>
                  {i < conversionRates.length && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pl-2">
                      <span>→ {conversionRates[i].rate}% de conversion</span>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Win/Loss */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" /> Répartition des deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {winLossData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={winLossData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {winLossData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucun deal à afficher</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
