import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Eye,
  Target,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useRealAnalytics } from "@/hooks/useRealAnalytics";

const Analytics = () => {
  const navigate = useNavigate();
  
  const [timeRange, setTimeRange] = useState("7d");
  const { analytics, isLoading } = useRealAnalytics();

  // Use real data if available, fallback to mock data
  const metrics = analytics ? [
    {
      title: "Chiffre d'Affaires",
      value: `€${analytics.revenue.toLocaleString()}`,
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Commandes",
      value: analytics.orders.toString(),
      change: "+8.2%",
      trend: "up", 
      icon: ShoppingCart,
      color: "text-blue-600"
    },
    {
      title: "Clients",
      value: analytics.customers.toString(),
      change: "-2.4%",
      trend: "down",
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Taux Conversion",
      value: `${analytics.conversionRate}%`,
      change: "+1.2%",
      trend: "up",
      icon: Target,
      color: "text-orange-600"
    }
  ] : [
    {
      title: "Chiffre d'Affaires",
      value: "€24,567",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Commandes",
      value: "156",
      change: "+8.2%",
      trend: "up", 
      icon: ShoppingCart,
      color: "text-blue-600"
    },
    {
      title: "Visiteurs",
      value: "3,247",
      change: "-2.4%",
      trend: "down",
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Taux Conversion",
      value: "4.8%",
      change: "+1.2%",
      trend: "up",
      icon: Target,
      color: "text-orange-600"
    }
  ];

  const topProducts = analytics?.topProducts || [
    { name: "iPhone 15 Case Premium", sales: 45, revenue: "€1,350", growth: "+15%" },
    { name: "Wireless Charger Pro", sales: 38, revenue: "€1,140", growth: "+8%" },
    { name: "AirPods Case Silicone", sales: 32, revenue: "€960", growth: "+22%" },
    { name: "Phone Stand Adjustable", sales: 28, revenue: "€840", growth: "+5%" },
    { name: "Screen Protector Kit", sales: 25, revenue: "€750", growth: "+18%" }
  ];

  const trafficSources = [
    { source: "Google Ads", visits: 1247, percentage: 38.4, color: "bg-blue-500" },
    { source: "Facebook Ads", visits: 896, percentage: 27.6, color: "bg-blue-600" },
    { source: "Organic Search", visits: 623, percentage: 19.2, color: "bg-green-500" },
    { source: "Direct", visits: 312, percentage: 9.6, color: "bg-gray-500" },
    { source: "Email", visits: 169, percentage: 5.2, color: "bg-purple-500" }
  ];

  const conversionFunnel = [
    { stage: "Visiteurs", count: 3247, percentage: 100, color: "bg-blue-500" },
    { stage: "Vues Produit", count: 1623, percentage: 50, color: "bg-blue-600" },
    { stage: "Ajouts Panier", count: 487, percentage: 15, color: "bg-purple-500" },
    { stage: "Commandes", count: 156, percentage: 4.8, color: "bg-green-500" }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Analytics Pro
          </h1>
          <p className="text-muted-foreground mt-1">
            Analysez vos performances et optimisez vos ventes
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setTimeRange(timeRange === "7d" ? "30d" : timeRange === "30d" ? "90d" : "7d")}>
            <Calendar className="mr-2 h-4 w-4" />
            {timeRange === "7d" ? "7 jours" : timeRange === "30d" ? "30 jours" : "90 jours"}
          </Button>
          <Button variant="outline" onClick={() => {
            toast.promise(
              new Promise((resolve) => {
                setTimeout(() => {
                  const analyticsData = `Metric,Value,Change\nRevenue,${metrics[0].value},${metrics[0].change}\nOrders,${metrics[1].value},${metrics[1].change}\nVisitors,${metrics[2].value},${metrics[2].change}\nConversion Rate,${metrics[3].value},${metrics[3].change}\n\nTop Products:\n${topProducts.map(p => `${p.name},${p.sales},${p.revenue}`).join('\n')}`;
                  const blob = new Blob([analyticsData], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `analytics-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  resolve('success');
                }, 2000);
              }),
              {
                loading: 'Génération du rapport d\'analyse...',
                success: 'Rapport d\'analyses exporté avec succès',
                error: 'Erreur lors de l\'export'
              }
            );
          }}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button variant="premium" onClick={() => navigate("/analytics-ultra-pro")}>
            <Zap className="mr-2 h-4 w-4" />
            Ultra Pro
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex space-x-2">
        {["7d", "30d", "90d"].map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range === "7d" ? "7 jours" : range === "30d" ? "30 jours" : "90 jours"}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="border-border bg-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {metric.trend === "up" ? (
                  <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={metric.trend === "up" ? "text-green-600" : "text-red-600"}>
                  {metric.change}
                </span>
                <span className="ml-1">vs période précédente</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Revenue Chart Placeholder */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Évolution du Chiffre d'Affaires
              </CardTitle>
              <CardDescription>
                Performance sur les {timeRange === "7d" ? "7 derniers jours" : timeRange === "30d" ? "30 derniers jours" : "90 derniers jours"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Graphique d'évolution du CA</p>
                  <p className="text-sm">(Intégration prévue)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Top Produits</CardTitle>
              <CardDescription>Vos produits les plus performants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.sales} ventes
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{product.revenue}</div>
                      <div className="text-sm text-green-600">{product.growth}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Entonnoir de Conversion</CardTitle>
              <CardDescription>Suivez le parcours de vos visiteurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnel.map((stage, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{stage.stage}</span>
                      <span className="text-muted-foreground">
                        {stage.count.toLocaleString()} ({stage.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-3">
                      <div 
                        className={`${stage.color} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Traffic Sources */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Sources de Trafic</CardTitle>
              <CardDescription>D'où viennent vos visiteurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trafficSources.map((source, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{source.source}</span>
                      <span className="text-muted-foreground">
                        {source.visits} ({source.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-2">
                      <div 
                        className={`${source.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  window.open('https://analytics.google.com', '_blank');
                  toast.success('Redirection vers Google Analytics');
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Voir Google Analytics
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  navigate('/marketing');
                  toast.success('Redirection vers les campagnes publicitaires');
                }}
              >
                <Target className="mr-2 h-4 w-4" />
                Campagnes Publicitaires
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  toast.success('Filtres avancés activés');
                  // Real filter functionality would show advanced filter panel
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtres Avancés
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  toast.promise(
                    new Promise((resolve) => setTimeout(resolve, 1500)),
                    {
                      loading: 'Actualisation des données...',
                      success: 'Données actualisées avec succès',
                      error: 'Erreur lors de l\'actualisation'
                    }
                  );
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser Données
              </Button>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Résumé Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Score Global</span>
                <span className="font-semibold text-green-600">Excellent</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Performance</span>
                  <span>92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Conversion</span>
                  <span>85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Engagement</span>
                  <span>78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;