import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  Package,
  Zap,
  Users,
  Globe
} from 'lucide-react'
import { useImportProducts } from '@/hooks/useImportProducts';

export const ImportAnalytics = () => {
  const { importedProducts, aiJobs, scheduledImports } = useImportProducts();
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('imports')

  // Calculate analytics data
  const totalImports = importedProducts.length
  const successfulImports = importedProducts.filter(p => p.status === 'published').length
  const failedImports = importedProducts.filter(p => p.review_status === 'rejected').length
  const aiOptimizedProducts = importedProducts.filter(p => p.ai_optimized).length
  
  const successRate = totalImports > 0 ? ((successfulImports / totalImports) * 100).toFixed(1) : '0'
  const optimizationRate = totalImports > 0 ? ((aiOptimizedProducts / totalImports) * 100).toFixed(1) : '0'

  // Mock time series data
  const importTrends = [
    { date: '2024-01-08', imports: 15, success: 12, failed: 3 },
    { date: '2024-01-09', imports: 23, success: 20, failed: 3 },
    { date: '2024-01-10', imports: 18, success: 16, failed: 2 },
    { date: '2024-01-11', imports: 31, success: 28, failed: 3 },
    { date: '2024-01-12', imports: 27, success: 24, failed: 3 },
    { date: '2024-01-13', imports: 35, success: 32, failed: 3 },
    { date: '2024-01-14', imports: 29, success: 26, failed: 3 }
  ]

  const categoryBreakdown = [
    { category: 'Électronique', count: 45, percentage: 35 },
    { category: 'Mode', count: 32, percentage: 25 },
    { category: 'Maison', count: 28, percentage: 22 },
    { category: 'Sport', count: 23, percentage: 18 }
  ]

  const supplierPerformance = [
    { supplier: 'AliExpress', imports: 78, success_rate: 92, avg_time: '2.3m' },
    { supplier: 'BigBuy', imports: 45, success_rate: 89, avg_time: '1.8m' },
    { supplier: 'Shopify Store', imports: 23, success_rate: 96, avg_time: '1.2m' },
    { supplier: 'CSV Import', imports: 15, success_rate: 87, avg_time: '0.8m' }
  ]

  const OverviewMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{totalImports}</div>
              <p className="text-sm text-muted-foreground">Total Imports</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600">+12% cette semaine</span>
              </div>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{successRate}%</div>
              <p className="text-sm text-muted-foreground">Taux de Succès</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600">+3.2% vs hier</span>
              </div>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600">{optimizationRate}%</div>
              <p className="text-sm text-muted-foreground">IA Optimisé</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-purple-500" />
                <span className="text-xs text-purple-600">+8% cette semaine</span>
              </div>
            </div>
            <Zap className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">2.1m</div>
              <p className="text-sm text-muted-foreground">Temps Moyen</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600">-15s vs hier</span>
              </div>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const ImportTrendChart = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tendances d'Import</CardTitle>
            <CardDescription>Évolution sur les 7 derniers jours</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 heures</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {importTrends.map((day, index) => (
            <div key={day.date} className="flex items-center gap-4">
              <div className="w-20 text-sm text-muted-foreground">
                {new Date(day.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{day.imports} imports</span>
                  <Badge variant="outline" className="text-xs bg-green-50">
                    {day.success} succès
                  </Badge>
                  {day.failed > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {day.failed} échecs
                    </Badge>
                  )}
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min((day.imports / 40) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground w-16 text-right">
                {((day.success / day.imports) * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const CategoryBreakdown = () => (
    <Card>
      <CardHeader>
        <CardTitle>Répartition par Catégorie</CardTitle>
        <CardDescription>Distribution des imports par catégorie</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categoryBreakdown.map((cat) => (
            <div key={cat.category} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="font-medium">{cat.category}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-8">
                  {cat.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const SupplierPerformance = () => (
    <Card>
      <CardHeader>
        <CardTitle>Performance par Fournisseur</CardTitle>
        <CardDescription>Analyse comparative des sources d'import</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {supplierPerformance.map((supplier) => (
            <div key={supplier.supplier} className="flex items-center justify-between p-4 border rounded">
              <div>
                <div className="font-medium">{supplier.supplier}</div>
                <div className="text-sm text-muted-foreground">
                  {supplier.imports} imports • Temps moyen: {supplier.avg_time}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium">{supplier.success_rate}%</div>
                  <div className="text-xs text-muted-foreground">Succès</div>
                </div>
                <Badge 
                  variant={supplier.success_rate >= 90 ? "default" : "secondary"}
                  className={supplier.success_rate >= 90 ? "bg-green-100 text-green-800" : ""}
                >
                  {supplier.success_rate >= 90 ? "Excellent" : "Correct"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const AIOptimizationStats = () => (
    <Card>
      <CardHeader>
        <CardTitle>Statistiques IA</CardTitle>
        <CardDescription>Performance des optimisations automatiques</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{aiJobs.length}</div>
            <div className="text-sm text-muted-foreground">Jobs IA Total</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {aiJobs.filter(j => j.status === 'completed').length}
            </div>
            <div className="text-sm text-muted-foreground">Complétés</div>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Image Optimization</span>
            <span>{aiJobs.filter(j => j.job_type === 'image_optimization').length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>SEO Enhancement</span>
            <span>{aiJobs.filter(j => j.job_type === 'seo_enhancement').length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Translation</span>
            <span>{aiJobs.filter(j => j.job_type === 'translation').length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics d'Import</h2>
          <p className="text-muted-foreground">
            Analyse détaillée des performances et tendances d'import
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <OverviewMetrics />

      {/* Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="ai">IA & Optimisation</TabsTrigger>
          <TabsTrigger value="quality">Qualité</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ImportTrendChart />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Prévisions</CardTitle>
                  <CardDescription>Estimations pour les 7 prochains jours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Imports estimés</span>
                      <span className="font-medium">~180-220</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Taux de succès prévu</span>
                      <span className="font-medium text-green-600">~91%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Optimisation IA</span>
                      <span className="font-medium text-purple-600">~75%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryBreakdown />
            <Card>
              <CardHeader>
                <CardTitle>Tendances Catégories</CardTitle>
                <CardDescription>Évolution par catégorie cette semaine</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryBreakdown.map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <span>{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">+{Math.floor(Math.random() * 20 + 5)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <SupplierPerformance />
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIOptimizationStats />
            <Card>
              <CardHeader>
                <CardTitle>Efficacité IA</CardTitle>
                <CardDescription>Impact des optimisations automatiques</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Amélioration SEO moyenne</span>
                    <Badge className="bg-green-100 text-green-800">+23%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Optimisation images</span>
                    <Badge className="bg-blue-100 text-blue-800">+67% qualité</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Suggestions acceptées</span>
                    <Badge className="bg-purple-100 text-purple-800">89%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scores de Qualité</CardTitle>
              <CardDescription>Évaluation automatique de la qualité des imports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">8.7</div>
                  <div className="text-sm text-muted-foreground">Score Moyen</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">92%</div>
                  <div className="text-sm text-muted-foreground">Complétude Données</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">85%</div>
                  <div className="text-sm text-muted-foreground">Conformité Standards</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}