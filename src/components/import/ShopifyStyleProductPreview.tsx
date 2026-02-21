/**
 * ShopifyStyleProductPreview — Full-page Shopify-inspired product editing layout
 * Two-column layout with media gallery, variants, and AI content optimization
 */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ImageIcon, Trash2, Check, X, ShoppingCart,
  Package, Eye, Plus, GripVertical, RotateCcw,
  ZoomIn, Loader2, Tag, DollarSign, FileText, Film, Star,
  MessageSquare, Play, Sparkles, ClipboardList, AlertCircle,
  ArrowLeft, Globe, Search, BarChart3, Layers, Settings,
  ChevronDown, ChevronUp, ExternalLink, Copy
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

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
  extracted_reviews?: any[]
  reviews?: { rating: number | null; count: number | null }
  specifications?: Record<string, string>
}

interface ShopifyStyleProductPreviewProps {
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
    ;['w', 'h', 'width', 'height', 'size', 'quality', 'q'].forEach(p => urlObj.searchParams.delete(p))
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

// --- Collapsible Card ---
function CollapsibleCard({ title, icon: Icon, badge, children, defaultOpen = true, className }: {
  title: string
  icon: React.ElementType
  badge?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <Card className={cn("border-border/60 shadow-sm", className)}>
      <CardHeader
        className="cursor-pointer select-none py-3 px-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {badge}
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0 px-4 pb-4">
              {children}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

// --- Main component ---
export function ShopifyStyleProductPreview({
  open, onOpenChange, product, onConfirmImport, isImporting = false
}: ShopifyStyleProductPreviewProps) {
  const [editedProduct, setEditedProduct] = useState<ProductPreviewData | null>(null)
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set())
  const [mainImageIndex, setMainImageIndex] = useState(0)
  const [duplicatesRemoved, setDuplicatesRemoved] = useState(0)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set())
  const [isOptimizingTitle, setIsOptimizingTitle] = useState(false)
  const [isOptimizingDesc, setIsOptimizingDesc] = useState(false)
  const [productStatus, setProductStatus] = useState('draft')

  useEffect(() => {
    if (product && open) {
      const originalCount = product.images?.length || 0
      const uniqueImages = deduplicateImages(product.images || [])
      setDuplicatesRemoved(originalCount - uniqueImages.length)
      setEditedProduct({ ...product, images: uniqueImages })
      setSelectedImages(new Set(uniqueImages.map((_, i) => i)))
      setMainImageIndex(0)
      setFailedImages(new Set())
    }
  }, [product, open])

  if (!editedProduct) return null

  const optimizeWithAI = async (field: 'title' | 'description') => {
    const setter = field === 'title' ? setIsOptimizingTitle : setIsOptimizingDesc
    setter(true)
    try {
      const { data, error } = await supabase.functions.invoke('ai-product-optimizer', {
        body: {
          productId: 'preview',
          optimizationType: field,
          currentData: {
            name: editedProduct.title,
            description: editedProduct.description,
            category: editedProduct.brand,
            price: editedProduct.price,
          }
        }
      })
      if (error) throw error
      if (data?.result) {
        if (field === 'title' && data.result.optimized_title) {
          handleFieldChange('title', data.result.optimized_title)
          toast({ title: '✨ Titre optimisé par IA' })
        } else if (field === 'description' && data.result.optimized_description) {
          handleFieldChange('description', data.result.optimized_description)
          toast({ title: '✨ Description optimisée par IA' })
        }
      }
    } catch (err) {
      toast({ title: 'Erreur IA', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
    } finally {
      setter(false)
    }
  }

  const handleFieldChange = (field: keyof ProductPreviewData, value: any) => {
    setEditedProduct(prev => prev ? { ...prev, [field]: value } : null)
  }

  const toggleImageSelection = (index: number) => {
    setSelectedImages(prev => {
      const n = new Set(prev)
      n.has(index) ? n.delete(index) : n.add(index)
      return n
    })
  }

  const removeImage = (index: number) => {
    const remaining = editedProduct.images.filter((_, i) => i !== index)
    setEditedProduct(prev => prev ? { ...prev, images: remaining } : null)
    setSelectedImages(new Set(remaining.map((_, i) => i)))
    if (mainImageIndex >= remaining.length) setMainImageIndex(0)
    setFailedImages(new Set())
  }

  const addImageUrl = () => {
    if (!newImageUrl.trim()) return
    try { new URL(newImageUrl) } catch {
      toast({ title: 'URL invalide', variant: 'destructive' }); return
    }
    setEditedProduct(prev => prev ? { ...prev, images: [...prev.images, newImageUrl.trim()] } : null)
    setSelectedImages(prev => new Set([...prev, editedProduct.images.length]))
    setNewImageUrl('')
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
  const mainImage = editedProduct.images[mainImageIndex]
  const margin = editedProduct.suggested_price > 0 && editedProduct.price > 0
    ? ((editedProduct.suggested_price - editedProduct.price) / editedProduct.suggested_price * 100).toFixed(0)
    : '0'

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-[1400px] max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
          {/* ── Shopify-style top bar ── */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border/60 bg-muted/30">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="gap-1.5 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <Separator orientation="vertical" className="h-5" />
              <DialogTitle className="text-base font-semibold truncate max-w-[400px]">
                {editedProduct.title?.slice(0, 60) || 'Nouveau produit'}
              </DialogTitle>
              <Badge variant="outline" className="capitalize text-xs">
                {editedProduct.platform_detected}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Select value={productStatus} onValueChange={setProductStatus}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleConfirm}
                disabled={isImporting || validSelectedCount === 0}
                size="sm"
                className="bg-primary hover:bg-primary/90 shadow-sm gap-1.5"
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                Importer le produit
              </Button>
            </div>
          </div>

          {/* ── Two-column layout ── */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 p-6">
              {/* ══════ LEFT COLUMN ══════ */}
              <div className="space-y-5">

                {/* ── Title & Description ── */}
                <CollapsibleCard title="Titre et description" icon={FileText}>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">Titre</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => optimizeWithAI('title')}
                          disabled={isOptimizingTitle}
                          className="h-7 gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
                        >
                          {isOptimizingTitle ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                          Optimiser avec l'IA
                        </Button>
                      </div>
                      <Input
                        value={editedProduct.title}
                        onChange={e => handleFieldChange('title', e.target.value)}
                        className="text-base font-medium"
                        placeholder="Nom du produit"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">Description</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => optimizeWithAI('description')}
                          disabled={isOptimizingDesc}
                          className="h-7 gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
                        >
                          {isOptimizingDesc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                          Optimiser avec l'IA
                        </Button>
                      </div>
                      <Textarea
                        value={editedProduct.description || ''}
                        onChange={e => handleFieldChange('description', e.target.value)}
                        rows={6}
                        placeholder="Décrivez votre produit..."
                        className="resize-none"
                      />
                    </div>
                  </div>
                </CollapsibleCard>

                {/* ── Media (Images + Videos) ── */}
                <CollapsibleCard
                  title="Médias"
                  icon={ImageIcon}
                  badge={
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-xs">{editedProduct.images.length} images</Badge>
                      {editedProduct.videos && editedProduct.videos.length > 0 && (
                        <Badge variant="secondary" className="text-xs">{editedProduct.videos.length} vidéos</Badge>
                      )}
                    </div>
                  }
                >
                  <div className="space-y-4">
                    {/* Shopify-style media layout: main image + thumbnails */}
                    {editedProduct.images.length > 0 ? (
                      <div className="flex gap-3">
                        {/* Main image preview */}
                        <div
                          className="relative w-[280px] h-[280px] shrink-0 rounded-xl border border-border/60 overflow-hidden bg-muted/20 cursor-pointer group"
                          onClick={() => setPreviewImage(mainImage)}
                        >
                          <img
                            src={mainImage}
                            alt="Image principale"
                            className="w-full h-full object-contain"
                            onError={() => setFailedImages(prev => new Set(prev).add(mainImageIndex))}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-70 transition-opacity" />
                          </div>
                          {mainImageIndex === 0 && (
                            <Badge className="absolute top-2 left-2 text-[10px] bg-primary/90 shadow-sm">
                              Principale
                            </Badge>
                          )}
                        </div>

                        {/* Thumbnail grid */}
                        <div className="flex-1 grid grid-cols-4 gap-2 content-start">
                          {editedProduct.images.map((img, idx) => (
                            <div
                              key={`${idx}-${img.slice(-15)}`}
                              className={cn(
                                "relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer group transition-all",
                                idx === mainImageIndex
                                  ? "border-primary ring-1 ring-primary/20"
                                  : selectedImages.has(idx)
                                    ? "border-border/60 hover:border-primary/40"
                                    : "border-border/30 opacity-50 hover:opacity-80"
                              )}
                              onClick={() => setMainImageIndex(idx)}
                            >
                              <img src={img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                              {failedImages.has(idx) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-destructive/20 backdrop-blur-sm">
                                  <X className="h-4 w-4 text-destructive" />
                                </div>
                              )}
                              {/* Selection checkbox */}
                              <button
                                onClick={e => { e.stopPropagation(); toggleImageSelection(idx) }}
                                className={cn(
                                  "absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 shadow-sm transition-all",
                                  selectedImages.has(idx)
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "bg-background/80 border-muted-foreground/30"
                                )}
                              >
                                {selectedImages.has(idx) && <Check className="h-2.5 w-2.5" />}
                              </button>
                              {/* Delete on hover */}
                              <button
                                onClick={e => { e.stopPropagation(); removeImage(idx) }}
                                className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-destructive/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}

                          {/* Add image button */}
                          <div className="aspect-square rounded-lg border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors group"
                            onClick={() => {
                              const url = prompt("URL de l'image:")
                              if (url) {
                                setNewImageUrl(url)
                                setTimeout(addImageUrl, 0)
                              }
                            }}
                          >
                            <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-[10px] text-muted-foreground">Ajouter</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border/50 rounded-xl text-muted-foreground bg-muted/10">
                        <ImageIcon className="h-10 w-10 mb-3 opacity-30" />
                        <p className="text-sm font-medium">Aucun média</p>
                        <p className="text-xs mt-1">Ajoutez des images ou vidéos</p>
                      </div>
                    )}

                    {/* Duplicate alert */}
                    {duplicatesRemoved > 0 && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                        <Copy className="h-3.5 w-3.5 shrink-0" />
                        {duplicatesRemoved} image(s) en double supprimée(s) automatiquement
                      </div>
                    )}

                    {/* Videos section */}
                    {editedProduct.videos && editedProduct.videos.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Film className="h-3.5 w-3.5" /> Vidéos ({editedProduct.videos.length})
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {editedProduct.videos.map((video, i) => (
                              <div key={i} className="rounded-lg overflow-hidden border border-border/50 bg-muted/20">
                                {(typeof video === 'string' ? video : '').includes('.m3u8') ? (
                                  <div className="flex items-center gap-2.5 p-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                      <Play className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium">Vidéo HLS #{i + 1}</p>
                                      <p className="text-[10px] text-muted-foreground truncate">{typeof video === 'string' ? video : ''}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <video
                                    src={typeof video === 'string' ? video : ''}
                                    controls
                                    preload="metadata"
                                    className="w-full aspect-video object-cover"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CollapsibleCard>

                {/* ── Variants ── */}
                <CollapsibleCard
                  title="Variantes"
                  icon={Layers}
                  badge={<Badge variant="secondary" className="text-xs">{editedProduct.variants?.length || 0}</Badge>}
                  defaultOpen={!!(editedProduct.variants && editedProduct.variants.length > 0)}
                >
                  {editedProduct.variants && editedProduct.variants.length > 0 ? (
                    <div className="space-y-2">
                      {/* Shopify-style variant table */}
                      <div className="border border-border/50 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40">
                            <tr>
                              <th className="text-left p-2.5 text-xs font-medium text-muted-foreground">Variante</th>
                              <th className="text-left p-2.5 text-xs font-medium text-muted-foreground">Prix</th>
                              <th className="text-left p-2.5 text-xs font-medium text-muted-foreground">Stock</th>
                              <th className="text-left p-2.5 text-xs font-medium text-muted-foreground">SKU</th>
                            </tr>
                          </thead>
                          <tbody>
                            {editedProduct.variants.slice(0, 20).map((v: any, i: number) => (
                              <tr key={i} className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                                <td className="p-2.5">
                                  <div className="flex items-center gap-2">
                                    {v.image && (
                                      <img src={v.image} alt="" className="w-8 h-8 rounded object-cover" />
                                    )}
                                    <span className="font-medium text-xs">{v.title || v.name || `Option ${i + 1}`}</span>
                                  </div>
                                </td>
                                <td className="p-2.5 text-xs">{v.price ? `${v.price} ${editedProduct.currency}` : '—'}</td>
                                <td className="p-2.5 text-xs">{v.stock ?? v.inventory_quantity ?? '∞'}</td>
                                <td className="p-2.5 text-xs font-mono text-muted-foreground">{v.sku || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {(editedProduct.variants?.length || 0) > 20 && (
                        <p className="text-xs text-muted-foreground text-center py-1">
                          +{(editedProduct.variants?.length || 0) - 20} autres variantes
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-4 rounded-lg border border-dashed border-border/50 bg-muted/10 text-muted-foreground">
                      <Layers className="h-4 w-4 opacity-40" />
                      <span className="text-sm">Ce produit n'a pas de variantes</span>
                    </div>
                  )}
                </CollapsibleCard>

                {/* ── Reviews ── */}
                <CollapsibleCard
                  title="Avis clients"
                  icon={MessageSquare}
                  badge={
                    <div className="flex items-center gap-1.5">
                      {editedProduct.reviews?.rating && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          {editedProduct.reviews.rating.toFixed(1)}
                          {editedProduct.reviews.count != null && (
                            <span className="text-muted-foreground">({editedProduct.reviews.count})</span>
                          )}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {editedProduct.extracted_reviews?.length || 0} extraits
                      </Badge>
                    </div>
                  }
                  defaultOpen={!!(editedProduct.extracted_reviews && editedProduct.extracted_reviews.length > 0)}
                >
                  {editedProduct.extracted_reviews && editedProduct.extracted_reviews.length > 0 ? (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {editedProduct.extracted_reviews.slice(0, 10).map((review: any, i: number) => (
                        <div key={i} className="p-3 rounded-lg border border-border/30 bg-muted/10 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{review.customer_name || 'Client'}</span>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, s) => (
                                <Star key={s} className={cn("h-3 w-3", s < (review.rating || 0) ? "fill-amber-500 text-amber-500" : "text-muted-foreground/20")} />
                              ))}
                            </div>
                          </div>
                          {review.title && <p className="text-xs font-medium">{review.title}</p>}
                          {review.comment && <p className="text-xs text-muted-foreground line-clamp-2">{review.comment}</p>}
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                            {review.verified_purchase && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1 border-green-500/30 text-green-600">Vérifié</Badge>
                            )}
                            {review.review_date && <span>{new Date(review.review_date).toLocaleDateString('fr-FR')}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-4 rounded-lg border border-dashed border-border/50 bg-muted/10 text-muted-foreground">
                      <MessageSquare className="h-4 w-4 opacity-40" />
                      <span className="text-sm">
                        {editedProduct.reviews?.rating
                          ? `Note: ${editedProduct.reviews.rating.toFixed(1)}/5 (${editedProduct.reviews.count || 0} avis) — avis individuels non extraits`
                          : 'Aucun avis détecté sur cette fiche'}
                      </span>
                    </div>
                  )}
                </CollapsibleCard>

                {/* ── SEO Preview ── */}
                <CollapsibleCard title="Aperçu SEO" icon={Search} defaultOpen={false}>
                  <div className="space-y-2 p-3 rounded-lg border border-border/30 bg-muted/10">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 line-clamp-1">
                      {editedProduct.title || 'Titre du produit'}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400 truncate">
                      monsite.com › produits › {editedProduct.sku?.toLowerCase() || 'nouveau-produit'}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {editedProduct.description?.slice(0, 160) || 'Description du produit...'}
                    </p>
                  </div>
                </CollapsibleCard>
              </div>

              {/* ══════ RIGHT COLUMN (Sidebar) ══════ */}
              <div className="space-y-5">

                {/* ── Status ── */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Statut
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <Select value={productStatus} onValueChange={setProductStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* ── Pricing ── */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      Tarification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Prix coût ({editedProduct.currency})</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editedProduct.price}
                        onChange={e => handleFieldChange('price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Prix de vente (€)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editedProduct.suggested_price}
                        onChange={e => handleFieldChange('suggested_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    {/* Profit indicator */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                      <span className="text-xs text-green-700 dark:text-green-400">Marge bénéficiaire</span>
                      <span className="text-sm font-bold text-green-600">{margin}%</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                      <span className="text-xs text-muted-foreground">Profit estimé</span>
                      <span className="text-sm font-semibold text-primary">
                        {(editedProduct.suggested_price - editedProduct.price).toFixed(2)} €
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* ── Organization ── */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      Organisation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Marque / Vendeur</label>
                      <Input
                        value={editedProduct.brand || ''}
                        onChange={e => handleFieldChange('brand', e.target.value)}
                        placeholder="Marque"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">SKU</label>
                      <Input
                        value={editedProduct.sku || ''}
                        onChange={e => handleFieldChange('sku', e.target.value)}
                        className="font-mono text-sm"
                        placeholder="SKU-001"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Source</label>
                      <div className="flex items-center gap-2 p-2 rounded-lg border border-border/40 bg-muted/20">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs capitalize font-medium">{editedProduct.platform_detected}</span>
                      </div>
                    </div>
                    {editedProduct.source_url && (
                      <a
                        href={editedProduct.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Voir sur le site source
                      </a>
                    )}
                  </CardContent>
                </Card>

                {/* ── Specifications ── */}
                <CollapsibleCard
                  title="Caractéristiques"
                  icon={ClipboardList}
                  badge={<Badge variant="secondary" className="text-xs">{Object.keys(editedProduct.specifications || {}).length}</Badge>}
                  defaultOpen={!!(editedProduct.specifications && Object.keys(editedProduct.specifications).length > 0)}
                >
                  {editedProduct.specifications && Object.keys(editedProduct.specifications).length > 0 ? (
                    <div className="space-y-1">
                      {Object.entries(editedProduct.specifications).slice(0, 15).map(([key, value], i) => (
                        <div key={i} className="flex items-start gap-2 py-1.5 border-b border-border/20 last:border-b-0">
                          <span className="text-[11px] font-medium text-muted-foreground min-w-[90px] shrink-0">{key}</span>
                          <span className="text-[11px] text-foreground">{value}</span>
                        </div>
                      ))}
                      {Object.keys(editedProduct.specifications).length > 15 && (
                        <p className="text-[10px] text-muted-foreground text-center pt-1">
                          +{Object.keys(editedProduct.specifications).length - 15} autres
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border/50 bg-muted/10 text-muted-foreground">
                      <ClipboardList className="h-4 w-4 opacity-40" />
                      <span className="text-xs">Aucune caractéristique détectée</span>
                    </div>
                  )}
                </CollapsibleCard>

                {/* ── Import Summary ── */}
                <Card className="border-primary/30 shadow-sm bg-primary/5">
                  <CardContent className="p-4 space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Résumé de l'import
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Images sélectionnées</span>
                        <span className="font-medium">{validSelectedCount}/{editedProduct.images.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Variantes</span>
                        <span className="font-medium">{editedProduct.variants?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vidéos</span>
                        <span className="font-medium">{editedProduct.videos?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avis</span>
                        <span className="font-medium">{editedProduct.extracted_reviews?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Caractéristiques</span>
                        <span className="font-medium">{Object.keys(editedProduct.specifications || {}).length}</span>
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <Button
                      onClick={handleConfirm}
                      disabled={isImporting || validSelectedCount === 0}
                      className="w-full bg-primary hover:bg-primary/90 shadow-sm"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Import en cours...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Confirmer l'import
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Image preview modal */}
      <AnimatePresence>
        {previewImage && (
          <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
            <DialogContent className="max-w-3xl p-2 bg-background/95 backdrop-blur-xl">
              <DialogTitle className="sr-only">Aperçu image</DialogTitle>
              <img src={previewImage} alt="Preview" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  )
}
