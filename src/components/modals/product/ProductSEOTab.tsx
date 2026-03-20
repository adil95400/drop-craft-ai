/**
 * ProductSEOTab — Extracted from ProductViewModal
 * Handles SEO score display, title/description editing, and Google preview
 */
import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Globe, Eye, Sparkles, Loader2 } from 'lucide-react'

interface ProductSEOTabProps {
  product: any
  editedProduct: any
  setEditedProduct: (fn: (prev: any) => any) => void
  isEditing: boolean
  images: string[]
  isOptimizing: boolean
  onOptimizeSEO: () => void
}

export const ProductSEOTab = memo(function ProductSEOTab({
  product, editedProduct, setEditedProduct, isEditing, images, isOptimizing, onOptimizeSEO
}: ProductSEOTabProps) {
  const seoTitle = isEditing ? editedProduct.seo_title : ((product as any).seo_title || product.name || '')
  const seoDesc = isEditing ? editedProduct.seo_description : ((product as any).seo_description || product.description?.slice(0, 160) || '')
  const titleLength = seoTitle.length
  const descLength = seoDesc.length
  const hasImages = images.length > 0
  const hasCategory = !!product.category

  // Calculate SEO score
  let seoScore = 0
  if (titleLength >= 30 && titleLength <= 60) seoScore += 25
  else if (titleLength > 0 && titleLength < 30) seoScore += 10
  else if (titleLength > 60) seoScore += 15
  if (descLength >= 120 && descLength <= 160) seoScore += 25
  else if (descLength > 0 && descLength < 120) seoScore += 10
  else if (descLength > 160) seoScore += 15
  if (hasImages) seoScore += 25
  if (hasCategory) seoScore += 15
  if (product.description && product.description.length > 100) seoScore += 10

  const seoScoreColor = seoScore >= 80 ? 'text-success' : seoScore >= 50 ? 'text-warning' : 'text-destructive'
  const seoScoreBg = seoScore >= 80
    ? 'from-success/10 to-emerald-500/10 border-success/20'
    : seoScore >= 50
      ? 'from-warning/10 to-warning/5 border-warning/20'
      : 'from-destructive/10 to-destructive/5 border-destructive/20'

  return (
    <>
      {/* SEO Score Card */}
      <Card className={cn("bg-gradient-to-br", seoScoreBg)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Score SEO</p>
              <div className="flex items-center gap-3">
                <span className={cn("text-4xl font-bold", seoScoreColor)}>{seoScore}</span>
                <span className="text-xl text-muted-foreground">/100</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {seoScore >= 80 ? 'Excellent - Votre produit est bien optimisé' :
                  seoScore >= 50 ? 'Moyen - Des améliorations sont possibles' :
                    'Faible - Optimisation recommandée'}
              </p>
            </div>
            <div className="relative h-20 w-20">
              <svg className="h-20 w-20 -rotate-90">
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/20" />
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent"
                  strokeDasharray={226} strokeDashoffset={226 - (226 * seoScore) / 100}
                  className={seoScoreColor} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className={cn("h-6 w-6", seoScoreColor)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO Optimization Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Optimisation SEO
              </CardTitle>
              <CardDescription>Optimisez votre produit pour les moteurs de recherche</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onOptimizeSEO} disabled={isOptimizing}>
              {isOptimizing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2 text-primary" />}
              Optimiser SEO
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Titre SEO</Label>
              <span className={cn("text-xs font-medium",
                titleLength >= 30 && titleLength <= 60 ? "text-success" :
                  titleLength > 60 ? "text-destructive" : "text-warning"
              )}>
                {titleLength}/60 caractères{titleLength >= 30 && titleLength <= 60 && " ✓"}
              </span>
            </div>
            <Input
              value={seoTitle}
              onChange={(e) => setEditedProduct((prev: any) => ({ ...prev, seo_title: e.target.value }))}
              placeholder="Titre pour les moteurs de recherche"
              disabled={!isEditing}
              className={cn(titleLength > 60 && "border-destructive")}
            />
            <Progress value={Math.min((titleLength / 60) * 100, 100)}
              className={cn("h-1.5", titleLength > 60 && "[&>div]:bg-destructive")} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Meta description</Label>
              <span className={cn("text-xs font-medium",
                descLength >= 120 && descLength <= 160 ? "text-success" :
                  descLength > 160 ? "text-destructive" : "text-warning"
              )}>
                {descLength}/160 caractères{descLength >= 120 && descLength <= 160 && " ✓"}
              </span>
            </div>
            <Textarea
              value={seoDesc}
              onChange={(e) => setEditedProduct((prev: any) => ({ ...prev, seo_description: e.target.value }))}
              placeholder="Description pour les moteurs de recherche"
              disabled={!isEditing}
              rows={3}
              className={cn(descLength > 160 && "border-destructive")}
            />
            <Progress value={Math.min((descLength / 160) * 100, 100)}
              className={cn("h-1.5", descLength > 160 && "[&>div]:bg-destructive")} />
          </div>

          <div className="space-y-2">
            <Label>URL slug</Label>
            <Input
              value={(product as any).slug || product.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || ''}
              placeholder="url-du-produit" disabled className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Google Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Aperçu Google
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-white rounded-lg border space-y-1 dark:bg-zinc-950">
            <p className="text-info dark:text-blue-400 text-lg hover:underline cursor-pointer truncate font-medium">
              {seoTitle || 'Titre du produit'}
            </p>
            <p className="text-success dark:text-success text-sm truncate">
              www.votre-boutique.com › produits › {(product as any).slug || product.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'produit'}
            </p>
            <p className="text-muted-foreground text-sm line-clamp-2">
              {seoDesc || 'Description du produit pour les moteurs de recherche...'}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
})
