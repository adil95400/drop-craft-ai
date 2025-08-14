import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  PieChart, 
  Calendar,
  Download,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRealFinance } from '@/hooks/useRealFinance';
import { toast } from 'sonner';

export default function Finance() {
  const [dateRange, setDateRange] = useState('30d');
  const { financialData, stats, isLoading, error } = useRealFinance();

  if (isLoading) {
    return (
      <div className="container-fluid">
        <div className="text-center">Chargement des données financières...</div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="container-fluid">
        <div className="text-center">Aucune donnée financière disponible</div>
      </div>
    );
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-success';
    if (growth < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  return (
    <div className="container-fluid">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de Bord Financier</h1>
          <p className="text-muted-foreground">Suivez votre santé financière et vos performances</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="1y">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              toast.promise(
                new Promise((resolve) => {
                  setTimeout(() => {
                    const financeReport = `Category,Amount,Growth\nRevenue,${financialData.revenue.total},${financialData.revenue.growth}%\nExpenses,${financialData.expenses.total},${financialData.expenses.growth}%\nNet Profit,${financialData.profit.net},12%\nCash Flow,${financialData.cashFlow.current},-\nAccounts Total,${financialData.accounts.reduce((sum, acc) => sum + acc.balance, 0)},-`;
                    const blob = new Blob([financeReport], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `rapport-financier-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    resolve('success');
                  }, 1500);
                }),
                {
                  loading: 'Génération du rapport financier...',
                  success: 'Rapport financier exporté avec succès',
                  error: 'Erreur lors de l\'export'
                }
              );
            }}
          >
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Alerts */}
      <div className="mb-6 space-y-2">
        {financialData.invoices.overdue > 0 && (
          <Alert className="border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              Vous avez €{financialData.invoices.overdue.toLocaleString()} de factures en retard de paiement.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid gap-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                <AnimatedCounter value={financialData.revenue.total} format="currency" />
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className={getGrowthColor(financialData.revenue.growth)}>
                  +{financialData.revenue.growth}%
                </span>
                {getGrowthIcon(financialData.revenue.growth)}
              </div>
              <Progress 
                value={(financialData.revenue.total / financialData.revenue.target) * 100} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dépenses Totales</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                <AnimatedCounter value={financialData.expenses.total} format="currency" />
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className={getGrowthColor(financialData.expenses.growth)}>
                  +{financialData.expenses.growth}%
                </span>
                {getGrowthIcon(financialData.expenses.growth)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bénéfice Net</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                <AnimatedCounter value={financialData.profit.net} format="currency" />
              </div>
              <p className="text-xs text-muted-foreground">
                Marge: {financialData.profit.margin}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trésorerie</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                <AnimatedCounter value={financialData.cashFlow.current} format="currency" />
              </div>
              <p className="text-xs text-muted-foreground">
                Projection: €{financialData.cashFlow.projection.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="expenses">Dépenses</TabsTrigger>
            <TabsTrigger value="accounts">Comptes</TabsTrigger>
            <TabsTrigger value="invoices">Factures</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Flux de Trésorerie</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                    <span className="text-sm font-medium text-foreground">Entrées prévues</span>
                    <span className="font-bold text-success">
                      +€{financialData.cashFlow.incoming.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
                    <span className="text-sm font-medium text-foreground">Sorties prévues</span>
                    <span className="font-bold text-destructive">
                      -€{financialData.cashFlow.outgoing.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                    <span className="text-sm font-medium text-foreground">Solde projeté</span>
                    <span className="font-bold text-primary">
                      €{(financialData.cashFlow.current + financialData.cashFlow.incoming - financialData.cashFlow.outgoing).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rentabilité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Bénéfice Brut</span>
                      <span className="font-medium text-foreground">
                        €{financialData.profit.gross.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={(financialData.profit.gross / financialData.revenue.total) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Bénéfice Net</span>
                      <span className="font-medium text-foreground">
                        €{financialData.profit.net.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={(financialData.profit.net / financialData.revenue.total) * 100} />
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">Marge Nette</span>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        {financialData.profit.margin}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Dépenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialData.expenses.categories.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">{category.name}</span>
                        <span className="text-sm text-muted-foreground">
                          €{category.amount.toLocaleString()} ({category.percentage}%)
                        </span>
                      </div>
                      <Progress value={category.percentage} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts">
            <div className="grid gap-6">
              {financialData.accounts.map((account, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{account.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{account.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">
                          €{account.balance.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className={getGrowthColor(account.growth)}>
                            {account.growth > 0 ? '+' : ''}{account.growth}%
                          </span>
                          {getGrowthIcon(account.growth)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    €{financialData.invoices.pending.toLocaleString()}
                  </div>
                  <Badge variant="outline" className="mt-2">Pending</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">En Retard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    €{financialData.invoices.overdue.toLocaleString()}
                  </div>
                  <Badge variant="destructive" className="mt-2">Overdue</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Payées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    €{financialData.invoices.paid.toLocaleString()}
                  </div>
                  <Badge variant="outline" className="mt-2 bg-success/10 text-success border-success/20">Paid</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground">
                    €{financialData.invoices.draft.toLocaleString()}
                  </div>
                  <Badge variant="secondary" className="mt-2">Draft</Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}