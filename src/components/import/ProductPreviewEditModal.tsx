import { useState, useMemo } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ImageIcon, Trash2, Check, X, ShoppingCart, 
  Package, Eye, Copy, Plus
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
  // Extraire le nom de fichier ou un identifiant unique
  try {
    const urlObj = new URL(normalized)
    const pathParts = urlObj.pathname.split('/')
    const filename = pathParts[pathParts.length - 1]
    // Supprimer les extensions et paramètres courants
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

  // Initialiser le produit édité quand le modal s'ouvre
  useMemo(() => {
    if (product && open) {
      // Dédupliquer les images
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
    }
  }, [product, open])

  if (!editedProduct) return null

  const handleFieldChange = (field: keyof ProductPreviewData, value: any) => {
    setEditedProduct(prev => prev ? { ...prev, [field]: value } : null)
  }

  const toggleImageSelection = (index: number) => {
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
    
    const remainingImages = editedProduct.images.filter((_, i) => !selectedImages.has(i))
    setEditedProduct(prev => prev ? { ...prev, images: remainingImages } : null)
    setSelectedImages(new Set(remainingImages.map((_, i) => i)))
    
    toast({
      title: 'Images supprimées',
      description: `${selectedImages.size} image(s) supprimée(s)`,
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

    const newImages = [...editedProduct.images, newImageUrl.trim()]
    setEditedProduct(prev => prev ? { ...prev, images: newImages } : null)
    setSelectedImages(prev => new Set([...prev, newImages.length - 1]))
    setNewImageUrl('')
    
    toast({
      title: 'Image ajoutée',
      description: 'L\'image a été ajoutée à la liste',
    })
  }

  const handleConfirm = () => {
    if (!editedProduct) return
    
    // Ne garder que les images sélectionnées
    const filteredImages = editedProduct.images.filter((_, i) => selectedImages.has(i))
    
    onConfirmImport({
      ...editedProduct,
      images: filteredImages
    })
  }

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

            {/* Sélection des images */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images ({selectedImages.size}/{editedProduct.images.length} sélectionnées)
                </Label>
                <div className="flex gap-2">
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

              {editedProduct.images.length === 0 ? (
                <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                  <ImageIcon className="h-6 w-6 mr-2" />
                  Aucune image - ajoutez-en via l'URL ci-dessus
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {editedProduct.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleImageSelection(idx)}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all",
                        selectedImages.has(idx)
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent opacity-50 hover:opacity-75"
                      )}
                    >
                      <img
                        src={img}
                        alt={`Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg'
                        }}
                      />
                      <div className={cn(
                        "absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition-colors",
                        selectedImages.has(idx)
                          ? "bg-primary text-primary-foreground"
                          : "bg-background/80 border"
                      )}>
                        {selectedImages.has(idx) && <Check className="h-3 w-3" />}
                      </div>
                      {idx === 0 && selectedImages.has(idx) && (
                        <Badge className="absolute bottom-1 left-1 text-xs bg-primary">
                          Principale
                        </Badge>
                      )}
                    </div>
                  ))}
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
            disabled={isImporting || selectedImages.size === 0}
            className="bg-gradient-to-r from-green-500 to-emerald-600"
          >
            {isImporting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Import en cours...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Importer avec {selectedImages.size} image{selectedImages.size > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
