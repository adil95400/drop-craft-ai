import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Package, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Eye, 
  Import,
  Search,
  Bell,
  Settings
} from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 1248,
    activeOrders: 89,
    revenue: 15420,
    conversionRate: 3.2
  });

  const quickActions = [
    {
      title: "Import Produits",
      description: "Importer depuis AliExpress, Amazon",
      icon: Import,
      badge: "Nouveau",
      action: () => console.log("Import products")
    },
    {
      title: "Suivi Colis",
      description: "Tracker les commandes en cours",
      icon: Package,
      badge: "89 actifs",
      action: () => console.log("Track packages")
    },
    {
      title: "SEO Analyzer",
      description: "Optimiser vos pages produits",
      icon: Search,
      badge: "IA",
      action: () => console.log("SEO analyze")
    },
    {
      title: "Produits Gagnants",
      description: "Découvrir les tendances",
      icon: TrendingUp,
      badge: "Hot",
      action: () => console.log("Winning products")
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Dashboard Shopopti Pro
          </h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue dans votre centre de contrôle dropshipping
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="default" className="bg-gradient-primary hover:opacity-90">
            Nouveau Projet
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border bg-card shadow-card hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Actifs</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrders}</div>
            <p className="text-xs text-muted-foreground">
              +8 nouvelles aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +23% ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              +0.4% cette semaine
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border bg-card shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Actions Rapides
          </CardTitle>
          <CardDescription>
            Accédez rapidement aux fonctionnalités principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-all duration-300 cursor-pointer group hover:shadow-card animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={action.action}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge 
                    variant={action.badge === "Nouveau" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {action.badge}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card shadow-soft">
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
            <CardDescription>Dernières actions sur votre compte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { action: "Import de 24 produits", time: "Il y a 2h", status: "success" },
              { action: "Mise à jour SEO", time: "Il y a 4h", status: "info" },
              { action: "Nouvelle commande #1234", time: "Il y a 6h", status: "success" },
              { action: "Sync Shopify", time: "Il y a 8h", status: "warning" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
                <Badge variant={activity.status === "success" ? "default" : "secondary"}>
                  {activity.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-soft">
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>Aperçu de vos métriques clés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Taux de conversion</span>
                <span className="text-sm font-medium text-primary">3.2%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-gradient-primary h-2 rounded-full" style={{ width: "32%" }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Satisfaction client</span>
                <span className="text-sm font-medium text-primary">94%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-gradient-accent h-2 rounded-full" style={{ width: "94%" }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Croissance</span>
                <span className="text-sm font-medium text-primary">+23%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-gradient-hero h-2 rounded-full" style={{ width: "75%" }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;