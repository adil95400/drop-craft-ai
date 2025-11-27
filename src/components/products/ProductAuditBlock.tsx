import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Sparkles,
  FileText,
  Image,
  Target,
  ShoppingBag,
  TrendingUp
} from 'lucide-react'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'
import { useProductAudit } from '@/hooks/useProductAudit'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface ProductAuditBlockProps {
  product: UnifiedProduct
  onOptimize?: () => void
}

export function ProductAuditBlock({ product, onOptimize }: ProductAuditBlockProps) {
  const { auditProduct, isAuditing } = useProductAudit()
  const { toast } = useToast()

  const calculateScores = () => {
    let seoScore = 0
    let imageScore = 0
    let dataScore = 0
    let aiReadyScore = 0

    // SEO Score
    if (product.name && product.name.length >= 20 && product.name.length <= 70) seoScore += 40
    if (product.description && product.description.length >= 100) seoScore += 40
    if (product.sku) seoScore += 20

    // Image Score
    if (product.image_url || product.images?.length > 0) imageScore += 50
    if (product.images && product.images.length >= 3) imageScore += 50

    // Data Score
    if (product.sku) dataScore += 25
    if (product.category) dataScore += 25
    if (product.price > 0) dataScore += 25
    if (product.stock_quantity !== undefined) dataScore += 25

    // AI Ready Score
    if (product.name && product.description) aiReadyScore += 40
    if (product.category) aiReadyScore += 20
    if (product.image_url || product.images?.length > 0) aiReadyScore += 20
    if (product.sku) aiReadyScore += 20

    const overallScore = Math.round((seoScore + imageScore + dataScore + aiReadyScore) / 4)

    return { overallScore, seoScore, imageScore, dataScore, aiReadyScore }
  }

  const scores = calculateScores()

  const getErrors = () => {
    const errors: Array<{ severity: 'critical' | 'warning' | 'info'; message: string; field: string }> = []

    // Critiques
    if (!product.name) errors.push({ severity: 'critical', message: 'Titre produit manquant', field: 'name' })
    if (!product.sku) errors.push({ severity: 'critical', message: 'SKU manquant', field: 'sku' })
    if (!product.image_url && !product.images?.length) errors.push({ severity: 'critical', message: 'Aucune image', field: 'images' })

    // Warnings
    if (product.name && product.name.length < 20) errors.push({ severity: 'warning', message: 'Titre trop court (< 20 caractères)', field: 'name' })
    if (product.name && product.name.length > 70) errors.push({ severity: 'warning', message: 'Titre trop long (> 70 caractères)', field: 'name' })
    if (!product.description) errors.push({ severity: 'warning', message: 'Description manquante', field: 'description' })
    if (product.description && product.description.length < 100) errors.push({ severity: 'warning', message: 'Description trop courte', field: 'description' })
    if (!product.category) errors.push({ severity: 'warning', message: 'Catégorie non définie', field: 'category' })
    if (product.images && product.images.length < 3) errors.push({ severity: 'warning', message: 'Moins de 3 images', field: 'images' })

    // Info
    if (!product.cost_price) errors.push({ severity: 'info', message: 'Prix de revient non renseigné', field: 'cost_price' })

    return errors
  }

  const errors = getErrors()

  const handleAudit = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await auditProduct.mutateAsync({
      productId: product.id,
      productSource: product.source === 'products' ? 'products' : 'imported_products',
      auditType: 'full',
      userId: user.id
    })
  }

  const handleAIOptimize = async (type: 'title' | 'description' | 'seo' | 'full') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const labels = {
      title: 'Titre',
      description: 'Description',
      seo: 'SEO',
      full: 'Optimisation complète'
    }

    try {
      const { error } = await supabase.functions.invoke('ai-product-optimizer', {
        body: {
          productId: product.id,
          userId: user.id,
          optimizationType: type
        }
      })

      if (error) throw error

      toast({
        title: `${labels[type]} optimisé !`,
        description: "Les modifications ont été appliquées avec succès"
      })

      onOptimize?.()
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible d'optimiser: ${labels[type]}`,
        variant: "destructive"
      })
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Audit IA du Produit
          </span>
          <div className="flex items-center gap-2">
            <Badge variant={scores.overallScore >= 70 ? 'default' : scores.overallScore >= 40 ? 'secondary' : 'destructive'} className="text-lg px-3 py-1">
              {scores.overallScore}/100
            </Badge>
            <Button size="sm" variant="outline" onClick={handleAudit} disabled={isAuditing}>
              Actualiser
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="errors">Erreurs ({errors.length})</TabsTrigger>
            <TabsTrigger value="actions">Actions IA</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Scores par dimension */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" /> SEO
                  </span>
                  <span className={`text-sm font-bold ${getScoreColor(scores.seoScore)}`}>
                    {scores.seoScore}/100
                  </span>
                </div>
                <Progress value={scores.seoScore} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Image className="h-4 w-4" /> Images
                  </span>
                  <span className={`text-sm font-bold ${getScoreColor(scores.imageScore)}`}>
                    {scores.imageScore}/100
                  </span>
                </div>
                <Progress value={scores.imageScore} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Données
                  </span>
                  <span className={`text-sm font-bold ${getScoreColor(scores.dataScore)}`}>
                    {scores.dataScore}/100
                  </span>
                </div>
                <Progress value={scores.dataScore} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" /> AI Shopping
                  </span>
                  <span className={`text-sm font-bold ${getScoreColor(scores.aiReadyScore)}`}>
                    {scores.aiReadyScore}/100
                  </span>
                </div>
                <Progress value={scores.aiReadyScore} className="h-2" />
              </div>
            </div>

            <Separator />

            {/* Résumé des problèmes */}
            <div className="space-y-2">
              <h4 className="font-semibold">Résumé</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-2 p-2 rounded bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Critique</div>
                    <div className="font-bold">{errors.filter(e => e.severity === 'critical').length}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Avertissements</div>
                    <div className="font-bold">{errors.filter(e => e.severity === 'warning').length}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-blue-50">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Suggestions</div>
                    <div className="font-bold">{errors.filter(e => e.severity === 'info').length}</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="errors" className="space-y-3">
            {errors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-600" />
                <p>Aucun problème détecté !</p>
              </div>
            ) : (
              errors.map((error, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                  {error.severity === 'critical' && <XCircle className="h-5 w-5 text-red-600 mt-0.5" />}
                  {error.severity === 'warning' && <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />}
                  {error.severity === 'info' && <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />}
                  <div className="flex-1">
                    <p className="font-medium">{error.message}</p>
                    <p className="text-xs text-muted-foreground">Champ: {error.field}</p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={() => handleAIOptimize('title')}
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs">Réécrire le titre</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={() => handleAIOptimize('description')}
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs">Réécrire la description</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={() => handleAIOptimize('seo')}
              >
                <Target className="h-5 w-5" />
                <span className="text-xs">Générer metas SEO</span>
              </Button>

              <Button
                variant="default"
                className="h-auto flex-col gap-2 py-4"
                onClick={() => handleAIOptimize('full')}
              >
                <Sparkles className="h-5 w-5" />
                <span className="text-xs">Optimisation complète</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
