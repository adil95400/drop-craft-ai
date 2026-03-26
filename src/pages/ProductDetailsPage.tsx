/**
 * Product Details Page — Shopify Admin Style v5.0
 * Two-column layout: Main content + Sidebar
 */
import { useState, useMemo } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductTranslations, ProductReviews } from '@/components/products'
import { ProductImageManager } from '@/components/products/ProductImageManager'
import { ProductVariantEditor, type ProductVariantData, type VariantOption } from '@/components/products/ProductVariantEditor'
import { ProductVideoPlayer } from '@/components/products/ProductVideoPlayer'
import { ProductSuppliersPanel } from '@/components/products/ProductSuppliersPanel'
import { ProductAuditBlock } from '@/components/products/ProductAuditBlock'
import { ProductPerformanceMetrics } from '@/components/products/ProductPerformanceMetrics'
import { OptimizationHistory } from '@/components/products/OptimizationHistory'
import { MultiChannelReadiness } from '@/components/products/MultiChannelReadiness'
import { ProductImageEditor } from '@/components/products/ProductImageEditor'
import { ProductMediaQualityPanel } from '@/components/products/ProductMediaQualityPanel'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, Package, Languages, MessageSquare, Images, Target, 
  TrendingUp, History, Globe, Edit, Copy, Sparkles,
  Tag, Box, BarChart3, Layers, ShoppingCart, Store,
  RefreshCw, Trash2, MoreVertical, CheckCircle2, AlertTriangle, 
  Share2, Download, Eye, Clock, FileText, Video, Truck,
  Lightbulb, AlertCircle, ImagePlus, DollarSign, FileSearch,
  Loader2, Palette, ChevronDown, Search, ExternalLink,
  Star, Zap, Shield, Settings, Hash, Weight, Barcode
} from 'lucide-react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useProduct } from '@/hooks/useUnifiedProducts'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useApiProducts, useApiAI } from '@/hooks/api'
import { useApiSync } from '@/hooks/api'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

// --- Sub-components ---

function StatusDot({ status }: { status: string }) {
  const color = ['active', 'published'].includes(status) 
    ? 'bg-emerald-500' 
    : status === 'draft' 
      ? 'bg-amber-500' 
      : 'bg-muted-foreground'
  return <span className={cn("h-2.5 w-2.5 rounded-full inline-block", color)} />
}

function SectionCard({ title, description, children, actions, className }: { 
  title: string; description?: string; children: React.ReactNode; actions?: React.ReactNode; className?: string 
}) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {description && <CardDescription className="text-xs mt-0.5">{description}</CardDescription>}
          </div>
          {actions}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  )
}

