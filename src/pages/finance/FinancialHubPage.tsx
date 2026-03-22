import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { DollarSign, TrendingUp, TrendingDown, Receipt, Plus, Trash2, ArrowUpRight, ArrowDownRight, PieChart, Calculator } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

export default function FinancialHubPage() {
  const { transactions, pnl, monthlyBreakdown, expensesByCategory, taxConfigs, addTransaction, deleteTransaction, addTaxConfig } = useFinancialManagement();
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [taxDialogOpen, setTaxDialogOpen] = useState(false);
  const [newTx, setNewTx] = useState({ transaction_type: 'expense', category: 'other', description: '', amount: '', transaction_date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
  const [newTax, setNewTax] = useState({ tax_name: '', tax_rate: '', country: 'France' });

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

    const { t: tPages } = useTranslation('pages');

  return (
    <ChannablePageWrapper
      title={tPages('gestionFinanciere.title')}
      description="P&L, dépenses, taxes et prévisions de trésorerie"
      heroImage="analytics"
      badge={{ label: 'Finance', icon: DollarSign }}
    >
      {/* P&L KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Chiffre d\'affaires', value: fmt(pnl.revenue), icon: DollarSign, trend: pnl.revenueGrowth, color: 'text-success' },
          { label: 'Dépenses', value: fmt(pnl.expenses), icon: TrendingDown, color: 'text-destructive' },
          { label: 'Bénéfice net', value: fmt(pnl.netProfit), icon: TrendingUp, color: pnl.netProfit >= 0 ? 'text-success' : 'text-destructive' },
          { label: 'Marge', value: `${pnl.margin.toFixed(1)}%`, icon: PieChart, color: pnl.margin >= 20 ? 'text-success' : 'text-warning' },
          { label: 'Commandes', value: pnl.orderCount.toString(), icon: Receipt, color: 'text-primary' },
          { label: 'Panier moyen', value: fmt(pnl.avgOrderValue), icon: Calculator, color: 'text-primary' },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-lg font-bold">{kpi.value}</p>
              {kpi.trend !== undefined && (
                <div className={`flex items-center gap-1 text-xs mt-1 ${kpi.trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {kpi.trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(kpi.trend).toFixed(1)}% vs mois précédent
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pnl" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pnl">P&L</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="expenses">Dépenses</TabsTrigger>
          <TabsTrigger value="taxes">Taxes</TabsTrigger>
        </TabsList>

        {/* P&L Chart */}
        <TabsContent value="pnl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Évolution sur 6 mois</CardTitle>
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
                    <Bar dataKey="revenue" name="CA" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Dépenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Bénéfice" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Ajouter une transaction</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouvelle transaction</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Select value={newTx.transaction_type} onValueChange={v => setNewTx(p => ({ ...p, transaction_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Dépense</SelectItem>
                      <SelectItem value="revenue">Revenu</SelectItem>
                      <SelectItem value="refund">Remboursement</SelectItem>
                      <SelectItem value="tax">Taxe</SelectItem>
                      <SelectItem value="fee">Frais</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newTx.category} onValueChange={v => setNewTx(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Description" value={newTx.description} onChange={e => setNewTx(p => ({ ...p, description: e.target.value }))} />
                  <Input type="number" placeholder="Montant (€)" value={newTx.amount} onChange={e => setNewTx(p => ({ ...p, amount: e.target.value }))} />
                  <Input type="date" value={newTx.transaction_date} onChange={e => setNewTx(p => ({ ...p, transaction_date: e.target.value }))} />
                  <Textarea placeholder="Notes" value={newTx.notes} onChange={e => setNewTx(p => ({ ...p, notes: e.target.value }))} rows={2} />
                  <Button onClick={handleAddTx} disabled={addTransaction.isPending} className="w-full">
                    {addTransaction.isPending ? 'Ajout...' : 'Ajouter'}
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
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Catégorie</th>
                      <th className="text-left p-3 font-medium">Description</th>
                      <th className="text-right p-3 font-medium">Montant</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.data?.length === 0 && (
                      <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">Aucune transaction enregistrée</td></tr>
                    )}
                    {transactions.data?.map(tx => (
                      <tr key={tx.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-muted-foreground text-xs">
                          {format(new Date(tx.transaction_date), 'dd MMM yyyy', { locale: fr })}
                        </td>
                        <td className="p-3">
                          <Badge variant={tx.transaction_type === 'expense' ? 'destructive' : tx.transaction_type === 'revenue' ? 'default' : 'secondary'}>
                            {tx.transaction_type === 'expense' ? 'Dépense' : tx.transaction_type === 'revenue' ? 'Revenu' : tx.transaction_type === 'refund' ? 'Rembours.' : tx.transaction_type}
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

        {/* Expense Breakdown */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Répartition par catégorie</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {expensesByCategory.length === 0 && (
                  <p className="text-muted-foreground text-center py-6">Aucune dépense enregistrée</p>
                )}
                {expensesByCategory.map((cat, i) => {
                  const total = expensesByCategory.reduce((s, c) => s + c.amount, 0);
                  const pct = total > 0 ? (cat.amount / total) * 100 : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{CATEGORIES.find(c => c.value === cat.category)?.label ?? cat.category}</span>
                        <span className="font-mono font-medium">{fmt(cat.amount)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">{pct.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Résumé mensuel</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Revenus', value: pnl.revenue, color: 'text-success' },
                  { label: 'Dépenses', value: pnl.expenses, color: 'text-destructive' },
                  { label: 'Taxes collectées', value: pnl.taxes, color: 'text-warning' },
                  { label: 'Frais d\'expédition', value: pnl.shipping, color: 'text-muted-foreground' },
                  { label: 'Remboursements', value: pnl.refunds, color: 'text-destructive' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className={`font-mono font-medium ${item.color}`}>{fmt(item.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t-2 border-primary/20">
                  <span className="font-semibold">Bénéfice net</span>
                  <span className={`font-mono font-bold text-lg ${pnl.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {fmt(pnl.netProfit)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tax Config */}
        <TabsContent value="taxes" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={taxDialogOpen} onOpenChange={setTaxDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Ajouter une taxe</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouvelle configuration fiscale</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Nom (ex: TVA 20%)" value={newTax.tax_name} onChange={e => setNewTax(p => ({ ...p, tax_name: e.target.value }))} />
                  <Input type="number" placeholder="Taux (%)" value={newTax.tax_rate} onChange={e => setNewTax(p => ({ ...p, tax_rate: e.target.value }))} />
                  <Input placeholder="Pays" value={newTax.country} onChange={e => setNewTax(p => ({ ...p, country: e.target.value }))} />
                  <Button onClick={handleAddTax} disabled={addTaxConfig.isPending} className="w-full">
                    {addTaxConfig.isPending ? 'Ajout...' : 'Ajouter'}
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
                      {tc.is_active ? 'Active' : 'Inactive'}
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
                  <p>Aucune configuration fiscale</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
