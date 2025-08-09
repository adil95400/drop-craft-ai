import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Package, TrendingUp, Crown, Database, Zap } from "lucide-react"
import { useImportUltraPro } from "@/hooks/useImportUltraPro"

export const BulkImportUltraPro = () => {
  const { 
    bulkImport, 
    isBulkImporting, 
    bulkImportProgress, 
    activeBulkImport,
    importedProducts 
  } = useImportUltraPro()

  const importOptions = [
    {
      id: 'complete_catalog',
      title: 'Catalogue complet',
      description: 'Tous les produits disponibles',
      icon: Database,
      count: '5,000+ produits',
      platform: 'aliexpress',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'trending_products',
      title: 'Produits tendances',
      description: 'Top 1000 cette semaine',
      icon: TrendingUp,
      count: '1,000 produits',
      platform: 'amazon',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'winners_detected',
      title: 'Winners détectés',
      description: 'Sélection IA personnalisée',
      icon: Crown,
      count: '150 produits',
      platform: 'bigbuy',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      featured: true
    }
  ]

  const handleBulkImport = (type: string, platform: string) => {
    bulkImport({
      type: type as any,
      platform,
      filters: {}
    })
  }

  // Mock real-time stats
  const stats = {
    success: Math.floor(bulkImportProgress * 26.89),
    warnings: Math.floor(bulkImportProgress * 1.58),
    errors: Math.floor(bulkImportProgress * 0.23)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Import en Masse
        </CardTitle>
        <CardDescription>
          Importez des milliers de produits en une fois
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold">Options d'import</h4>
            <div className="space-y-3">
              {importOptions.map((option) => {
                const Icon = option.icon
                const isActive = activeBulkImport === option.id
                
                return (
                  <div key={option.id} className={`relative flex items-center justify-between p-4 border rounded-lg transition-all ${
                    isActive ? 'ring-2 ring-primary border-primary' : 'hover:border-muted-foreground/50'
                  }`}>
                    {option.featured && (
                      <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600">
                        PRO
                      </Badge>
                    )}
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${option.bgColor}`}>
                        <Icon className={`h-5 w-5 ${option.color}`} />
                      </div>
                      <div>
                        <div className="font-medium">{option.title}</div>
                        <div className="text-sm text-muted-foreground">{option.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">{option.count}</div>
                      </div>
                    </div>
                    <Button 
                      variant={option.featured ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleBulkImport(option.id, option.platform)}
                      disabled={isBulkImporting}
                      className={option.featured ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" : ""}
                    >
                      {isBulkImporting && isActive ? (
                        <>
                          <Zap className="h-4 w-4 mr-2 animate-spin" />
                          En cours...
                        </>
                      ) : (
                        'Importer'
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Progression</h4>
            {isBulkImporting ? (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Import en cours</span>
                    <span>{stats.success + stats.warnings + stats.errors} / {activeBulkImport === 'complete_catalog' ? '5,000' : activeBulkImport === 'trending_products' ? '1,000' : '150'}</span>
                  </div>
                  <Progress value={bulkImportProgress} className="h-2" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-green-50 rounded">
                    <div className="text-xl font-bold text-green-600">{stats.success.toLocaleString()}</div>
                    <div className="text-xs text-green-600">Succès</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded">
                    <div className="text-xl font-bold text-yellow-600">{stats.warnings}</div>
                    <div className="text-xs text-yellow-600">Warnings</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded">
                    <div className="text-xl font-bold text-red-600">{stats.errors}</div>
                    <div className="text-xs text-red-600">Erreurs</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Sélectionnez une option d'import pour commencer</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-muted/50 rounded">
                    <div className="text-xl font-bold">{importedProducts.length.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total importé</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded">
                    <div className="text-xl font-bold">94.2%</div>
                    <div className="text-xs text-muted-foreground">Taux succès</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded">
                    <div className="text-xl font-bold">12.3k</div>
                    <div className="text-xs text-muted-foreground">Ce mois</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}