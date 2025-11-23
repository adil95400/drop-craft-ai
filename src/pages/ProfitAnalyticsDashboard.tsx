import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, TrendingUp, TrendingDown, Package, 
  ShoppingCart, Percent, BarChart3, PieChart 
} from 'lucide-react';

export default function ProfitAnalyticsDashboard() {
  const profitStats = [
    {
      label: 'Profit Total (30j)',
      value: '€24,567',
      change: '+18.5%',
      icon: DollarSign,
      color: 'text-green-500'
    },
    {
      label: 'Marge Moyenne',
      value: '42.3%',
      change: '+3.2%',
      icon: Percent,
      color: 'text-blue-500'
    },
    {
      label: 'Produits Rentables',
      value: '847/1,247',
      change: '67.9%',
      icon: Package,
      color: 'text-purple-500'
    },
    {
      label: 'Commandes',
      value: '1,842',
      change: '+24%',
      icon: ShoppingCart,
      color: 'text-orange-500'
    }
  ];

  const topProducts = [
    {
      name: 'Wireless Earbuds Pro',
      sold: 342,
      revenue: 27360,
      cost: 10800,
      profit: 16560,
      margin: 60.5,
      trend: 'up'
    },
    {
      name: 'Smart Watch X5',
      sold: 156,
      revenue: 23400,
      cost: 15600,
      profit: 7800,
      margin: 33.3,
      trend: 'up'
    },
    {
      name: 'LED Strip Lights',
      sold: 289,
      revenue: 14450,
      cost: 7225,
      profit: 7225,
      margin: 50.0,
      trend: 'stable'
    },
    {
      name: 'Phone Case Premium',
      sold: 567,
      revenue: 11340,
      cost: 5670,
      profit: 5670,
      margin: 50.0,
      trend: 'down'
    }
  ];

  const supplierProfitability = [
    {
      name: 'AliExpress',
      products: 458,
      totalProfit: 12450,
      avgMargin: 45.2,
      trend: '+8%'
    },
    {
      name: 'CJ Dropshipping',
      products: 342,
      totalProfit: 8760,
      avgMargin: 38.5,
      trend: '+12%'
    },
    {
      name: 'Alibaba',
      products: 289,
      totalProfit: 6890,
      avgMargin: 52.3,
      trend: '+5%'
    }
  ];

  const costBreakdown = [
    { category: 'Coût Produits', amount: 45230, percentage: 62 },
    { category: 'Frais de Port', amount: 8940, percentage: 12 },
    { category: 'Frais Marketplace', amount: 7250, percentage: 10 },
    { category: 'Marketing', amount: 5420, percentage: 7 },
    { category: 'Autres', amount: 6160, percentage: 9 }
  ];

  return (
    <>
      <Helmet>
        <title>Profit Analytics Dashboard - ShopOpti</title>
        <meta name="description" content="Analysez vos marges, coûts et profits en temps réel par produit et fournisseur" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profit Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Analyse détaillée de vos marges et rentabilité
            </p>
          </div>
          
          <Button>
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {profitStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-green-500">{stat.change}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Par Produit</TabsTrigger>
            <TabsTrigger value="suppliers">Par Fournisseur</TabsTrigger>
            <TabsTrigger value="costs">Répartition des Coûts</TabsTrigger>
            <TabsTrigger value="trends">Tendances</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Produits par Rentabilité</CardTitle>
                <CardDescription>
                  Produits générant le plus de profit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.map((product, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{product.name}</h4>
                            {product.trend === 'up' && (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            )}
                            {product.trend === 'down' && (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {product.sold} ventes ce mois
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            €{product.profit.toLocaleString()}
                          </div>
                          <Badge variant={product.margin > 50 ? 'default' : 'secondary'}>
                            {product.margin}% marge
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Revenu</div>
                          <div className="font-semibold">€{product.revenue.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Coûts</div>
                          <div className="font-semibold text-red-600">
                            €{product.cost.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Profit</div>
                          <div className="font-semibold text-green-600">
                            €{product.profit.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <Progress value={product.margin} className="mt-3 h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rentabilité par Fournisseur</CardTitle>
                <CardDescription>
                  Comparaison des marges par source d'approvisionnement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supplierProfitability.map((supplier, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{supplier.name}</h4>
                          <div className="text-sm text-muted-foreground">
                            {supplier.products} produits actifs
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            €{supplier.totalProfit.toLocaleString()}
                          </div>
                          <div className="text-sm text-green-500">{supplier.trend}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-sm text-muted-foreground">Marge moyenne</span>
                        <div className="flex items-center gap-2">
                          <Progress value={supplier.avgMargin} className="w-32 h-2" />
                          <span className="font-semibold">{supplier.avgMargin}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Coûts</CardTitle>
                <CardDescription>
                  Analyse détaillée de vos dépenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costBreakdown.map((cost, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{cost.category}</span>
                        <span className="text-muted-foreground">
                          €{cost.amount.toLocaleString()} ({cost.percentage}%)
                        </span>
                      </div>
                      <Progress value={cost.percentage} className="h-2" />
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Total Coûts</span>
                    <span className="text-2xl font-bold">€73,000</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Revenu Total</span>
                    <span>€120,000</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t">
                    <span className="font-semibold text-green-600">Profit Net</span>
                    <span className="text-xl font-bold text-green-600">€47,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendances de Rentabilité</CardTitle>
                <CardDescription>
                  Évolution des marges et profits sur 30 jours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Graphiques et tendances disponibles prochainement</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
