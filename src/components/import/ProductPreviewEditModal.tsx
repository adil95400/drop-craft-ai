/**
 * ProductPreviewEditModal — Channable Premium Design
 * Glassmorphism, gradient header, fluid animations
 */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  ImageIcon, Trash2, Check, X, ShoppingCart, 
  Package, Eye, Copy, Plus, GripVertical, RotateCcw,
  ZoomIn, Loader2, Tag, DollarSign, FileText, Film
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

// --- Types ---
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

// --- Image utilities ---
const normalizeImageUrl = (url: string): string => {
  try {
    if (url.includes('amazon') || url.includes('media-amazon')) {
      return url.replace(/\._[A-Z]{2}_[^.]*\./g, '.').replace(/\._S[XY]\d+_\./g, '.').replace(/\._AC_[^.]*\./g, '.')
    }
    if (url.includes('aliexpress') || url.includes('alicdn')) {
      return url.replace(/(_\d+x\d+|\.\d+x\d+)/g, '')
    }
    const urlObj = new URL(url)
    ;['w','h','width','height','size','quality','q'].forEach(p => urlObj.searchParams.delete(p))
    return urlObj.toString()
  } catch { return url }
}

const getImageHash = (url: string): string => {
  try {
    const urlObj = new URL(normalizeImageUrl(url))
    const parts = urlObj.pathname.split('/')
    return parts[parts.length - 1].replace(/\.(jpg|jpeg|png|webp|gif)/gi, '').toLowerCase()
  } catch { return normalizeImageUrl(url).toLowerCase() }
}

const deduplicateImages = (images: string[]): string[] => {
  const seen = new Set<string>()
  return images.filter(img => {
    const hash = getImageHash(img)
    if (seen.has(hash)) return false
    seen.add(hash)
    return true
  })
}

// --- Section wrapper ---
function ModalSection({ icon: Icon, title, badge, children, className }: {
  icon: React.ElementType
  title: string
  badge?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("space-y-3", className)}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {badge}
      </div>
      {children}
    </motion.div>
  )
}

// --- Field wrapper ---
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

