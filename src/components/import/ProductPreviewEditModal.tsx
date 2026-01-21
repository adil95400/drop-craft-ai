import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ImageIcon, Trash2, Check, X, ShoppingCart, 
  Package, Eye, Copy, Plus, GripVertical, RotateCcw,
  ZoomIn, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface ProductPreviewData {
  title: string
  description: string
  price: number
  currency: string
  suggested_price: number
  profit_margin: number
  images: string[]
  brand: string
  sku: string
  platform_detected: string
  source_url: string
  variants?: any[]
  videos?: string[]
}

interface ProductPreviewEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: ProductPreviewData | null
  onConfirmImport: (editedProduct: ProductPreviewData) => void
  isImporting?: boolean
}

// Fonction pour normaliser les URLs d'images (supprimer les paramètres de taille)
const normalizeImageUrl = (url: string): string => {
  try {
    // Amazon: supprimer les segments de transformation de taille
    if (url.includes('amazon') || url.includes('media-amazon')) {
      return url
        .replace(/\._[A-Z]{2}_[^.]*\./g, '.')
        .replace(/\._S[XY]\d+_\./g, '.')
        .replace(/\._AC_[^.]*\./g, '.')
    }
    // AliExpress: supprimer les suffixes de taille
    if (url.includes('aliexpress') || url.includes('alicdn')) {
      return url.replace(/(_\d+x\d+|\.\d+x\d+)/g, '')
    }
    // Générique: supprimer les paramètres de query courants
    const urlObj = new URL(url)
    urlObj.searchParams.delete('w')
    urlObj.searchParams.delete('h')
    urlObj.searchParams.delete('width')
    urlObj.searchParams.delete('height')
    urlObj.searchParams.delete('size')
    urlObj.searchParams.delete('quality')
    urlObj.searchParams.delete('q')
    return urlObj.toString()
  } catch {
    return url
  }
}

// Fonction pour extraire un hash simple d'une URL
const getImageHash = (url: string): string => {
  const normalized = normalizeImageUrl(url)
  try {
    const urlObj = new URL(normalized)
    const pathParts = urlObj.pathname.split('/')
    const filename = pathParts[pathParts.length - 1]
    return filename.replace(/\.(jpg|jpeg|png|webp|gif)/gi, '').toLowerCase()
  } catch {
    return normalized.toLowerCase()
  }
}

// Dédupliquer les images
const deduplicateImages = (images: string[]): string[] => {
  const seen = new Set<string>()
  const unique: string[] = []
  
  for (const img of images) {
    const hash = getImageHash(img)
    if (!seen.has(hash)) {
      seen.add(hash)
      unique.push(img)
    }
  }
  
  return unique
}

