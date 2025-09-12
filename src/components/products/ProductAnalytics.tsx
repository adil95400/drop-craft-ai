import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, Eye, ShoppingCart, Star, 
  BarChart3, PieChart, Activity, DollarSign, Users,
  Calendar, Filter, Download, RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

interface ProductAnalyticsProps {
  productId: string;
}

const ProductAnalytics = ({ productId }: ProductAnalyticsProps) => {
  const [timeRange, setTimeRange] = useState('30d');
  
  // Données simulées pour l'exemple
  const salesData = [
    { date: '2024-01-01', sales: 12, revenue: 15600, views: 450 },
    { date: '2024-01-02', sales: 18, revenue: 23400, views: 520 },
    { date: '2024-01-03', sales: 15, revenue: 19500, views: 480 },
    { date: '2024-01-04', sales: 22, revenue: 28600, views: 610 },
    { date: '2024-01-05', sales: 19, revenue: 24700, views: 550 },
    { date: '2024-01-06', sales: 25, revenue: 32500, views: 680 },
    { date: '2024-01-07', sales: 20, revenue: 26000, views: 590 }
  ];

  const conversionData = [
    { channel: 'Recherche organique', visits: 2400, conversions: 120, rate: 5.0 },
    { channel: 'Publicité payante', visits: 1800, conversions: 108, rate: 6.0 },
    { channel: 'Réseaux sociaux', visits: 1200, conversions: 48, rate: 4.0 },
    { channel: 'Email marketing', visits: 900, conversions: 63, rate: 7.0 },
    { channel: 'Référencement', visits: 600, conversions: 24, rate: 4.0 }
  ];

  const geographicData = [
    { country: 'France', sales: 156, percentage: 45 },
    { country: 'Allemagne', sales: 89, percentage: 26 },
    { country: 'Belgique', sales: 45, percentage: 13 },
    { country: 'Suisse', sales: 32, percentage: 9 },
    { country: 'Autres', sales: 23, percentage: 7 }
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F'];

  const productMetrics = {
    totalSales: 456,
    totalRevenue: 592400,
    averageOrderValue: 1299,
    conversionRate: 4.8,
    totalViews: 12450,
    favoriteCount: 89,
    returnRate: 2.1,
    stockTurnover: 6.2,
    profitMargin: 31.5,
    customerSatisfaction: 4.6,
    repeatPurchaseRate: 23.4,
    avgTimeOnPage: 145
  };

  const compareToAverage = (value: number, average: number) => {
    const diff = ((value - average) / average) * 100;
    return {
      isPositive: diff > 0,
      percentage: Math.abs(diff).toFixed(1),
      diff
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Produit</h2>
          <p className="text-muted-foreground">Analyse détaillée des performances</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes totales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productMetrics.totalSales}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12.5% vs mois dernier
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productMetrics.totalRevenue.toLocaleString('fr-FR')}€</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8.3% vs mois dernier
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productMetrics.conversionRate}%</div>
            <div className="flex items-center text-xs text-red-600">
              <TrendingDown className="w-3 h-3 mr-1" />
              -0.4% vs mois dernier
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vues produit</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productMetrics.totalViews.toLocaleString('fr-FR')}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +15.7% vs mois dernier
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="geographic">Géographie</TabsTrigger>
          <TabsTrigger value="behavior">Comportement</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des ventes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenus par jour</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Métriques avancées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Panier moyen</span>
                  <span className="font-semibold">{productMetrics.averageOrderValue}€</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Marge bénéficiaire</span>
                  <span className="font-semibold text-green-600">{productMetrics.profitMargin}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Rotation stock</span>
                  <span className="font-semibold">{productMetrics.stockTurnover}x</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Taux retour</span>
                  <span className="font-semibold text-orange-600">{productMetrics.returnRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Engagement client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Favoris</span>
                  <span className="font-semibold">{productMetrics.favoriteCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Satisfaction</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{productMetrics.customerSatisfaction}/5</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Rachat</span>
                  <span className="font-semibold">{productMetrics.repeatPurchaseRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Temps sur page</span>
                  <span className="font-semibold">{productMetrics.avgTimeOnPage}s</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comparaison marché</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Position prix</span>
                  <Badge variant="default">Compétitif</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">vs Concurrence</span>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span className="text-sm font-semibold">+23%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Rank catégorie</span>
                  <Badge variant="outline">#3/157</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tendance</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Croissante
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversion par canal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionData.map((channel, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{channel.channel}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {channel.conversions}/{channel.visits}
                        </span>
                        <Badge variant={channel.rate > 5 ? "default" : "secondary"}>
                          {channel.rate}%
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2" 
                        style={{ width: `${(channel.rate / 7) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Entonnoir de conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span>Vues produit</span>
                    <span className="font-bold">12,450</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-100 rounded">
                    <span>Ajouts panier</span>
                    <span className="font-bold">1,245 (10%)</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-200 rounded">
                    <span>Initiations checkout</span>
                    <span className="font-bold">892 (7.2%)</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-300 rounded">
                    <span>Achats complétés</span>
                    <span className="font-bold">456 (3.7%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimisations suggérées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded">
                    <Badge variant="secondary">SEO</Badge>
                    <div>
                      <p className="text-sm font-medium">Améliorer le titre</p>
                      <p className="text-xs text-muted-foreground">
                        Ajouter des mots-clés pour +12% de trafic
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded">
                    <Badge variant="default">Prix</Badge>
                    <div>
                      <p className="text-sm font-medium">Test prix dynamique</p>
                      <p className="text-xs text-muted-foreground">
                        Testez une réduction de 5% pour +8% de conversion
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded">
                    <Badge variant="outline">Images</Badge>
                    <div>
                      <p className="text-sm font-medium">Ajouter des images</p>
                      <p className="text-xs text-muted-foreground">
                        3 images supplémentaires peuvent améliorer de 15%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition géographique</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={geographicData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="sales"
                      label={({ country, percentage }: any) => `${country} (${percentage}%)`}
                    >
                      {geographicData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top pays par ventes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {geographicData.map((country, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{country.country}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{country.sales} ventes</div>
                        <div className="text-sm text-muted-foreground">{country.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Heures d'achat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i;
                    const purchases = Math.floor(Math.random() * 20) + 1;
                    const maxPurchases = 20;
                    return (
                      <div key={hour} className="flex items-center gap-2">
                        <span className="text-xs w-8">{hour}h</span>
                        <div className="flex-1 bg-muted rounded h-2">
                          <div 
                            className="bg-primary rounded h-2" 
                            style={{ width: `${(purchases / maxPurchases) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs w-6">{purchases}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Jours de la semaine</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => {
                    const sales = [45, 52, 48, 61, 73, 89, 67][index];
                    const maxSales = 89;
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <span className="font-medium w-12">{day}</span>
                        <div className="flex-1 bg-muted rounded h-3">
                          <div 
                            className="bg-primary rounded h-3" 
                            style={{ width: `${(sales / maxSales) * 100}%` }}
                          />
                        </div>
                        <span className="font-bold w-8">{sales}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appareils utilisés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Mobile</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded h-2">
                        <div className="bg-primary rounded h-2" style={{ width: '67%' }} />
                      </div>
                      <span className="text-sm font-medium">67%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Desktop</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded h-2">
                        <div className="bg-primary rounded h-2" style={{ width: '28%' }} />
                      </div>
                      <span className="text-sm font-medium">28%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Tablette</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded h-2">
                        <div className="bg-primary rounded h-2" style={{ width: '5%' }} />
                      </div>
                      <span className="text-sm font-medium">5%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductAnalytics;