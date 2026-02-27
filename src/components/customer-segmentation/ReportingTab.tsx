import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, FunnelChart, Funnel, LabelList
} from 'recharts';
import {
  Download, TrendingUp, Users, DollarSign, ShoppingCart,
  ArrowUpRight, ArrowDownRight, Target, Repeat, BarChart3
} from 'lucide-react';
import { CohortAnalysisChart } from './CohortAnalysisChart';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 160 60% 45%))',
  'hsl(var(--chart-3, 30 80% 55%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
];

// Demo data
const revenueBySegment = [
  { name: 'Champions', revenue: 45200, customers: 45, avgOrder: 1004 },
  { name: 'Fidèles', revenue: 28500, customers: 120, avgOrder: 237 },
  { name: 'Potentiels', revenue: 12300, customers: 85, avgOrder: 144 },
  { name: 'À risque', revenue: 8100, customers: 60, avgOrder: 135 },
  { name: 'Perdus', revenue: 2400, customers: 95, avgOrder: 25 },
];

const monthlyTrend = [
  { month: 'Sep', newCustomers: 88, returning: 45, revenue: 18500, churn: 12 },
  { month: 'Oct', newCustomers: 110, returning: 52, revenue: 22300, churn: 15 },
  { month: 'Nov', newCustomers: 145, returning: 68, revenue: 31200, churn: 10 },
  { month: 'Déc', newCustomers: 98, returning: 75, revenue: 28700, churn: 18 },
  { month: 'Jan', newCustomers: 120, returning: 80, revenue: 35100, churn: 8 },
  { month: 'Fév', newCustomers: 135, returning: 92, revenue: 38400, churn: 11 },
];

const funnelData = [
  { name: 'Visiteurs', value: 10000, fill: COLORS[0] },
  { name: 'Prospects', value: 3200, fill: COLORS[1] },
  { name: '1ère commande', value: 850, fill: COLORS[2] },
  { name: '2ème commande', value: 340, fill: COLORS[3] },
  { name: 'Fidèles', value: 165, fill: COLORS[4] },
];

const rfmDistribution = [
  { name: 'Champions', value: 45, color: '#10b981' },
  { name: 'Fidèles', value: 120, color: '#3b82f6' },
  { name: 'Potentiels', value: 85, color: '#f59e0b' },
  { name: 'À risque', value: 60, color: '#ef4444' },
  { name: 'Perdus', value: 95, color: '#6b7280' },
];

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  subtitle?: string;
}

function KPICard({ title, value, change, icon: Icon, subtitle }: KPICardProps) {
  const isPositive = change >= 0;
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs">
              {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {Math.abs(change)}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportingTab() {
  const [period, setPeriod] = useState('6m');

  const handleExportCSV = () => {
    const headers = ['Segment', 'Revenus (€)', 'Clients', 'Panier moyen (€)'];
    const rows = revenueBySegment.map(s => [s.name, s.revenue, s.customers, s.avgOrder]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-segmentation-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalRevenue = revenueBySegment.reduce((a, s) => a + s.revenue, 0);
  const totalCustomers = revenueBySegment.reduce((a, s) => a + s.customers, 0);
  const avgLTV = Math.round(totalRevenue / totalCustomers);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Reporting avancé</h3>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 mois</SelectItem>
              <SelectItem value="3m">3 mois</SelectItem>
              <SelectItem value="6m">6 mois</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="LTV Moyen" value={`${avgLTV} €`} change={12.5} icon={DollarSign} subtitle="Lifetime Value" />
        <KPICard title="Taux de rétention" value="34%" change={5.2} icon={Repeat} subtitle="Clients récurrents" />
        <KPICard title="Taux de churn" value="8.5%" change={-2.1} icon={Users} subtitle="Perte mensuelle" />
        <KPICard title="Conversion" value="8.5%" change={3.8} icon={Target} subtitle="Visiteur → Client" />
      </div>

      {/* Revenue by segment + RFM Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Revenus par segment
            </CardTitle>
            <CardDescription>Contribution au chiffre d'affaires par segment client</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueBySegment}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value.toLocaleString('fr-FR')} €`, 'Revenus']}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {revenueBySegment.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Répartition RFM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={rfmDistribution}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {rfmDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Évolution mensuelle
          </CardTitle>
          <CardDescription>Nouveaux clients vs récurrents et revenus</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="left" type="monotone" dataKey="newCustomers" name="Nouveaux clients" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 4 }} />
              <Line yAxisId="left" type="monotone" dataKey="returning" name="Récurrents" stroke={COLORS[1]} strokeWidth={2} dot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenus (€)" stroke={COLORS[2]} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cohort Analysis */}
      <CohortAnalysisChart />

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Funnel de conversion client
          </CardTitle>
          <CardDescription>Du visiteur au client fidèle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {funnelData.map((step, i) => {
              const widthPercent = (step.value / funnelData[0].value) * 100;
              const convRate = i > 0 ? ((step.value / funnelData[i - 1].value) * 100).toFixed(1) : '100';
              return (
                <div key={step.name} className="flex items-center gap-4">
                  <div className="w-28 text-sm font-medium text-right shrink-0">{step.name}</div>
                  <div className="flex-1 relative">
                    <div
                      className="h-10 rounded-lg flex items-center px-3 transition-all"
                      style={{
                        width: `${Math.max(widthPercent, 8)}%`,
                        backgroundColor: step.fill,
                        opacity: 0.85
                      }}
                    >
                      <span className="text-sm font-semibold text-white">
                        {step.value.toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <div className="w-16 text-xs text-muted-foreground shrink-0">
                    {i > 0 && `${convRate}%`}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
