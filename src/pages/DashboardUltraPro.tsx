import { useState } from 'react';
import { TrendingUp, TrendingDown, ShoppingCart, Package, Users, Euro, Eye, BarChart3, Calendar, Target, Zap, Bot, Globe, Award, Shield, Star, ArrowUpRight, ArrowDownRight, RefreshCw, Download, Filter, Search, Bell, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useRealAnalytics } from '@/hooks/useRealAnalytics';
import { useProductionData } from '@/hooks/useProductionData';
import { useModals } from '@/hooks/useModals';
import { useAI } from '@/hooks/useAI';
import { useToast } from '@/hooks/use-toast';
import { DashboardNotificationToast } from '@/components/dashboard/DashboardNotificationToast';
import { AIInsightsModal } from '@/components/dashboard/AIInsightsModal';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Données de vente par jour
const salesData = [{
  date: '01/01',
  revenue: 4200,
  orders: 28,
  visitors: 1250
}, {
  date: '02/01',
  revenue: 3800,
  orders: 24,
  visitors: 1180
}, {
  date: '03/01',
  revenue: 5200,
  orders: 35,
  visitors: 1420
}, {
  date: '04/01',
  revenue: 4800,
  orders: 32,
  visitors: 1350
}, {
  date: '05/01',
  revenue: 6100,
  orders: 41,
  visitors: 1680
}, {
  date: '06/01',
  revenue: 5900,
  orders: 39,
  visitors: 1590
}, {
  date: '07/01',
  revenue: 7200,
  orders: 48,
  visitors: 1850
}];

// Données des produits top performers
const topProducts = [{
  name: 'iPhone 15 Pro',
  revenue: 12500,
  units: 25,
  growth: 15.3
}, {
  name: 'Samsung Galaxy S24',
  revenue: 8900,
  units: 18,
  growth: 8.7
}, {
  name: 'AirPods Pro',
  revenue: 6200,
  units: 31,
  growth: 22.1
}, {
  name: 'MacBook Air M3',
  revenue: 15600,
  units: 12,
  growth: -3.2
}, {
  name: 'iPad Pro',
  revenue: 9800,
  units: 14,
  growth: 11.5
}];

// Données de performance par région
const regionData = [{
  region: 'France',
  revenue: 35000,
  orders: 245,
  growth: 12.5
}, {
  region: 'Allemagne',
  revenue: 28000,
  orders: 198,
  growth: 8.3
}, {
  region: 'Espagne',
  revenue: 22000,
  orders: 156,
  growth: 15.7
}, {
  region: 'Italie',
  revenue: 18000,
  orders: 134,
  growth: 6.2
}, {
  region: 'Belgique',
  revenue: 12000,
  orders: 89,
  growth: 9.8
}];

// Données des canaux de vente
const channelData = [{
  name: 'Site Web',
  value: 45,
  revenue: 45000
}, {
  name: 'Amazon',
  value: 30,
  revenue: 30000
}, {
  name: 'eBay',
  value: 15,
  revenue: 15000
}, {
  name: 'Shopify',
  value: 10,
  revenue: 10000
}];

// Données de conversion
const conversionData = [{
  step: 'Visiteurs',
  value: 10000,
  rate: 100
}, {
  step: 'Produits vus',
  value: 6500,
  rate: 65
}, {
  step: 'Panier',
  value: 2100,
  rate: 21
}, {
  step: 'Commande',
  value: 420,
  rate: 4.2
}];

