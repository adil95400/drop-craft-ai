import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, Image, FileText, ShoppingBag } from 'lucide-react'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'

interface CatalogQualityDashboardProps {
  products: UnifiedProduct[]
}

export function CatalogQualityDashboard({ products }: CatalogQualityDashboardProps) {
  // Calcul du score global de qualité (0-100)
  const calculateQualityScore = (product: UnifiedProduct) => {
    let score = 0
    let maxScore = 0

    // SEO (25 points)
    maxScore += 25
    if (product.name && product.name.length >= 20 && product.name.length <= 70) score += 10
    if (product.description && product.description.length >= 100) score += 10
    if (product.sku) score += 5

    // Images (25 points)
    maxScore += 25
    if (product.image_url || product.images?.length > 0) score += 10
    if (product.images && product.images.length >= 3) score += 15

    // Données produit (25 points)
    maxScore += 25
    if (product.sku) score += 5
    if (product.category) score += 5
    if (product.price > 0) score += 5
    if (product.stock_quantity !== undefined) score += 5
    if (product.cost_price) score += 5

    // AI Shopping readiness (25 points)
    maxScore += 25
    if (product.name && product.description) score += 10
    if (product.category) score += 5
    if (product.image_url || product.images?.length > 0) score += 5
    if (product.sku) score += 5

    return Math.round((score / maxScore) * 100)
  }

  const productsWithScores = products.map(p => ({
    ...p,
    qualityScore: calculateQualityScore(p)
  }))

  const avgScore = Math.round(
    productsWithScores.reduce((sum, p) => sum + p.qualityScore, 0) / (products.length || 1)
  )

  // Scores par dimension
  const seoScore = Math.round(
    products.filter(p => 
      p.name?.length >= 20 && p.description?.length >= 100
    ).length / (products.length || 1) * 100
  )

  const imageScore = Math.round(
    products.filter(p => 
      (p.image_url || p.images?.length > 0) && p.images?.length >= 3
    ).length / (products.length || 1) * 100
  )

  const dataScore = Math.round(
    products.filter(p => 
      p.sku && p.category && p.price > 0 && p.stock_quantity !== undefined
    ).length / (products.length || 1) * 100
  )

  const aiReadyScore = Math.round(
    products.filter(p => 
      p.name && p.description && p.category && (p.image_url || p.images?.length > 0)
    ).length / (products.length || 1) * 100
  )

  // Répartition par qualité
  const okCount = productsWithScores.filter(p => p.qualityScore > 70).length
  const warningCount = productsWithScores.filter(p => p.qualityScore >= 40 && p.qualityScore <= 70).length
  const criticalCount = productsWithScores.filter(p => p.qualityScore < 40).length

  // Top 5 erreurs
  const errors = [
    { 
      type: 'Description manquante ou trop courte', 
      count: products.filter(p => !p.description || p.description.length < 100).length,
      severity: 'warning' as const
    },
    { 
      type: 'Moins de 3 images', 
      count: products.filter(p => !p.images || p.images.length < 3).length,
      severity: 'warning' as const
    },
    { 
      type: 'SKU manquant', 
      count: products.filter(p => !p.sku).length,
      severity: 'error' as const
    },
    { 
      type: 'Catégorie non définie', 
      count: products.filter(p => !p.category).length,
      severity: 'error' as const
    },
    { 
      type: 'Titre trop court', 
      count: products.filter(p => !p.name || p.name.length < 20).length,
      severity: 'warning' as const
    }
  ].sort((a, b) => b.count - a.count).slice(0, 5)

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-green-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      {/* Score Global */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📊 Qualité Globale du Catalogue</span>
            <Badge variant={avgScore >= 70 ? 'default' : avgScore >= 40 ? 'secondary' : 'destructive'} className="text-2xl px-4 py-2">
              {avgScore}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={avgScore} className="h-3 mb-4" />
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-sm text-muted-foreground">OK</div>
                <div className="font-bold">{okCount} ({Math.round(okCount / products.length * 100)}%)</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-sm text-muted-foreground">À améliorer</div>
                <div className="font-bold">{warningCount} ({Math.round(warningCount / products.length * 100)}%)</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-sm text-muted-foreground">Critique</div>
                <div className="font-bold">{criticalCount} ({Math.round(criticalCount / products.length * 100)}%)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scores par Dimension */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              SEO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(seoScore)}`}>{seoScore}/100</div>
            <Progress value={seoScore} className={`h-2 mt-2 ${getScoreBg(seoScore)}`} />
            <p className="text-xs text-muted-foreground mt-2">Titres, metas, descriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Image className="h-4 w-4" />
              Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(imageScore)}`}>{imageScore}/100</div>
            <Progress value={imageScore} className={`h-2 mt-2 ${getScoreBg(imageScore)}`} />
            <p className="text-xs text-muted-foreground mt-2">Présence, qualité minimale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Données
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(dataScore)}`}>{dataScore}/100</div>
            <Progress value={dataScore} className={`h-2 mt-2 ${getScoreBg(dataScore)}`} />
            <p className="text-xs text-muted-foreground mt-2">Attributs, variantes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              AI Shopping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(aiReadyScore)}`}>{aiReadyScore}/100</div>
            <Progress value={aiReadyScore} className={`h-2 mt-2 ${getScoreBg(aiReadyScore)}`} />
            <p className="text-xs text-muted-foreground mt-2">Schema, champs clés</p>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Erreurs */}
      <Card>
        <CardHeader>
          <CardTitle>⚠️ Top 5 des Problèmes à Corriger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {errors.map((error, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  {error.severity === 'error' ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  )}
                  <span className="font-medium">{error.type}</span>
                </div>
                <Badge variant={error.severity === 'error' ? 'destructive' : 'secondary'}>
                  {error.count} produit{error.count > 1 ? 's' : ''}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
