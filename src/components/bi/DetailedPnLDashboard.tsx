import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancialManagement } from '@/hooks/useFinancialManagement';
import { useBusinessMetrics } from '@/hooks/useBIMetrics';
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Receipt, Truck, RotateCcw, Percent, Download, FileText
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

const EXPENSE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(var(--accent))',
  'hsl(220 70% 55%)',
  'hsl(280 60% 55%)',
  'hsl(160 60% 45%)',
  'hsl(30 80% 55%)',
  'hsl(var(--muted-foreground))',
];

export function DetailedPnLDashboard() {
  const { pnl, monthlyBreakdown, expensesByCategory } = useFinancialManagement();
  const { data: metrics } = useBusinessMetrics('30d');

  // P&L line items
  const pnlLines = useMemo(() => [
    { label: 'Chiffre d\'affaires brut', value: pnl.revenue, type: 'revenue' as const, icon: DollarSign },
    { label: 'Remboursements', value: -pnl.refunds, type: 'deduction' as const, icon: RotateCcw },
    { label: 'CA Net', value: pnl.revenue - pnl.refunds, type: 'subtotal' as const, icon: TrendingUp },
    { label: 'Dépenses opérationnelles', value: -pnl.expenses, type: 'expense' as const, icon: Receipt },
    { label: 'Frais de livraison', value: -pnl.shipping, type: 'expense' as const, icon: Truck },
    { label: 'Taxes collectées', value: pnl.taxes, type: 'info' as const, icon: Percent },
    { label: 'Résultat net', value: pnl.netProfit, type: 'total' as const, icon: pnl.netProfit >= 0 ? TrendingUp : TrendingDown },
  ], [pnl]);

  const expensePieData = expensesByCategory.map((e, i) => ({
    name: e.category || 'Autre',
    value: e.amount,
    color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
  }));

  // Margin analysis
  const marginData = monthlyBreakdown.map(m => ({
    month: m.month,
    margin: m.revenue > 0 ? ((m.profit / m.revenue) * 100) : 0,
    revenue: m.revenue,
    profit: m.profit,
  }));

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'CA Mensuel', value: fmt(pnl.revenue), change: pnl.revenueGrowth, icon: DollarSign },
          { label: 'Dépenses', value: fmt(pnl.expenses), icon: Receipt, negative: true },
          { label: 'Résultat Net', value: fmt(pnl.netProfit), icon: pnl.netProfit >= 0 ? TrendingUp : TrendingDown, highlight: true },
          { label: 'Marge Nette', value: `${pnl.margin.toFixed(1)}%`, icon: Percent, highlight: pnl.margin >= 20 },
        ].map((kpi, i) => (
          <Card key={i} className={kpi.highlight ? 'border-primary/30 bg-primary/5' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg bg-muted ${kpi.negative ? 'text-destructive' : 'text-primary'}`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-xl font-bold">{kpi.value}</p>
              {kpi.change !== undefined && (
                <div className={`flex items-center gap-1 text-xs mt-1 ${kpi.change >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {kpi.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {fmtPct(kpi.change)} vs mois précédent
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detailed P&L Statement */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Compte de Résultat
              </CardTitle>
              <Badge variant="secondary">Ce mois</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {pnlLines.map((line, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between py-2 px-3 rounded-md text-sm ${
                    line.type === 'subtotal' ? 'bg-muted font-semibold border-t border-b' :
                    line.type === 'total' ? 'bg-primary/10 font-bold text-lg mt-2 border-t-2' :
                    ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <line.icon className={`h-4 w-4 ${
                      line.type === 'expense' || line.type === 'deduction' ? 'text-destructive' :
                      line.type === 'revenue' ? 'text-primary' :
                      line.type === 'total' && line.value >= 0 ? 'text-primary' :
                      line.type === 'total' ? 'text-destructive' :
                      'text-muted-foreground'
                    }`} />
                    <span>{line.label}</span>
                  </div>
                  <span className={`font-mono ${
                    line.value < 0 ? 'text-destructive' : line.type === 'total' && line.value >= 0 ? 'text-primary' : ''
                  }`}>
                    {fmt(line.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Ventilation des dépenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expensePieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={expensePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {expensePieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {expensePieData.slice(0, 5).map((cat, i) => {
                    const total = expensePieData.reduce((s, e) => s + e.value, 0);
                    const pct = total > 0 ? (cat.value / total) * 100 : 0;
                    return (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="flex-1 truncate">{cat.name}</span>
                        <span className="font-mono text-muted-foreground">{fmt(cat.value)}</span>
                        <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground text-sm">
                <Receipt className="h-8 w-8 mb-2 opacity-50" />
                Aucune dépense enregistrée
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Margin Evolution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="h-4 w-4 text-primary" />
            Évolution de la marge nette (6 mois)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={marginData}>
              <defs>
                <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v.toFixed(0)}%`} />
              <Tooltip formatter={(v: number, name: string) => name === 'margin' ? `${v.toFixed(1)}%` : fmt(v)}
                labelFormatter={l => l} />
              <Area type="monotone" dataKey="margin" stroke="hsl(var(--primary))" fill="url(#marginGrad)" strokeWidth={2} name="Marge %" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* P&L Bar Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Revenus vs Dépenses (6 mois)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="revenue" name="Revenus" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Dépenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
