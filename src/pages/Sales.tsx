import { useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users, Calendar, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AnimatedCounter } from '@/components/ui/animated-counter';

export default function Sales() {
  const [dateRange, setDateRange] = useState('30d');
  const [category, setCategory] = useState('all');

  // Mock data
  const salesData = {
    totalRevenue: 145820,
    totalOrders: 1284,
    avgOrderValue: 113.59,
    newCustomers: 186,
    conversionRate: 3.2,
    topProducts: [
      { name: 'iPhone 15 Pro', sales: 45, revenue: 54000, growth: 12 },
      { name: 'AirPods Pro', sales: 128, revenue: 32000, growth: 8 },
      { name: 'MacBook Air M2', sales: 23, revenue: 28750, growth: -3 },
      { name: 'iPad Pro', sales: 67, revenue: 53600, growth: 15 },
    ],
    salesByChannel: [
      { channel: 'Site Web', percentage: 65, amount: 94783 },
      { channel: 'Mobile App', percentage: 25, amount: 36455 },
      { channel: 'Marketplace', percentage: 10, amount: 14582 },
    ],
    recentSales: [
      { id: '1', customer: 'Jean Dupont', amount: 1299, product: 'iPhone 15 Pro', time: '2 min ago' },
      { id: '2', customer: 'Marie Martin', amount: 249, product: 'AirPods Pro', time: '5 min ago' },
      { id: '3', customer: 'Pierre Durand', amount: 1249, product: 'MacBook Air', time: '12 min ago' },
    ]
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-success';
    if (growth < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? '↗' : '↘';
  };

  return (
    <div className="container-fluid">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de Bord Ventes</h1>
          <p className="text-muted-foreground">Suivez vos performances commerciales en temps réel</p>
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
              const salesReport = `Date,Revenue,Orders,AOV\n${new Date().toLocaleDateString()},${salesData.totalRevenue},${salesData.totalOrders},${salesData.avgOrderValue}`;
              const blob = new Blob([salesReport], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'sales-report.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
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
                <AnimatedCounter value={salesData.totalRevenue} format="currency" />
              </div>
              <p className="text-xs text-success flex items-center gap-1">
                +12.5% par rapport au mois dernier
                <TrendingUp className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                <AnimatedCounter value={salesData.totalOrders} />
              </div>
              <p className="text-xs text-success flex items-center gap-1">
                +8.2% par rapport au mois dernier
                <TrendingUp className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                <AnimatedCounter value={salesData.avgOrderValue} format="currency" decimals={2} />
              </div>
              <p className="text-xs text-success flex items-center gap-1">
                +5.4% par rapport au mois dernier
                <TrendingUp className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nouveaux Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                <AnimatedCounter value={salesData.newCustomers} />
              </div>
              <p className="text-xs text-success flex items-center gap-1">
                +15.3% par rapport au mois dernier
                <TrendingUp className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="channels">Canaux</TabsTrigger>
            <TabsTrigger value="recent">Ventes récentes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Taux de Conversion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {salesData.conversionRate}%
                  </div>
                  <Progress value={salesData.conversionRate * 10} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Objectif: 5% (+1.8% à atteindre)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Mensuelle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Objectif mensuel</span>
                      <span className="font-medium text-foreground">€150,000</span>
                    </div>
                    <Progress value={(salesData.totalRevenue / 150000) * 100} />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        {Math.round((salesData.totalRevenue / 150000) * 100)}% atteint
                      </span>
                      <span className="text-muted-foreground">
                        €{(150000 - salesData.totalRevenue).toLocaleString()} restant
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Top Produits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">{product.sales} ventes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">€{product.revenue.toLocaleString()}</p>
                        <p className={`text-sm ${getGrowthColor(product.growth)}`}>
                          {getGrowthIcon(product.growth)} {Math.abs(product.growth)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channels">
            <Card>
              <CardHeader>
                <CardTitle>Ventes par Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {salesData.salesByChannel.map((channel, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">{channel.channel}</span>
                        <span className="text-sm text-muted-foreground">
                          €{channel.amount.toLocaleString()} ({channel.percentage}%)
                        </span>
                      </div>
                      <Progress value={channel.percentage} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Ventes Récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesData.recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">{sale.customer}</h4>
                        <p className="text-sm text-muted-foreground">{sale.product}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">€{sale.amount}</p>
                        <p className="text-sm text-muted-foreground">{sale.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}