// --- Main component ---
export function ProductPreviewEditModal({
  open, onOpenChange, product, onConfirmImport, isImporting = false
}: ProductPreviewEditModalProps) {
  const [editedProduct, setEditedProduct] = useState<ProductPreviewData | null>(null)
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set())
  const [duplicatesRemoved, setDuplicatesRemoved] = useState(0)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set())
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (product && open) {
      const originalCount = product.images?.length || 0
      const uniqueImages = deduplicateImages(product.images || [])
      setDuplicatesRemoved(originalCount - uniqueImages.length)
      setEditedProduct({ ...product, images: uniqueImages })
      setSelectedImages(new Set(uniqueImages.map((_, i) => i)))
      setFailedImages(new Set())
      setLoadingImages(new Set(uniqueImages.map((_, i) => i)))
    }
  }, [product, open])

  useEffect(() => { if (!open) { setPreviewImage(null); setNewImageUrl('') } }, [open])

  const handleImageLoad = useCallback((index: number) => {
    setLoadingImages(prev => { const n = new Set(prev); n.delete(index); return n })
  }, [])

  const handleImageError = useCallback((index: number) => {
    setLoadingImages(prev => { const n = new Set(prev); n.delete(index); return n })
    setFailedImages(prev => new Set(prev).add(index))
  }, [])

  if (!editedProduct) return null

  const handleFieldChange = (field: keyof ProductPreviewData, value: any) => {
    setEditedProduct(prev => prev ? { ...prev, [field]: value } : null)
  }

  const toggleImageSelection = (index: number, event?: React.MouseEvent) => {
    event?.stopPropagation()
    setSelectedImages(prev => {
      const n = new Set(prev)
      n.has(index) ? n.delete(index) : n.add(index)
      return n
    })
  }

  const selectAllImages = () => setSelectedImages(new Set(editedProduct.images.map((_, i) => i)))
  const deselectAllImages = () => setSelectedImages(new Set())

  const deleteSelectedImages = () => {
    if (selectedImages.size === 0) return
    const count = selectedImages.size
    const remaining = editedProduct.images.filter((_, i) => !selectedImages.has(i))
    setEditedProduct(prev => prev ? { ...prev, images: remaining } : null)
    setSelectedImages(new Set(remaining.map((_, i) => i)))
    setFailedImages(new Set())
    setLoadingImages(new Set())
    toast({ title: 'Images supprimées', description: `${count} image(s) supprimée(s)` })
  }

  const removeFailedImages = () => {
    if (failedImages.size === 0) return
    const count = failedImages.size
    const remaining = editedProduct.images.filter((_, i) => !failedImages.has(i))
    setEditedProduct(prev => prev ? { ...prev, images: remaining } : null)
    setSelectedImages(new Set(remaining.map((_, i) => i)))
    setFailedImages(new Set())
    toast({ title: 'Images invalides supprimées', description: `${count} image(s) retirée(s)` })
  }

  const addImageUrl = () => {
    if (!newImageUrl.trim()) return
    try { new URL(newImageUrl) } catch {
      toast({ title: 'URL invalide', description: 'Veuillez entrer une URL valide', variant: 'destructive' }); return
    }
    const hash = getImageHash(newImageUrl)
    if (editedProduct.images.map(getImageHash).includes(hash)) {
      toast({ title: 'Image déjà présente', variant: 'destructive' }); return
    }
    const idx = editedProduct.images.length
    setEditedProduct(prev => prev ? { ...prev, images: [...prev.images, newImageUrl.trim()] } : null)
    setSelectedImages(prev => new Set([...prev, idx]))
    setLoadingImages(prev => new Set(prev).add(idx))
    setNewImageUrl('')
  }

  const setAsPrimary = (index: number) => {
    if (index === 0) return
    const imgs = [...editedProduct.images]
    const [moved] = imgs.splice(index, 1)
    imgs.unshift(moved)
    const newSel = new Set<number>()
    selectedImages.forEach(i => {
      if (i === index) newSel.add(0)
      else if (i < index) newSel.add(i + 1)
      else newSel.add(i)
    })
    setEditedProduct(prev => prev ? { ...prev, images: imgs } : null)
    setSelectedImages(newSel)
    toast({ title: 'Image principale définie' })
  }

  const handleConfirm = () => {
    if (!editedProduct) return
    const filtered = editedProduct.images.filter((_, i) => selectedImages.has(i) && !failedImages.has(i))
    if (filtered.length === 0) {
      toast({ title: 'Aucune image valide', variant: 'destructive' }); return
    }
    onConfirmImport({ ...editedProduct, images: filtered })
  }

  const validSelectedCount = [...selectedImages].filter(i => !failedImages.has(i)).length

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn(
          "max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0",
          "border-border/50 bg-background/95 backdrop-blur-xl",
          "shadow-2xl shadow-primary/5"
        )}>
          {/* ── Channable Premium Header ── */}
          <div className="relative bg-gradient-to-b from-primary/10 via-primary/5 to-transparent">
            <DialogHeader className="p-6 pb-4">
              <div className="flex items-start gap-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="p-3 rounded-xl bg-primary/10 text-primary shadow-lg"
                >
                  <Eye className="h-5 w-5" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-lg font-semibold leading-tight">
                    Aperçu et modification avant import
                  </DialogTitle>
                  <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
                    Vérifiez et modifiez les informations du produit avant de l'importer
                  </DialogDescription>
                </div>
                {editedProduct.platform_detected && (
                  <Badge variant="secondary" className="shrink-0 capitalize">
                    {editedProduct.platform_detected}
                  </Badge>
                )}
              </div>
            </DialogHeader>
            <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* ── Content ── */}
          <ScrollArea className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="px-6 py-5 space-y-6"
            >
              {/* Duplicate alert */}
              <AnimatePresence>
                {duplicatesRemoved > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm"
                  >
                    <Copy className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="text-amber-700 dark:text-amber-400">
                      {duplicatesRemoved} image{duplicatesRemoved > 1 ? 's' : ''} en double supprimée{duplicatesRemoved > 1 ? 's' : ''} automatiquement
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Section: Product Info ── */}
              <ModalSection icon={FileText} title="Informations produit">
                <div className="space-y-4">
                  <FormField label="Titre du produit">
                    <Input
                      value={editedProduct.title}
                      onChange={e => handleFieldChange('title', e.target.value)}
                      className="font-medium bg-background/60 border-border/60 focus:border-primary/50 transition-colors"
                    />
                  </FormField>

                  <FormField label="Description">
                    <Textarea
                      value={editedProduct.description || ''}
                      onChange={e => handleFieldChange('description', e.target.value)}
                      rows={3}
                      className="bg-background/60 border-border/60 focus:border-primary/50 resize-none transition-colors"
                    />
                  </FormField>
                </div>
              </ModalSection>

              <Separator className="bg-border/40" />

              {/* ── Section: Pricing ── */}
              <ModalSection icon={DollarSign} title="Tarification & Identifiants">
                <div className="grid sm:grid-cols-3 gap-3">
                  <FormField label={`Prix coût (${editedProduct.currency})`}>
                    <Input
                      type="number"
                      step="0.01"
                      value={editedProduct.price}
                      onChange={e => handleFieldChange('price', parseFloat(e.target.value) || 0)}
                      className="bg-background/60 border-border/60 focus:border-primary/50 transition-colors"
                    />
                  </FormField>
                  <FormField label="Prix de vente (€)">
                    <Input
                      type="number"
                      step="0.01"
                      value={editedProduct.suggested_price}
                      onChange={e => handleFieldChange('suggested_price', parseFloat(e.target.value) || 0)}
                      className="bg-background/60 border-border/60 focus:border-primary/50 transition-colors"
                    />
                  </FormField>
                  <FormField label="SKU">
                    <Input
                      value={editedProduct.sku || ''}
                      onChange={e => handleFieldChange('sku', e.target.value)}
                      className="bg-background/60 border-border/60 focus:border-primary/50 font-mono text-sm transition-colors"
                    />
                  </FormField>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  <FormField label="Marque">
                    <Input
                      value={editedProduct.brand || ''}
                      onChange={e => handleFieldChange('brand', e.target.value)}
                      className="bg-background/60 border-border/60 focus:border-primary/50 transition-colors"
                    />
                  </FormField>
                  <FormField label="Plateforme source">
                    <Input
                      value={editedProduct.platform_detected}
                      disabled
                      className="bg-muted/50 border-border/40 capitalize"
                    />
                  </FormField>
                </div>
              </ModalSection>

              <Separator className="bg-border/40" />

              {/* ── Section: Images ── */}
              <ModalSection
                icon={ImageIcon}
                title="Images"
                badge={
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {validSelectedCount}/{editedProduct.images.length}
                    </Badge>
                    {failedImages.size > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {failedImages.size} erreur{failedImages.size > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                }
              >
                {/* Image toolbar */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <Button variant="outline" size="sm" onClick={selectAllImages}
                      disabled={selectedImages.size === editedProduct.images.length}
                      className="h-7 text-xs rounded-lg">
                      <Check className="h-3 w-3 mr-1" /> Tout
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAllImages}
                      disabled={selectedImages.size === 0}
                      className="h-7 text-xs rounded-lg">
                      <X className="h-3 w-3 mr-1" /> Aucun
                    </Button>
                    {failedImages.size > 0 && (
                      <Button variant="outline" size="sm" onClick={removeFailedImages}
                        className="h-7 text-xs rounded-lg text-destructive border-destructive/30 hover:bg-destructive/10">
                        <RotateCcw className="h-3 w-3 mr-1" /> Retirer invalides
                      </Button>
                    )}
                  </div>
                  <Button variant="destructive" size="sm" onClick={deleteSelectedImages}
                    disabled={selectedImages.size === 0}
                    className="h-7 text-xs rounded-lg">
                    <Trash2 className="h-3 w-3 mr-1" /> Supprimer ({selectedImages.size})
                  </Button>
                </div>

                {/* Add image URL */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Coller une URL d'image..."
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addImageUrl()}
                    className="flex-1 bg-background/60 border-border/60 text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={addImageUrl}
                    disabled={!newImageUrl.trim()} className="shrink-0 h-9 w-9">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Image grid */}
                {editedProduct.images.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-border/50 rounded-xl text-muted-foreground bg-muted/20">
                    <ImageIcon className="h-8 w-8 mb-2 opacity-40" />
                    <span className="text-sm">Aucune image — ajoutez-en via l'URL ci-dessus</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                    {editedProduct.images.map((img, idx) => {
                      const isSelected = selectedImages.has(idx)
                      const isFailed = failedImages.has(idx)
                      const isLoading = loadingImages.has(idx)
                      return (
                        <motion.div
                          key={`${idx}-${img.slice(-20)}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          className={cn(
                            "relative aspect-square rounded-xl overflow-hidden border-2 transition-all group cursor-pointer",
                            isFailed
                              ? "border-destructive/40 opacity-50"
                              : isSelected
                                ? "border-primary shadow-md shadow-primary/10 ring-1 ring-primary/20"
                                : "border-border/40 opacity-60 hover:opacity-90 hover:border-border"
                          )}
                        >
                          <div className="absolute inset-0 z-10" onClick={e => toggleImageSelection(idx, e)} />
                          <img src={img} alt={`Image ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onLoad={() => handleImageLoad(idx)}
                            onError={() => handleImageError(idx)}
                          />
                          {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                          )}
                          {isFailed && (
                            <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 backdrop-blur-sm">
                              <X className="h-6 w-6 text-destructive" />
                            </div>
                          )}
                          {/* Checkbox */}
                          <button type="button"
                            onClick={e => { e.stopPropagation(); toggleImageSelection(idx) }}
                            className={cn(
                              "absolute top-1.5 right-1.5 z-20 w-5.5 h-5.5 rounded-full flex items-center justify-center transition-all",
                              "border-2 shadow-sm backdrop-blur-sm",
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground scale-100"
                                : "bg-background/80 border-muted-foreground/30 hover:border-primary/50 scale-90"
                            )}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </button>
                          {/* Hover actions */}
                          <div className="absolute bottom-0 left-0 right-0 z-20 p-1.5 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 justify-center">
                            <Button type="button" variant="ghost" size="icon"
                              className="h-6 w-6 text-white hover:bg-white/20"
                              onClick={e => { e.stopPropagation(); setPreviewImage(img) }}>
                              <ZoomIn className="h-3.5 w-3.5" />
                            </Button>
                            {idx !== 0 && isSelected && (
                              <Button type="button" variant="ghost" size="icon"
                                className="h-6 w-6 text-white hover:bg-white/20"
                                onClick={e => { e.stopPropagation(); setAsPrimary(idx) }}
                                title="Définir comme image principale">
                                <GripVertical className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          {/* Primary badge */}
                          {idx === 0 && isSelected && !isFailed && (
                            <Badge className="absolute bottom-1.5 left-1.5 z-20 text-[10px] bg-primary/90 backdrop-blur-sm pointer-events-none shadow-sm">
                              Principale
                            </Badge>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </ModalSection>

              {/* ── Section: Variants ── */}
              {editedProduct.variants && editedProduct.variants.length > 0 && (
                <>
                  <Separator className="bg-border/40" />
                  <ModalSection icon={Package} title="Variantes"
                    badge={<Badge variant="secondary" className="text-xs">{editedProduct.variants.length}</Badge>}>
                    <div className="flex flex-wrap gap-1.5">
                      {editedProduct.variants.slice(0, 10).map((v, i) => (
                        <Badge key={i} variant="outline" className="bg-background/60">
                          {v.title || v.name || `Variante ${i + 1}`}
                        </Badge>
                      ))}
                      {editedProduct.variants.length > 10 && (
                        <Badge variant="outline" className="text-muted-foreground">
                          +{editedProduct.variants.length - 10} autres
                        </Badge>
                      )}
                    </div>
                  </ModalSection>
                </>
              )}

              {/* ── Section: Videos ── */}
              {editedProduct.videos && editedProduct.videos.length > 0 && (
                <>
                  <Separator className="bg-border/40" />
                  <ModalSection icon={Film} title="Vidéos"
                    badge={<Badge variant="secondary" className="text-xs">{editedProduct.videos.length}</Badge>}>
                    <p className="text-sm text-muted-foreground">
                      Les vidéos seront importées avec le produit
                    </p>
                  </ModalSection>
                </>
              )}
            </motion.div>
          </ScrollArea>

          {/* ── Channable Footer ── */}
          <div className="border-t border-border/50 bg-muted/30 px-6 py-4 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="min-w-[100px]">
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isImporting || validSelectedCount === 0}
              className={cn(
                "min-w-[180px]",
                "bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity",
                "shadow-lg shadow-primary/20"
              )}
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview modal */}
      <AnimatePresence>
        {previewImage && (
          <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
            <DialogContent className="max-w-3xl p-2 bg-background/95 backdrop-blur-xl">
              <img src={previewImage} alt="Preview"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  )
}
