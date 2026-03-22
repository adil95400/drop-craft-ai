import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { useFinancialManagement } from '@/hooks/useFinancialManagement';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  DollarSign, TrendingUp, TrendingDown, Receipt, Plus, Trash2,
  ArrowUpRight, ArrowDownRight, PieChart, Calculator, Package,
  Truck, Target, ShoppingBag, Wallet, BarChart3, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, AreaChart, Area, PieChart as RePieChart, Pie, Cell
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CATEGORIES = [
  { value: 'advertising', label: 'Publicité' },
  { value: 'shipping', label: 'Expédition' },
  { value: 'supplier', label: 'Fournisseur' },
  { value: 'platform_fee', label: 'Frais plateforme' },
  { value: 'subscription', label: 'Abonnement' },
  { value: 'tax', label: 'Taxe' },
  { value: 'refund', label: 'Remboursement' },
  { value: 'other', label: 'Autre' },
];

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--destructive))',
];

export default function FinancialHubPage() {
  const { t: tPages } = useTranslation('pages');
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const {
    transactions, pnl, monthlyBreakdown, expensesByCategory,
    taxConfigs, addTransaction, deleteTransaction, addTaxConfig
  } = useFinancialManagement();

  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [taxDialogOpen, setTaxDialogOpen] = useState(false);
  const [newTx, setNewTx] = useState({
    transaction_type: 'expense', category: 'other', description: '',
    amount: '', transaction_date: format(new Date(), 'yyyy-MM-dd'), notes: ''
  });
  const [newTax, setNewTax] = useState({ tax_name: '', tax_rate: '', country: 'France' });

  // Fetch products for COGS & product profitability
  const { data: products = [] } = useQuery({
    queryKey: ['finance-products', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('products')
        .select('id, title, price, cost_price, stock_quantity, status')
        .eq('user_id', user.id)
        .not('price', 'is', null)
        .order('price', { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!user,
  });

  // Compute product-level profitability
  const productProfitability = useMemo(() => {
    return products
      .filter((p: any) => p.price && p.cost_price)
      .map((p: any) => {
        const margin = p.price - (p.cost_price || 0);
        const marginPct = p.price > 0 ? (margin / p.price) * 100 : 0;
        return { ...p, margin, marginPct };
      })
      .sort((a: any, b: any) => b.marginPct - a.marginPct)
      .slice(0, 20);
  }, [products]);

  // COGS summary
  const cogsSummary = useMemo(() => {
    const totalCOGS = products.reduce((sum: number, p: any) =>
      sum + ((p.cost_price || 0) * (p.stock_quantity || 0)), 0);
    const totalRetailValue = products.reduce((sum: number, p: any) =>
      sum + ((p.price || 0) * (p.stock_quantity || 0)), 0);
    const potentialProfit = totalRetailValue - totalCOGS;
    const avgMargin = totalRetailValue > 0 ? (potentialProfit / totalRetailValue) * 100 : 0;

    return { totalCOGS, totalRetailValue, potentialProfit, avgMargin, productCount: products.length };
  }, [products]);

  // Cash flow projection (simple: revenue trend + expenses)
  const cashFlowData = useMemo(() => {
    return monthlyBreakdown.map((m, i) => ({
      ...m,
      cashFlow: m.revenue - m.expenses,
      cumulativeCashFlow: monthlyBreakdown.slice(0, i + 1).reduce((s, d) => s + d.revenue - d.expenses, 0),
    }));
  }, [monthlyBreakdown]);

  // Gross vs Net margin calculation
  const grossProfit = pnl.revenue - cogsSummary.totalCOGS;
  const grossMargin = pnl.revenue > 0 ? (grossProfit / pnl.revenue) * 100 : 0;

  const handleAddTx = () => {
    if (!newTx.amount) return;
    addTransaction.mutate({
      ...newTx,
      amount: parseFloat(newTx.amount),
      transaction_date: newTx.transaction_date,
    }, {
      onSuccess: () => {
        setTxDialogOpen(false);
        setNewTx({ transaction_type: 'expense', category: 'other', description: '', amount: '', transaction_date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
      },
    });
  };

  const handleAddTax = () => {
    if (!newTax.tax_name || !newTax.tax_rate) return;
    addTaxConfig.mutate({
      tax_name: newTax.tax_name,
      tax_rate: parseFloat(newTax.tax_rate),
      country: newTax.country,
    }, {
      onSuccess: () => {
        setTaxDialogOpen(false);
        setNewTax({ tax_name: '', tax_rate: '', country: 'France' });
      },
    });
  };

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  return (
    <ChannablePageWrapper
      title={tPages('gestionFinanciere.title', 'Financial Command Center')}
      description={tPages('gestionFinanciere.description', 'P&L, costs, margins, taxes & cash flow')}
      heroImage="analytics"
      badge={{ label: 'Finance', icon: DollarSign }}
    >
      {/* ===== TOP KPI STRIP ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: t('revenue', 'Revenue'), value: fmt(pnl.revenue), icon: DollarSign, trend: pnl.revenueGrowth, positive: true },
          { label: t('cogs', 'COGS'), value: fmt(cogsSummary.totalCOGS), icon: Package, positive: false },
          { label: t('grossProfit', 'Gross Profit'), value: fmt(grossProfit), icon: TrendingUp, positive: grossProfit >= 0 },
          { label: t('grossMargin', 'Gross Margin'), value: `${grossMargin.toFixed(1)}%`, icon: PieChart, positive: grossMargin >= 20 },
          { label: t('expenses', 'Expenses'), value: fmt(pnl.expenses), icon: TrendingDown, positive: false },
          { label: t('netProfit', 'Net Profit'), value: fmt(pnl.netProfit), icon: Wallet, positive: pnl.netProfit >= 0 },
          { label: t('netMargin', 'Net Margin'), value: `${pnl.margin.toFixed(1)}%`, icon: Target, positive: pnl.margin >= 10 },
          { label: t('orders', 'Orders'), value: pnl.orderCount.toString(), icon: ShoppingBag, positive: true },
        ].map((kpi, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <kpi.icon className={`h-3.5 w-3.5 ${kpi.positive ? 'text-success' : 'text-destructive'}`} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
              </div>
              <p className="text-lg font-bold font-mono">{kpi.value}</p>
              {kpi.trend !== undefined && (
                <div className={`flex items-center gap-0.5 text-[10px] mt-0.5 ${kpi.trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {kpi.trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(kpi.trend).toFixed(1)}%
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ===== P&L WATERFALL SUMMARY ===== */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {t('pnlSummary', 'Profit & Loss Summary')}
          </CardTitle>
          <CardDescription>{t('currentMonth', 'Current month breakdown')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { label: t('revenue', 'Revenue'), value: pnl.revenue, color: 'bg-success' },
              { label: '−', value: null, color: '' },
              { label: 'COGS', value: cogsSummary.totalCOGS, color: 'bg-chart-1' },
              { label: '=', value: null, color: '' },
              { label: t('grossProfit', 'Gross Profit'), value: grossProfit, color: grossProfit >= 0 ? 'bg-success/80' : 'bg-destructive' },
              { label: '−', value: null, color: '' },
              { label: t('opex', 'OpEx'), value: pnl.expenses, color: 'bg-destructive/80' },
              { label: '−', value: null, color: '' },
              { label: t('taxes', 'Taxes'), value: pnl.taxes, color: 'bg-warning' },
              { label: '−', value: null, color: '' },
              { label: t('refunds', 'Refunds'), value: pnl.refunds, color: 'bg-destructive' },
              { label: '=', value: null, color: '' },
              { label: t('netProfit', 'Net Profit'), value: pnl.netProfit, color: pnl.netProfit >= 0 ? 'bg-success' : 'bg-destructive' },
            ].map((item, i) => (
              item.value === null ? (
                <span key={i} className="text-lg font-bold text-muted-foreground flex-shrink-0">{item.label}</span>
              ) : (
                <div key={i} className="flex-shrink-0 min-w-[100px]">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">{item.label}</p>
                  <div className={`${item.color} text-white rounded-md px-3 py-2 text-center`}>
                    <span className="font-mono font-bold text-sm">{fmt(item.value)}</span>
                  </div>
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== MAIN TABS ===== */}
      <Tabs defaultValue="pnl" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="pnl">P&L</TabsTrigger>
          <TabsTrigger value="products">{t('productProfitability', 'Product Profitability')}</TabsTrigger>
          <TabsTrigger value="cashflow">{t('cashFlow', 'Cash Flow')}</TabsTrigger>
          <TabsTrigger value="transactions">{t('transactions', 'Transactions')}</TabsTrigger>
          <TabsTrigger value="expenses">{t('expenses', 'Expenses')}</TabsTrigger>
          <TabsTrigger value="taxes">{t('taxes', 'Taxes')}</TabsTrigger>
        </TabsList>

        {/* ===== P&L CHART ===== */}
        <TabsContent value="pnl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('sixMonthEvolution', '6-Month Evolution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Bar dataKey="revenue" name={t('revenue', 'Revenue')} fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name={t('expenses', 'Expenses')} fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name={t('profit', 'Profit')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== PRODUCT PROFITABILITY ===== */}
        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">{t('totalProducts', 'Total Products')}</p>
              <p className="text-2xl font-bold">{cogsSummary.productCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">{t('inventoryValue', 'Inventory Value')}</p>
              <p className="text-2xl font-bold font-mono">{fmt(cogsSummary.totalRetailValue)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">COGS</p>
              <p className="text-2xl font-bold font-mono">{fmt(cogsSummary.totalCOGS)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">{t('avgMargin', 'Avg Margin')}</p>
              <p className={`text-2xl font-bold ${cogsSummary.avgMargin >= 30 ? 'text-success' : cogsSummary.avgMargin >= 15 ? 'text-warning' : 'text-destructive'}`}>
                {cogsSummary.avgMargin.toFixed(1)}%
              </p>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('topProductsByMargin', 'Top Products by Margin')}</CardTitle>
              <CardDescription>{t('top20', 'Top 20 products with cost data')}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">{t('product', 'Product')}</th>
                      <th className="text-right p-3 font-medium">{t('costPrice', 'Cost')}</th>
                      <th className="text-right p-3 font-medium">{t('sellingPrice', 'Price')}</th>
                      <th className="text-right p-3 font-medium">{t('margin', 'Margin')}</th>
                      <th className="text-right p-3 font-medium">%</th>
                      <th className="text-right p-3 font-medium">{t('stock', 'Stock')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productProfitability.length === 0 && (
                      <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">{t('noProductsWithCost', 'No products with cost data')}</td></tr>
                    )}
                    {productProfitability.map((p: any) => (
                      <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 truncate max-w-[250px]">{p.title}</td>
                        <td className="p-3 text-right font-mono text-muted-foreground">{fmt(p.cost_price)}</td>
                        <td className="p-3 text-right font-mono">{fmt(p.price)}</td>
                        <td className="p-3 text-right font-mono font-medium text-success">{fmt(p.margin)}</td>
                        <td className="p-3 text-right">
                          <Badge variant={p.marginPct >= 30 ? 'default' : p.marginPct >= 15 ? 'secondary' : 'destructive'}>
                            {p.marginPct.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-mono">{p.stock_quantity ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== CASH FLOW ===== */}
        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('cashFlowEvolution', 'Cash Flow Evolution')}</CardTitle>
              <CardDescription>{t('cumulativeCashFlow', 'Monthly and cumulative cash flow')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="cashFlow" name={t('monthlyCashFlow', 'Monthly Cash Flow')} stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                    <Area type="monotone" dataKey="cumulativeCashFlow" name={t('cumulative', 'Cumulative')} stroke="hsl(var(--success))" fill="hsl(var(--success) / 0.1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">{t('monthlySummary', 'Monthly Summary')}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: t('revenue', 'Revenue'), value: pnl.revenue, color: 'text-success' },
                  { label: t('expenses', 'Expenses'), value: pnl.expenses, color: 'text-destructive' },
                  { label: t('taxes', 'Taxes'), value: pnl.taxes, color: 'text-warning' },
                  { label: t('shipping', 'Shipping'), value: pnl.shipping, color: 'text-muted-foreground' },
                  { label: t('refunds', 'Refunds'), value: pnl.refunds, color: 'text-destructive' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className={`font-mono font-medium ${item.color}`}>{fmt(item.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t-2 border-primary/20">
                  <span className="font-semibold">{t('netProfit', 'Net Profit')}</span>
                  <span className={`font-mono font-bold text-lg ${pnl.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {fmt(pnl.netProfit)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">{t('avgOrderValue', 'Average Order')}</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <Receipt className="h-10 w-10 text-primary mb-3 opacity-50" />
                <p className="text-4xl font-bold font-mono">{fmt(pnl.avgOrderValue)}</p>
                <p className="text-sm text-muted-foreground mt-2">{pnl.orderCount} {t('orders', 'orders')} {t('thisMonth', 'this month')}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== TRANSACTIONS ===== */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />{t('addTransaction', 'Add Transaction')}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{t('newTransaction', 'New Transaction')}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Select value={newTx.transaction_type} onValueChange={v => setNewTx(p => ({ ...p, transaction_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">{t('expense', 'Expense')}</SelectItem>
                      <SelectItem value="revenue">{t('revenue', 'Revenue')}</SelectItem>
                      <SelectItem value="refund">{t('refund', 'Refund')}</SelectItem>
                      <SelectItem value="tax">{t('tax', 'Tax')}</SelectItem>
                      <SelectItem value="fee">{t('fee', 'Fee')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newTx.category} onValueChange={v => setNewTx(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input placeholder={t('description', 'Description')} value={newTx.description} onChange={e => setNewTx(p => ({ ...p, description: e.target.value }))} />
                  <Input type="number" placeholder={t('amount', 'Amount (€)')} value={newTx.amount} onChange={e => setNewTx(p => ({ ...p, amount: e.target.value }))} />
                  <Input type="date" value={newTx.transaction_date} onChange={e => setNewTx(p => ({ ...p, transaction_date: e.target.value }))} />
                  <Textarea placeholder="Notes" value={newTx.notes} onChange={e => setNewTx(p => ({ ...p, notes: e.target.value }))} rows={2} />
                  <Button onClick={handleAddTx} disabled={addTransaction.isPending} className="w-full">
                    {addTransaction.isPending ? t('adding', 'Adding...') : t('add', 'Add')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">{t('date', 'Date')}</th>
                      <th className="text-left p-3 font-medium">{t('type', 'Type')}</th>
                      <th className="text-left p-3 font-medium">{t('category', 'Category')}</th>
                      <th className="text-left p-3 font-medium">{t('description', 'Description')}</th>
                      <th className="text-right p-3 font-medium">{t('amount', 'Amount')}</th>
                      <th className="text-center p-3 font-medium">{t('actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.data?.length === 0 && (
                      <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">{t('noTransactions', 'No transactions recorded')}</td></tr>
                    )}
                    {transactions.data?.map(tx => (
                      <tr key={tx.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-muted-foreground text-xs">
                          {format(new Date(tx.transaction_date), 'dd MMM yyyy', { locale: fr })}
                        </td>
                        <td className="p-3">
                          <Badge variant={tx.transaction_type === 'expense' ? 'destructive' : tx.transaction_type === 'revenue' ? 'default' : 'secondary'}>
                            {tx.transaction_type}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground capitalize">
                          {CATEGORIES.find(c => c.value === tx.category)?.label ?? tx.category}
                        </td>
                        <td className="p-3 truncate max-w-[200px]">{tx.description ?? '—'}</td>
                        <td className={`p-3 text-right font-mono font-medium ${tx.transaction_type === 'expense' || tx.transaction_type === 'refund' ? 'text-destructive' : 'text-success'}`}>
                          {tx.transaction_type === 'expense' || tx.transaction_type === 'refund' ? '-' : '+'}{fmt(Math.abs(tx.amount))}
                        </td>
                        <td className="p-3 text-center">
                          <Button variant="ghost" size="icon" onClick={() => deleteTransaction.mutate(tx.id)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== EXPENSE BREAKDOWN ===== */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">{t('byCategory', 'By Category')}</CardTitle></CardHeader>
              <CardContent>
                {expensesByCategory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">{t('noExpenses', 'No expenses recorded')}</p>
                ) : (
                  <>
                    <div className="h-[200px] mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={expensesByCategory.map((c, i) => ({ ...c, color: CHART_COLORS[i % CHART_COLORS.length] }))}
                            cx="50%" cy="50%"
                            innerRadius={50} outerRadius={80}
                            paddingAngle={2}
                            dataKey="amount"
                            nameKey="category"
                          >
                            {expensesByCategory.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => fmt(v)} />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {expensesByCategory.map((cat, i) => {
                        const total = expensesByCategory.reduce((s, c) => s + c.amount, 0);
                        const pct = total > 0 ? (cat.amount / total) * 100 : 0;
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                <span className="capitalize">{CATEGORIES.find(c => c.value === cat.category)?.label ?? cat.category}</span>
                              </div>
                              <span className="font-mono font-medium">{fmt(cat.amount)}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">{t('monthlySummary', 'Monthly Summary')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: t('revenue', 'Revenue'), value: pnl.revenue, color: 'text-success' },
                  { label: t('expenses', 'Expenses'), value: pnl.expenses, color: 'text-destructive' },
                  { label: t('taxes', 'Taxes'), value: pnl.taxes, color: 'text-warning' },
                  { label: t('shipping', 'Shipping'), value: pnl.shipping, color: 'text-muted-foreground' },
                  { label: t('refunds', 'Refunds'), value: pnl.refunds, color: 'text-destructive' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className={`font-mono font-medium ${item.color}`}>{fmt(item.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t-2 border-primary/20">
                  <span className="font-semibold">{t('netProfit', 'Net Profit')}</span>
                  <span className={`font-mono font-bold text-lg ${pnl.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {fmt(pnl.netProfit)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== TAX CONFIG ===== */}
        <TabsContent value="taxes" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={taxDialogOpen} onOpenChange={setTaxDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />{t('addTax', 'Add Tax')}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{t('newTaxConfig', 'New Tax Configuration')}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder={t('taxName', 'Name (e.g. VAT 20%)')} value={newTax.tax_name} onChange={e => setNewTax(p => ({ ...p, tax_name: e.target.value }))} />
                  <Input type="number" placeholder={t('rate', 'Rate (%)')} value={newTax.tax_rate} onChange={e => setNewTax(p => ({ ...p, tax_rate: e.target.value }))} />
                  <Input placeholder={t('country', 'Country')} value={newTax.country} onChange={e => setNewTax(p => ({ ...p, country: e.target.value }))} />
                  <Button onClick={handleAddTax} disabled={addTaxConfig.isPending} className="w-full">
                    {addTaxConfig.isPending ? t('adding', 'Adding...') : t('add', 'Add')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {taxConfigs.data?.map(tc => (
              <Card key={tc.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{tc.tax_name}</p>
                      <p className="text-2xl font-bold text-primary mt-1">{tc.tax_rate}%</p>
                    </div>
                    <Badge variant={tc.is_active ? 'default' : 'secondary'}>
                      {tc.is_active ? t('active', 'Active') : t('inactive', 'Inactive')}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-3 text-xs text-muted-foreground">
                    {tc.country && <span>{tc.country}</span>}
                    {tc.applies_to && <span>• {tc.applies_to}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!taxConfigs.data || taxConfigs.data.length === 0) && (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Calculator className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>{t('noTaxConfig', 'No tax configuration')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
