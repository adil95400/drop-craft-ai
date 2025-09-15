import React, { useState } from 'react'
import { useUnifiedPlan } from '@/lib/unified-plan-system'
import { ProductionImportInterface } from '@/components/import/ProductionImportInterface'
import { QuickImportAccess } from '@/components/import/QuickImportAccess'
import { ImportMethods } from '@/components/import/ImportMethods'
import { ImportTemplates } from '@/components/import/ImportTemplates'
import { ImportStatsRealTime } from '@/components/import/ImportStatsRealTime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, Zap, TrendingUp, ArrowLeft, FileText, BarChart3 } from 'lucide-react'

export default function Import() {
  const { isUltraPro, isPro } = useUnifiedPlan()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('')
  const [currentView, setCurrentView] = useState<'quick' | 'templates' | 'stats' | 'advanced'>('quick')

  const handleMethodSelect = (method: string) => {
    if (method === 'all-methods') {
      setCurrentView('advanced')
    } else {
      setSelectedMethod(method)
      setCurrentView('advanced')
    }
  }

  const handleTemplateSelect = (template: any, exampleUrl: string) => {
    setSelectedMethod('url')
    setCurrentView('advanced')
    // Pré-remplir l'URL dans l'interface avancée si nécessaire
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'templates':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  Templates d'Import
                </h2>
                <p className="text-muted-foreground">
                  Configurations pré-optimisées par catégorie de produits
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentView('quick')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
            </div>
            <ImportTemplates onSelectTemplate={handleTemplateSelect} />
          </div>
        )

      case 'stats':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  Statistiques d'Import
                </h2>
                <p className="text-muted-foreground">
                  Métriques en temps réel de la plateforme d'import
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentView('quick')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
            </div>
            <ImportStatsRealTime />
          </div>
        )

      case 'advanced':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Interface d'Import Avancée</h2>
                <p className="text-muted-foreground">
                  Accédez à toutes les méthodes d'import disponibles
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentView('quick')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à l'accueil
              </Button>
            </div>
            <ProductionImportInterface />
          </div>
        )

      default:
        return (
          <div className="space-y-8">
            <QuickImportAccess onMethodSelect={handleMethodSelect} />
            
            {/* Navigation rapide vers autres vues */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20"
                onClick={() => setCurrentView('templates')}
              >
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Templates d'Import</h3>
                      <p className="text-sm text-muted-foreground">
                        Configurations pré-optimisées par catégorie
                      </p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700">
                      7 Templates Disponibles
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20"
                onClick={() => setCurrentView('stats')}
              >
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-full text-white">
                      <BarChart3 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Statistiques en Direct</h3>
                      <p className="text-sm text-muted-foreground">
                        Métriques temps réel de la plateforme
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      Live Data
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm text-muted-foreground">
                <span>Ou utilisez les méthodes basiques ci-dessous</span>
              </div>
            </div>
            
            <ImportMethods 
              selectedMethod={selectedMethod} 
              onMethodSelect={setSelectedMethod} 
            />
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-background animate-fade-in">
      {/* Header amélioré avec animations */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground flex items-center gap-3 animate-scale-in">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                Import Intelligent
                {isUltraPro && (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white animate-pulse">
                    Ultra Pro
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground text-lg">
                {isUltraPro 
                  ? "🚀 Import révolutionnaire avec IA avancée et automation totale"
                  : isPro
                  ? "⚡ Import optimisé avec IA et fonctionnalités premium"
                  : "📦 Import de produits depuis vos sources préférées"
                }
              </p>
              
              {/* Stats rapides */}
              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>1,234 produits importés ce mois</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span>95% de succès IA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {renderCurrentView()}
      </div>
    </div>
  )
}