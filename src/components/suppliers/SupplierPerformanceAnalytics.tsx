import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  Users,
  Star,
  CheckCircle
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'

interface SupplierMetrics {
  id: string
  name: string
  overallScore: number
  reliability: number
  responseTime: number
  productQuality: number
  priceCompetitiveness: number
  supportQuality: number
  deliverySpeed: number
  stockAvailability: number
  monthlyRevenue: number
  orderVolume: number
  returnRate: number
  satisfactionScore: number
  tier: 'premium' | 'gold' | 'silver' | 'bronze'
  trending: 'up' | 'down' | 'stable'
}

const supplierMetrics: SupplierMetrics[] = [
  {
    id: 'aliexpress',
    name: 'AliExpress',
    overallScore: 94,
    reliability: 96,
    responseTime: 85,
    productQuality: 88,
    priceCompetitiveness: 98,
    supportQuality: 82,
    deliverySpeed: 78,
    stockAvailability: 95,
    monthlyRevenue: 24500,
    orderVolume: 342,
    returnRate: 3.2,
    satisfactionScore: 4.2,
    tier: 'premium',
    trending: 'up'
  },
  {
    id: 'bigbuy',
    name: 'BigBuy',
    overallScore: 96,
    reliability: 98,
    responseTime: 92,
    productQuality: 94,
    priceCompetitiveness: 85,
    supportQuality: 96,
    deliverySpeed: 89,
    stockAvailability: 97,
    monthlyRevenue: 18200,
    orderVolume: 156,
    returnRate: 2.1,
    satisfactionScore: 4.6,
    tier: 'premium',
    trending: 'up'
  },
  {
    id: 'printful',
    name: 'Printful',
    overallScore: 89,
    reliability: 94,
    responseTime: 88,
    productQuality: 96,
    priceCompetitiveness: 72,
    supportQuality: 94,
    deliverySpeed: 85,
    stockAvailability: 88,
    monthlyRevenue: 8900,
    orderVolume: 89,
    returnRate: 1.8,
    satisfactionScore: 4.4,
    tier: 'gold',
    trending: 'stable'
  },
  {
    id: 'shopify',
    name: 'Shopify Store',
    overallScore: 76,
    reliability: 82,
    responseTime: 65,
    productQuality: 79,
    priceCompetitiveness: 88,
    supportQuality: 68,
    deliverySpeed: 74,
    stockAvailability: 71,
    monthlyRevenue: 3400,
    orderVolume: 45,
    returnRate: 5.8,
    satisfactionScore: 3.8,
    tier: 'silver',
    trending: 'down'
  }
]

const performanceData = [
  { month: 'Jan', aliexpress: 91, bigbuy: 93, printful: 87, shopify: 82 },
  { month: 'Fév', aliexpress: 89, bigbuy: 94, printful: 88, shopify: 79 },
  { month: 'Mar', aliexpress: 92, bigbuy: 95, printful: 89, shopify: 78 },
  { month: 'Avr', aliexpress: 93, bigbuy: 96, printful: 88, shopify: 75 },
  { month: 'Mai', aliexpress: 94, bigbuy: 96, printful: 89, shopify: 76 },
  { month: 'Jun', aliexpress: 94, bigbuy: 96, printful: 89, shopify: 76 }
]

