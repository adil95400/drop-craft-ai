import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRevenueAnalytics } from '@/hooks/useRevenueAnalytics';
import {
  TrendingUp, TrendingDown, DollarSign, Users, AlertTriangle,
  RefreshCw, BarChart3, Target, Percent
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

function MetricCard({
  icon: Icon, label, value, subValue, trend, trendLabel
}: {
  icon: any; label: string; value: string; subValue?: string;
  trend?: number; trendLabel?: string;
}) {
  const isPositive = (trend ?? 0) >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-3 flex items-center gap-1">
            <TrendIcon className={`h-3.5 w-3.5 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{trend.toFixed(1)}%
            </span>
            {trendLabel && <span className="text-xs text-muted-foreground ml-1">{trendLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RevenueAnalyticsPage() {
  const { data: metrics, isLoading, error, refetch, isFetching } = useRevenueAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="p-6 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium">Erreur de chargement</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Impossible de charger les métriques revenue.'}
              </p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => refetch()}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const planData = Object.entries(metrics.plan_distribution).map(([name, count], i) => ({
    name: name.startsWith('prod_') ? `Plan ${i + 1}` : name,
    value: count,
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Revenue Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Métriques SaaS en temps réel depuis Stripe
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Mis à jour : {new Date(metrics.computed_at).toLocaleTimeString('fr-FR')}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={DollarSign}
          label="MRR"
          value={`$${metrics.mrr.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`}
          subValue={`ARR: $${metrics.arr.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}`}
          trend={metrics.mrr_growth}
          trendLabel="vs mois précédent"
        />
        <MetricCard
          icon={Users}
          label="Abonnés actifs"
          value={metrics.active_subscribers.toString()}
          subValue={`${metrics.canceled_last_30d} annulés (30j)`}
        />
        <MetricCard
          icon={Percent}
          label="Taux de churn"
          value={`${metrics.churn_rate}%`}
          subValue="Sur 30 jours"
          trend={-metrics.churn_rate}
          trendLabel={metrics.churn_rate === 0 ? 'Aucun churn' : ''}
        />
        <MetricCard
          icon={Target}
          label="LTV estimée"
          value={`$${metrics.ltv.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}`}
          subValue="Valeur vie client"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Revenus mensuels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.trend}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(m) => {
                    const [y, mo] = m.split('-');
                    return new Date(+y, +mo - 1).toLocaleDateString('fr-FR', { month: 'short' });
                  }}
                  className="text-xs"
                />
                <YAxis tickFormatter={(v) => `$${v}`} className="text-xs" />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenu']}
                  labelFormatter={(m) => {
                    const [y, mo] = m.split('-');
                    return new Date(+y, +mo - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                  }}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Répartition des plans</CardTitle>
          </CardHeader>
          <CardContent>
            {planData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={planData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={4}
                    >
                      {planData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  {planData.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-muted-foreground">{p.name}</span>
                      </div>
                      <span className="font-medium">{p.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                Aucun abonné pour l'instant
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">${metrics.revenue_last_30d.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Revenu 30j</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.active_subscribers}</p>
              <p className="text-xs text-muted-foreground mt-1">Abonnés</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.canceled_last_30d}</p>
              <p className="text-xs text-muted-foreground mt-1">Annulations 30j</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                ${metrics.active_subscribers > 0 ? (metrics.mrr / metrics.active_subscribers).toFixed(2) : '0'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">ARPU mensuel</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
