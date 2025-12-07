import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { BarChart3, Package, Upload, FileText, TrendingUp, Shield, Zap } from 'lucide-react'
import { ImportDashboard } from '@/components/import/ImportDashboard'
import { AdvancedImportResults } from '@/components/import/AdvancedImportResults'
import { ImportCSVWithValidation } from '@/components/import/ImportCSVWithValidation'
import { PrePublicationValidator } from '@/components/import/PrePublicationValidator'
import { AutoValidationQueue } from '@/components/import/AutoValidationQueue'
import { useNavigate } from 'react-router-dom'

export default function ImportManagement() {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Gestion des Imports</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gestion, analyse et publication de vos imports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/products/import/quick')}>
            <Upload className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Import Rapide</span>
          </Button>
        </div>
      </div>

      {/* Navigation rapide */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
          onClick={() => navigate('/products/import/manage/products')}
        >
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-xs sm:text-sm truncate">Produits</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Liste complète</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
          onClick={() => navigate('/products/import/manage/publishing')}
        >
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-xs sm:text-sm truncate">Publication</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Publier produits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
          onClick={() => navigate('/products/import/manage/marketplace')}
        >
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-xs sm:text-sm truncate">Marketplace</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Sync & export</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
          onClick={() => navigate('/products/import/manage/history')}
        >
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-xs sm:text-sm truncate">Historique</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Voir tout</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs defaultValue="dashboard" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide">
          <TabsTrigger value="dashboard" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Tableau de Bord</span>
            <span className="sm:hidden">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Package className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Produits Importés</span>
            <span className="sm:hidden">Produits</span>
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Validation</span>
            <span className="sm:hidden">Valid.</span>
          </TabsTrigger>
          <TabsTrigger value="auto-validation" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Auto-Validation</span>
            <span className="sm:hidden">Auto</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Nouvel Import</span>
            <span className="sm:hidden">Import</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
            Rapports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ImportDashboard />
        </TabsContent>

        <TabsContent value="products">
          <AdvancedImportResults />
        </TabsContent>

        <TabsContent value="validation">
          <PrePublicationValidator />
        </TabsContent>

        <TabsContent value="auto-validation">
          <AutoValidationQueue />
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 w-5" />
                Nouvel Import CSV avec Validation
              </CardTitle>
              <CardDescription>
                Importez vos produits depuis un fichier CSV avec validation automatique
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportCSVWithValidation />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Rapport de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Analyse détaillée des imports et de leur performance
                </p>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Taux de succès:</span>
                    <span className="font-medium">92.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temps moyen:</span>
                    <span className="font-medium">45 sec</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Erreurs résolues:</span>
                    <span className="font-medium">98.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Qualité des Produits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Évaluation de la qualité des données importées
                </p>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Complétude moyenne:</span>
                    <span className="font-medium">87.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Images présentes:</span>
                    <span className="font-medium">94.1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Descriptions OK:</span>
                    <span className="font-medium">89.7%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Optimisations IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Performance des optimisations automatiques
                </p>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Produits optimisés:</span>
                    <span className="font-medium">156</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amélioration SEO:</span>
                    <span className="font-medium">+23%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prix optimisés:</span>
                    <span className="font-medium">67</span>
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
