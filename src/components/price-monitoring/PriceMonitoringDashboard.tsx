/**
 * P1-1: Dashboard de monitoring des changements de prix
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  History, BarChart3, AlertTriangle, RefreshCw, Filter
} from 'lucide-react';
import { usePriceChangeHistory, PriceChangeRecord } from '@/hooks/usePriceChangeHistory';
import { useStockAlerts } from '@/hooks/useStockAlerts';
import { formatDistanceToNow, format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { motion } from 'framer-motion';

function PriceChangeChart({ records }: { records: PriceChangeRecord[] }) {
  const chartData = records
    .slice(0, 30)
    .reverse()
    .map((r, i) => ({
      idx: i,
      date: format(new Date(r.created_at), 'dd/MM', { locale: getDateFnsLocale() }),
      oldPrice: r.old_price,
      newPrice: r.new_price,
      change: r.change_percent,
    }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorOld" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" className="text-xs fill-muted-foreground" />
        <YAxis className="text-xs fill-muted-foreground" />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--popover-foreground))'
          }}
        />
        <Area type="monotone" dataKey="oldPrice" stroke="hsl(var(--muted-foreground))" fill="url(#colorOld)" name="Ancien prix" />
        <Area type="monotone" dataKey="newPrice" stroke="hsl(var(--primary))" fill="url(#colorNew)" name="Nouveau prix" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ChangeDistributionChart({ records }: { records: PriceChangeRecord[] }) {
  const buckets = [
    { label: '< -10%', min: -Infinity, max: -10, count: 0 },
    { label: '-10% à -5%', min: -10, max: -5, count: 0 },
    { label: '-5% à 0%', min: -5, max: 0, count: 0 },
    { label: '0% à 5%', min: 0, max: 5, count: 0 },
    { label: '5% à 10%', min: 5, max: 10, count: 0 },
    { label: '> 10%', min: 10, max: Infinity, count: 0 },
  ];

  records.forEach(r => {
    const b = buckets.find(b => r.change_percent >= b.min && r.change_percent < b.max);
    if (b) b.count++;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={buckets}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" className="text-xs fill-muted-foreground" />
        <YAxis className="text-xs fill-muted-foreground" />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--popover-foreground))'
          }}
        />
        <Bar dataKey="count" name="Changements" radius={[4, 4, 0, 0]}>
          {buckets.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.max <= 0 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
              fillOpacity={0.7}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PriceMonitoringDashboard() {
  const [period, setPeriod] = useState('50');
  const { data: records = [], isLoading } = usePriceChangeHistory(undefined, parseInt(period));
  const { stats: stockStats } = useStockAlerts({ resolved: false });

  const increases = records.filter(r => r.change_percent > 0);
  const decreases = records.filter(r => r.change_percent < 0);
  const avgChange = records.length
    ? records.reduce((acc, r) => acc + r.change_percent, 0) / records.length
    : 0;

  const statCards = [
    {
      title: 'Changements de prix',
      value: records.length,
      icon: History,
      description: `${period} derniers enregistrements`,
      color: 'text-primary',
    },
    {
      title: 'Hausses',
      value: increases.length,
      icon: TrendingUp,
      description: `${records.length ? Math.round((increases.length / records.length) * 100) : 0}% des changements`,
      color: 'text-emerald-500',
    },
    {
      title: 'Baisses',
      value: decreases.length,
      icon: TrendingDown,
      description: `${records.length ? Math.round((decreases.length / records.length) * 100) : 0}% des changements`,
      color: 'text-destructive',
    },
    {
      title: 'Alertes stock actives',
      value: stockStats.unresolved,
      icon: AlertTriangle,
      description: `${stockStats.critical} critiques`,
      color: stockStats.critical > 0 ? 'text-destructive' : 'text-amber-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-70`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Period Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20 derniers</SelectItem>
              <SelectItem value="50">50 derniers</SelectItem>
              <SelectItem value="100">100 derniers</SelectItem>
              <SelectItem value="200">200 derniers</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Badge variant="outline" className="gap-1">
          Variation moyenne : {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
        </Badge>
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline" className="gap-1">
            <BarChart3 className="h-4 w-4" />
            Évolution
          </TabsTrigger>
          <TabsTrigger value="distribution" className="gap-1">
            <BarChart3 className="h-4 w-4" />
            Distribution
          </TabsTrigger>
          <TabsTrigger value="table" className="gap-1">
            <History className="h-4 w-4" />
            Détails
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Évolution des prix</CardTitle>
              <CardDescription>Ancien vs Nouveau prix sur les derniers changements</CardDescription>
            </CardHeader>
            <CardContent>
              {records.length > 0 ? (
                <PriceChangeChart records={records} />
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  Aucun changement de prix enregistré
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribution des variations</CardTitle>
              <CardDescription>Répartition des changements de prix par tranche</CardDescription>
            </CardHeader>
            <CardContent>
              {records.length > 0 ? (
                <ChangeDistributionChart records={records} />
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historique détaillé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-[500px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background border-b">
                    <tr>
                      <th className="text-left p-2 font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-2 font-medium text-muted-foreground">Type</th>
                      <th className="text-right p-2 font-medium text-muted-foreground">Ancien</th>
                      <th className="text-right p-2 font-medium text-muted-foreground">Nouveau</th>
                      <th className="text-right p-2 font-medium text-muted-foreground">Variation</th>
                      <th className="text-left p-2 font-medium text-muted-foreground">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-2">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">{r.change_type}</Badge>
                        </td>
                        <td className="p-2 text-right font-mono">{r.old_price.toFixed(2)}€</td>
                        <td className="p-2 text-right font-mono">{r.new_price.toFixed(2)}€</td>
                        <td className="p-2 text-right">
                          <span className={`inline-flex items-center gap-0.5 font-medium ${r.change_percent >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                            {r.change_percent >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(r.change_percent).toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-2 text-muted-foreground text-xs">{r.source || '—'}</td>
                      </tr>
                    ))}
                    {records.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          Aucun changement de prix enregistré
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
