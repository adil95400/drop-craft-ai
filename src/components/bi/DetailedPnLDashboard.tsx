import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinancialManagement } from '@/hooks/useFinancialManagement';
import { useBusinessMetrics } from '@/hooks/useBIMetrics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Receipt, Truck, RotateCcw, Percent, FileText, Package, BarChart3, Layers
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Line
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

const OVERHEAD_RATE = 0.13; // 13% estimated overhead (shipping commissions etc.)

export function DetailedPnLDashboard() {
  const { pnl, monthlyBreakdown, expensesByCategory } = useFinancialManagement();
  const { data: metrics } = useBusinessMetrics('30d');
  const { user } = useAuth();

  // Fetch products with cost data for per-product P&L
  const { data: productsWithCost, isLoading: loadingProducts } = useQuery({
    queryKey: ['pnl-products', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, price, cost_price, stock_quantity, status, category, view_count')
        .eq('user_id', user!.id)
        .not('cost_price', 'is', null)
        .gt('cost_price', 0)
        .order('view_count', { ascending: false, nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // ── COGS & Waterfall calculations ──
  const cogsData = useMemo(() => {
    if (!productsWithCost?.length) return null;

    // Estimate COGS from total orders: avg cost * order count
    const avgCost = productsWithCost.reduce((s, p) => s + (p.cost_price || 0), 0) / productsWithCost.length;
    const estimatedUnitsSold = pnl.orderCount > 0 ? pnl.orderCount : 0;
    const totalCOGS = avgCost * estimatedUnitsSold;

    const revenue = pnl.revenue;
    const grossProfit = revenue - totalCOGS;
    const overhead = revenue * OVERHEAD_RATE;
    const opex = pnl.expenses;
    const refunds = pnl.refunds;
    const netProfit = grossProfit - overhead - opex - refunds;

    return { totalCOGS, grossProfit, overhead, opex, refunds, netProfit, revenue };
  }, [productsWithCost, pnl]);

  // Waterfall chart data
  const waterfallData = useMemo(() => {
    if (!cogsData) return [];
    const { revenue, totalCOGS, grossProfit, overhead, opex, refunds, netProfit } = cogsData;
    return [
      { name: 'CA Brut', value: revenue, fill: 'hsl(var(--primary))' },
      { name: 'COGS', value: -totalCOGS, fill: 'hsl(var(--destructive))' },
      { name: 'Marge Brute', value: grossProfit, fill: 'hsl(160 60% 45%)' },
      { name: 'Frais (~13%)', value: -overhead, fill: 'hsl(30 80% 55%)' },
      { name: 'OPEX', value: -opex, fill: 'hsl(var(--destructive))' },
      { name: 'Remboursements', value: -refunds, fill: 'hsl(280 60% 55%)' },
      { name: 'Résultat Net', value: netProfit, fill: netProfit >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' },
    ];
  }, [cogsData]);

  // Per-product profitability
  const productProfitability = useMemo(() => {
    if (!productsWithCost?.length) return [];
    return productsWithCost.map(p => {
      const cost = p.cost_price || 0;
      const price = p.price || 0;
      const unitMargin = price - cost;
      const marginPct = price > 0 ? ((unitMargin - (price * OVERHEAD_RATE)) / price) * 100 : 0;
      const netPerUnit = unitMargin - (price * OVERHEAD_RATE);

      return {
        id: p.id,
        title: p.title || 'Sans titre',
        category: p.category || '—',
        price,
        cost,
        unitMargin,
        netPerUnit,
        margin: marginPct,
        stock: p.stock_quantity || 0,
        status: marginPct < 5 ? 'danger' as const : marginPct < 15 ? 'warning' as const : 'healthy' as const,
      };
    }).sort((a, b) => b.netPerUnit - a.netPerUnit);
  }, [productsWithCost]);

  // P&L line items enhanced with COGS
  const pnlLines = useMemo(() => {
    const cogs = cogsData?.totalCOGS || 0;
    const grossProfit = cogsData?.grossProfit || (pnl.revenue - cogs);
    const overhead = cogsData?.overhead || 0;

    return [
      { label: 'Chiffre d\'affaires brut', value: pnl.revenue, type: 'revenue' as const, icon: DollarSign },
      { label: 'Remboursements', value: -pnl.refunds, type: 'deduction' as const, icon: RotateCcw },
      { label: 'CA Net', value: pnl.revenue - pnl.refunds, type: 'subtotal' as const, icon: TrendingUp },
      { label: 'Coût des marchandises (COGS)', value: -cogs, type: 'expense' as const, icon: Package },
      { label: 'Marge Brute', value: grossProfit, type: 'subtotal' as const, icon: TrendingUp },
      { label: 'Frais estimés (~13%)', value: -overhead, type: 'expense' as const, icon: Truck },
      { label: 'Dépenses opérationnelles', value: -pnl.expenses, type: 'expense' as const, icon: Receipt },
      { label: 'Taxes collectées', value: pnl.taxes, type: 'info' as const, icon: Percent },
      { label: 'Résultat net', value: cogsData?.netProfit ?? pnl.netProfit, type: 'total' as const, icon: (cogsData?.netProfit ?? pnl.netProfit) >= 0 ? TrendingUp : TrendingDown },
    ];
  }, [pnl, cogsData]);

  const expensePieData = expensesByCategory.map((e, i) => ({
    name: e.category || 'Autre',
    value: e.amount,
    color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
  }));

  const marginData = monthlyBreakdown.map(m => ({
    month: m.month,
    margin: m.revenue > 0 ? ((m.profit / m.revenue) * 100) : 0,
    revenue: m.revenue,
    profit: m.profit,
  }));

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'CA Mensuel', value: fmt(pnl.revenue), change: pnl.revenueGrowth, icon: DollarSign },
          { label: 'COGS', value: fmt(cogsData?.totalCOGS || 0), icon: Package },
          { label: 'Marge Brute', value: fmt(cogsData?.grossProfit || 0), icon: Layers, highlight: true },
          { label: 'Résultat Net', value: fmt(cogsData?.netProfit ?? pnl.netProfit), icon: (cogsData?.netProfit ?? pnl.netProfit) >= 0 ? TrendingUp : TrendingDown, highlight: true },
          { label: 'Marge Nette', value: `${pnl.margin.toFixed(1)}%`, icon: Percent, highlight: pnl.margin >= 20 },
        ].map((kpi, i) => (
          <Card key={i} className={kpi.highlight ? 'border-primary/30 bg-primary/5' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-muted text-primary">
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

      <Tabs defaultValue="statement" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="statement" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" />Compte de Résultat</TabsTrigger>
          <TabsTrigger value="waterfall" className="gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" />Cascade</TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5 text-xs"><Package className="h-3.5 w-3.5" />Produits</TabsTrigger>
          <TabsTrigger value="trends" className="gap-1.5 text-xs"><TrendingUp className="h-3.5 w-3.5" />Tendances</TabsTrigger>
        </TabsList>

        {/* ── STATEMENT TAB ── */}
        <TabsContent value="statement">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Compte de Résultat Détaillé
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
                        line.type === 'total' ? 'bg-primary/10 font-bold text-lg mt-2 border-t-2' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <line.icon className={`h-4 w-4 ${
                          line.type === 'expense' || line.type === 'deduction' ? 'text-destructive' :
                          line.type === 'revenue' ? 'text-primary' :
                          line.type === 'total' && line.value >= 0 ? 'text-primary' :
                          line.type === 'total' ? 'text-destructive' : 'text-muted-foreground'
                        }`} />
                        <span>{line.label}</span>
                      </div>
                      <span className={`font-mono ${line.value < 0 ? 'text-destructive' : line.type === 'total' && line.value >= 0 ? 'text-primary' : ''}`}>
                        {fmt(line.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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
        </TabsContent>

        {/* ── WATERFALL TAB ── */}
        <TabsContent value="waterfall">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Cascade de Profit — Du CA au Résultat Net
              </CardTitle>
            </CardHeader>
            <CardContent>
              {waterfallData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v / 1000).toFixed(0)}k€`} />
                    <Tooltip formatter={(v: number) => fmt(Math.abs(v))} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {waterfallData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground text-sm">
                  <Package className="h-8 w-8 mb-2 opacity-50" />
                  Ajoutez des prix d'achat à vos produits pour visualiser la cascade
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PRODUCTS P&L TAB ── */}
        <TabsContent value="products">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Rentabilité par Produit
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : productProfitability.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead className="text-right">Prix</TableHead>
                        <TableHead className="text-right">Coût</TableHead>
                        <TableHead className="text-right">Marge/u</TableHead>
                        <TableHead className="text-right">Net/u</TableHead>
                        <TableHead className="text-right">Marge %</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productProfitability.slice(0, 20).map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="max-w-[200px] truncate font-medium">{p.title}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(p.price)}</TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">{fmt(p.cost)}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(p.unitMargin)}</TableCell>
                          <TableCell className={`text-right font-mono ${p.netPerUnit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                            {fmt(p.netPerUnit)}
                          </TableCell>
                          <TableCell className={`text-right font-mono ${p.margin >= 15 ? 'text-primary' : p.margin >= 5 ? 'text-yellow-600' : 'text-destructive'}`}>
                            {p.margin.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            <Badge variant={p.status === 'healthy' ? 'default' : p.status === 'warning' ? 'secondary' : 'destructive'} className="text-xs">
                              {p.status === 'healthy' ? '✓' : p.status === 'warning' ? '⚠' : '✗'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm">
                  <Package className="h-8 w-8 mb-2 opacity-50" />
                  Aucun produit avec prix d'achat renseigné
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TRENDS TAB ── */}
        <TabsContent value="trends">
          <div className="grid grid-cols-1 gap-6">
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
                    <Tooltip formatter={(v: number, name: string) => name === 'margin' ? `${v.toFixed(1)}%` : fmt(v)} />
                    <Area type="monotone" dataKey="margin" stroke="hsl(var(--primary))" fill="url(#marginGrad)" strokeWidth={2} name="Marge %" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Revenus vs COGS vs Profit (6 mois)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={monthlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="revenue" name="Revenus" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="COGS + OPEX" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="profit" name="Profit Net" stroke="hsl(160 60% 45%)" strokeWidth={2.5} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
