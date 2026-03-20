import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRealPredictiveAI } from '@/hooks/usePredictiveAI';
import { useBusinessMetrics } from '@/hooks/useBIMetrics';
import {
  Brain, Zap, TrendingUp, TrendingDown, Target, ArrowUpRight,
  ArrowDownRight, Calendar, Eye, Lightbulb, AlertTriangle, Sparkles
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, BarChart, Bar
} from 'recharts';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function AIRevenueForecastDashboard() {
  const { insights, salesData, generatePrediction, isGenerating, isLoading } = useRealPredictiveAI('30d');
  const { data: metrics } = useBusinessMetrics('30d');
  const [horizon, setHorizon] = useState<30 | 60 | 90>(30);

  // Advanced forecasting with seasonality
  const forecasts = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    const pastData = salesData.filter(d => d.actual > 0);
    if (pastData.length < 3) return [];

    const avgDaily = pastData.reduce((s, d) => s + d.actual, 0) / pastData.length;

    // Simple trend detection
    const halfLen = Math.floor(pastData.length / 2);
    const firstHalf = pastData.slice(0, halfLen);
    const secondHalf = pastData.slice(halfLen);
    const firstAvg = firstHalf.reduce((s, d) => s + d.actual, 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((s, d) => s + d.actual, 0) / (secondHalf.length || 1);
    const trendRate = firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;

    // Weekly seasonality pattern (simplified)
    const dayOfWeekAvg: Record<number, number[]> = {};
    pastData.forEach(d => {
      const dow = new Date(d.date).getDay();
      if (!dayOfWeekAvg[dow]) dayOfWeekAvg[dow] = [];
      dayOfWeekAvg[dow].push(d.actual);
    });
    const seasonality: Record<number, number> = {};
    Object.entries(dayOfWeekAvg).forEach(([dow, vals]) => {
      seasonality[Number(dow)] = vals.reduce((s, v) => s + v, 0) / vals.length / (avgDaily || 1);
    });

    return Array.from({ length: horizon }, (_, i) => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i + 1);
      const dow = futureDate.getDay();
      const seasonalFactor = seasonality[dow] || 1;
      const trendFactor = 1 + trendRate * ((i + 1) / 30);
      const base = avgDaily * seasonalFactor * trendFactor;

      return {
        day: `J+${i + 1}`,
        date: futureDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        forecast: Math.max(0, Math.round(base)),
        optimistic: Math.max(0, Math.round(base * 1.2)),
        pessimistic: Math.max(0, Math.round(base * 0.8)),
        confidence: Math.max(50, Math.round(95 - i * 0.8)),
      };
    });
  }, [salesData, horizon]);

  const totalForecast = forecasts.reduce((s, d) => s + d.forecast, 0);
  const totalOptimistic = forecasts.reduce((s, d) => s + d.optimistic, 0);
  const totalPessimistic = forecasts.reduce((s, d) => s + d.pessimistic, 0);
  const avgConfidence = forecasts.length > 0 ? forecasts.reduce((s, d) => s + d.confidence, 0) / forecasts.length : 0;

  // AI Recommendations
  const recommendations = useMemo(() => {
    const recs: { title: string; description: string; impact: 'high' | 'medium' | 'low'; icon: any }[] = [];

    if (metrics) {
      if (metrics.revenue.change < 0) {
        recs.push({
          title: 'Relancer les ventes',
          description: `Le CA a baissé de ${Math.abs(metrics.revenue.change).toFixed(1)}%. Lancez une campagne promotionnelle ciblée.`,
          impact: 'high',
          icon: AlertTriangle,
        });
      }
      if (metrics.avgOrderValue < 50) {
        recs.push({
          title: 'Augmenter le panier moyen',
          description: 'Panier moyen inférieur à 50€. Proposez des bundles ou upsells sur les pages produit.',
          impact: 'medium',
          icon: Target,
        });
      }
      if (metrics.customers.new > 10 && metrics.revenue.change > 0) {
        recs.push({
          title: 'Capitaliser sur la croissance',
          description: `${metrics.customers.new} nouveaux clients ce mois. Mettez en place un programme de fidélisation.`,
          impact: 'high',
          icon: TrendingUp,
        });
      }
    }

    recs.push({
      title: 'Optimiser la saisonnalité',
      description: 'Analysez les pics de vente hebdomadaires pour optimiser vos campagnes publicitaires.',
      impact: 'medium',
      icon: Calendar,
    });

    return recs;
  }, [metrics]);

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Prévisions IA avancées
          </h3>
          <p className="text-sm text-muted-foreground">Modèle prédictif avec saisonnalité et 3 scénarios</p>
        </div>
        <div className="flex items-center gap-2">
          {([30, 60, 90] as const).map(h => (
            <Button key={h} size="sm" variant={horizon === h ? 'default' : 'outline'} onClick={() => setHorizon(h)}>
              {h}j
            </Button>
          ))}
          <Button onClick={() => generatePrediction()} disabled={isGenerating} size="sm" variant="secondary">
            <Zap className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-pulse' : ''}`} />
            {isGenerating ? 'Analyse...' : 'Régénérer'}
          </Button>
        </div>
      </div>

      {/* Forecast Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Prévision {horizon}j</p>
            <p className="text-2xl font-bold text-primary">{fmt(totalForecast)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-primary" /> Optimiste</p>
            <p className="text-2xl font-bold">{fmt(totalOptimistic)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><ArrowDownRight className="h-3 w-3 text-destructive" /> Pessimiste</p>
            <p className="text-2xl font-bold text-muted-foreground">{fmt(totalPessimistic)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Confiance moyenne</p>
            <p className="text-2xl font-bold">{avgConfidence.toFixed(0)}%</p>
            <Badge variant="secondary" className="mt-1 text-xs">{avgConfidence >= 80 ? 'Fiable' : avgConfidence >= 60 ? 'Modéré' : 'Incertain'}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      {forecasts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Projection des revenus ({horizon} jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={forecasts}>
                <defs>
                  <linearGradient id="aiForecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aiOptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))"
                  interval={Math.floor(horizon / 8)} />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))"
                  tickFormatter={v => `${(v / 1000).toFixed(1)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Area type="monotone" dataKey="optimistic" stroke="hsl(var(--primary) / 0.4)"
                  fill="url(#aiOptGrad)" strokeDasharray="5 5" name="Optimiste (+20%)" />
                <Area type="monotone" dataKey="forecast" stroke="hsl(var(--primary))"
                  fill="url(#aiForecastGrad)" strokeWidth={2.5} name="Prévision" />
                <Area type="monotone" dataKey="pessimistic" stroke="hsl(var(--destructive) / 0.4)"
                  fill="none" strokeDasharray="5 5" name="Pessimiste (-20%)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Confidence Decay */}
      {forecasts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Indice de confiance par jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={forecasts.filter((_, i) => i % Math.ceil(horizon / 15) === 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="confidence" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Confiance" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          Recommandations IA
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recommendations.map((rec, i) => (
            <Card key={i} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${
                  rec.impact === 'high' ? 'bg-primary/10 text-primary' :
                  rec.impact === 'medium' ? 'bg-accent/50 text-accent-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  <rec.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{rec.title}</p>
                    <Badge variant={rec.impact === 'high' ? 'default' : 'secondary'} className="text-xs shrink-0">
                      {rec.impact === 'high' ? 'Impact élevé' : rec.impact === 'medium' ? 'Moyen' : 'Faible'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Predictive Insights from DB */}
      {insights && insights.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Insights prédictifs
          </h3>
          {insights.slice(0, 4).map((insight: any, i: number) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${
                  insight.impact === 'high' ? 'bg-primary/10 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {insight.type === 'sales_forecast' ? <TrendingUp className="h-4 w-4" /> :
                   insight.type === 'inventory_alert' ? <AlertTriangle className="h-4 w-4" /> :
                   <Eye className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                </div>
                {insight.confidence && (
                  <Badge variant="secondary" className="shrink-0 text-xs">{insight.confidence}%</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
