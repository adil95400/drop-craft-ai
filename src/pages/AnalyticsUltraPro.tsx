import { useState } from 'react'
import { BarChart3, TrendingUp, DollarSign, Users, ShoppingCart, Eye, ArrowUp, ArrowDown, Calendar, Filter, Download, RefreshCw, Zap, Target, Globe, Smartphone, Bot, Layers, Gauge, Award, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
const salesData = [
  { name: 'Jan', ventes: 45000, visiteurs: 12000, commandes: 890, conversionRate: 7.4 },
  { name: 'Fév', ventes: 52000, visiteurs: 14000, commandes: 1020, conversionRate: 7.3 },
  { name: 'Mar', ventes: 48000, visiteurs: 13500, commandes: 960, conversionRate: 7.1 },
  { name: 'Avr', ventes: 61000, visiteurs: 16000, commandes: 1180, conversionRate: 7.4 },
  { name: 'Mai', ventes: 55000, visiteurs: 15200, commandes: 1050, conversionRate: 6.9 },
  { name: 'Jun', ventes: 67000, visiteurs: 17800, commandes: 1290, conversionRate: 7.2 }
]

const productPerformance = [
  { name: 'Écouteurs Pro', ventes: 15600, marge: 65, stock: 89 },
  { name: 'Smartphone X1', ventes: 12400, marge: 45, stock: 23 },
  { name: 'Montre Sport', ventes: 9800, marge: 55, stock: 67 },
  { name: 'Tablette HD', ventes: 8200, marge: 42, stock: 12 },
  { name: 'Casque Gaming', ventes: 7100, marge: 58, stock: 45 }
]

const trafficSources = [
  { name: 'Organique', value: 45, color: '#22c55e' },
  { name: 'Payant', value: 28, color: '#3b82f6' },
  { name: 'Social', value: 15, color: '#8b5cf6' },
  { name: 'Email', value: 8, color: '#f59e0b' },
  { name: 'Direct', value: 4, color: '#ef4444' }
]

const conversionFunnel = [
  { stage: 'Visiteurs', count: 17800, rate: 100 },
  { stage: 'Vues Produit', count: 8900, rate: 50 },
  { stage: 'Panier', count: 3560, rate: 20 },
  { stage: 'Commande', count: 1290, rate: 7.2 },
  { stage: 'Paiement', count: 1251, rate: 7.0 }
]

const cohortData = [
  { month: 'Jan', retention1: 100, retention3: 85, retention6: 72, retention12: 65 },
  { month: 'Fév', retention1: 100, retention3: 88, retention6: 75, retention12: 68 },
  { month: 'Mar', retention1: 100, retention3: 82, retention6: 70, retention12: 62 },
  { month: 'Avr', retention1: 100, retention3: 90, retention6: 78, retention12: 71 },
  { month: 'Mai', retention1: 100, retention3: 86, retention6: 74, retention12: 67 },
  { month: 'Jun', retention1: 100, retention3: 84, retention6: 72, retention12: 65 }
]

const radarData = [
  { subject: 'Acquisition', A: 85, fullMark: 100 },
  { subject: 'Activation', A: 92, fullMark: 100 },
  { subject: 'Rétention', A: 78, fullMark: 100 },
  { subject: 'Revenus', A: 88, fullMark: 100 },
  { subject: 'Referral', A: 65, fullMark: 100 },
  { subject: 'UX', A: 94, fullMark: 100 }
]

export default function AnalyticsUltraPro() {
  const [dateRange, setDateRange] = useState('7d')
  const [activeTab, setActiveTab] = useState('overview')
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    activeUsers: 127,
    currentSales: 2450,
    conversionRate: 7.2,
    avgOrderValue: 89.50
  })

  const kpis = {
    totalRevenue: 67000,
    revenueGrowth: 12.5,
    totalOrders: 1290,
    ordersGrowth: 8.3,
    avgOrderValue: 89.50,
    aovGrowth: 4.1,
    conversionRate: 7.2,
    conversionGrowth: -0.2,
    customers: 3840,
    customersGrowth: 15.2,
    retentionRate: 72,
    retentionGrowth: 5.1,
    cac: 24.80,
    cacGrowth: -3.2,
    ltv: 156.40,
    ltvGrowth: 8.9
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <ArrowUp className="h-3 w-3 text-green-500" />
    ) : (
      <ArrowDown className="h-3 w-3 text-red-500" />
    )
  }

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className="space-y-6 p-6">
        {/* Header avec Contrôles Temps Réel */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Analytics Ultra Pro
            </h1>
            <p className="text-muted-foreground mt-2">
              Insights avancés et prédictions IA pour votre business
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Aujourd'hui</SelectItem>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="90d">3 derniers mois</SelectItem>
                <SelectItem value="1y">12 derniers mois</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
            
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            
            <Button className="gap-2 bg-gradient-to-r from-primary to-purple-600">
              <Bot className="h-4 w-4" />
              IA Insights
            </Button>
          </div>
        </div>

        {/* Métriques Temps Réel */}
        <Card className="border-primary/20 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Gauge className="h-5 w-5" />
              Métriques Temps Réel
              <Badge variant="outline" className="ml-auto text-green-600 border-green-600 animate-pulse">
                • LIVE
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{realTimeMetrics.activeUsers}</div>
                <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatCurrency(realTimeMetrics.currentSales)}</div>
                <p className="text-sm text-muted-foreground">CA aujourd'hui</p>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                <Target className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{realTimeMetrics.conversionRate}%</div>
                <p className="text-sm text-muted-foreground">Taux conversion</p>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                <ShoppingCart className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatCurrency(realTimeMetrics.avgOrderValue)}</div>
                <p className="text-sm text-muted-foreground">Panier moyen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs Principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Chiffre d'Affaires
                </span>
                <div className={`flex items-center gap-1 ${getGrowthColor(kpis.revenueGrowth)}`}>
                  {getGrowthIcon(kpis.revenueGrowth)}
                  <span className="text-xs font-medium">{Math.abs(kpis.revenueGrowth)}%</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpis.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">vs période précédente</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-blue-500" />
                  Commandes
                </span>
                <div className={`flex items-center gap-1 ${getGrowthColor(kpis.ordersGrowth)}`}>
                  {getGrowthIcon(kpis.ordersGrowth)}
                  <span className="text-xs font-medium">{Math.abs(kpis.ordersGrowth)}%</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalOrders.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Nouvelles commandes</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  Conversion
                </span>
                <div className={`flex items-center gap-1 ${getGrowthColor(kpis.conversionGrowth)}`}>
                  {getGrowthIcon(kpis.conversionGrowth)}
                  <span className="text-xs font-medium">{Math.abs(kpis.conversionGrowth)}%</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">Taux de conversion</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  Clients
                </span>
                <div className={`flex items-center gap-1 ${getGrowthColor(kpis.customersGrowth)}`}>
                  {getGrowthIcon(kpis.customersGrowth)}
                  <span className="text-xs font-medium">{Math.abs(kpis.customersGrowth)}%</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.customers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Clients uniques</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="revenue" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Revenus
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Layers className="h-4 w-4" />
              Produits
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Users className="h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="acquisition" className="gap-2">
              <Globe className="h-4 w-4" />
              Acquisition
            </TabsTrigger>
            <TabsTrigger value="predictive" className="gap-2">
              <Bot className="h-4 w-4" />
              IA Prédictive
            </TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Évolution du CA */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Évolution du Chiffre d'Affaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(value as number), 'CA']} />
                      <Area 
                        type="monotone" 
                        dataKey="ventes" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance Radar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    Score de Performance Global
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Performance"
                        dataKey="A"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Entonnoir de Conversion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Entonnoir de Conversion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversionFunnel.map((stage, index) => (
                    <div key={stage.stage} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{stage.stage}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {stage.count.toLocaleString()}
                          </span>
                          <span className="text-sm font-medium w-12 text-right">
                            {stage.rate}%
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={stage.rate} 
                        className="h-2" 
                        style={{ 
                          '--progress-background': `hsl(${220 + index * 20} 70% ${60 - index * 5}%)` 
                        } as React.CSSProperties}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenus */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Évolution Détaillée des Revenus</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="ventes" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        name="Revenus"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="commandes" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        name="Commandes"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Métriques Avancées</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Panier Moyen</span>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(kpis.avgOrderValue)}</div>
                        <div className={`text-xs ${getGrowthColor(kpis.aovGrowth)}`}>
                          {kpis.aovGrowth > 0 ? '+' : ''}{kpis.aovGrowth}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">CAC</span>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(kpis.cac)}</div>
                        <div className={`text-xs ${getGrowthColor(kpis.cacGrowth)}`}>
                          {kpis.cacGrowth > 0 ? '+' : ''}{kpis.cacGrowth}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">LTV</span>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(kpis.ltv)}</div>
                        <div className={`text-xs ${getGrowthColor(kpis.ltvGrowth)}`}>
                          {kpis.ltvGrowth > 0 ? '+' : ''}{kpis.ltvGrowth}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">ROI</span>
                      <div className="text-right">
                        <div className="font-medium">{(kpis.ltv / kpis.cac).toFixed(1)}x</div>
                        <div className="text-xs text-green-600">Excellent</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Objectifs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CA Mensuel</span>
                        <span>89%</span>
                      </div>
                      <Progress value={89} />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(67000)} / {formatCurrency(75000)}
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Nouveaux Clients</span>
                        <span>76%</span>
                      </div>
                      <Progress value={76} />
                      <p className="text-xs text-muted-foreground mt-1">
                        384 / 500 clients
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Produits */}
          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Produits par CA</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="ventes" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analyse de Rentabilité</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {productPerformance.map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-bold">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(product.ventes)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{product.marge}%</p>
                            <p className="text-xs text-muted-foreground">Marge</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{product.stock}</p>
                            <p className="text-xs text-muted-foreground">Stock</p>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${
                            product.stock > 50 ? 'bg-green-500' : 
                            product.stock > 20 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clients */}
          <TabsContent value="customers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rétention Client par Cohorte</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={cohortData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="retention1" stroke="#22c55e" name="1 mois" />
                      <Line type="monotone" dataKey="retention3" stroke="#3b82f6" name="3 mois" />
                      <Line type="monotone" dataKey="retention6" stroke="#8b5cf6" name="6 mois" />
                      <Line type="monotone" dataKey="retention12" stroke="#ef4444" name="12 mois" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Segmentation Clients</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Champions</span>
                      <div className="flex items-center gap-2">
                        <Progress value={25} className="w-20" />
                        <span className="text-sm font-medium">25%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Loyaux</span>
                      <div className="flex items-center gap-2">
                        <Progress value={35} className="w-20" />
                        <span className="text-sm font-medium">35%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Potentiels</span>
                      <div className="flex items-center gap-2">
                        <Progress value={20} className="w-20" />
                        <span className="text-sm font-medium">20%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">À Risque</span>
                      <div className="flex items-center gap-2">
                        <Progress value={20} className="w-20" />
                        <span className="text-sm font-medium">20%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Métriques Clients</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Taux de Rétention</span>
                      <span className="font-medium">{kpis.retentionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Fréquence d'Achat</span>
                      <span className="font-medium">2.4x/an</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Temps de Cycle</span>
                      <span className="font-medium">156 jours</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Acquisition */}
          <TabsContent value="acquisition" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sources de Trafic</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={trafficSources}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {trafficSources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {trafficSources.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm">{item.name}</span>
                        <span className="text-sm font-medium">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance par Canal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { canal: 'Google Ads', cac: 22.50, roas: 4.2, conversions: 156 },
                    { canal: 'Facebook Ads', cac: 18.30, roas: 3.8, conversions: 89 },
                    { canal: 'Instagram', cac: 31.20, roas: 2.9, conversions: 67 },
                    { canal: 'Email', cac: 5.80, roas: 8.1, conversions: 45 },
                    { canal: 'SEO', cac: 8.90, roas: 12.3, conversions: 234 }
                  ].map((canal, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{canal.canal}</p>
                        <p className="text-xs text-muted-foreground">{canal.conversions} conversions</p>
                      </div>
                      <div className="flex gap-6">
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(canal.cac)}</p>
                          <p className="text-xs text-muted-foreground">CAC</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{canal.roas}x</p>
                          <p className="text-xs text-muted-foreground">ROAS</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* IA Prédictive */}
          <TabsContent value="predictive" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-primary/20 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Bot className="h-5 w-5" />
                    Prédictions IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium">CA Prévu 30j</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(73500)}</p>
                      <p className="text-sm text-muted-foreground">+9.7% vs ce mois</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">Nouveaux Clients</p>
                      <p className="text-2xl font-bold text-blue-600">427</p>
                      <p className="text-sm text-muted-foreground">Confiance: 89%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="font-medium">Clients à Risque</p>
                      <p className="text-2xl font-bold text-orange-600">23</p>
                      <p className="text-sm text-muted-foreground">Action requise</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Opportunités Détectées
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium text-green-700 dark:text-green-400">
                      Segment High-Value sous-exploité
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Potentiel de +32% de revenus en ciblant les clients premium inactifs
                    </p>
                    <Button size="sm" className="mt-2">Voir stratégie</Button>
                  </div>
                  
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-blue-700 dark:text-blue-400">
                      Optimisation Cross-sell
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Écouteurs Pro + Montre Sport = +18% panier moyen
                    </p>
                    <Button size="sm" variant="outline" className="mt-2">Configurer</Button>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-medium text-purple-700 dark:text-purple-400">
                      Timing Optimal Campagne
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Lancement recommandé: Mardi 14h pour +24% ouvertures
                    </p>
                    <Button size="sm" variant="outline" className="mt-2">Planifier</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  )
}