import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { BarChart3, Package, Upload, FileText, TrendingUp } from 'lucide-react'
import { ImportDashboard } from '@/components/import/ImportDashboard'
import { AdvancedImportResults } from '@/components/import/AdvancedImportResults'
import { ImportUltraProInterface } from '@/components/import/ImportUltraProInterface'
import { useNavigate } from 'react-router-dom'

export default function ImportManagement() {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion des Imports</h1>
          <p className="text-muted-foreground">
            Module complet de gestion, analyse et publication de vos imports
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/import')}>
          Retour au Hub
        </Button>
      </div>

      {/* Navigation rapide */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/import/manage/products')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              <div>
                <p className="font-semibold">Produits</p>
                <p className="text-sm text-muted-foreground">Liste complète</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/import/manage/publishing')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Upload className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-semibold">Publication</p>
                <p className="text-sm text-muted-foreground">Publier produits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/import/manage/marketplace')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="font-semibold">Marketplace</p>
                <p className="text-sm text-muted-foreground">Sync & export</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/import/manage/history')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-semibold">Historique</p>
                <p className="text-sm text-muted-foreground">Voir tout</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Tableau de Bord
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Produits Importés
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Nouvel Import
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Rapports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ImportDashboard />
        </TabsContent>

        <TabsContent value="products">
          <AdvancedImportResults />
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Nouvel Import de Produits
              </CardTitle>
              <CardDescription>
                Interface complète pour importer vos produits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportUltraProInterface />
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
