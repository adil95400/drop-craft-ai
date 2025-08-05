import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from "lucide-react";

const Analytics = () => {
  const stats = [
    {
      title: "Revenus Totaux",
      value: "€47,293",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign
    },
    {
      title: "Commandes",
      value: "1,847",
      change: "+8.2%",
      trend: "up",
      icon: ShoppingCart
    },
    {
      title: "Clients",
      value: "892",
      change: "+23.1%",
      trend: "up",
      icon: Users
    },
    {
      title: "Produits Actifs",
      value: "2,341",
      change: "-2.4%",
      trend: "down",
      icon: Package
    }
  ];

  const topProducts = [
    { name: "Montre Connectée Pro", sales: 234, revenue: "€12,450" },
    { name: "Écouteurs Bluetooth", sales: 189, revenue: "€8,920" },
    { name: "Chargeur Sans Fil", sales: 156, revenue: "€6,780" },
    { name: "Coque iPhone Premium", sales: 143, revenue: "€4,290" },
    { name: "Support Téléphone Auto", sales: 98, revenue: "€2,940" }
  ];

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Tableau de bord des performances et statistiques
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtres
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button variant="hero">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border bg-card shadow-card hover:shadow-glow transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center space-x-2 text-sm">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {stat.change}
                </span>
                <span className="text-muted-foreground">vs mois dernier</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
          <TabsTrigger value="traffic">Trafic</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <CardTitle>Revenus Mensuels</CardTitle>
                <CardDescription>Évolution des revenus sur les 12 derniers mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Graphique des revenus (Chart.js/Recharts)
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <CardTitle>Conversion Rate</CardTitle>
                <CardDescription>Taux de conversion par source de trafic</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Graphique de conversion (Chart.js/Recharts)
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Top Produits</CardTitle>
              <CardDescription>Produits les plus performants ce mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.sales} ventes</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{product.revenue}</div>
                      <Badge variant="secondary">#{index + 1}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Analyse Clients</CardTitle>
              <CardDescription>Comportement et segmentation des clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Analyse des clients (à implémenter)
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Sources de Trafic</CardTitle>
              <CardDescription>D'où viennent vos visiteurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Analyse du trafic (à implémenter)
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;