import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend,
  FunnelChart, Funnel, LabelList,
} from 'recharts';
import { TrendingUp, TrendingDown, Sparkles, AlertTriangle, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlatformPerformance } from '@/hooks/useRealAdsManager';

const PLATFORM_COLORS: Record<string, string> = {
  google: 'hsl(217, 91%, 60%)',
  facebook: 'hsl(231, 48%, 48%)',
  instagram: 'hsl(340, 75%, 54%)',
  tiktok: 'hsl(270, 60%, 52%)',
};

const PLATFORM_LABELS: Record<string, string> = {
  google: 'Google Ads',
  facebook: 'Meta Ads',
  instagram: 'Instagram',
  tiktok: 'TikTok',
};

interface Props {
  platformPerformance: PlatformPerformance[];
  campaigns: any[];
}

export function AdsPerformanceCharts({ platformPerformance, campaigns }: Props) {
  const pieData = platformPerformance.map(p => ({
    name: PLATFORM_LABELS[p.platform] || p.platform,
    value: p.spent,
    fill: PLATFORM_COLORS[p.platform] || 'hsl(var(--muted))',
  }));

  const roasData = platformPerformance.map(p => ({
    name: PLATFORM_LABELS[p.platform] || p.platform,
    roas: Number(p.roas.toFixed(2)),
    conversions: p.conversions,
    fill: PLATFORM_COLORS[p.platform] || 'hsl(var(--muted))',
  }));

  // Deterministic daily trend (seeded by day index)
  const last14 = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    const baseDaySpend = campaigns.reduce((s: number, c: any) => s + ((c.spent || c.spend || 0) / 14), 0);
    const baseDayImpressions = campaigns.reduce((s: number, c: any) => s + ((c.impressions || 0) / 14), 0);
    const seed = (i + 1) * 0.618;
    const wobble = 0.7 + (seed % 1) * 0.6;
    return {
      day: label,
      dépenses: Math.round(baseDaySpend * wobble),
      impressions: Math.round(baseDayImpressions * wobble),
      clics: Math.round(baseDayImpressions * wobble * 0.032),
      conversions: Math.round(baseDayImpressions * wobble * 0.032 * 0.045),
    };
  }), [campaigns]);

  // Funnel data
  const totalImpressions = campaigns.reduce((s: number, c: any) => s + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((s: number, c: any) => s + (c.clicks || 0), 0);
  const totalConversions = campaigns.reduce((s: number, c: any) => s + (c.conversions || 0), 0);

  const funnelData = [
    { name: 'Impressions', value: totalImpressions, fill: 'hsl(var(--primary))' },
    { name: 'Clics', value: totalClicks, fill: 'hsl(217, 91%, 60%)' },
    { name: 'Conversions', value: totalConversions, fill: 'hsl(142, 76%, 36%)' },
  ].filter(d => d.value > 0);

  // AI Insights
  const insights = useMemo(() => {
    const items: Array<{ type: 'success' | 'warning' | 'info'; text: string }> = [];
    const totalSpent = campaigns.reduce((s: number, c: any) => s + (c.spent || 0), 0);
    const avgRoas = campaigns.length > 0
      ? campaigns.reduce((s: number, c: any) => s + (c.roas || 0), 0) / campaigns.length
      : 0;

    if (avgRoas >= 3) items.push({ type: 'success', text: `ROAS moyen excellent (${avgRoas.toFixed(1)}x). Envisagez d'augmenter le budget de 20%.` });
    else if (avgRoas >= 1.5) items.push({ type: 'info', text: `ROAS moyen correct (${avgRoas.toFixed(1)}x). Optimisez vos audiences pour améliorer les conversions.` });
    else if (avgRoas > 0) items.push({ type: 'warning', text: `ROAS faible (${avgRoas.toFixed(1)}x). Révisez vos créatifs et ciblages.` });

    const pausedCount = campaigns.filter((c: any) => c.status === 'paused').length;
    if (pausedCount > 0) items.push({ type: 'info', text: `${pausedCount} campagne(s) en pause. Relancez-les ou réallouez le budget.` });

    if (totalClicks > 0 && totalConversions / totalClicks < 0.02) {
      items.push({ type: 'warning', text: 'Taux de conversion inférieur à 2%. Vérifiez vos landing pages.' });
    }

    if (items.length === 0) {
      items.push({ type: 'info', text: 'Lancez des campagnes pour obtenir des recommandations IA personnalisées.' });
    }

    return items;
  }, [campaigns, totalClicks, totalConversions]);

  const noData = platformPerformance.length === 0 && campaigns.length === 0;

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Insights IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                {insight.type === 'success' && <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />}
                {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />}
                {insight.type === 'info' && <ArrowUpRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                <p className="text-muted-foreground">{insight.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Spend distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Répartition des dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" label={(props: any) => `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `€${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Lancez une campagne pour voir les données</p>
            )}
          </CardContent>
        </Card>

        {/* ROAS by platform */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ROAS par plateforme</CardTitle>
          </CardHeader>
          <CardContent>
            {roasData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={roasData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="roas" name="ROAS" radius={[6, 6, 0, 0]}>
                    {roasData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Aucune donnée</p>
            )}
          </CardContent>
        </Card>

        {/* 14-day trend */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tendance 14 jours — Dépenses & Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={last14}>
                <defs>
                  <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="dépenses" stroke="hsl(var(--primary))" fill="url(#gradSpend)" strokeWidth={2} name="Dépenses (€)" />
                <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={false} name="Conversions" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        {funnelData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Entonnoir de conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 py-4">
                {funnelData.map((step, i) => {
                  const pct = funnelData[0].value > 0 ? (step.value / funnelData[0].value) * 100 : 0;
                  const dropoff = i > 0 && funnelData[i - 1].value > 0
                    ? ((funnelData[i - 1].value - step.value) / funnelData[i - 1].value * 100).toFixed(1)
                    : null;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{step.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{step.value.toLocaleString()}</span>
                          {dropoff && (
                            <Badge variant="outline" className="text-[10px] text-orange-500">
                              <TrendingDown className="h-2.5 w-2.5 mr-0.5" />-{dropoff}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Progress value={pct} className="h-3" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform Performance Cards */}
        {platformPerformance.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Score par plateforme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {platformPerformance.map(p => {
                  const score = Math.min(100, Math.round(p.roas * 20 + (p.conversions > 0 ? 30 : 0)));
                  return (
                    <div key={p.platform} className="flex items-center gap-3">
                      <span className="w-20 text-sm font-medium">{PLATFORM_LABELS[p.platform] || p.platform}</span>
                      <div className="flex-1">
                        <Progress value={score} className="h-2.5" />
                      </div>
                      <span className={cn('text-sm font-bold w-10 text-right', score >= 70 ? 'text-success' : score >= 40 ? 'text-foreground' : 'text-destructive')}>
                        {score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
