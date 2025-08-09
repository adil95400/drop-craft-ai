import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Package, 
  TrendingUp, 
  Crown, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Zap,
  Globe,
  Star,
  Download,
  Database
} from "lucide-react"
import { toast } from "sonner"
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
      title: 'Catalogue Complet',
      description: 'Import automatique de tout le catalogue fournisseur',
      icon: Database,
      count: '2.5K+ produits',
      estimatedTime: '~15 min',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      id: 'trending_products',
      title: 'Produits Tendance',
      description: 'Import intelligent des produits en forte demande',
      icon: TrendingUp,
      count: '150+ produits',
      estimatedTime: '~3 min',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10'
    },
    {
      id: 'winners_detected',
      title: 'Winners Détectés',
      description: 'Import des produits à fort potentiel par IA',
      icon: Crown,
      count: '45+ produits',
      estimatedTime: '~2 min',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      id: 'global_bestsellers',
      title: 'Best-sellers Mondiaux',
      description: 'Import des meilleures ventes internationales',
      icon: Globe,
      count: '200+ produits',
      estimatedTime: '~5 min',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10'
    }
  ]

  const handleBulkImport = (type: string, platform: string) => {
    bulkImport({ 
      type: type as any, 
      platform, 
      filters: {} 
    })
    toast.success(`Import ${type} démarré avec succès`)
  }

  const stats = {
    success: importedProducts.filter(p => p.status === 'imported').length,
    warnings: importedProducts.filter(p => p.status === 'pending').length,
    errors: importedProducts.filter(p => p.status === 'rejected').length
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative bg-gradient-hero p-8 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-2">Import Masse Ultra Pro</h2>
              <p className="text-xl opacity-90">
                Importez des milliers de produits en quelques clics
              </p>
            </div>
            <Badge className="bg-gradient-accent text-white px-4 py-2 font-bold animate-pulse-glow">
              <Download className="h-4 w-4 mr-2" />
              BULK IMPORT
            </Badge>
          </div>

          {/* Real-time Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-smooth">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-2xl font-bold">{stats.success}</div>
                    <p className="text-sm opacity-80">Succès</p>
                  </div>
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-smooth">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-2xl font-bold">{stats.warnings}</div>
                    <p className="text-sm opacity-80">Avertissements</p>
                  </div>
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-smooth">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-2xl font-bold">{stats.errors}</div>
                    <p className="text-sm opacity-80">Erreurs</p>
                  </div>
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Import Options */}
      <Card className="border-0 shadow-card">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Options d'Import Masse
          </CardTitle>
          <CardDescription className="text-lg">
            Choisissez votre stratégie d'import pour maximiser vos résultats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {importOptions.map((option) => {
              const IconComponent = option.icon
              const isActive = activeBulkImport === option.id
              const isDisabled = isBulkImporting && activeBulkImport !== option.id

              return (
                <Card 
                  key={option.id}
                  className={`
                    group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-glow hover-scale
                    ${isActive ? 'border-primary shadow-glow' : 'border-border hover:border-primary/50'}
                    ${isDisabled ? 'opacity-50' : ''}
                  `}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                  
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-xl ${option.bgColor} group-hover:scale-110 transition-transform`}>
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary" className="animate-fade-in">
                        {option.count}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                      {option.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {option.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">
                        Durée estimée: {option.estimatedTime}
                      </span>
                      {option.id === 'winners_detected' && (
                        <Badge className="bg-gradient-accent text-white">
                          <Star className="h-3 w-3 mr-1" />
                          IA Powered
                        </Badge>
                      )}
                    </div>

                    {isActive && isBulkImporting ? (
                      <div className="space-y-3">
                        <Progress value={bulkImportProgress} className="h-2" />
                        <p className="text-sm text-center text-muted-foreground">
                          Import en cours... {bulkImportProgress}%
                        </p>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => handleBulkImport(option.id, 'aliexpress')}
                        disabled={isDisabled}
                        className="w-full bg-gradient-primary hover:bg-gradient-accent transition-all duration-300"
                      >
                        {isDisabled ? (
                          <>
                            <Zap className="h-4 w-4 mr-2 animate-spin" />
                            Import en cours...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Démarrer l'Import
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Import Progress */}
      {isBulkImporting && (
        <Card className="border-primary shadow-glow animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Zap className="h-5 w-5 animate-pulse" />
              Import en Cours - {activeBulkImport?.replace('_', ' ').toUpperCase()}
            </CardTitle>
            <CardDescription>
              Progression de l'import automatique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={bulkImportProgress} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                  <div className="text-sm text-muted-foreground">Réussis</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
                  <div className="text-sm text-muted-foreground">Avertissements</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                  <div className="text-sm text-muted-foreground">Erreurs</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}