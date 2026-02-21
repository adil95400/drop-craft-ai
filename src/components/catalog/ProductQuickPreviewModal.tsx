/**
 * ProductQuickPreviewModal — Modal de prévisualisation premium
 * Design Channable : galerie interactive, vidéos, avis, spécifications
 * Pour /catalog/to-process
 */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Eye, Package, ImageIcon, Film, Star, MessageSquare,
  ExternalLink, Tag, Building2, FileText, DollarSign,
  TrendingUp, Clipboard, ChevronLeft, ChevronRight,
  Play, AlertTriangle, CheckCircle2, Info, Layers,
  X, ZoomIn, ShoppingCart, Globe, Clock, ThumbsUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Types
export interface QuickPreviewProduct {
  id: string
  name: string
  description?: string | null
  price: number
  cost_price?: number | null
  sku?: string | null
  image_urls?: string[] | null
  original_images?: string[] | null
  category?: string | null
  brand?: string | null
  status?: string | null
  import_notes?: string | null
  source_url?: string | null
  source_platform?: string | null
  created_at?: string
  // Extended data loaded from DB
  videos?: string[]
  reviews?: { rating: number | null; count: number | null }
  extracted_reviews?: any[]
  variants?: any[]
  specifications?: Record<string, string>
}

interface ProductQuickPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: QuickPreviewProduct | null
  onValidate?: (id: string) => void
  onDelete?: (id: string) => void
  onNavigateToProduct?: (id: string) => void
  isValidating?: boolean
}

