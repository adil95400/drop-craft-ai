/**
 * DraftProductsPanel - Panneau des produits brouillons importés
 * Affiche les produits nécessitant une révision avec leurs notes d'import
 * Phase 3: Interface de gestion des imports incomplets
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Package, 
  Image as ImageIcon, 
  FileText, 
  Tag, 
  Building2,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Eye
} from 'lucide-react'
import { useDraftProducts, DraftProduct } from '@/hooks/catalog/useDraftProducts'
import { cn } from '@/lib/utils'
import { ProductQuickPreviewModal, type QuickPreviewProduct } from './ProductQuickPreviewModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface DraftProductCardProps {
  product: DraftProduct
  issues: string[]
  onValidate: () => void
  onDelete: () => void
  onPreview: () => void
  isValidating: boolean
  isDeleting: boolean
}

function DraftProductCard({ product, issues, onValidate, onDelete, onPreview, isValidating, isDeleting }: DraftProductCardProps) {
  const getIssueIcon = (issue: string) => {
    if (issue.toLowerCase().includes('image')) return <ImageIcon className="h-3 w-3" />
    if (issue.toLowerCase().includes('description')) return <FileText className="h-3 w-3" />
    if (issue.toLowerCase().includes('catégorie')) return <Tag className="h-3 w-3" />
    if (issue.toLowerCase().includes('marque')) return <Building2 className="h-3 w-3" />
    if (issue.toLowerCase().includes('qualité')) return <Sparkles className="h-3 w-3" />
    return <AlertTriangle className="h-3 w-3" />
  }

  return (
    <div className="p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors">
      <div className="flex gap-4">
        {/* Image */}
        <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
          {product.image_urls && product.image_urls.length > 0 ? (
            <img 
              src={product.image_urls[0]} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium line-clamp-1">{product.name}</h4>
              <p className="text-sm text-muted-foreground">
                {product.price ? `${product.price.toFixed(2)}€` : 'Prix non défini'}
                {product.sku && <span className="ml-2">• SKU: {product.sku}</span>}
              </p>
            </div>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 flex-shrink-0">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Brouillon
            </Badge>
          </div>

          {/* Issues */}
          <div className="flex flex-wrap gap-1">
            {issues.map((issue, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="text-xs bg-destructive/10 text-destructive border-destructive/20"
              >
                {getIssueIcon(issue)}
                <span className="ml-1">{issue}</span>
              </Badge>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={onPreview} className="h-8">
              <Eye className="h-3 w-3 mr-1" />
              Aperçu
            </Button>
            <Button 
              size="sm" 
              onClick={onValidate}
              disabled={isValidating || isDeleting}
              className="h-8"
            >
              {isValidating ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              )}
              Valider
            </Button>

            {product.source_url && (
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => window.open(product.source_url!, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Source
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 text-destructive hover:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce brouillon ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Le produit "{product.name}" sera définitivement supprimé.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DraftProductsPanel() {
  const navigate = useNavigate()
  const { 
    draftProducts, 
    stats, 
    isLoading, 
    parseImportNotes,
    validateDraft,
    deleteDraft,
    isValidating,
    isDeleting
  } = useDraftProducts()

  const openPreview = (product: DraftProduct) => {
    navigate('/import/preview', {
      state: {
        product: {
          title: product.name,
          description: product.description || '',
          price: product.price || 0,
          images: product.image_urls || [],
          category: product.category || '',
          sku: product.sku || '',
        },
        returnTo: '/catalog/to-process',
      }
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (draftProducts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Aucun brouillon en attente</h3>
          <p className="text-muted-foreground text-sm">
            Tous vos produits importés sont complets et publiés
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Produits brouillons
              <Badge variant="secondary">{stats.total}</Badge>
            </CardTitle>
            <CardDescription>
              Produits importés nécessitant une révision avant publication
            </CardDescription>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="flex flex-wrap gap-2 mt-4">
          {stats.missingImages > 0 && (
            <Badge variant="outline" className="bg-destructive/5">
              <ImageIcon className="h-3 w-3 mr-1" />
              {stats.missingImages} sans image
            </Badge>
          )}
          {stats.missingDescription > 0 && (
            <Badge variant="outline" className="bg-amber-500/5">
              <FileText className="h-3 w-3 mr-1" />
              {stats.missingDescription} sans description
            </Badge>
          )}
          {stats.missingCategory > 0 && (
            <Badge variant="outline" className="bg-blue-500/5">
              <Tag className="h-3 w-3 mr-1" />
              {stats.missingCategory} sans catégorie
            </Badge>
          )}
          {stats.missingBrand > 0 && (
            <Badge variant="outline" className="bg-violet-500/5">
              <Building2 className="h-3 w-3 mr-1" />
              {stats.missingBrand} sans marque
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {draftProducts.map(product => (
              <DraftProductCard
                key={product.id}
                product={product}
                issues={parseImportNotes(product.import_notes)}
                onValidate={() => validateDraft(product.id)}
                onDelete={() => deleteDraft(product.id)}
                onPreview={() => openPreview(product)}
                isValidating={isValidating}
                isDeleting={isDeleting}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>

    </>
  )
}
