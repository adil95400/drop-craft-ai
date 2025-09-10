import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  Eye,
  Database
} from 'lucide-react'
import { useProductionData } from '@/hooks/useProductionData'
import { useImportUltraPro } from '@/hooks/useImportUltraPro'
import { BulkImportUltraPro } from '@/components/import/BulkImportUltraPro'
import { AIImportUltraPro } from '@/components/import/AIImportUltraPro'
import { ImportUltraProInterface } from '@/components/import/ImportUltraProInterface'
import { ExtensionsImportInterface } from '@/components/import/ExtensionsImportInterface'
import { BrowserExtensionImportInterface } from '@/components/import/BrowserExtensionImportInterface'

export const ProductionImportInterface = () => {
  const { dashboardStats, isLoadingStats, seedDatabase, isSeeding } = useProductionData()
  const { importedProducts, isLoadingProducts } = useImportUltraPro()
  const [activeView, setActiveView] = useState<string>('overview')

  const importStats = {
    total: importedProducts.length,
    published: importedProducts.filter(p => p.status === 'published').length,
    draft: importedProducts.filter(p => p.status === 'draft').length,
    failed: importedProducts.filter(p => p.review_status === 'rejected').length,
    ai_optimized: importedProducts.filter(p => p.ai_optimized).length
  }

  const conversionRate = importStats.total > 0 ? 
    Math.round((importStats.published / importStats.total) * 100) : 0

  const qualityScore = importedProducts.length > 0 ?
    Math.round(importedProducts.reduce((acc, p) => acc + (p.import_quality_score || 0), 0) / importedProducts.length) : 0

  return (
    <div className="space-y-8">
      {/* Header with Production Stats */}
      <div className="relative bg-gradient-hero p-8 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2">Import Production Interface</h1>
              <p className="text-xl opacity-90">
                Interface complète de gestion d'imports en environnement de production
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-gradient-accent text-white px-4 py-2 font-bold">
                <Database className="h-4 w-4 mr-2" />
                PRODUCTION
              </Badge>
              <Button
                onClick={() => seedDatabase()}
                disabled={isSeeding}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                {isSeeding ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Initialisation...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Initialiser DB
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Production KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-2xl font-bold">{dashboardStats?.totalProducts || 0}</div>
                    <p className="text-sm opacity-80">Produits Production</p>
                  </div>
                  <Package className="h-5 w-5 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-2xl font-bold">{dashboardStats?.totalOrders || 0}</div>
                    <p className="text-sm opacity-80">Commandes Total</p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-2xl font-bold">{importStats.total}</div>
                    <p className="text-sm opacity-80">Produits Importés</p>
                  </div>
                  <Download className="h-5 w-5 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-2xl font-bold">{conversionRate}%</div>
                    <p className="text-sm opacity-80">Taux Publication</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Import Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics d'Import
            </CardTitle>
            <CardDescription>
              Métriques détaillées de performance d'import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{importStats.total}</div>
                <div className="text-sm text-muted-foreground">Total Imports</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{importStats.published}</div>
                <div className="text-sm text-muted-foreground">Publiés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{importStats.draft}</div>
                <div className="text-sm text-muted-foreground">Brouillons</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{importStats.ai_optimized}</div>
                <div className="text-sm text-muted-foreground">IA Optimisés</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Taux de Publication</span>
                  <span>{conversionRate}%</span>
                </div>
                <Progress value={conversionRate} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Score Qualité Moyen</span>
                  <span>{qualityScore}/100</span>
                </div>
                <Progress value={qualityScore} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Imports Récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {importedProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(product.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.status === 'published' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {product.status === 'draft' && (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                    {product.ai_optimized && (
                      <Badge variant="secondary" className="text-xs">IA</Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {importedProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun import encore effectué</p>
                  <p className="text-sm">Commencez par importer vos premiers produits</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Interfaces */}
      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="interface">Interface Unifiée</TabsTrigger>
          <TabsTrigger value="extensions">Extensions IA</TabsTrigger>
          <TabsTrigger value="browser">Extension Navigateur</TabsTrigger>
          <TabsTrigger value="bulk">Import en Masse</TabsTrigger>
          <TabsTrigger value="ai">IA Avancée</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Production Import Overview</CardTitle>
              <CardDescription>
                Vue d'ensemble complète de vos imports en production
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Status des Imports</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Publiés</span>
                      <Badge variant="default">{importStats.published}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">En attente</span>
                      <Badge variant="secondary">{importStats.draft}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Échecs</span>
                      <Badge variant="destructive">{importStats.failed}</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Optimisations IA</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Optimisés IA</span>
                      <Badge className="bg-purple-100 text-purple-800">{importStats.ai_optimized}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Standard</span>
                      <Badge variant="outline">{importStats.total - importStats.ai_optimized}</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Métriques Qualité</h3>
                  <div className="space-y-2">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{qualityScore}</div>
                      <div className="text-sm text-muted-foreground">Score Qualité Moyen</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{conversionRate}%</div>
                      <div className="text-sm text-muted-foreground">Taux de Conversion</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interface">
          <ImportUltraProInterface />
        </TabsContent>

        <TabsContent value="extensions">
          <ExtensionsImportInterface 
            importMethod="all"
            onExtensionActivated={(ext) => {
              console.log('Extension activée:', ext)
            }}
          />
        </TabsContent>

        <TabsContent value="browser">
          <BrowserExtensionImportInterface />
        </TabsContent>

        <TabsContent value="bulk">
          <BulkImportUltraPro />
        </TabsContent>

        <TabsContent value="ai">
          <AIImportUltraPro />
        </TabsContent>
      </Tabs>
    </div>
  )
}