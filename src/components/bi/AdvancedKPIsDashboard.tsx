import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBusinessMetrics, useCustomerAnalytics, useProductAnalytics } from '@/hooks/useBIMetrics';
import { useFinancialManagement } from '@/hooks/useFinancialManagement';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Target, TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart,
  ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle2, Gauge,
  BarChart3, Zap, Package, Percent, Clock, Bell, Settings2
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

interface KPIGoal {
  key: string;
  label: string;
  current: number;
  target: number;
  unit: 'currency' | 'percent' | 'number';
  icon: any;
  alertThreshold?: number; // % of target below which to alert
}

export function AdvancedKPIsDashboard({ period }: { period: '7d' | '30d' | '90d' }) {
  const { data: metrics, isLoading } = useBusinessMetrics(period);
  const { data: customerData } = useCustomerAnalytics();
  const { data: productData } = useProductAnalytics();
  const { pnl } = useFinancialManagement();

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>;

  const kpiGoals: KPIGoal[] = [
    { key: 'revenue', label: 'CA mensuel', current: metrics?.revenue.current || 0, target: 10000, unit: 'currency', icon: DollarSign, alertThreshold: 50 },
    { key: 'orders', label: 'Commandes', current: metrics?.orders.current || 0, target: 100, unit: 'number', icon: ShoppingCart, alertThreshold: 40 },
    { key: 'aov', label: 'Panier moyen', current: metrics?.avgOrderValue || 0, target: 80, unit: 'currency', icon: Target },
    { key: 'customers', label: 'Nouveaux clients', current: metrics?.customers.new || 0, target: 50, unit: 'number', icon: Users, alertThreshold: 30 },
    { key: 'margin', label: 'Marge nette', current: pnl.margin, target: 25, unit: 'percent', icon: Percent, alertThreshold: 60 },
    { key: 'repeat', label: 'Taux de fidélisation', current: customerData?.repeatRate || 0, target: 30, unit: 'percent', icon: TrendingUp },
  ];

  const formatValue = (v: number, unit: string) => {
    if (unit === 'currency') return fmt(v);
    if (unit === 'percent') return `${v.toFixed(1)}%`;
    return v.toString();
  };

  // Period comparison data
  const comparisons = [
    { label: 'CA', current: metrics?.revenue.current || 0, previous: metrics?.revenue.previous || 0, change: metrics?.revenue.change || 0, unit: 'currency' as const },
    { label: 'Commandes', current: metrics?.orders.current || 0, previous: metrics?.orders.previous || 0, change: metrics?.orders.change || 0, unit: 'number' as const },
    { label: 'Clients', current: metrics?.customers.new || 0, previous: 0, change: metrics?.customers.change || 0, unit: 'number' as const },
  ];

  // Alerts: KPIs below threshold
  const alerts = kpiGoals.filter(k => {
    if (!k.alertThreshold) return false;
    const progress = k.target > 0 ? (k.current / k.target) * 100 : 0;
    return progress < k.alertThreshold;
  });

  // Health score
  const healthScore = Math.round(
    kpiGoals.reduce((sum, k) => {
      const progress = Math.min(k.target > 0 ? (k.current / k.target) * 100 : 0, 100);
      return sum + progress;
    }, 0) / kpiGoals.length
  );

  const healthData = [{ name: 'Score', value: healthScore, fill: 'hsl(var(--primary))' }];

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-destructive" />
              <span className="font-semibold text-sm text-destructive">{alerts.length} alerte{alerts.length > 1 ? 's' : ''} KPI</span>
            </div>
            <div className="space-y-2">
              {alerts.map((alert, i) => {
                const pct = alert.target > 0 ? (alert.current / alert.target) * 100 : 0;
                return (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                      <span>{alert.label}</span>
                    </div>
                    <span className="text-destructive font-mono">
                      {formatValue(alert.current, alert.unit)} / {formatValue(alert.target, alert.unit)} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Health Gauge */}
        <Card className="lg:row-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              Santé Business
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative w-40 h-40 mb-4">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={healthScore >= 70 ? 'hsl(var(--primary))' : healthScore >= 40 ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'}
                  strokeWidth="3" strokeDasharray={`${healthScore}, 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{healthScore}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            <Badge variant={healthScore >= 70 ? 'default' : healthScore >= 40 ? 'secondary' : 'destructive'}>
              {healthScore >= 70 ? 'Excellent' : healthScore >= 40 ? 'À améliorer' : 'Critique'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Score basé sur l'atteinte de vos objectifs KPI
            </p>
          </CardContent>
        </Card>

        {/* KPI Goal Tracking */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Suivi des objectifs
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {kpiGoals.map((kpi) => {
              const progress = Math.min(kpi.target > 0 ? (kpi.current / kpi.target) * 100 : 0, 100);
              const isAlert = kpi.alertThreshold && progress < kpi.alertThreshold;
              return (
                <Card key={kpi.key} className={isAlert ? 'border-destructive/30' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <kpi.icon className={`h-4 w-4 ${isAlert ? 'text-destructive' : 'text-primary'}`} />
                        <span className="text-xs text-muted-foreground">{kpi.label}</span>
                      </div>
                      {isAlert && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold">{formatValue(kpi.current, kpi.unit)}</span>
                      <span className="text-xs text-muted-foreground">
                        Objectif: {formatValue(kpi.target, kpi.unit)}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2 mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(0)}% atteint</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Period Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Comparaison période
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {comparisons.map((comp, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm font-medium">{comp.label}</p>
                <div className="flex items-end gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Actuel</p>
                    <p className="text-2xl font-bold">
                      {comp.unit === 'currency' ? fmt(comp.current) : comp.current}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Précédent</p>
                    <p className="text-lg text-muted-foreground">
                      {comp.unit === 'currency' ? fmt(comp.previous) : comp.previous}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-sm ${comp.change >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {comp.change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  <span className="font-medium">{comp.change >= 0 ? '+' : ''}{comp.change.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product & Customer Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Indicateurs Produits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Produits actifs', value: productData?.activeProducts || 0, total: productData?.totalProducts || 0, icon: CheckCircle2 },
              { label: 'Stock bas', value: productData?.lowStock || 0, total: productData?.totalProducts || 0, icon: AlertTriangle, alert: true },
              { label: 'Ruptures', value: productData?.outOfStock || 0, total: productData?.totalProducts || 0, icon: AlertTriangle, alert: true },
            ].map((item, i) => {
              const pct = (item.total > 0 ? item.value / item.total * 100 : 0);
              return (
                <div key={i} className="flex items-center gap-3">
                  <item.icon className={`h-4 w-4 ${item.alert && item.value > 0 ? 'text-destructive' : 'text-primary'}`} />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span className="font-mono">{item.value}</span>
                    </div>
                    <Progress value={pct} className="h-1.5 mt-1" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Indicateurs Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Total clients', value: customerData?.totalCustomers || 0 },
              { label: 'Clients fidèles', value: customerData?.repeatCustomers || 0 },
              { label: 'Clients VIP', value: customerData?.segments.vip || 0 },
              { label: 'Dépense moyenne', value: fmt(customerData?.avgSpent || 0), raw: true },
            ].map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-mono font-medium">{item.raw ? item.value : item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