const categoryData = [
  { name: 'Électronique', value: 35, revenue: 15200 },
  { name: 'Vêtements', value: 28, revenue: 12800 },
  { name: 'Maison', value: 20, revenue: 8900 },
  { name: 'Sport', value: 12, revenue: 5400 },
  { name: 'Autres', value: 5, revenue: 2200 }
]

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export const SupplierPerformanceAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const [selectedMetric, setSelectedMetric] = useState('overall')
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'text-purple-600 bg-purple-100'
      case 'gold': return 'text-yellow-600 bg-yellow-100'
      case 'silver': return 'text-gray-600 bg-gray-100'
      case 'bronze': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTrendingIcon = (trending: string) => {
    switch (trending) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />
      default: return <div className="w-4 h-4" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-orange-600'
    return 'text-red-600'
  }

  const topPerformer = supplierMetrics.reduce((prev, current) => 
    (prev.overallScore > current.overallScore) ? prev : current
  )

  const totalRevenue = supplierMetrics.reduce((sum, supplier) => sum + supplier.monthlyRevenue, 0)
  const avgSatisfaction = supplierMetrics.reduce((sum, supplier) => sum + supplier.satisfactionScore, 0) / supplierMetrics.length
  const avgReturnRate = supplierMetrics.reduce((sum, supplier) => sum + supplier.returnRate, 0) / supplierMetrics.length

  const radarData = selectedSupplier 
    ? (() => {
        const supplier = supplierMetrics.find(s => s.id === selectedSupplier)
        if (!supplier) return []
        return [
          { subject: 'Fiabilité', A: supplier.reliability, fullMark: 100 },
          { subject: 'Temps Réponse', A: supplier.responseTime, fullMark: 100 },
          { subject: 'Qualité', A: supplier.productQuality, fullMark: 100 },
          { subject: 'Prix', A: supplier.priceCompetitiveness, fullMark: 100 },
          { subject: 'Support', A: supplier.supportQuality, fullMark: 100 },
          { subject: 'Livraison', A: supplier.deliverySpeed, fullMark: 100 },
          { subject: 'Stock', A: supplier.stockAvailability, fullMark: 100 }
        ]
      })()
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Analytics Fournisseurs
          </h2>
          <p className="text-muted-foreground">
            Analyse approfondie des performances de vos fournisseurs
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Mois</SelectItem>
              <SelectItem value="3months">3 Mois</SelectItem>
              <SelectItem value="6months">6 Mois</SelectItem>
              <SelectItem value="1year">1 Année</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chiffre d'Affaires</p>
                <p className="text-2xl font-bold">€{totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +12% ce mois
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Performer</p>
                <p className="text-lg font-bold">{topPerformer.name}</p>
                <p className="text-xs text-purple-600 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  {topPerformer.overallScore}% score
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction Moyenne</p>
                <p className="text-2xl font-bold">{avgSatisfaction.toFixed(1)}/5</p>
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Très bon niveau
                </p>
              </div>
              <Star className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux Retour Moy.</p>
                <p className="text-2xl font-bold">{avgReturnRate.toFixed(1)}%</p>
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Objectif: &lt;5%
                </p>
              </div>
              <Target className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des Performances</CardTitle>
          <CardDescription>
            Scores de performance par fournisseur sur les 6 derniers mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[60, 100]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="aliexpress" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="AliExpress"
              />
              <Line 
                type="monotone" 
                dataKey="bigbuy" 
                stroke="#10b981" 
                strokeWidth={2}
                name="BigBuy"
              />
              <Line 
                type="monotone" 
                dataKey="printful" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Printful"
              />
              <Line 
                type="monotone" 
                dataKey="shopify" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Shopify"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Rankings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Classement Fournisseurs
            </CardTitle>
            <CardDescription>
              Classement basé sur les performances globales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supplierMetrics
                .sort((a, b) => b.overallScore - a.overallScore)
                .map((supplier, index) => (
                  <div key={supplier.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                        {getTrendingIcon(supplier.trending)}
                      </div>
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getTierColor(supplier.tier)}>
                            {supplier.tier}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            €{supplier.monthlyRevenue.toLocaleString()}/mois
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-xl font-bold ${getScoreColor(supplier.overallScore)}`}>
                        {supplier.overallScore}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {supplier.orderVolume} commandes
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance par Catégorie</CardTitle>
            <CardDescription>
              Répartition du chiffre d'affaires par catégorie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {categoryData.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{category.name}</span>
                  </div>
                  <span className="text-sm font-medium">€{category.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Analyse Détaillée</CardTitle>
            <Select value={selectedSupplier || 'all'} onValueChange={(value) => setSelectedSupplier(value === 'all' ? null : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sélectionner un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les fournisseurs</SelectItem>
                {supplierMetrics.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {selectedSupplier ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Profil de Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="A"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Metrics */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Métriques Détaillées</h3>
                <div className="space-y-3">
                  {(() => {
                    const supplier = supplierMetrics.find(s => s.id === selectedSupplier)
                    if (!supplier) return null
                    
                    const metrics = [
                      { label: 'Fiabilité', value: supplier.reliability, icon: CheckCircle },
                      { label: 'Temps de Réponse', value: supplier.responseTime, icon: Clock },
                      { label: 'Qualité Produits', value: supplier.productQuality, icon: Package },
                      { label: 'Compétitivité Prix', value: supplier.priceCompetitiveness, icon: DollarSign },
                      { label: 'Support Client', value: supplier.supportQuality, icon: Users },
                      { label: 'Vitesse Livraison', value: supplier.deliverySpeed, icon: TrendingUp },
                      { label: 'Disponibilité Stock', value: supplier.stockAvailability, icon: Package }
                    ]
                    
                    return metrics.map((metric) => (
                      <div key={metric.label} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <metric.icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{metric.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${metric.value}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{metric.value}%</span>
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Sélectionnez un fournisseur pour voir l'analyse détaillée
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}