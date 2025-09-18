import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Target,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdvancedAnalyticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataType?: 'sales' | 'traffic' | 'products' | 'customers' | 'marketing';
}

export const AdvancedAnalyticsModal: React.FC<AdvancedAnalyticsModalProps> = ({
  open,
  onOpenChange,
  dataType = 'sales'
}) => {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    revenue: 125430,
    orders: 1247,
    customers: 892,
    conversion: 3.2,
    avgOrderValue: 89.50,
    traffic: 45231,
    bounceRate: 32.5,
    sessionDuration: '02:45'
  });

  const performanceMetrics = [
    { metric: 'Revenus', value: '€125.4K', change: '+12.5%', trend: 'up' },
    { metric: 'Commandes', value: '1,247', change: '+8.2%', trend: 'up' },
    { metric: 'Conversion', value: '3.2%', change: '+0.5%', trend: 'up' },
    { metric: 'Panier moyen', value: '€89.50', change: '-2.1%', trend: 'down' }
  ];

  const topProducts = [
    { name: 'Smartphone Pro Max', sales: 156, revenue: 45680, growth: '+15%' },
    { name: 'Écouteurs Wireless', sales: 243, revenue: 12150, growth: '+22%' },
    { name: 'Montre connectée', sales: 89, revenue: 26700, growth: '+8%' },
    { name: 'Tablette 10"', sales: 67, revenue: 20100, growth: '+12%' }
  ];

  const customerSegments = [
    { segment: 'VIP (>€1000)', count: 45, percentage: 5, revenue: '€52.3K' },
    { segment: 'Fidèles (3+ commandes)', count: 178, percentage: 20, revenue: '€43.2K' },
    { segment: 'Réguliers (2 commandes)', count: 267, percentage: 30, revenue: '€28.1K' },
    { segment: 'Nouveaux (1 commande)', count: 402, percentage: 45, revenue: '€18.4K' }
  ];

  const trafficSources = [
    { source: 'Organique', visits: 18920, percentage: 42, cost: 0 },
    { source: 'Publicités', visits: 12450, percentage: 27, cost: 2890 },
    { source: 'Email', visits: 8930, percentage: 20, cost: 450 },
    { source: 'Réseaux sociaux', visits: 4931, percentage: 11, cost: 780 }
  ];

  const handleExportData = (format: 'csv' | 'pdf' | 'excel') => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Export terminé",
        description: `Données exportées en ${format.toUpperCase()}`,
      });
    }, 2000);
  };

  const handleRefreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Données actualisées",
        description: "Les analytics ont été mises à jour",
      });
    }, 1500);
  };

  useEffect(() => {
    if (open) {
      handleRefreshData();
    }
  }, [open, timeRange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Analytics Avancées
          </DialogTitle>
          <DialogDescription>
            Analyse approfondie de vos performances business
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contrôles */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 jours</SelectItem>
                  <SelectItem value="30d">30 jours</SelectItem>
                  <SelectItem value="90d">90 jours</SelectItem>
                  <SelectItem value="1y">1 an</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" onClick={handleRefreshData} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportData('csv')}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportData('excel')}>
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportData('pdf')}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          {/* Métriques principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {performanceMetrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.metric}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <Badge variant={metric.trend === 'up' ? 'default' : 'secondary'}>
                      {metric.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                      )}
                      {metric.change}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Onglets d'analyse */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="products">Produits</TabsTrigger>
              <TabsTrigger value="customers">Clients</TabsTrigger>
              <TabsTrigger value="traffic">Trafic</TabsTrigger>
              <TabsTrigger value="predictions">Prédictions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Performance Financière
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Revenus ({timeRange})</span>
                        <span className="font-bold text-lg">€{analyticsData.revenue.toLocaleString()}</span>
                      </div>
                      <Progress value={75} />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Objectif</div>
                          <div className="font-medium">€150K</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Progression</div>
                          <div className="font-medium text-green-500">83.6%</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Engagement Client
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Taux de conversion</span>
                        <span className="font-bold text-lg">{analyticsData.conversion}%</span>
                      </div>
                      <Progress value={analyticsData.conversion * 10} />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Sessions</div>
                          <div className="font-medium">{analyticsData.traffic.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Durée moy.</div>
                          <div className="font-medium">{analyticsData.sessionDuration}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Produits ({timeRange})</CardTitle>
                  <CardDescription>Performances par produit</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.sales} ventes • €{product.revenue.toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{product.growth}</Badge>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Détails
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Segmentation Client</CardTitle>
                  <CardDescription>Analyse des segments de clientèle</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {customerSegments.map((segment, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{segment.segment}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{segment.count} clients</span>
                            <span className="font-bold">{segment.revenue}</span>
                          </div>
                        </div>
                        <Progress value={segment.percentage} />
                        <div className="text-xs text-muted-foreground">
                          {segment.percentage}% de la base client
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="traffic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sources de Trafic</CardTitle>
                  <CardDescription>Analyse du trafic par canal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trafficSources.map((source, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{source.source}</div>
                          <div className="text-sm text-muted-foreground">
                            {source.visits.toLocaleString()} visites • {source.percentage}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {source.cost > 0 ? `€${source.cost}` : 'Gratuit'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {source.cost > 0 ? `€${(source.cost / source.visits * 1000).toFixed(2)} CPM` : 'Organique'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="predictions" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Prédictions IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="font-medium text-blue-900">Revenus prévisionnels (30j)</div>
                        <div className="text-2xl font-bold text-blue-600">€142.5K</div>
                        <div className="text-sm text-blue-700">+13.6% vs période actuelle</div>
                      </div>
                      
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="font-medium text-green-900">Opportunité détectée</div>
                        <div className="text-sm text-green-700 mt-1">
                          Augmenter le stock des écouteurs Wireless (+22% de croissance)
                        </div>
                      </div>
                      
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="font-medium text-amber-900">Alerte tendance</div>
                        <div className="text-sm text-amber-700 mt-1">
                          Baisse du panier moyen détectée (-2.1%), recommandation d'upselling
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Actions Recommandées
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Target className="w-4 h-4 mr-2" />
                        Créer campagne remarketing
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Optimiser abandon panier
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="w-4 h-4 mr-2" />
                        Segmenter clients VIP
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="w-4 h-4 mr-2" />
                        Planifier promotions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};