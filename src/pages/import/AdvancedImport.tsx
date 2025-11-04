import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Settings, Database, Zap, TrendingUp, FolderSync } from 'lucide-react'
import { ImportUltraProInterface } from '@/components/import/ImportUltraProInterface'
import { AdvancedMapping } from '@/components/import/AdvancedMapping'
import { AIImportUltraPro } from '@/components/import/AIImportUltraPro'
import { BulkImportUltraPro } from '@/components/import/BulkImportUltraPro'
import { useNavigate } from 'react-router-dom'

export default function AdvancedImport() {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Import Avancé</h1>
          <p className="text-muted-foreground">
            Configuration avancée, mapping intelligent et optimisation IA
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/import')}>
          Retour au Hub
        </Button>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="interface" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="interface" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Interface Pro
          </TabsTrigger>
          <TabsTrigger value="mapping" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Mapping
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            IA
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            En Masse
          </TabsTrigger>
        </TabsList>

        {/* Interface Pro complète */}
        <TabsContent value="interface">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Interface d'Import Professionnelle
              </CardTitle>
              <CardDescription>
                Configuration complète avec toutes les options d'import avancées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportUltraProInterface />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mapping avancé */}
        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Mapping Avancé des Champs
              </CardTitle>
              <CardDescription>
                Mappez vos colonnes source vers les champs cibles avec validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedMapping />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimisation IA */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Optimisation IA Ultra Pro
              </CardTitle>
              <CardDescription>
                Enrichissement automatique et optimisation intelligente des produits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIImportUltraPro />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import en masse */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Import en Masse
              </CardTitle>
              <CardDescription>
                Importez plusieurs sources simultanément avec gestion des lots
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BulkImportUltraPro />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation vers autres fonctions avancées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/import/advanced/sources')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderSync className="w-5 h-5" />
              Configuration des Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configurez et gérez vos sources d'import (API, FTP, etc.)
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/import/manage')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="w-5 h-5" />
              Voir les Résultats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Consultez les produits importés et gérez leur publication
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
