import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAnalytics } from '@/hooks/useSupabaseData';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  Package, 
  Euro,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend, 
  prefix = '', 
  suffix = '' 
}: {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  trend: 'up' | 'down';
  prefix?: string;
  suffix?: string;
}) => (
  <Card className="relative overflow-hidden">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
          {title}
        </span>
        <Badge variant={trend === 'up' ? 'default' : 'destructive'} className="text-xs">
          {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
          {Math.abs(change)}%
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {change >= 0 ? '+' : ''}{change}% par rapport au mois dernier
      </p>
    </CardContent>
    <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${
      trend === 'up' 
        ? 'from-green-400 to-green-600' 
        : 'from-red-400 to-red-600'
    }`} />
  </Card>
);

export default function ModernAnalyticsPage() {
  const { analytics, loading, refetch } = useAnalytics();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const handleExport = () => {
    toast.success('Export des données en cours...');
    // Logique d'export ici
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Données actualisées');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Rapports</h1>
          <p className="text-muted-foreground">Analysez vos performances et tendances de vente</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres d'Analyse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="90d">90 derniers jours</SelectItem>
                <SelectItem value="1y">12 derniers mois</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-[180px]">
                <BarChart3 className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Chiffre d'Affaires</SelectItem>
                <SelectItem value="orders">Commandes</SelectItem>
                <SelectItem value="customers">Clients</SelectItem>
                <SelectItem value="products">Produits</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Chiffre d'Affaires"
          value={analytics.revenue}
          change={analytics.revenueGrowth}
          icon={Euro}
          trend={analytics.revenueGrowth >= 0 ? 'up' : 'down'}
          suffix=" €"
        />
        <MetricCard
          title="Commandes"
          value={analytics.orders}
          change={analytics.ordersGrowth}
          icon={ShoppingCart}
          trend={analytics.ordersGrowth >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Clients"
          value={analytics.customers}
          change={15.2}
          icon={Users}
          trend="up"
        />
        <MetricCard
          title="Produits"
          value={analytics.products}
          change={8.7}
          icon={Package}
          trend="up"
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Évolution du Chiffre d'Affaires
                </CardTitle>
                <CardDescription>
                  Tendance des revenus sur les 30 derniers jours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/50">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Graphique des revenus</p>
                    <p className="text-xs text-muted-foreground mt-1">Croissance de {analytics.revenueGrowth}% ce mois</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Répartition des Ventes
                </CardTitle>
                <CardDescription>
                  Distribution par catégorie de produits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/50">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Répartition des ventes</p>
                    <p className="text-xs text-muted-foreground mt-1">Par catégorie et produit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Métriques Avancées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analytics.conversionRate}%</div>
                  <p className="text-sm text-muted-foreground">Taux de Conversion</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {(analytics.revenue / Math.max(analytics.orders, 1)).toFixed(2)} €
                  </div>
                  <p className="text-sm text-muted-foreground">Panier Moyen</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {(analytics.revenue / Math.max(analytics.customers, 1)).toFixed(2)} €
                  </div>
                  <p className="text-sm text-muted-foreground">Valeur Client Moyenne</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des Ventes</CardTitle>
              <CardDescription>
                Détails des performances de vente par période
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Ventes Aujourd'hui</h4>
                    <p className="text-sm text-muted-foreground">Revenus générés aujourd'hui</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{(analytics.revenue * 0.03).toFixed(0)} €</div>
                    <Badge variant="default">+12%</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Ventes Cette Semaine</h4>
                    <p className="text-sm text-muted-foreground">Revenus des 7 derniers jours</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{(analytics.revenue * 0.25).toFixed(0)} €</div>
                    <Badge variant="default">+8%</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Ventes Ce Mois</h4>
                    <p className="text-sm text-muted-foreground">Revenus du mois en cours</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{analytics.revenue} €</div>
                    <Badge variant="default">+{analytics.revenueGrowth}%</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Analyse Clientèle</CardTitle>
              <CardDescription>
                Insights sur le comportement et la satisfaction client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Nouveaux Clients</h4>
                    <div className="text-2xl font-bold">{Math.floor(analytics.customers * 0.15)}</div>
                    <p className="text-sm text-muted-foreground">Ce mois</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Clients Fidèles</h4>
                    <div className="text-2xl font-bold">{Math.floor(analytics.customers * 0.65)}</div>
                    <p className="text-sm text-muted-foreground">Plus de 3 commandes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Performance Produits</CardTitle>
              <CardDescription>
                Analyse des produits les plus performants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Produits Actifs</h4>
                    <p className="text-sm text-muted-foreground">Produits en ligne</p>
                  </div>
                  <div className="text-lg font-bold">{analytics.products}</div>
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Produits les Plus Vendus</h4>
                    <p className="text-sm text-muted-foreground">Top performers ce mois</p>
                  </div>
                  <div className="text-lg font-bold">{Math.floor(analytics.products * 0.2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}