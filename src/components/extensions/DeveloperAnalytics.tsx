import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, TrendingUp, DollarSign, Users, Download, Star, Eye,
  Calendar, MapPin, Clock, Smartphone, Monitor, Tablet, Globe,
  Filter, RefreshCw, FileDown, Share2, Target, Zap
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const revenueData = [
  { month: 'Jan', revenue: 2400, downloads: 1200, users: 800 },
  { month: 'Fév', revenue: 1398, downloads: 900, users: 600 },
  { month: 'Mar', revenue: 9800, downloads: 4500, users: 2800 },
  { month: 'Avr', revenue: 3908, downloads: 2100, users: 1400 },
  { month: 'Mai', revenue: 4800, downloads: 2800, users: 1800 },
  { month: 'Jun', revenue: 3800, downloads: 2200, users: 1500 },
  { month: 'Jul', revenue: 4300, downloads: 2600, users: 1700 },
  { month: 'Aoû', revenue: 5200, downloads: 3100, users: 2000 },
  { month: 'Sep', revenue: 6100, downloads: 3600, users: 2300 },
  { month: 'Oct', revenue: 5800, downloads: 3400, users: 2200 },
  { month: 'Nov', revenue: 6400, downloads: 3800, users: 2400 },
  { month: 'Déc', revenue: 7200, downloads: 4200, users: 2700 }
]

const deviceData = [
  { name: 'Desktop', value: 65, color: '#8884d8' },
  { name: 'Mobile', value: 28, color: '#82ca9d' },
  { name: 'Tablette', value: 7, color: '#ffc658' }
]

const geographicData = [
  { country: 'France', users: 3420, revenue: 15680 },
  { country: 'Allemagne', users: 2180, revenue: 12340 },
  { country: 'Espagne', users: 1890, revenue: 9870 },
  { country: 'Italie', users: 1650, revenue: 8920 },
  { country: 'Royaume-Uni', users: 1420, revenue: 7650 },
  { country: 'Belgique', users: 980, revenue: 4320 },
  { country: 'Pays-Bas', users: 820, revenue: 3890 },
  { country: 'Suisse', users: 640, revenue: 3210 }
]

const extensionPerformance = [
  {
    id: 'ai-optimizer',
    name: 'AI Product Optimizer',
    revenue: 18500,
    downloads: 12400,
    rating: 4.8,
    reviews: 234,
    conversion: 12.4,
    refunds: 2.1,
    support_tickets: 45,
    trend: '+15%'
  },
  {
    id: 'inventory-manager',
    name: 'Smart Inventory Manager',
    revenue: 8900,
    downloads: 6700,
    rating: 4.6,
    reviews: 156,
    conversion: 8.9,
    refunds: 3.2,
    support_tickets: 28,
    trend: '+8%'
  },
  {
    id: 'analytics-pro',
    name: 'Analytics Dashboard Pro',
    revenue: 15600,
    downloads: 4200,
    rating: 4.7,
    reviews: 89,
    conversion: 18.5,
    refunds: 1.8,
    support_tickets: 12,
    trend: '+22%'
  }
]