export function ProductPreviewEditModal({
  open,
  onOpenChange,
  product,
  onConfirmImport,
  isImporting = false
}: ProductPreviewEditModalProps) {
  const [editedProduct, setEditedProduct] = useState<ProductPreviewData | null>(null)
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set())
  const [duplicatesRemoved, setDuplicatesRemoved] = useState(0)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set())
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set())

  // Initialiser le produit édité quand le modal s'ouvre
  useEffect(() => {
    if (product && open) {
      const originalCount = product.images?.length || 0
      const uniqueImages = deduplicateImages(product.images || [])
      const removedCount = originalCount - uniqueImages.length
      
      setDuplicatesRemoved(removedCount)
      setEditedProduct({
        ...product,
        images: uniqueImages
      })
      // Sélectionner toutes les images par défaut
      setSelectedImages(new Set(uniqueImages.map((_, i) => i)))
      setFailedImages(new Set())
      setLoadingImages(new Set(uniqueImages.map((_, i) => i)))
    }
  }, [product, open])

  // Reset à la fermeture
  useEffect(() => {
    if (!open) {
      setPreviewImage(null)
      setNewImageUrl('')
    }
  }, [open])

  const handleImageLoad = useCallback((index: number) => {
    setLoadingImages(prev => {
      const next = new Set(prev)
      next.delete(index)
      return next
    })
  }, [])

  const handleImageError = useCallback((index: number) => {
    setLoadingImages(prev => {
      const next = new Set(prev)
      next.delete(index)
      return next
    })
    setFailedImages(prev => new Set(prev).add(index))
  }, [])

  if (!editedProduct) return null

  const handleFieldChange = (field: keyof ProductPreviewData, value: any) => {
    setEditedProduct(prev => prev ? { ...prev, [field]: value } : null)
  }

  const toggleImageSelection = (index: number, event?: React.MouseEvent) => {
    // Empêcher la propagation si c'est un clic sur le checkbox
    if (event) {
      event.stopPropagation()
    }
    
    setSelectedImages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const selectAllImages = () => {
    setSelectedImages(new Set(editedProduct.images.map((_, i) => i)))
  }

  const deselectAllImages = () => {
    setSelectedImages(new Set())
  }

  const deleteSelectedImages = () => {
    if (selectedImages.size === 0) return
    
    const count = selectedImages.size
    const remainingImages = editedProduct.images.filter((_, i) => !selectedImages.has(i))
    
    // Réindexer les images restantes
    setEditedProduct(prev => prev ? { ...prev, images: remainingImages } : null)
    // Sélectionner toutes les images restantes
    setSelectedImages(new Set(remainingImages.map((_, i) => i)))
    // Nettoyer les états de chargement
    setFailedImages(new Set())
    setLoadingImages(new Set())
    
    toast({
      title: 'Images supprimées',
      description: `${count} image(s) supprimée(s)`,
    })
  }

  const removeFailedImages = () => {
    if (failedImages.size === 0) return
    
    const count = failedImages.size
    const remainingImages = editedProduct.images.filter((_, i) => !failedImages.has(i))
    
    setEditedProduct(prev => prev ? { ...prev, images: remainingImages } : null)
    setSelectedImages(new Set(remainingImages.map((_, i) => i)))
    setFailedImages(new Set())
    
    toast({
      title: 'Images invalides supprimées',
      description: `${count} image(s) en erreur supprimée(s)`,
    })
  }

  const addImageUrl = () => {
    if (!newImageUrl.trim()) return
    
    // Vérifier si l'URL est valide
    try {
      new URL(newImageUrl)
    } catch {
      toast({
        title: 'URL invalide',
        description: 'Veuillez entrer une URL d\'image valide',
        variant: 'destructive'
      })
      return
    }

    // Vérifier les doublons
    const hash = getImageHash(newImageUrl)
    const existingHashes = editedProduct.images.map(getImageHash)
    if (existingHashes.includes(hash)) {
      toast({
        title: 'Image déjà présente',
        description: 'Cette image existe déjà dans la liste',
        variant: 'destructive'
      })
      return
    }

    const newIndex = editedProduct.images.length
    const newImages = [...editedProduct.images, newImageUrl.trim()]
    setEditedProduct(prev => prev ? { ...prev, images: newImages } : null)
    setSelectedImages(prev => new Set([...prev, newIndex]))
    setLoadingImages(prev => new Set(prev).add(newIndex))
    setNewImageUrl('')
    
    toast({
      title: 'Image ajoutée',
      description: 'L\'image a été ajoutée à la liste',
    })
  }

  const setAsPrimary = (index: number) => {
    if (index === 0) return
    
    const newImages = [...editedProduct.images]
    const [moved] = newImages.splice(index, 1)
    newImages.unshift(moved)
    
    // Réindexer la sélection
    const newSelection = new Set<number>()
    selectedImages.forEach(i => {
      if (i === index) {
        newSelection.add(0)
      } else if (i < index) {
        newSelection.add(i + 1)
      } else {
        newSelection.add(i)
      }
    })
    
    setEditedProduct(prev => prev ? { ...prev, images: newImages } : null)
    setSelectedImages(newSelection)
    
    toast({
      title: 'Image principale définie',
      description: 'Cette image sera utilisée comme miniature principale',
    })
  }

  const handleConfirm = () => {
    if (!editedProduct) return
    
    // Ne garder que les images sélectionnées (et non en erreur)
    const filteredImages = editedProduct.images.filter((_, i) => 
      selectedImages.has(i) && !failedImages.has(i)
    )
    
    if (filteredImages.length === 0) {
      toast({
        title: 'Aucune image valide',
        description: 'Veuillez sélectionner au moins une image valide',
        variant: 'destructive'
      })
      return
    }
    
    onConfirmImport({
      ...editedProduct,
      images: filteredImages
    })
  }

  const validSelectedCount = [...selectedImages].filter(i => !failedImages.has(i)).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Aperçu et modification avant import
          </DialogTitle>
          <DialogDescription>
            Vérifiez et modifiez les informations du produit avant de l'importer
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Alerte doublons supprimés */}
            {duplicatesRemoved > 0 && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
                <Copy className="h-4 w-4 text-amber-600" />
                <span className="text-amber-700">
                  {duplicatesRemoved} image{duplicatesRemoved > 1 ? 's' : ''} en double supprimée{duplicatesRemoved > 1 ? 's' : ''} automatiquement
                </span>
              </div>
            )}

            {/* Informations principales */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Titre du produit</Label>
                <Input
                  id="edit-title"
                  value={editedProduct.title}
                  onChange={e => handleFieldChange('title', e.target.value)}
                  className="font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editedProduct.description || ''}
                  onChange={e => handleFieldChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Prix coût ({editedProduct.currency})</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editedProduct.price}
                    onChange={e => handleFieldChange('price', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-suggested-price">Prix de vente (€)</Label>
                  <Input
                    id="edit-suggested-price"
                    type="number"
                    step="0.01"
                    value={editedProduct.suggested_price}
                    onChange={e => handleFieldChange('suggested_price', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sku">SKU</Label>
                  <Input
                    id="edit-sku"
                    value={editedProduct.sku || ''}
                    onChange={e => handleFieldChange('sku', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-brand">Marque</Label>
                  <Input
                    id="edit-brand"
                    value={editedProduct.brand || ''}
                    onChange={e => handleFieldChange('brand', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plateforme source</Label>
                  <Input
                    value={editedProduct.platform_detected}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* Sélection des images - Section améliorée */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images 
                  <Badge variant="secondary">
                    {validSelectedCount}/{editedProduct.images.length}
                  </Badge>
                  {failedImages.size > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {failedImages.size} en erreur
                    </Badge>
                  )}
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllImages}
                    disabled={selectedImages.size === editedProduct.images.length}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Tout
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllImages}
                    disabled={selectedImages.size === 0}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Aucun
                  </Button>
                  {failedImages.size > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeFailedImages}
                      className="text-orange-600 border-orange-300"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Retirer invalides
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteSelectedImages}
                    disabled={selectedImages.size === 0}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Supprimer ({selectedImages.size})
                  </Button>
                </div>
              </div>

              {/* Ajouter une image par URL */}
              <div className="flex gap-2">
                <Input
                  placeholder="Coller une URL d'image..."
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addImageUrl()}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addImageUrl}
                  disabled={!newImageUrl.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Grille d'images améliorée */}
              {editedProduct.images.length === 0 ? (
                <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                  <ImageIcon className="h-6 w-6 mr-2" />
                  Aucune image - ajoutez-en via l'URL ci-dessus
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {editedProduct.images.map((img, idx) => {
                    const isSelected = selectedImages.has(idx)
                    const isFailed = failedImages.has(idx)
                    const isLoading = loadingImages.has(idx)
                    
                    return (
                      <div
                        key={`${idx}-${img.slice(-20)}`}
                        className={cn(
                          "relative aspect-square rounded-lg overflow-hidden border-2 transition-all group",
                          isFailed 
                            ? "border-destructive/50 opacity-50" 
                            : isSelected
                              ? "border-primary ring-2 ring-primary/20 cursor-pointer"
                              : "border-muted opacity-60 hover:opacity-80 cursor-pointer"
                        )}
                      >
                        {/* Zone cliquable principale pour toggle */}
                        <div 
                          className="absolute inset-0 z-10"
                          onClick={(e) => toggleImageSelection(idx, e)}
                        />
                        
                        {/* Image */}
                        <img
                          src={img}
                          alt={`Image ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onLoad={() => handleImageLoad(idx)}
                          onError={() => handleImageError(idx)}
                        />
                        
                        {/* Loader */}
                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        )}
                        
                        {/* Indicateur d'erreur */}
                        {isFailed && (
                          <div className="absolute inset-0 flex items-center justify-center bg-destructive/20">
                            <X className="h-6 w-6 text-destructive" />
                          </div>
                        )}
                        
                        {/* Checkbox de sélection - TOUJOURS VISIBLE */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleImageSelection(idx)
                          }}
                          className={cn(
                            "absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full flex items-center justify-center transition-all",
                            "border-2 shadow-sm",
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-background/90 border-muted-foreground/30 hover:border-primary/50"
                          )}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </button>
                        
                        {/* Actions au survol */}
                        <div className="absolute bottom-0 left-0 right-0 z-20 p-1 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-white hover:bg-white/20"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPreviewImage(img)
                            }}
                          >
                            <ZoomIn className="h-3.5 w-3.5" />
                          </Button>
                          {idx !== 0 && isSelected && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-white hover:bg-white/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                setAsPrimary(idx)
                              }}
                              title="Définir comme image principale"
                            >
                              <GripVertical className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        
                        {/* Badge image principale */}
                        {idx === 0 && isSelected && !isFailed && (
                          <Badge className="absolute bottom-1 left-1 z-20 text-xs bg-primary pointer-events-none">
                            Principale
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Variantes */}
            {editedProduct.variants && editedProduct.variants.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Variantes ({editedProduct.variants.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {editedProduct.variants.slice(0, 10).map((variant, idx) => (
                    <Badge key={idx} variant="secondary">
                      {variant.title || variant.name || `Variante ${idx + 1}`}
                    </Badge>
                  ))}
                  {editedProduct.variants.length > 10 && (
                    <Badge variant="outline">
                      +{editedProduct.variants.length - 10} autres
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Vidéos */}
            {editedProduct.videos && editedProduct.videos.length > 0 && (
              <div className="space-y-2">
                <Label>🎬 Vidéos ({editedProduct.videos.length})</Label>
                <div className="text-sm text-muted-foreground">
                  Les vidéos seront importées avec le produit
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isImporting || validSelectedCount === 0}
            className="bg-gradient-to-r from-green-500 to-emerald-600"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Importer avec {validSelectedCount} image{validSelectedCount > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Modal de prévisualisation */}
        {previewImage && (
          <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
            <DialogContent className="max-w-3xl p-2">
              <img 
                src={previewImage} 
                alt="Preview" 
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
