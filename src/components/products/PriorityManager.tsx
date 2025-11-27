import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Target, TrendingUp, AlertTriangle, DollarSign, Sparkles } from 'lucide-react'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'
import { useMemo } from 'react'

interface PriorityManagerProps {
  products: UnifiedProduct[]
  onSelectProducts: (ids: string[]) => void
}

export function PriorityManager({ products, onSelectProducts }: PriorityManagerProps) {
  const prioritizedProducts = useMemo(() => {
    return products.map(product => {
      // Calcul du score de qualité
      let qualityScore = 0
      if (product.name && product.name.length >= 20 && product.name.length <= 70) qualityScore += 25
      if (product.description && product.description.length >= 100) qualityScore += 25
      if (product.image_url || product.images?.length > 0) qualityScore += 25
      if (product.sku && product.category) qualityScore += 25

      // Calcul de l'impact business (basé sur prix et marge)
      const businessImpact = product.profit_margin ? product.profit_margin * product.price : product.price * 0.3

      // Calcul de la gravité des problèmes
      let problemSeverity = 0
      if (!product.name || product.name.length < 20) problemSeverity += 3
      if (!product.description) problemSeverity += 3
      if (!product.image_url && !product.images?.length) problemSeverity += 3
      if (!product.sku) problemSeverity += 2
      if (!product.category) problemSeverity += 2

      // Score de priorité = (Impact × Gravité) / Qualité
      const priorityScore = qualityScore > 0 
        ? (businessImpact * problemSeverity) / qualityScore
        : businessImpact * problemSeverity * 2

      return {
        ...product,
        qualityScore,
        businessImpact,
        problemSeverity,
        priorityScore
      }
    }).sort((a, b) => b.priorityScore - a.priorityScore)
  }, [products])

  const topPriority = prioritizedProducts.slice(0, 10)

  const getPriorityBadge = (severity: number) => {
    if (severity >= 9) return { label: 'Critique', variant: 'destructive' as const, icon: AlertTriangle }
    if (severity >= 6) return { label: 'Haute', variant: 'default' as const, icon: Target }
    if (severity >= 3) return { label: 'Moyenne', variant: 'secondary' as const, icon: TrendingUp }
    return { label: 'Basse', variant: 'outline' as const, icon: Sparkles }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Priorisation Automatique des Tâches
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground mb-4">
            Classement intelligent basé sur: Impact Business × Gravité des Problèmes ÷ Qualité Actuelle
          </div>

          {topPriority.map((product, idx) => {
            const badge = getPriorityBadge(product.problemSeverity)
            const Icon = badge.icon

            return (
              <div key={product.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className="text-lg px-3 py-1">{idx + 1}</Badge>
                    <div>
                      <div className="font-semibold">{product.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        <span>Score qualité: {product.qualityScore}/100</span>
                        <span>•</span>
                        <span>Impact: {product.businessImpact.toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={badge.variant} className="gap-1">
                    <Icon className="h-3 w-3" />
                    {badge.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-muted">
                    <div className="text-muted-foreground">Qualité</div>
                    <div className="font-bold">{product.qualityScore}/100</div>
                  </div>
                  <div className="p-2 rounded bg-muted">
                    <div className="text-muted-foreground">Impact €</div>
                    <div className="font-bold">{product.businessImpact.toFixed(0)}€</div>
                  </div>
                  <div className="p-2 rounded bg-muted">
                    <div className="text-muted-foreground">Problèmes</div>
                    <div className="font-bold">{product.problemSeverity}/15</div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => onSelectProducts([product.id])}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimiser maintenant
                </Button>
              </div>
            )
          })}

          {topPriority.length > 0 && (
            <Button
              className="w-full mt-4"
              onClick={() => onSelectProducts(topPriority.map(p => p.id))}
            >
              Sélectionner les 10 produits prioritaires
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
