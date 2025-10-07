import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Eye,
  MousePointer,
  RefreshCw,
  Target,
  Brain,
  Sparkles,
  Calendar,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'

interface AnalyticsData {
  date: string
  revenue: number
  orders: number
  visitors: number
  conversions: number
  avgOrderValue: number
  bounceRate: number
}

interface CustomerSegment {
  name: string
  count: number
  value: number
  growth: number
  color: string
  [key: string]: any
}

interface ProductPerformance {
  name: string
  sales: number
  revenue: number
  margin: number
  trend: 'up' | 'down' | 'stable'
}

export function AdvancedAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([])
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([])
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  useEffect(() => {
    generateAnalyticsData()
  }, [selectedPeriod])

  const generateAnalyticsData = () => {
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90
    
    const data: AnalyticsData[] = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      
      return {
        date: date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        revenue: Math.floor(Math.random() * 5000) + 2000,
        orders: Math.floor(Math.random() * 50) + 20,
        visitors: Math.floor(Math.random() * 500) + 200,
        conversions: Math.floor(Math.random() * 30) + 10,
        avgOrderValue: Math.floor(Math.random() * 100) + 80,
        bounceRate: Math.floor(Math.random() * 30) + 25
      }
    })

    const segments: CustomerSegment[] = [
      { name: 'Nouveaux Clients', count: 1247, value: 45280, growth: 15.3, color: '#3b82f6' },
      { name: 'Clients Fidèles', count: 892, value: 67340, growth: 8.7, color: '#10b981' },
      { name: 'VIP/Premium', count: 156, value: 89450, growth: 23.1, color: '#f59e0b' },
      { name: 'Inactifs', count: 543, value: 12890, growth: -5.2, color: '#ef4444' }
    ]

    const products: ProductPerformance[] = [
      { name: 'Smartphone XY', sales: 234, revenue: 156780, margin: 28, trend: 'up' },
      { name: 'Casque Audio Pro', sales: 189, revenue: 89450, margin: 32, trend: 'up' },
      { name: 'Montre Connectée', sales: 156, revenue: 67890, margin: 25, trend: 'stable' },
      { name: 'Tablette Ultra', sales: 98, revenue: 45670, margin: 18, trend: 'down' },
      { name: 'Écouteurs Sans-fil', sales: 312, revenue: 34560, margin: 35, trend: 'up' }
    ]

    setAnalyticsData(data)
    setCustomerSegments(segments)
    setProductPerformance(products)
  }

  const runAdvancedAnalysis = async () => {
    setLoading(true)
    toast.loading('Analyse IA avancée en cours...', { id: 'advanced-analysis' })

    try {
      await new Promise(resolve => setTimeout(resolve, 3000))

      toast.success(
        '✅ Analyse terminée ! Nouvelles insights disponibles.',
        { id: 'advanced-analysis', duration: 4000 }
      )

      // Simuler la génération de nouvelles données
      generateAnalyticsData()
    } catch (error) {
      toast.error('Erreur lors de l\'analyse', { id: 'advanced-analysis' })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-400" />
    }
  }

  const totalRevenue = analyticsData.reduce((sum, day) => sum + day.revenue, 0)
  const totalOrders = analyticsData.reduce((sum, day) => sum + day.orders, 0)
  const avgConversion = analyticsData.reduce((sum, day) => sum + day.conversions, 0) / analyticsData.length

  return (
    <div className="space-y-6">
      {/* Contrôles et Métriques Principales */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Analytics Avancées IA
              </CardTitle>
              <CardDescription>
                Insights approfondies et analyses prédictives
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPeriod('7d')}
                className={selectedPeriod === '7d' ? 'bg-primary text-primary-foreground' : ''}
              >
                7j
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPeriod('30d')}
                className={selectedPeriod === '30d' ? 'bg-primary text-primary-foreground' : ''}
              >
                30j
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPeriod('90d')}
                className={selectedPeriod === '90d' ? 'bg-primary text-primary-foreground' : ''}
              >
                90j
              </Button>
              <Button 
                onClick={runAdvancedAnalysis}
                disabled={loading}
                className="ml-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyse...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyse IA
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Revenus</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalRevenue)}</div>
              <div className="text-xs text-blue-600">+12.5% vs période précédente</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Commandes</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{totalOrders}</div>
              <div className="text-xs text-green-600">+8.3% vs période précédente</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Conversion</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">{avgConversion.toFixed(1)}%</div>
              <div className="text-xs text-purple-600">+2.1% vs période précédente</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Visiteurs</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">
                {analyticsData.reduce((sum, day) => sum + day.visitors, 0)}
              </div>
              <div className="text-xs text-orange-600">+15.7% vs période précédente</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graphiques et Analyses */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="segments">Segments Clients</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="predictions">Prédictions IA</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `€${value}`} />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenus']} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métriques de Conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="conversions" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bounceRate" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ fill: '#ef4444' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Répartition des Segments Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={customerSegments}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(props: any) => `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`}
                    >
                      {customerSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Détails des Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerSegments.map((segment, index) => (
                    <div key={index} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{segment.name}</span>
                        <Badge 
                          className={`text-xs ${
                            segment.growth > 0 ? 'bg-green-500' : 'bg-red-500'
                          } text-white`}
                        >
                          {segment.growth > 0 ? '+' : ''}{segment.growth}%
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>{segment.count} clients</div>
                        <div>{formatCurrency(segment.value)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance des Produits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productPerformance.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
                    <div className="flex items-center gap-3">
                      {getTrendIcon(product.trend)}
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          {product.sales} ventes • Marge: {product.margin}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(product.revenue)}</div>
                      <Badge variant="secondary" className="text-xs">
                        {product.trend === 'up' ? 'Croissance' : 
                         product.trend === 'down' ? 'Déclin' : 'Stable'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Prédictions IA
              </CardTitle>
              <CardDescription>
                Analyses prédictives basées sur l'intelligence artificielle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Prévisions 30 Jours</h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-800">Revenus Prévus</div>
                      <div className="text-2xl font-bold text-blue-900">€87,450</div>
                      <div className="text-sm text-blue-600">+18% vs mois précédent</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-800">Nouvelles Commandes</div>
                      <div className="text-2xl font-bold text-green-900">1,247</div>
                      <div className="text-sm text-green-600">+12% vs mois précédent</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="font-medium text-purple-800">Taux de Conversion</div>
                      <div className="text-2xl font-bold text-purple-900">4.2%</div>
                      <div className="text-sm text-purple-600">+0.5% vs mois précédent</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Recommandations IA</h4>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Optimisation Marketing</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Augmentez vos investissements publicitaires de 25% sur le segment "Nouveaux Clients" pour maximiser le ROI.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">Personnalisation</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Implémentez des recommandations produits personnalisées pour augmenter le panier moyen de 15%.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Rétention Client</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Lancez une campagne de fidélisation pour les clients inactifs avec un potentiel de récupération de 68%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}