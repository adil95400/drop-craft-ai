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
  Settings,
  Euro,
  ArrowUp,
  Activity,
  Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProductsDemo as useProducts } from "@/hooks/useProductsDemo";
import { useOrdersDemo as useOrders } from "@/hooks/useOrdersDemo";
import { useCustomersDemo as useCustomers } from "@/hooks/useCustomersDemo";

const Dashboard = () => {
  const navigate = useNavigate();
  const { products, isLoading: productsLoading } = useProducts();
  const { orders, stats: orderStats, isLoading: ordersLoading } = useOrders();
  const { customers, stats: customerStats, isLoading: customersLoading } = useCustomers();
  
  const [realtimeStats, setRealtimeStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    conversionRate: 3.2,
    growthRate: 12.5
  });

  useEffect(() => {
    // Simulate realtime updates
    const interval = setInterval(() => {
      setRealtimeStats(prev => ({
        ...prev,
        todayOrders: Math.floor(Math.random() * 20) + 5,
        todayRevenue: Math.floor(Math.random() * 5000) + 1000,
        conversionRate: Number((Math.random() * 2 + 2.5).toFixed(1)),
        growthRate: Number((Math.random() * 20 + 5).toFixed(1))
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    {
      title: "Import Produits",
      description: "Importer depuis AliExpress, Amazon",
      icon: Import,
      badge: "Pro",
      action: () => navigate("/import")
    },
    {
      title: "Suivi Colis",
      description: "Tracker les commandes en cours",
      icon: Package,
      badge: `${orderStats.processing + orderStats.pending} actifs`,
      action: () => navigate("/tracking")
    },
    {
      title: "SEO Analyzer",
      description: "Optimiser vos pages produits",
      icon: Search,
      badge: "IA+",
      action: () => navigate("/seo")
    },
    {
      title: "Produits Gagnants",
      description: "Découvrir les tendances",
      icon: TrendingUp,
      badge: "Hot",
      action: () => navigate("/winners")
    },
    {
      title: "CRM Clients",
      description: "Gérer vos relations clients",
      icon: Users,
      badge: `${customerStats.active} actifs`,
      action: () => navigate("/crm")
    },
    {
      title: "Blog IA",
      description: "Générer du contenu automatiquement",
      icon: Activity,
      badge: "IA Pro",
      action: () => navigate("/blog")
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Dashboard Shopopti Pro
          </h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue dans votre centre de contrôle dropshipping
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => navigate("/dashboard-ultra-pro")}
          >
            <Zap className="mr-2 h-4 w-4" />
            Dashboard Ultra Pro
          </Button>
        </div>
      </div>

      {/* Real-time Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 shadow-card hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Produits Actifs</CardTitle>
            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {productsLoading ? "..." : products.filter(p => p.status === 'active').length.toLocaleString()}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              <span className="text-green-600">+{realtimeStats.growthRate}%</span> ce mois
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 shadow-card hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Commandes Actives</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {ordersLoading ? "..." : orderStats.processing + orderStats.pending}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              <span className="text-green-600">+{realtimeStats.todayOrders}</span> aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 shadow-card hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Chiffre d'Affaires</CardTitle>
            <Euro className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {ordersLoading ? "..." : `${orderStats.revenue.toLocaleString()}€`}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              <span className="text-green-600">+{realtimeStats.todayRevenue}€</span> aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800 shadow-card hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Taux de Conversion</CardTitle>
            <Eye className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {realtimeStats.conversionRate}%
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              <span className="text-green-600">+0.3%</span> cette semaine
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-all duration-300 cursor-pointer group hover:shadow-card animate-slide-up bg-gradient-to-br from-background to-muted/20"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={action.action}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg group-hover:from-primary/20 group-hover:to-primary/30 transition-all">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge 
                    variant={action.badge.includes("Pro") || action.badge.includes("IA") ? "default" : "secondary"}
                    className="text-xs font-medium"
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
    </div>
  );
};

export default Dashboard;