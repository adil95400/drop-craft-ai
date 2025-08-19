import React from 'react'
import { usePlan } from '@/hooks/usePlan'
import { ImportHub } from '@/components/import/ImportHub'
import { EnhancedImportInterface } from '@/components/import/EnhancedImportInterface'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Zap, TrendingUp } from 'lucide-react'

export default function Import() {
  const { isUltraPro, isPro } = usePlan()

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
                  : isPro()
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
        <ImportHub />
      </div>
    </div>
  )
}