// --- Section wrapper ---
function Section({ icon: Icon, title, badge, children, className }: {
  icon: React.ElementType
  title: string
  badge?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
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

// --- Health score widget ---
function HealthScore({ product }: { product: QuickPreviewProduct }) {
  let score = 0
  let total = 0

  const checks = [
    { label: 'Nom', ok: !!product.name && product.name.length > 5 },
    { label: 'Description', ok: !!product.description && product.description.length > 50 },
    { label: 'Prix', ok: product.price > 0 },
    { label: 'Images', ok: !!product.image_urls && product.image_urls.length > 0 },
    { label: 'Catégorie', ok: !!product.category },
    { label: 'Marque', ok: !!product.brand },
    { label: 'SKU', ok: !!product.sku },
    { label: 'Source', ok: !!product.source_url },
  ]

  checks.forEach(c => { total++; if (c.ok) score++ })
  const percent = Math.round((score / total) * 100)

  const color = percent >= 80 ? 'text-emerald-600' : percent >= 50 ? 'text-amber-600' : 'text-red-600'
  const bgColor = percent >= 80 ? 'bg-emerald-500' : percent >= 50 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className={cn("text-3xl font-bold", color)}>{percent}%</span>
        <Badge variant="outline" className={color}>
          {percent >= 80 ? 'Complet' : percent >= 50 ? 'Partiel' : 'Incomplet'}
        </Badge>
      </div>
      <Progress value={percent} className="h-2" />
      <div className="grid grid-cols-2 gap-1.5">
        {checks.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            {c.ok ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
            )}
            <span className={c.ok ? 'text-muted-foreground' : 'text-foreground font-medium'}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Main component ---
export function ProductQuickPreviewModal({
  open, onOpenChange, product, onValidate, onDelete, onNavigateToProduct, isValidating
}: ProductQuickPreviewModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [extendedData, setExtendedData] = useState<{
    videos?: string[]
    reviews?: any
    extracted_reviews?: any[]
    variants?: any[]
    specifications?: Record<string, string>
  } | null>(null)
  const [loadingExtended, setLoadingExtended] = useState(false)
  const { toast } = useToast()

  // Reset on open
  useEffect(() => {
    if (open && product) {
      setActiveTab('overview')
      setSelectedImageIndex(0)
      setZoomedImage(null)
      setExtendedData(null)
      // Try to load extended data from imported_products
      loadExtendedData(product.id)
    }
  }, [open, product?.id])

  const loadExtendedData = async (productId: string) => {
    setLoadingExtended(true)
    try {
      const { data } = await supabase
        .from('imported_products')
        .select('metadata')
        .eq('id', productId)
        .maybeSingle()

      if (data) {
        const metadata = (data as any).metadata as any
        if (metadata) {
          setExtendedData({
            videos: metadata.videos || [],
            extracted_reviews: metadata.extracted_reviews || [],
            reviews: metadata.reviews || null,
            variants: metadata.variants || [],
            specifications: metadata.specifications || {},
          })
        }
      }
    } catch {
      // Not critical, just won't show extended data
    } finally {
      setLoadingExtended(false)
    }
  }

  if (!product) return null

  const images = product.image_urls || product.original_images || []
  const videos = extendedData?.videos || product.videos || []
  const reviews = extendedData?.extracted_reviews || product.extracted_reviews || []
  const specs = extendedData?.specifications || product.specifications || {}
  const variants = extendedData?.variants || product.variants || []
  const reviewStats = extendedData?.reviews || product.reviews

  const margin = product.price && product.cost_price
    ? Math.round(((product.price - product.cost_price) / product.price) * 100)
    : null

  const nextImage = () => setSelectedImageIndex(i => (i + 1) % images.length)
  const prevImage = () => setSelectedImageIndex(i => (i - 1 + images.length) % images.length)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: 'Copié !', description: 'Contenu copié dans le presse-papiers' })
  }

  // Filter only actual video URLs
  const actualVideos = videos.filter((v: string) =>
    typeof v === 'string' && (v.endsWith('.mp4') || v.includes('.m3u8') || v.includes('videopreview') || v.includes('productVideo'))
  )

  const specsEntries = Object.entries(specs).filter(([key]) =>
    !key.startsWith('Détail') && key !== 'ASIN' && !key.includes('retour')
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn(
          "max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-0",
          "border-border/50 bg-background/95 backdrop-blur-xl",
          "shadow-2xl shadow-primary/5"
        )}>
          {/* ── Header ── */}
          <div className="relative bg-gradient-to-b from-primary/8 via-primary/3 to-transparent">
            <DialogHeader className="p-5 pb-3">
              <div className="flex items-start gap-3">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-lg"
                >
                  <Eye className="h-5 w-5" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-base font-semibold leading-tight line-clamp-1">
                    {product.name}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                    {product.source_platform && (
                      <Badge variant="secondary" className="text-[10px] capitalize h-5">
                        <Globe className="h-3 w-3 mr-1" />
                        {product.source_platform}
                      </Badge>
                    )}
                    {product.sku && (
                      <span className="font-mono text-[10px]">SKU: {product.sku}</span>
                    )}
                    {product.created_at && (
                      <span className="text-[10px]">
                        <Clock className="h-3 w-3 inline mr-0.5" />
                        {new Date(product.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </DialogDescription>
                </div>
                {product.status && (
                  <Badge
                    variant={product.status === 'active' ? 'default' : 'secondary'}
                    className={cn(
                      "shrink-0",
                      product.status === 'draft' && "bg-amber-500/10 text-amber-600 border-amber-500/30"
                    )}
                  >
                    {product.status === 'draft' ? '🔶 Brouillon' : product.status === 'active' ? '✅ Actif' : product.status}
                  </Badge>
                )}
              </div>
            </DialogHeader>
            <div className="absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* ── Tabs ── */}
          <div className="px-5 pt-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-9 bg-muted/50">
                <TabsTrigger value="overview" className="text-xs gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  Aperçu
                </TabsTrigger>
                <TabsTrigger value="media" className="text-xs gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Médias
                  {(images.length + actualVideos.length) > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">
                      {images.length + actualVideos.length}
                    </Badge>
                  )}
                </TabsTrigger>
                {reviews.length > 0 && (
                  <TabsTrigger value="reviews" className="text-xs gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Avis
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">{reviews.length}</Badge>
                  </TabsTrigger>
                )}
                {specsEntries.length > 0 && (
                  <TabsTrigger value="specs" className="text-xs gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    Spécifications
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>

          {/* ── Content ── */}
          <ScrollArea className="flex-1">
            <div className="px-5 py-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                {/* === OVERVIEW === */}
                <TabsContent value="overview" className="mt-0 space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                    {/* Left: Image + info */}
                    <div className="lg:col-span-3 space-y-4">
                      {/* Main image */}
                      {images.length > 0 && (
                        <div className="relative rounded-xl overflow-hidden border border-border/50 bg-muted/20 aspect-[4/3]">
                          <AnimatePresence mode="wait">
                            <motion.img
                              key={selectedImageIndex}
                              src={images[selectedImageIndex]}
                              alt={product.name}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="w-full h-full object-contain"
                            />
                          </AnimatePresence>
                          {images.length > 1 && (
                            <>
                              <button
                                onClick={prevImage}
                                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button
                                onClick={nextImage}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] font-medium border border-border/50">
                                {selectedImageIndex + 1} / {images.length}
                              </div>
                            </>
                          )}
                          <button
                            onClick={() => setZoomedImage(images[selectedImageIndex])}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors"
                          >
                            <ZoomIn className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Thumbnails */}
                      {images.length > 1 && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                          {images.slice(0, 8).map((img, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedImageIndex(i)}
                              className={cn(
                                "w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all",
                                i === selectedImageIndex
                                  ? "border-primary shadow-md shadow-primary/20"
                                  : "border-border/40 opacity-60 hover:opacity-100"
                              )}
                            >
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                          {images.length > 8 && (
                            <button
                              onClick={() => setActiveTab('media')}
                              className="w-14 h-14 rounded-lg border-2 border-dashed border-border/40 flex items-center justify-center text-xs text-muted-foreground hover:border-primary/50 transition-colors flex-shrink-0"
                            >
                              +{images.length - 8}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      {product.description && product.description.length > 10 && (
                        <Section icon={FileText} title="Description">
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6">
                            {product.description}
                          </p>
                        </Section>
                      )}
                    </div>

                    {/* Right: Sidebar */}
                    <div className="lg:col-span-2 space-y-4">
                      {/* Pricing card */}
                      <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <DollarSign className="h-4 w-4 text-primary" />
                          Tarification
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs text-muted-foreground">Prix de vente</span>
                            <span className="text-xl font-bold">{product.price?.toFixed(2) || '0.00'}€</span>
                          </div>
                          {product.cost_price != null && product.cost_price > 0 && (
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs text-muted-foreground">Prix coût</span>
                              <span className="text-sm font-medium text-muted-foreground">{product.cost_price.toFixed(2)}€</span>
                            </div>
                          )}
                          {margin !== null && margin > 0 && (
                            <div className="flex justify-between items-center pt-1 border-t border-border/30">
                              <span className="text-xs text-muted-foreground">Marge</span>
                              <Badge className={cn(
                                margin >= 30 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" :
                                margin >= 15 ? "bg-amber-500/10 text-amber-600 border-amber-500/30" :
                                "bg-red-500/10 text-red-600 border-red-500/30"
                              )} variant="outline">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {margin}%
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reviews summary */}
                      {reviewStats && reviewStats.rating && (
                        <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <Star className="h-4 w-4 text-amber-500" />
                            Avis clients
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">{reviewStats.rating.toFixed?.(1) || reviewStats.rating}</span>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, s) => (
                                <Star key={s} className={cn("h-4 w-4", s < Math.round(reviewStats.rating || 0) ? "fill-amber-500 text-amber-500" : "text-muted-foreground/20")} />
                              ))}
                            </div>
                          </div>
                          {reviews.length > 0 && (
                            <button onClick={() => setActiveTab('reviews')} className="text-xs text-primary hover:underline">
                              Voir les {reviews.length} avis →
                            </button>
                          )}
                        </div>
                      )}

                      {/* Health score */}
                      <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Score de santé
                        </div>
                        <HealthScore product={product} />
                      </div>

                      {/* Metadata */}
                      <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                          <Tag className="h-4 w-4 text-primary" />
                          Détails
                        </div>
                        <div className="space-y-1.5 text-xs">
                          {product.brand && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Marque</span>
                              <span className="font-medium">{product.brand}</span>
                            </div>
                          )}
                          {product.category && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Catégorie</span>
                              <span className="font-medium">{product.category}</span>
                            </div>
                          )}
                          {product.sku && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">SKU</span>
                              <button onClick={() => copyToClipboard(product.sku!)} className="flex items-center gap-1 font-mono text-[10px] hover:text-primary transition-colors">
                                {product.sku}
                                <Clipboard className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          {variants.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Variantes</span>
                              <Badge variant="secondary" className="text-[10px] h-4">{variants.length}</Badge>
                            </div>
                          )}
                          {images.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Images</span>
                              <span className="font-medium">{images.length}</span>
                            </div>
                          )}
                          {actualVideos.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Vidéos</span>
                              <span className="font-medium">{actualVideos.length}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Variants */}
                  {variants.length > 0 && (
                    <>
                      <Separator className="bg-border/30" />
                      <Section icon={Layers} title="Variantes" badge={<Badge variant="secondary" className="text-xs">{variants.length}</Badge>}>
                        <div className="flex flex-wrap gap-1.5">
                          {variants.slice(0, 12).map((v: any, i: number) => (
                            <Badge key={i} variant="outline" className="bg-background/60 text-xs">
                              {v.name || v.title || `Variante ${i + 1}`}
                              {v.price > 0 && <span className="ml-1 text-muted-foreground">({v.price}€)</span>}
                            </Badge>
                          ))}
                          {variants.length > 12 && (
                            <Badge variant="outline" className="text-muted-foreground text-xs">+{variants.length - 12}</Badge>
                          )}
                        </div>
                      </Section>
                    </>
                  )}
                </TabsContent>

                {/* === MEDIA === */}
                <TabsContent value="media" className="mt-0 space-y-5">
                  {/* Images grid */}
                  {images.length > 0 && (
                    <Section icon={ImageIcon} title="Images" badge={<Badge variant="secondary" className="text-xs">{images.length}</Badge>}>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                        {images.map((img, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            className="relative aspect-square rounded-xl overflow-hidden border-2 border-border/40 hover:border-primary/50 transition-all cursor-pointer group"
                            onClick={() => setZoomedImage(img)}
                          >
                            <img src={img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {idx === 0 && (
                              <Badge className="absolute bottom-1 left-1 text-[10px] bg-primary/90 backdrop-blur-sm pointer-events-none">
                                Principale
                              </Badge>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Videos */}
                  {actualVideos.length > 0 && (
                    <>
                      <Separator className="bg-border/30" />
                      <Section icon={Film} title="Vidéos" badge={<Badge variant="secondary" className="text-xs">{actualVideos.length}</Badge>}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {actualVideos.map((video: string, i: number) => (
                            <div key={i} className="relative rounded-xl overflow-hidden border border-border/50 bg-muted/30">
                              {video.includes('.m3u8') ? (
                                <div className="flex items-center gap-3 p-4">
                                  <div className="p-2.5 rounded-lg bg-primary/10">
                                    <Play className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">Vidéo HLS #{i + 1}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{video}</p>
                                  </div>
                                </div>
                              ) : (
                                <video
                                  src={video}
                                  controls
                                  preload="metadata"
                                  className="w-full aspect-video object-cover rounded-xl"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </Section>
                    </>
                  )}

                  {images.length === 0 && actualVideos.length === 0 && (
                    <div className="text-center py-16">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Aucun média disponible</p>
                    </div>
                  )}
                </TabsContent>

                {/* === REVIEWS === */}
                <TabsContent value="reviews" className="mt-0 space-y-4">
                  {/* Rating summary */}
                  {reviewStats && reviewStats.rating && (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{reviewStats.rating.toFixed?.(1) || reviewStats.rating}</div>
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, s) => (
                            <Star key={s} className={cn("h-4 w-4", s < Math.round(reviewStats.rating || 0) ? "fill-amber-500 text-amber-500" : "text-muted-foreground/20")} />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{reviews.length} avis</p>
                      </div>
                    </div>
                  )}

                  {/* Reviews list */}
                  <div className="space-y-2.5">
                    {reviews.slice(0, 20).map((review: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="p-3.5 rounded-xl border border-border/40 bg-background/60 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {(review.customer_name || 'Client').replace(/&#39;/g, "'")}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, s) => (
                              <Star key={s} className={cn("h-3 w-3", s < (review.rating || 0) ? "fill-amber-500 text-amber-500" : "text-muted-foreground/20")} />
                            ))}
                          </div>
                        </div>
                        {review.title && (
                          <p className="text-xs font-semibold text-foreground/90">
                            {review.title.replace(/&#39;/g, "'").replace(/&#34;/g, '"')}
                          </p>
                        )}
                        {review.comment && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {review.comment.replace(/&#39;/g, "'").replace(/&#34;/g, '"')}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                          {review.verified_purchase && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-green-500/30 text-green-600">
                              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                              Vérifié
                            </Badge>
                          )}
                          {review.review_date && (
                            <span>{new Date(review.review_date).toLocaleDateString('fr-FR')}</span>
                          )}
                          {review.helpful_count > 0 && (
                            <span className="flex items-center gap-0.5">
                              <ThumbsUp className="h-2.5 w-2.5" />
                              {review.helpful_count}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {reviews.length > 20 && (
                      <p className="text-xs text-center text-muted-foreground py-2">
                        +{reviews.length - 20} autres avis
                      </p>
                    )}
                  </div>
                </TabsContent>

                {/* === SPECIFICATIONS === */}
                <TabsContent value="specs" className="mt-0 space-y-4">
                  <Section icon={Layers} title="Spécifications techniques" badge={<Badge variant="secondary" className="text-xs">{specsEntries.length}</Badge>}>
                    <div className="rounded-xl border border-border/50 overflow-hidden">
                      {specsEntries.map(([key, value], i) => (
                        <div
                          key={key}
                          className={cn(
                            "flex items-start gap-4 px-4 py-2.5 text-sm",
                            i % 2 === 0 ? "bg-muted/20" : "bg-background"
                          )}
                        >
                          <span className="text-muted-foreground font-medium min-w-[140px] flex-shrink-0 text-xs">{key}</span>
                          <span className="text-foreground text-xs">
                            {String(value).replace(/&lrm;/g, '').replace(/&#39;/g, "'").replace(/&#34;/g, '"')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Section>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>

          {/* ── Footer ── */}
          <div className="border-t border-border/50 bg-muted/30 px-5 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {product.source_url && (
                <Button variant="outline" size="sm" onClick={() => window.open(product.source_url!, '_blank')} className="h-8 text-xs">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Source
                </Button>
              )}
              {onNavigateToProduct && (
                <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); onNavigateToProduct(product.id) }} className="h-8 text-xs">
                  <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                  Fiche produit
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">
                Fermer
              </Button>
              {onValidate && product.status === 'draft' && (
                <Button
                  size="sm"
                  onClick={() => onValidate(product.id)}
                  disabled={isValidating}
                  className="h-8 text-xs bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  Valider & Publier
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Zoom modal */}
      <AnimatePresence>
        {zoomedImage && (
          <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
            <DialogContent className="max-w-4xl p-2 bg-background/95 backdrop-blur-xl">
              <img src={zoomedImage} alt="Preview" className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  )
}
