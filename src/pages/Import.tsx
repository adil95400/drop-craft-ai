import React, { useState } from 'react'
import { useUnifiedPlan } from '@/lib/unified-plan-system'
import { ProductionImportInterface } from '@/components/import/ProductionImportInterface'
import { QuickImportAccess } from '@/components/import/QuickImportAccess'
import { ImportMethods } from '@/components/import/ImportMethods'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Zap, TrendingUp } from 'lucide-react'

export default function Import() {
  const { isUltraPro, isPro } = useUnifiedPlan()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('')

  const handleMethodSelect = (method: string) => {
    if (method === 'all-methods') {
      setShowAdvanced(true)
    } else {
      setSelectedMethod(method)
      setShowAdvanced(true)
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
        {!showAdvanced ? (
          <div className="space-y-8">
            <QuickImportAccess onMethodSelect={handleMethodSelect} />
            
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
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Interface d'Import Avancée</h2>
                <p className="text-muted-foreground">
                  Accédez à toutes les méthodes d'import disponibles
                </p>
              </div>
              <button
                onClick={() => setShowAdvanced(false)}
                className="text-primary hover:text-primary/80 font-medium"
              >
                ← Retour à l'accès rapide
              </button>
            </div>
            <ProductionImportInterface />
          </div>
        )}
      </div>
    </div>
  )
}