export const DeveloperAnalytics = () => {
  const [timeRange, setTimeRange] = useState('12m')
  const [selectedMetric, setSelectedMetric] = useState('revenue')

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0)
  const totalDownloads = revenueData.reduce((sum, item) => sum + item.downloads, 0)
  const totalUsers = revenueData.reduce((sum, item) => sum + item.users, 0)
  const averageRevenue = totalRevenue / revenueData.length
  const growthRate = ((revenueData[revenueData.length - 1].revenue - revenueData[0].revenue) / revenueData[0].revenue * 100)

  const exportData = () => {
    // Simulation d'export de données
    const csvContent = [
      ['Mois', 'Revenus', 'Téléchargements', 'Utilisateurs'],
      ...revenueData.map(item => [item.month, item.revenue, item.downloads, item.users])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${timeRange}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-accent">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            Analytics Développeur
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyses détaillées de vos extensions et revenus
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="3m">3 mois</SelectItem>
              <SelectItem value="6m">6 mois</SelectItem>
              <SelectItem value="12m">12 mois</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <FileDown className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold text-success">
              {totalRevenue.toLocaleString()}€
            </div>
            <div className="text-sm text-muted-foreground">Revenus totaux</div>
            <div className="text-xs text-success mt-1">
              +{growthRate.toFixed(1)}% vs période précédente
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Download className="w-8 h-8 text-info mx-auto mb-2" />
            <div className="text-2xl font-bold text-info">
              {totalDownloads.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Téléchargements</div>
            <div className="text-xs text-info mt-1">
              +18% ce mois
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary">
              {totalUsers.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Utilisateurs actifs</div>
            <div className="text-xs text-primary mt-1">
              +12% ce mois
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold text-warning">
              {averageRevenue.toFixed(0)}€
            </div>
            <div className="text-sm text-muted-foreground">Revenu moyen/mois</div>
            <div className="text-xs text-warning mt-1">
              Tendance: +{growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="extensions">Extensions</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="geographic">Géographie</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Évolution des revenus et téléchargements
              </CardTitle>
              <CardDescription>
                Performance mensuelle sur les 12 derniers mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenus (€)" />
                    <Line yAxisId="right" type="monotone" dataKey="downloads" stroke="#82ca9d" name="Téléchargements" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par appareil</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métriques clés</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-info" />
                    Taux de conversion moyen
                  </span>
                  <span className="font-bold text-info">13.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning" />
                    Note moyenne
                  </span>
                  <span className="font-bold text-warning">4.7/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-destructive" />
                    Taux de remboursement
                  </span>
                  <span className="font-bold text-destructive">2.4%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-success" />
                    Temps de réponse support
                  </span>
                  <span className="font-bold text-success">4.2h</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="extensions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance par extension</CardTitle>
              <CardDescription>
                Comparaison détaillée de toutes vos extensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {extensionPerformance.map(ext => (
                  <div key={ext.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{ext.name}</h3>
                      <Badge className={ext.trend.startsWith('+') ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}>
                        {ext.trend}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">
                          {ext.revenue.toLocaleString()}€
                        </div>
                        <div className="text-muted-foreground">Revenus</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-info">
                          {ext.downloads.toLocaleString()}
                        </div>
                        <div className="text-muted-foreground">Téléchargements</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-warning">
                          {ext.rating}
                        </div>
                        <div className="text-muted-foreground">{ext.reviews} avis</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {ext.conversion}%
                        </div>
                        <div className="text-muted-foreground">Conversion</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                      <div>Remboursements: {ext.refunds}%</div>
                      <div>Tickets support: {ext.support_tickets}</div>
                      <div>Satisfaction: {((5 - ext.rating) * 20).toFixed(0)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="users" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segments d'utilisateurs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Nouveaux utilisateurs</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div className="bg-info h-2 rounded-full" style={{width: '65%'}}></div>
                    </div>
                    <span className="font-bold">65%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Utilisateurs récurrents</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div className="bg-success h-2 rounded-full" style={{width: '25%'}}></div>
                    </div>
                    <span className="font-bold">25%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Utilisateurs premium</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{width: '10%'}}></div>
                    </div>
                    <span className="font-bold">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Répartition géographique
              </CardTitle>
              <CardDescription>
                Performance par pays et région
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {geographicData.map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{country.country}</div>
                        <div className="text-sm text-muted-foreground">
                          {country.users.toLocaleString()} utilisateurs
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-success">
                        {country.revenue.toLocaleString()}€
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(country.revenue / country.users).toFixed(2)}€/user
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Recommandations IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-info/10 border border-info/20 rounded-lg">
                  <div className="font-medium text-info mb-1">Optimisation des prix</div>
                  <div className="text-sm text-info/80">
                    Augmentez le prix de "AI Product Optimizer" de 15% pour maximiser les revenus sans impact sur les ventes.
                  </div>
                </div>
                
                <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                  <div className="font-medium text-success mb-1">Nouvelle fonctionnalité</div>
                  <div className="text-sm text-success/80">
                    78% des utilisateurs demandent une intégration Shopify dans vos extensions d'inventaire.
                  </div>
                </div>
                
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="font-medium text-warning mb-1">Support client</div>
                  <div className="text-sm text-warning/80">
                    Réduisez le temps de réponse support pour améliorer la satisfaction de 23%.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Objectifs et prédictions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Objectif mensuel (8000€)</span>
                    <span className="font-bold">85%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-success h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Prédiction fin d'année</span>
                    <span className="font-bold text-success">95K€</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Basé sur la tendance actuelle +18% MoM
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Croissance utilisateurs</span>
                    <span className="font-bold text-info">+24%</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Estimation pour les 3 prochains mois
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DeveloperAnalytics