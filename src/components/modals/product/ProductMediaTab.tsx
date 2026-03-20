/**
 * ProductMediaTab — Extracted from ProductViewModal
 * Handles image gallery, video list, and variant display
 */
import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  Image as ImageIcon, Video, Layers, Star, Check, Plus, Trash2,
  Package, Play, ExternalLink
} from 'lucide-react'

interface ProductMediaTabProps {
  images: string[]
  videos: any[]
  variants: any[]
  selectedImages: Set<number>
  isSavingImages: boolean
  onToggleImageSelection: (index: number) => void
  onSelectAllImages: () => void
  onShowAddImageDialog: () => void
  onShowDeleteImagesDialog: () => void
  onSetPrimaryImage: (index: number) => void
  formatCurrency: (amount: number) => string
}

export const ProductMediaTab = memo(function ProductMediaTab({
  images, videos, variants, selectedImages, isSavingImages,
  onToggleImageSelection, onSelectAllImages, onShowAddImageDialog,
  onShowDeleteImagesDialog, onSetPrimaryImage, formatCurrency
}: ProductMediaTabProps) {
  return (
    <>
      {/* Images Gallery */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Images ({images.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              {images.length > 0 && (
                <Button variant="outline" size="sm" onClick={onSelectAllImages} className="h-8 gap-1.5">
                  <Checkbox checked={selectedImages.size === images.length && images.length > 0} className="pointer-events-none h-3.5 w-3.5" />
                  <span className="text-xs">{selectedImages.size === images.length ? 'Désélectionner' : 'Tout'}</span>
                </Button>
              )}
              {selectedImages.size > 0 && (
                <Button variant="destructive" size="sm" onClick={onShowDeleteImagesDialog} className="h-8 gap-1.5" disabled={isSavingImages}>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="text-xs">Supprimer ({selectedImages.size})</span>
                </Button>
              )}
              <Button variant="default" size="sm" onClick={onShowAddImageDialog} className="h-8 gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                <span className="text-xs">Ajouter</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {images.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img: string, idx: number) => (
                <div key={idx} className={cn(
                  "relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer group",
                  selectedImages.has(idx) ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted-foreground/30"
                )} onClick={() => onToggleImageSelection(idx)}>
                  <img src={img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }} />
                  {idx === 0 && (
                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-current" />Principale
                    </div>
                  )}
                  <div className={cn(
                    "absolute top-1 right-1 h-5 w-5 rounded flex items-center justify-center transition-all",
                    selectedImages.has(idx) ? "bg-primary text-primary-foreground" : "bg-background/80 opacity-0 group-hover:opacity-100"
                  )}>
                    {selectedImages.has(idx) ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 border-2 rounded-sm" />}
                  </div>
                  {idx !== 0 && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="secondary" size="sm" className="h-7 text-xs gap-1"
                        onClick={(e) => { e.stopPropagation(); onSetPrimaryImage(idx) }} disabled={isSavingImages}>
                        <Star className="h-3 w-3" />Principale
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="mb-4">Aucune image disponible</p>
              <Button variant="outline" size="sm" onClick={onShowAddImageDialog} className="gap-2">
                <Plus className="h-4 w-4" />Ajouter une image
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Videos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Video className="h-4 w-4" />Vidéos ({videos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {videos.length > 0 ? (
            <div className="space-y-3">
              {videos.map((video: string, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Play className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Vidéo {idx + 1}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {video.includes('.mp4') ? 'MP4' : video.includes('.m3u8') ? 'HLS Stream' : 'Vidéo'}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => window.open(video, '_blank')}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Aucune vidéo disponible</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variants */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4" />Variantes ({variants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {variants.length > 0 ? (
            <div className="space-y-2">
              {variants.map((variant: any, idx: number) => (
                <div key={variant.id || idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    {variant.image ? (
                      <img src={variant.image} alt={variant.name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{variant.name || 'Variante'}</p>
                      {variant.sku && <p className="text-xs text-muted-foreground font-mono">SKU: {variant.sku}</p>}
                      {variant.attributes && Object.keys(variant.attributes).length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {Object.entries(variant.attributes).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">{key}: {String(value)}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {variant.price !== undefined && variant.price > 0 && (
                      <p className="text-sm font-bold">{formatCurrency(variant.price)}</p>
                    )}
                    {variant.stock_quantity !== undefined && (
                      <p className="text-xs text-muted-foreground">Stock: {variant.stock_quantity}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Aucune variante disponible</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
})