export default function ProductDetailsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const { data: product, isLoading, refetch } = useProduct(id || '')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const { user } = useAuth()

  const { updateProduct, deleteProduct, createProduct } = useApiProducts()
  const { generateContent, optimizeSeo, isGenerating, isOptimizingSeo } = useApiAI()
  const { triggerSync } = useApiSync()

  const shouldOpenEdit = location.state?.openEdit || location.pathname.endsWith('/edit')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(shouldOpenEdit)
  const [activeTab, setActiveTab] = useState('overview')
  const [aiGeneratingField, setAiGeneratingField] = useState<string | null>(null)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [editingImageUrl, setEditingImageUrl] = useState('')
  const [isInlineEditing, setIsInlineEditing] = useState(false)

  // Inline edit state
  const [editForm, setEditForm] = useState({
    name: '', description: '', price: 0, cost_price: 0,
    stock_quantity: 0, sku: '', category: '', status: 'draft',
  })

  const handleAIGenerate = async (field: 'title' | 'description' | 'category') => {
    setAiGeneratingField(field)
    try {
      const prompts: Record<string, { system: string; user: string }> = {
        title: {
          system: 'Expert SEO e-commerce. Génère un titre produit optimisé, accrocheur et concis (max 80 chars). Retourne UNIQUEMENT le titre, sans guillemets ni explication.',
          user: `Produit actuel: "${editForm.name}"\nCatégorie: ${editForm.category || 'Non définie'}\nDescription: ${editForm.description?.slice(0, 200) || 'Aucune'}`
        },
        description: {
          system: 'Expert copywriting e-commerce. Génère une description produit optimisée SEO, persuasive, avec des bullet points. Max 500 chars. Retourne UNIQUEMENT la description.',
          user: `Produit: "${editForm.name}"\nCatégorie: ${editForm.category || 'Non définie'}\nDescription actuelle: ${editForm.description?.slice(0, 200) || 'Aucune'}\nPrix: ${editForm.price}€`
        },
        category: {
          system: 'Expert catégorisation e-commerce. Retourne UNIQUEMENT le nom de la catégorie la plus pertinente (1-3 mots, en français). Pas d\'explication.',
          user: `Produit: "${editForm.name}"\nDescription: ${editForm.description?.slice(0, 200) || 'Aucune'}`
        }
      }
      const { system, user: userPrompt } = prompts[field]
      const { data, error } = await supabase.functions.invoke('ai-product-edit-assist', {
        body: { systemPrompt: system, userPrompt, field }
      })
      if (error) throw error
      const result = data?.result?.trim()
      if (result) {
        if (field === 'title') setEditForm(prev => ({ ...prev, name: result }))
        else if (field === 'description') setEditForm(prev => ({ ...prev, description: result }))
        else if (field === 'category') setEditForm(prev => ({ ...prev, category: result }))
        toast.success(`${field === 'title' ? 'Titre' : field === 'description' ? 'Description' : 'Catégorie'} généré(e) par l'IA`)
      }
    } catch (e) {
      console.error('AI generation error:', e)
      toast.error('Erreur lors de la génération IA')
    } finally {
      setAiGeneratingField(null)
    }
  }

  const handleOptimizeAI = () => {
    if (!id) return
    generateContent.mutate({ productId: id, contentTypes: ['title', 'description', 'seo'] })
  }

  const handleOptimizeSEO = () => {
    if (!id) return
    optimizeSeo.mutate({ productIds: [id] })
  }

  const openEditModal = () => {
    if (!product) return
    setEditForm({
      name: product.name || '', description: product.description || '',
      price: product.price || 0, cost_price: product.cost_price || 0,
      stock_quantity: product.stock_quantity || 0, sku: product.sku || '',
      category: product.category || '', status: product.status || 'draft',
    })
    setShowEditModal(true)
  }

  const healthScore = useMemo(() => {
    if (!product) return 0
    let score = 0
    if (product.name && product.name.length >= 10) score += 20
    if (product.description && product.description.length >= 50) score += 20
    if (product.image_url || product.images?.length > 0) score += 20
    if (product.sku) score += 15
    if (product.category) score += 15
    if (product.price > 0) score += 10
    return score
  }, [product])

  const handleCopySku = () => {
    if (product?.sku) {
      navigator.clipboard.writeText(product.sku)
      toast.success('SKU copié !')
    }
  }

  const handlePublish = () => {
    if (!id) return
    triggerSync.mutate({ syncType: 'products', options: { productIds: [id] } })
  }

  const handleSaveEdit = () => {
    if (!id) return
    updateProduct.mutate({
      id,
      updates: {
        title: editForm.name, description: editForm.description,
        salePrice: editForm.price, costPrice: editForm.cost_price,
        stock: editForm.stock_quantity, status: editForm.status,
      },
    }, {
      onSuccess: () => { setShowEditModal(false); refetch() },
    })
  }

  const handleDuplicate = async () => {
    if (!product || !user) return
    try {
      const { data, error } = await supabase.from('products').insert({
        user_id: user.id,
        title: `${(product as any).title || product.name} (copie)`,
        description: product.description, sku: product.sku ? `${product.sku}-COPY` : null,
        price: product.price, cost_price: product.cost_price,
        stock_quantity: product.stock_quantity, category: product.category,
        images: product.images as any, image_url: product.image_url,
        status: 'draft', tags: product.tags,
      }).select('id').single()
      if (error) throw error
      toast.success('Produit dupliqué')
      if (data?.id) navigate(`/products/${data.id}/edit`)
    } catch { toast.error('Erreur lors de la duplication') }
  }

  const handleExport = () => {
    if (!product) return
    const blob = new Blob([JSON.stringify(product, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `product-${product.sku || product.id}.json`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Produit exporté')
  }

  const handleShare = async () => {
    if (!product) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/products/${product.id}`)
      toast.success('Lien copié')
    } catch { toast.error('Impossible de copier le lien') }
  }

  const handleDelete = () => { if (id) setShowDeleteConfirm(true) }
  const confirmDelete = () => {
    if (!id) return
    deleteProduct.mutate(id, { onSuccess: () => { toast.success('Produit supprimé'); navigate('/products') } })
    setShowDeleteConfirm(false)
  }

  // --- Loading / Not found ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground text-sm">Chargement du produit...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Produit introuvable</h2>
        <p className="text-sm text-muted-foreground">Ce produit n'existe pas ou a été supprimé.</p>
        <Button variant="outline" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour au catalogue
        </Button>
      </div>
    )
  }

  const images = product.images?.length ? product.images : (product.image_url ? [product.image_url] : [])
  const mainImage = images[selectedImageIndex] || '/placeholder.svg'
  const margin = product.cost_price > 0 && product.price > 0 
    ? ((product.price - product.cost_price) / product.price * 100) : null

  const statusLabel = ['active', 'published'].includes(product.status) ? 'Actif' 
    : product.status === 'draft' ? 'Brouillon' 
    : product.status === 'archived' ? 'Archivé' : product.status

  return (
    <>
      {/* ===== TOP BAR ===== */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/products')} className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Produits
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <h1 className="text-lg font-semibold truncate max-w-md">{product.name}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={openEditModal} className="gap-1.5">
            <Edit className="h-3.5 w-3.5" /> Modifier
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={triggerSync.isPending} className="gap-1.5">
            {triggerSync.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Store className="h-3.5 w-3.5" />}
            Publier
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleDuplicate}><Copy className="h-4 w-4 mr-2" />Dupliquer</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}><Download className="h-4 w-4 mr-2" />Exporter JSON</DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}><Share2 className="h-4 w-4 mr-2" />Copier le lien</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Supprimer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ===== MAIN LAYOUT: 2 COLUMNS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        
        {/* ===== LEFT COLUMN ===== */}
        <div className="space-y-6">

          {/* MEDIA SECTION */}
          <SectionCard 
            title="Médias" 
            description={`${images.length} image${images.length !== 1 ? 's' : ''}`}
            actions={
              <div className="flex gap-1.5">
                {product?.images?.[0] && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => {
                    setEditingImageUrl(product.images[0]); setShowImageEditor(true)
                  }}>
                    <Palette className="h-3 w-3" /> Éditeur
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setActiveTab('gallery')}>
                  <ImagePlus className="h-3 w-3" /> Gérer
                </Button>
              </div>
            }
          >
            {images.length > 0 ? (
              <div className="grid grid-cols-[1fr_auto] gap-3">
                {/* Main image */}
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border">
                  <img 
                    src={mainImage} alt={product.name} 
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                  />
                  <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur text-foreground text-[10px] h-5">
                    {selectedImageIndex + 1}/{images.length}
                  </Badge>
                </div>
                {/* Thumbnails column */}
                {images.length > 1 && (
                  <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
                    {images.slice(0, 8).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={cn(
                          "w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0",
                          idx === selectedImageIndex 
                            ? "border-primary ring-1 ring-primary/30" 
                            : "border-border hover:border-muted-foreground/40"
                        )}
                      >
                        <img src={img as string} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                    {images.length > 8 && (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-xs font-medium">
                        +{images.length - 8}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video rounded-xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-3 bg-muted/30">
                <Images className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Aucune image</p>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('gallery')}>
                  <ImagePlus className="h-3.5 w-3.5 mr-1.5" /> Ajouter des images
                </Button>
              </div>
            )}
          </SectionCard>

          {/* TITLE & DESCRIPTION */}
          <SectionCard 
            title="Titre et description"
            actions={
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary" onClick={handleOptimizeAI} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Optimiser IA
              </Button>
            }
          >
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Titre</Label>
                <p className="text-sm font-medium">{product.name || <span className="text-muted-foreground italic">Non défini</span>}</p>
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Description</Label>
                {product.description ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{product.description}</p>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">Aucune description — cela réduit le SEO et les conversions.</p>
                    <Button variant="outline" size="sm" className="ml-auto h-6 text-[10px] gap-1" onClick={handleOptimizeAI} disabled={isGenerating}>
                      <Sparkles className="h-2.5 w-2.5" /> Générer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* PRICING */}
          <SectionCard title="Tarification">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Prix de vente</Label>
                <p className="text-xl font-bold tabular-nums mt-1">
                  {product.price > 0 ? `${product.price.toFixed(2)} €` : <span className="text-destructive text-sm">Non défini</span>}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Coût</Label>
                <p className="text-xl font-semibold tabular-nums mt-1 text-muted-foreground">
                  {product.cost_price > 0 ? `${product.cost_price.toFixed(2)} €` : '—'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Marge</Label>
                <p className={cn("text-xl font-bold tabular-nums mt-1", margin && margin >= 30 ? "text-emerald-600" : margin ? "text-amber-600" : "")}>
                  {margin ? `${margin.toFixed(0)}%` : '—'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Profit / unité</Label>
                <p className="text-xl font-semibold tabular-nums mt-1">
                  {product.cost_price > 0 && product.price > 0 ? `${(product.price - product.cost_price).toFixed(2)} €` : '—'}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* INVENTORY */}
          <SectionCard title="Inventaire">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">SKU</Label>
                <div className="flex items-center gap-1.5 mt-1">
                  <p className="text-sm font-mono">{product.sku || '—'}</p>
                  {product.sku && (
                    <button onClick={handleCopySku} className="text-muted-foreground hover:text-foreground">
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">En stock</Label>
                <p className={cn("text-lg font-bold tabular-nums mt-1", product.stock_quantity <= 0 && "text-destructive")}>
                  {product.stock_quantity ?? 0}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Code-barres</Label>
                <p className="text-sm font-mono mt-1">{(product as any).barcode || '—'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Poids</Label>
                <p className="text-sm mt-1">{(product as any).weight ? `${(product as any).weight} g` : '—'}</p>
              </div>
            </div>
          </SectionCard>

          {/* VARIANTS */}
          {(product.variants?.length > 0) && (
            <SectionCard title="Variantes" description={`${product.variants.length} variante${product.variants.length > 1 ? 's' : ''}`}>
              <div className="space-y-2">
                {product.variants.slice(0, 5).map((v: any, i: number) => (
                  <div key={v.id || i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                    <div className="flex items-center gap-3">
                      {v.image_url && <img src={v.image_url} className="w-10 h-10 rounded-md object-cover" />}
                      <div>
                        <p className="text-sm font-medium">
                          {v.attributes ? Object.values(v.attributes).join(' / ') : `Variante ${i + 1}`}
                        </p>
                        {v.sku && <p className="text-xs text-muted-foreground font-mono">{v.sku}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="tabular-nums font-medium">{v.price ? `${v.price.toFixed(2)} €` : '—'}</span>
                      <span className={cn("tabular-nums", (v.stock_quantity ?? 0) <= 0 && "text-destructive")}>
                        {v.stock_quantity ?? 0} en stock
                      </span>
                    </div>
                  </div>
                ))}
                {product.variants.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveTab('variants')}>
                    Voir toutes les variantes ({product.variants.length})
                  </Button>
                )}
              </div>
            </SectionCard>
          )}

          {/* SEO */}
          <SectionCard 
            title="Référencement SEO" 
            actions={
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary" onClick={handleOptimizeSEO} disabled={isOptimizingSeo}>
                {isOptimizingSeo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                Optimiser SEO
              </Button>
            }
          >
            <div className="space-y-3">
              {/* Google preview */}
              <div className="p-4 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground mb-2">Aperçu Google</p>
                <p className="text-blue-600 text-sm font-medium hover:underline cursor-default truncate">
                  {product.seo_title || product.name || 'Titre du produit'}
                </p>
                <p className="text-emerald-700 text-xs truncate mt-0.5">
                  {window.location.origin}/products/{product.id}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {product.seo_description || product.description?.slice(0, 160) || 'Aucune méta-description définie.'}
                </p>
              </div>
              {!product.seo_title && !product.seo_description && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <p className="text-xs text-muted-foreground">SEO non configuré — optimisez pour améliorer le référencement.</p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* ADVANCED TABS */}
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex flex-wrap w-full gap-1 h-auto p-1 bg-muted/50">
                  <TabsTrigger value="overview" className="gap-1.5 text-xs py-1.5">
                    <Target className="h-3.5 w-3.5" /> Audit
                  </TabsTrigger>
                  <TabsTrigger value="variants" className="gap-1.5 text-xs py-1.5">
                    <Layers className="h-3.5 w-3.5" /> Variantes
                  </TabsTrigger>
                  <TabsTrigger value="suppliers" className="gap-1.5 text-xs py-1.5">
                    <Truck className="h-3.5 w-3.5" /> Fournisseurs
                  </TabsTrigger>
                  <TabsTrigger value="gallery" className="gap-1.5 text-xs py-1.5">
                    <Images className="h-3.5 w-3.5" /> Images
                  </TabsTrigger>
                  <TabsTrigger value="media-quality" className="gap-1.5 text-xs py-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Qualité Média
                  </TabsTrigger>
                  <TabsTrigger value="videos" className="gap-1.5 text-xs py-1.5">
                    <Video className="h-3.5 w-3.5" /> Vidéos
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="gap-1.5 text-xs py-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Avis
                  </TabsTrigger>
                  <TabsTrigger value="translations" className="gap-1.5 text-xs py-1.5">
                    <Languages className="h-3.5 w-3.5" /> Traductions
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="gap-1.5 text-xs py-1.5">
                    <TrendingUp className="h-3.5 w-3.5" /> Performance
                  </TabsTrigger>
                  <TabsTrigger value="channels" className="gap-1.5 text-xs py-1.5">
                    <Globe className="h-3.5 w-3.5" /> Multi-canal
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-1.5 text-xs py-1.5">
                    <History className="h-3.5 w-3.5" /> Historique
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                  <TabsContent value="overview"><ProductAuditBlock product={product} onOptimize={() => refetch()} /></TabsContent>
                  <TabsContent value="variants">
                    <ProductVariantEditor
                      variants={(product.variants || []).map((v: any, i: number) => ({
                        id: v.id || `v-${i}`, sku: v.sku || '', price: v.price ?? null,
                        cost_price: v.cost_price ?? null, stock_quantity: v.stock_quantity ?? 0,
                        weight: v.weight ?? null, barcode: v.barcode ?? null,
                        is_active: v.is_active !== false, attributes: v.attributes || {}, image_url: v.image_url,
                      }))}
                      options={(() => {
                        const optMap: Record<string, Set<string>> = {}
                        ;(product.variants || []).forEach((v: any) => {
                          if (v.attributes) Object.entries(v.attributes).forEach(([k, val]) => {
                            if (!optMap[k]) optMap[k] = new Set(); optMap[k].add(val as string)
                          })
                        })
                        return Object.entries(optMap).map(([name, vals]) => ({ name, values: Array.from(vals) }))
                      })()}
                      basePrice={product.price || 0} baseSku={product.sku}
                      onVariantsChange={(v) => { updateProduct.mutate({ id: product.id, updates: { variants: v } as any }, { onSuccess: () => refetch() }) }}
                      onOptionsChange={() => refetch()}
                    />
                  </TabsContent>
                  <TabsContent value="suppliers">
                    <ProductSuppliersPanel productId={product.id} productPrice={product.price || 0} productTitle={product.name || (product as any).title}
                      variantKeys={(product.variants || []).map((v: any) => v.attributes ? Object.values(v.attributes).join(' / ') : null).filter(Boolean) as string[]} />
                  </TabsContent>
                  <TabsContent value="gallery"><ProductImageManager productId={product.id} sourceUrl={product.source_url || (product as any).url} /></TabsContent>
                  <TabsContent value="media-quality"><ProductMediaQualityPanel productId={product.id} onImagesUpdated={() => refetch()} /></TabsContent>
                  <TabsContent value="videos">
                    <ProductVideoPlayer videos={product.videos || []} onVideosChange={(v) => { updateProduct.mutate({ id: product.id, updates: { videos: v } as any }, { onSuccess: () => refetch() }) }} />
                  </TabsContent>
                  <TabsContent value="reviews"><ProductReviews productId={product.id} sourceUrl={product.source_url || (product as any).url} /></TabsContent>
                  <TabsContent value="translations"><ProductTranslations productId={product.id} /></TabsContent>
                  <TabsContent value="performance"><ProductPerformanceMetrics productId={product.id} sourceTable={product.source === 'products' ? 'products' : 'imported_products'} /></TabsContent>
                  <TabsContent value="channels"><MultiChannelReadiness product={product} /></TabsContent>
                  <TabsContent value="history"><OptimizationHistory productId={product.id} sourceTable={product.source === 'products' ? 'products' : 'imported_products'} /></TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* ===== RIGHT SIDEBAR ===== */}
        <div className="space-y-4">

          {/* STATUS */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Statut</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="flex items-center gap-2.5">
                <StatusDot status={product.status} />
                <span className="text-sm font-medium">{statusLabel}</span>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Canaux de vente</span>
                  <Badge variant="secondary" className="text-[10px]">0 actifs</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Marchés</span>
                  <Badge variant="secondary" className="text-[10px]">International</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HEALTH SCORE */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Score qualité
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center mb-3">
                <p className={cn("text-4xl font-black tabular-nums", 
                  healthScore >= 80 ? "text-emerald-600" : healthScore >= 50 ? "text-amber-500" : "text-destructive"
                )}>{healthScore}</p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </div>
              <Progress value={healthScore} className="h-2 mb-3" />
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Titre', ok: product.name?.length >= 10 },
                  { label: 'Description', ok: product.description?.length >= 50 },
                  { label: 'Images', ok: images.length > 0 },
                  { label: 'SKU', ok: !!product.sku },
                  { label: 'Catégorie', ok: !!product.category },
                  { label: 'Prix', ok: product.price > 0 },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{item.label}</span>
                    {item.ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ORGANIZATION */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Organisation</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Catégorie</Label>
                <p className="text-sm mt-0.5">{product.category || <span className="text-muted-foreground italic">Non assignée</span>}</p>
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground">Type de produit</Label>
                <p className="text-sm mt-0.5">{(product as any).product_type || <span className="text-muted-foreground italic">—</span>}</p>
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground">Fournisseur</Label>
                <p className="text-sm mt-0.5">{(product as any).vendor || (product as any).supplier_name || <span className="text-muted-foreground italic">—</span>}</p>
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground">Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {product.tags?.length > 0 ? product.tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-[10px] h-5">{tag}</Badge>
                  )) : (
                    <p className="text-xs text-muted-foreground italic">Aucun tag</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QUICK METRICS */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Métriques
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Vues', value: product.view_count || 0, icon: Eye },
                  { label: 'Ventes', value: (product as any).sales_count || 0, icon: ShoppingCart },
                  { label: 'Images', value: images.length, icon: Images },
                  { label: 'Variantes', value: product.variants?.length || 0, icon: Layers },
                ].map(m => (
                  <div key={m.label} className="p-2.5 rounded-lg bg-muted/40 text-center">
                    <m.icon className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold tabular-nums">{m.value}</p>
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* DATES */}
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Créé le</span>
                <span>{product.created_at ? new Date(product.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Modifié le</span>
                <span>{product.updated_at ? new Date(product.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
              </div>
            </CardContent>
          </Card>

          {/* AI SUGGESTIONS */}
          {healthScore < 100 && (
            <Card className="shadow-sm border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" /> Suggestions IA
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {!product.description && (
                  <button onClick={handleOptimizeAI} className="w-full text-left p-2.5 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors">
                    <p className="text-xs font-medium">Ajouter une description</p>
                    <p className="text-[10px] text-muted-foreground">+20 pts • Améliore le SEO</p>
                  </button>
                )}
                {images.length === 0 && (
                  <button onClick={() => setActiveTab('gallery')} className="w-full text-left p-2.5 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors">
                    <p className="text-xs font-medium">Ajouter des images</p>
                    <p className="text-[10px] text-muted-foreground">+20 pts • 3x plus de conversions</p>
                  </button>
                )}
                {!product.seo_title && (
                  <button onClick={handleOptimizeSEO} className="w-full text-left p-2.5 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors">
                    <p className="text-xs font-medium">Optimiser le SEO</p>
                    <p className="text-[10px] text-muted-foreground">Meilleur référencement</p>
                  </button>
                )}
                {!product.category && (
                  <button onClick={openEditModal} className="w-full text-left p-2.5 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors">
                    <p className="text-xs font-medium">Assigner une catégorie</p>
                    <p className="text-[10px] text-muted-foreground">+15 pts • Organisation</p>
                  </button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ===== MODALS ===== */}
      <ConfirmDialog
        open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}
        title="Supprimer ce produit ?"
        description="Cette action est irréversible. Le produit sera définitivement supprimé."
        confirmText="Supprimer" variant="destructive" onConfirm={confirmDelete}
      />

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Edit className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">Modifier le produit</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Éditez les informations et utilisez l'IA pour optimiser</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-name" className="text-sm font-semibold">Nom du produit</Label>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-primary" disabled={aiGeneratingField === 'title'} onClick={() => handleAIGenerate('title')}>
                  {aiGeneratingField === 'title' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Générer IA
                </Button>
              </div>
              <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Machine à café Nespresso..." className="h-11" />
              <p className="text-xs text-muted-foreground">{editForm.name.length}/150 caractères</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-description" className="text-sm font-semibold">Description</Label>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-primary" disabled={aiGeneratingField === 'description'} onClick={() => handleAIGenerate('description')}>
                  {aiGeneratingField === 'description' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Rédiger IA
                </Button>
              </div>
              <Textarea id="edit-description" value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} rows={5} placeholder="Décrivez votre produit..." className="resize-y min-h-[100px]" />
              <p className="text-xs text-muted-foreground">{editForm.description.length}/2000 caractères</p>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-semibold mb-3">Tarification</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Prix de vente (€)</Label>
                  <Input type="number" step="0.01" min="0" value={editForm.price} onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} className="h-11 text-lg font-semibold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Prix d'achat (€)</Label>
                  <Input type="number" step="0.01" min="0" value={editForm.cost_price} onChange={(e) => setEditForm(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))} className="h-11" />
                </div>
              </div>
              {editForm.price > 0 && editForm.cost_price > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Marge estimée</span>
                  <span className={cn("font-bold", ((editForm.price - editForm.cost_price) / editForm.price * 100) >= 30 ? "text-emerald-600" : "text-destructive")}>
                    {((editForm.price - editForm.cost_price) / editForm.price * 100).toFixed(1)}% ({(editForm.price - editForm.cost_price).toFixed(2)}€)
                  </span>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-sm font-semibold mb-3">Organisation</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Stock</Label>
                  <Input type="number" min="0" value={editForm.stock_quantity} onChange={(e) => setEditForm(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))} className="h-11" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Catégorie</Label>
                    <Button variant="ghost" size="sm" className="h-5 text-[10px] gap-1 text-primary px-1.5" disabled={aiGeneratingField === 'category'} onClick={() => handleAIGenerate('category')}>
                      {aiGeneratingField === 'category' ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />} IA
                    </Button>
                  </div>
                  <Input value={editForm.category} onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))} placeholder="Ex: Électroménager" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Statut</Label>
                  <select value={editForm.status} onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="draft">Brouillon</option>
                    <option value="active">Actif</option>
                    <option value="paused">En pause</option>
                    <option value="archived">Archivé</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">SKU / Référence</Label>
              <Input value={editForm.sku} onChange={(e) => setEditForm(prev => ({ ...prev, sku: e.target.value }))} placeholder="Ex: NESP-PIXIE-BLUE" className="h-11 font-mono text-sm" />
            </div>
          </div>

          <DialogFooter className="border-t pt-4 gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Annuler</Button>
            <Button onClick={handleSaveEdit} disabled={updateProduct.isPending} className="min-w-[140px]">
              {updateProduct.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editingImageUrl && (
        <ProductImageEditor imageUrl={editingImageUrl} open={showImageEditor} onOpenChange={setShowImageEditor}
          onSave={(dataUrl) => {
            if (product && id) {
              const newImages = [...(product.images || [])]
              const idx = newImages.indexOf(editingImageUrl)
              if (idx >= 0) newImages[idx] = dataUrl
              updateProduct.mutate({ id, updates: { images: newImages } as any })
            }
          }}
        />
      )}
    </>
  )
}
