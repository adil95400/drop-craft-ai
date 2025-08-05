import { useState } from "react";
import { BarChart, LineChart, TrendingUp, Eye, Users, ShoppingCart, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("7d");

  const kpis = [
    {
      title: "Chiffre d'Affaires",
      value: "€45,231",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign
    },
    {
      title: "Commandes",
      value: "1,247",
      change: "+8.2%", 
      trend: "up",
      icon: ShoppingCart
    },
    {
      title: "Visiteurs",
      value: "8,932",
      change: "-2.1%",
      trend: "down",
      icon: Users
    },
    {
      title: "Conversion",
      value: "3.8%",
      change: "+0.5%",
      trend: "up",
      icon: TrendingUp
    }
  ];

  const topProducts = [
    { name: "iPhone 15 Pro", sales: 89, revenue: "€79,911", margin: "12%" },
    { name: "MacBook Air M3", sales: 34, revenue: "€44,196", margin: "8%" },
    { name: "Samsung Galaxy S24", sales: 67, revenue: "€53,533", margin: "15%" },
    { name: "AirPods Pro", sales: 156, revenue: "€39,000", margin: "22%" }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Tableaux de bord et métriques business</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <BarChart className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className={`text-sm ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.change} vs période précédente
                  </p>
                </div>
                <kpi.icon className={`w-8 h-8 ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="competitors">Concurrents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Évolution du Chiffre d'Affaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center">
                    <LineChart className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Graphique CA (7 derniers jours)</p>
                    <p className="text-sm text-gray-400">Intégration Chart.js à venir</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orders Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5" />
                  Commandes par Canal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center">
                    <BarChart className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Répartition des commandes</p>
                    <p className="text-sm text-gray-400">Shopify: 45% | Amazon: 30% | Direct: 25%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Sources de Trafic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Google Ads</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">3,421 visiteurs</span>
                    <span className="text-sm text-muted-foreground ml-2">(38%)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Facebook Ads</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">2,156 visiteurs</span>
                    <span className="text-sm text-muted-foreground ml-2">(24%)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span>Organique</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">1,987 visiteurs</span>
                    <span className="text-sm text-muted-foreground ml-2">(22%)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Produits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">{product.sales} ventes</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{product.revenue}</p>
                      <p className="text-sm text-green-600">Marge: {product.margin}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Segmentation Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Nouveaux clients</span>
                    <span className="font-semibold">423 (34%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clients fidèles</span>
                    <span className="font-semibold">567 (45%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clients VIP</span>
                    <span className="font-semibold">267 (21%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métriques Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Panier moyen</span>
                    <span className="font-semibold">€67.80</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LTV moyenne</span>
                    <span className="font-semibold">€234.50</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taux de rétention</span>
                    <span className="font-semibold">68%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Campagnes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Google Ads - iPhone</h4>
                    <p className="text-sm text-muted-foreground">Actif depuis 7 jours</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">€2,340 dépensés</p>
                    <p className="text-sm text-green-600">ROAS: 4.2x</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Facebook - Accessoires</h4>
                    <p className="text-sm text-muted-foreground">Actif depuis 5 jours</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">€1,890 dépensés</p>
                    <p className="text-sm text-green-600">ROAS: 3.8x</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Analyse Concurrentielle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800">Opportunité détectée</h4>
                  <p className="text-sm text-blue-700">
                    Vos concurrents vendent le "iPhone 15" 15% plus cher. 
                    Augmentez vos prix pour optimiser vos marges.
                  </p>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold text-orange-800">Alerte prix</h4>
                  <p className="text-sm text-orange-700">
                    3 concurrents ont baissé leurs prix sur les "AirPods Pro". 
                    Ajustement recommandé.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}