// Alertes et notifications
const alerts = [{
  type: 'stock',
  message: 'Stock faible: iPhone 15 Pro (5 unités)',
  severity: 'warning'
}, {
  type: 'order',
  message: 'Pic de commandes détecté (+35%)',
  severity: 'info'
}, {
  type: 'error',
  message: 'Erreur sync Amazon (3 produits)',
  severity: 'error'
}, {
  type: 'success',
  message: 'Nouveau record de ventes hebdomadaire!',
  severity: 'success'
}];
const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];
export default function DashboardUltraPro() {
  const [dateRange, setDateRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [showAIModal, setShowAIModal] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);
  
  // Hooks pour les fonctionnalités
  const { analytics, isLoading, generateReport, isGeneratingReport } = useRealAnalytics();
  const { dashboardStats } = useProductionData();
  const { openModal } = useModals();
  const { generateInsights, isGeneratingInsights } = useAI();
  const { toast } = useToast();

  // Handlers pour les boutons
  const handleRefresh = async () => {
    toast({
      title: "Actualisation",
      description: "Mise à jour des données en cours...",
    });
    window.location.reload();
  };

  const handleExport = () => {
    openModal('exportData');
  };

  const handleAIInsights = () => {
    setShowAIModal(true);
  };

  const handleDismissAlert = (index: number) => {
    setDismissedAlerts(prev => [...prev, index]);
  };


  // KPIs principaux - utilise les vraies données depuis la production
  const kpis = [{
    title: 'Chiffre d\'affaires',
    value: dashboardStats?.revenue7d ? `€ ${dashboardStats.revenue7d.toLocaleString()}` : '€ 127,543',
    change: '+12.5%',
    trend: 'up',
    icon: Euro,
    description: 'vs mois dernier'
  }, {
    title: 'Commandes',
    value: dashboardStats?.totalOrders?.toString() || '1,247',
    change: '+8.3%',
    trend: 'up',
    icon: ShoppingCart,
    description: 'nouvelles commandes'
  }, {
    title: 'Produits vendus',
    value: dashboardStats?.totalProducts?.toString() || '3,892',
    change: '+15.7%',
    trend: 'up',
    icon: Package,
    description: 'unités vendues'
  }, {
    title: 'Taux conversion',
    value: '4.2%',
    change: '-0.3%',
    trend: 'down',
    icon: Target,
    description: 'visiteurs → clients'
  }];
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };
  const getGrowthIcon = (growth: number) => {
    return growth > 0 ? ArrowUpRight : ArrowDownRight;
  };
  const getGrowthColor = (growth: number) => {
    return growth > 0 ? 'text-emerald-600' : 'text-red-600';
  };
  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'success':
        return 'default';
      default:
        return 'outline';
    }
  };
  return (
    <div className="p-6 space-y-6">
      {/* Header avec contrôles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-indigo-500">Dashboard Ultra Pro</h1>
          <p className="text-muted-foreground">Vue d'ensemble complète de votre business</p>
        </div>
          
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Aujourd'hui</SelectItem>
                <SelectItem value="7d">7 jours</SelectItem>
                <SelectItem value="30d">30 jours</SelectItem>
                <SelectItem value="90d">90 jours</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="hover-scale"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="hover-scale"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button 
              size="sm" 
              className="hover-scale bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={handleAIInsights}
              disabled={isGeneratingInsights}
            >
              <Bot className={`h-4 w-4 mr-2 ${isGeneratingInsights ? 'animate-spin' : ''}`} />
              IA Insights
            </Button>
          </div>
        </div>

        {/* Alertes importantes */}
        <Card className="border-l-4 border-l-primary animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertes importantes
              </CardTitle>
              <Badge variant="secondary">{alerts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts
                .filter((_, index) => !dismissedAlerts.includes(index))
                .map((alert, index) => (
                  <DashboardNotificationToast
                    key={index}
                    message={alert.message}
                    type={alert.type as any}
                    severity={alert.severity as any}
                    onDismiss={() => handleDismissAlert(index)}
                  />
                ))
              }
              {alerts.filter((_, index) => !dismissedAlerts.includes(index)).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune alerte active
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KPIs principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in" style={{
        animationDelay: '0.1s'
      }}>
          {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown;
          return <Card key={index} className="relative overflow-hidden hover-scale hover:shadow-lg transition-all duration-300" style={{
            animationDelay: `${index * 0.1}s`
          }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <Badge variant={kpi.trend === 'up' ? 'default' : 'destructive'} className="text-xs">
                      <TrendIcon className="h-3 w-3 mr-1" />
                      {kpi.change}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.title}</p>
                    <p className="text-xs text-muted-foreground">{kpi.description}</p>
                  </div>
                </CardContent>
                <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${kpi.trend === 'up' ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'}`} />
              </Card>;
        })}
        </div>

        {/* Graphiques principaux */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution des ventes */}
          <Card className="lg:col-span-2 animate-fade-in" style={{
          animationDelay: '0.3s'
        }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Évolution des performances</CardTitle>
                  <CardDescription>Revenus, commandes et visiteurs</CardDescription>
                </div>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenus</SelectItem>
                    <SelectItem value="orders">Commandes</SelectItem>
                    <SelectItem value="visitors">Visiteurs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics?.salesByDay || salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={value => selectedMetric === 'revenue' ? formatCurrency(Number(value)) : value} />
                  <Area type="monotone" dataKey={selectedMetric} stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Analyses détaillées */}
        <Tabs defaultValue="products" className="space-y-4 animate-fade-in" style={{
        animationDelay: '0.4s'
      }}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Top Produits</TabsTrigger>
            <TabsTrigger value="regions">Régions</TabsTrigger>
            <TabsTrigger value="channels">Canaux</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle>Produits les plus performants</CardTitle>
                <CardDescription>Classement par chiffre d'affaires</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.map((product, index) => {
                  const GrowthIcon = getGrowthIcon(product.growth);
                  return <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20 hover-scale transition-all duration-200 cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.units} unités vendues</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(product.revenue)}</p>
                          <div className={`flex items-center gap-1 text-sm ${getGrowthColor(product.growth)}`}>
                            <GrowthIcon className="h-3 w-3" />
                            {Math.abs(product.growth)}%
                          </div>
                        </div>
                      </div>;
                })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regions">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle>Performance par région</CardTitle>
                <CardDescription>Répartition géographique des ventes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {regionData.map((region, index) => <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20 hover-scale transition-all duration-200 cursor-pointer">
                      <div className="flex items-center gap-4">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{region.region}</p>
                          <p className="text-sm text-muted-foreground">{region.orders} commandes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(region.revenue)}</p>
                        <div className={`flex items-center gap-1 text-sm ${getGrowthColor(region.growth)}`}>
                          <TrendingUp className="h-3 w-3" />
                          {region.growth}%
                        </div>
                      </div>
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channels">
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                <CardTitle>Canaux de vente</CardTitle>
                <CardDescription>Répartition des revenus par plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={channelData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                          {channelData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3">
                    {channelData.map((channel, index) => <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover-scale transition-all duration-200 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{
                        backgroundColor: COLORS[index % COLORS.length]
                      }} />
                          <span className="font-medium">{channel.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(channel.revenue)}</p>
                          <p className="text-sm text-muted-foreground">{channel.value}%</p>
                        </div>
                      </div>)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversion">
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                <CardTitle>Entonnoir de conversion</CardTitle>
                <CardDescription>Analyse du parcours client</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {conversionData.map((step, index) => <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{step.step}</span>
                        <div className="text-right">
                          <span className="font-bold">{step.value.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground ml-2">({step.rate}%)</span>
                        </div>
                      </div>
                      <Progress value={step.rate} className="h-3" />
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal IA Insights */}
        <AIInsightsModal 
          open={showAIModal} 
          onOpenChange={setShowAIModal} 
        />
      </div>
  );
}