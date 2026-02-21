/**
 * Product Details Page - Premium Redesign v4.0
 * All buttons functional + AI Suggestions panel
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

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  ArrowLeft, Package, Languages, MessageSquare, Images, Target, 
  TrendingUp, History, Globe, Edit, Copy, Sparkles,
  Tag, Box, BarChart3, Layers, ShoppingCart, Store,
  RefreshCw, Trash2, MoreVertical, CheckCircle2, AlertTriangle, 
  Share2, Download, Eye, Clock, FileText, Video, Truck,
  Lightbulb, AlertCircle, ImagePlus, DollarSign, FileSearch,
  Loader2
} from 'lucide-react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useProduct } from '@/hooks/useUnifiedProducts'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useApiProducts, useApiAI } from '@/hooks/api'
import { useApiSync } from '@/hooks/api'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export default function ProductDetailsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const { data: product, isLoading, refetch } = useProduct(id || '')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const { user } = useAuth()

  // FastAPI hooks for mutations
  const { updateProduct, deleteProduct, createProduct } = useApiProducts()
  const { generateContent, optimizeSeo, isGenerating, isOptimizingSeo } = useApiAI()
  const { triggerSync } = useApiSync()

  // Auto-open edit modal when navigated with openEdit state or /edit path
  const shouldOpenEdit = location.state?.openEdit || location.pathname.endsWith('/edit')

  // UI state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(shouldOpenEdit)
  const [showDescriptionFull, setShowDescriptionFull] = useState(false)
  const [activeTab, setActiveTab] = useState('audit')

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: 0,
    cost_price: 0,
    stock_quantity: 0,
    sku: '',
    category: '',
    status: 'draft',
  })

  // Action handlers (must be defined before useMemo that references them)
  const handleOptimizeAI = () => {
    if (!id) return
    generateContent.mutate({
      productId: id,
      contentTypes: ['title', 'description', 'seo'],
    })
  }

  const handleOptimizeSEO = () => {
    if (!id) return
    optimizeSeo.mutate({ productIds: [id] })
  }

  const openEditModal = () => {
    if (!product) return
    setEditForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      cost_price: product.cost_price || 0,
      stock_quantity: product.stock_quantity || 0,
      sku: product.sku || '',
      category: product.category || '',
      status: product.status || 'draft',
    })
    setShowEditModal(true)
  }

  // Calculate health score
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

  // AI Suggestions based on product data
  const suggestions = useMemo(() => {
    if (!product) return []
    const items: { icon: any; title: string; description: string; action: string; priority: 'high' | 'medium' | 'low'; onClick: () => void }[] = []

    if (!product.images?.length && !product.image_url) {
      items.push({
        icon: ImagePlus,
        title: 'Ajouter des images produit',
        description: 'Les produits avec images ont 3x plus de conversions. Ajoutez au moins 3 photos de qualité.',
        action: 'Gérer les images',
        priority: 'high',
        onClick: () => setActiveTab('gallery'),
      })
    }

    if (!product.price || product.price <= 0) {
      items.push({
        icon: DollarSign,
        title: 'Définir un prix de vente',
        description: 'Ce produit n\'a pas de prix. Définissez un prix compétitif pour commencer à vendre.',
        action: 'Modifier le produit',
        priority: 'high',
        onClick: () => openEditModal(),
      })
    }

    if (!product.description || product.description.length < 50) {
      items.push({
        icon: FileText,
        title: 'Enrichir la description',
        description: 'Une description détaillée améliore le SEO et la conversion. Utilisez l\'IA pour en générer une optimisée.',
        action: 'Optimiser avec IA',
        priority: 'high',
        onClick: () => handleOptimizeAI(),
      })
    }

    if (!product.seo_title && !product.seo_description) {
      items.push({
        icon: FileSearch,
        title: 'Optimiser le SEO',
        description: 'Ajoutez un titre et une description SEO pour améliorer le référencement de ce produit.',
        action: 'Lancer l\'optimisation SEO',
        priority: 'medium',
        onClick: () => handleOptimizeSEO(),
      })
    }

    if (!product.category) {
      items.push({
        icon: Layers,
        title: 'Assigner une catégorie',
        description: 'Les produits catégorisés sont mieux référencés et plus faciles à trouver dans le catalogue.',
        action: 'Modifier le produit',
        priority: 'medium',
        onClick: () => openEditModal(),
      })
    }

    if (product.stock_quantity <= 0) {
      items.push({
        icon: Box,
        title: 'Mettre à jour le stock',
        description: 'Ce produit est en rupture de stock. Mettez à jour la quantité disponible.',
        action: 'Modifier le stock',
        priority: 'medium',
        onClick: () => openEditModal(),
      })
    }

    if (!product.variants?.length) {
      items.push({
        icon: Layers,
        title: 'Ajouter des variantes',
        description: 'Proposez des options (taille, couleur) pour augmenter les conversions et le panier moyen.',
        action: 'Gérer les variantes',
        priority: 'low',
        onClick: () => setActiveTab('variants'),
      })
    }

    return items
  }, [product, id])

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 50) return 'text-orange-500'
    return 'text-red-500'
  }

  const getHealthBadge = (score: number) => {
    if (score >= 80) return { label: 'Excellent', variant: 'default' as const }
    if (score >= 50) return { label: 'À améliorer', variant: 'secondary' as const }
    return { label: 'Critique', variant: 'destructive' as const }
  }

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'border-red-500/30 bg-red-500/5'
    if (priority === 'medium') return 'border-orange-500/30 bg-orange-500/5'
    return 'border-blue-500/30 bg-blue-500/5'
  }

  const getPriorityBadge = (priority: string) => {
    if (priority === 'high') return 'destructive'
    if (priority === 'medium') return 'secondary'
    return 'outline'
  }

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
        title: editForm.name,
        description: editForm.description,
        salePrice: editForm.price,
        costPrice: editForm.cost_price,
        stock: editForm.stock_quantity,
        status: editForm.status,
      },
    }, {
      onSuccess: () => {
        setShowEditModal(false)
        refetch()
      },
    })
  }

  const handleDuplicate = async () => {
    if (!product || !user) return
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          title: `${product.name} (copie)`,
          name: `${product.name} (copie)`,
          description: product.description,
          sku: product.sku ? `${product.sku}-COPY` : null,
          price: product.price,
          cost_price: product.cost_price,
          stock_quantity: product.stock_quantity,
          category: product.category,
          images: product.images as any,
          image_url: product.image_url,
          status: 'draft',
          tags: product.tags,
        })
        .select('id')
        .single()

      if (error) throw error
      toast.success('Produit dupliqué avec succès')
      if (data?.id) navigate(`/products/${data.id}`)
    } catch (err) {
      toast.error('Erreur lors de la duplication')
    }
  }

  const handleExport = () => {
    if (!product) return
    const exportData = {
      name: product.name,
      sku: product.sku,
      description: product.description,
      price: product.price,
      cost_price: product.cost_price,
      stock_quantity: product.stock_quantity,
      category: product.category,
      status: product.status,
      images: product.images,
      tags: product.tags,
      variants: product.variants,
      seo_title: product.seo_title,
      seo_description: product.seo_description,
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `product-${product.sku || product.id}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Produit exporté en JSON')
  }

  const handleShare = async () => {
    if (!product) return
    const shareUrl = `${window.location.origin}/products/${product.id}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Lien copié dans le presse-papier')
    } catch {
      toast.error('Impossible de copier le lien')
    }
  }

  const handleEditImages = () => {
    setActiveTab('gallery')
    // Scroll to tabs
    setTimeout(() => {
      document.getElementById('product-tabs')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleDelete = () => {
    if (!id) return
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (!id) return
    deleteProduct.mutate(id, {
      onSuccess: () => {
        toast.success('Produit supprimé')
        navigate('/products')
      },
    })
    setShowDeleteConfirm(false)
  }

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Chargement du produit...</p>
          </div>
        </div>
      </>
    )
  }

  if (!product) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Produit introuvable</h2>
            <p className="text-muted-foreground mb-4 max-w-md">
              Ce produit n'existe pas ou a été supprimé de votre catalogue.
            </p>
            <Button onClick={() => navigate('/products')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au catalogue
            </Button>
          </div>
        </div>
      </>
    )
  }

  const images = product.images?.length ? product.images : (product.image_url ? [product.image_url] : [])
  const mainImage = images[selectedImageIndex] || '/placeholder.svg'

  return (
    <>
      <div className="min-h-screen">
        {/* Action bar intégrée */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Catalogue
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Badge variant="outline" className="gap-1">
              <Box className="h-3 w-3" />
              {product.source === 'products' ? 'Catalogue' : 'Importé'}
            </Badge>
            <Badge variant={['active', 'published'].includes(product.status) ? 'default' : 'secondary'}>
              {['active', 'published'].includes(product.status) ? 'Publié' : product.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Actualiser</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button variant="outline" size="sm" onClick={openEditModal}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>

            <Button size="sm" onClick={handlePublish} disabled={triggerSync.isPending}>
              {triggerSync.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Store className="h-4 w-4 mr-2" />}
              Publier
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter (JSON)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Copier le lien
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="py-2">
          {/* AI Suggestions Banner */}
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Suggestions d'amélioration ({suggestions.length})
                    <Badge variant="outline" className="ml-auto">
                      Score : {healthScore}/100
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestions.slice(0, 4).map((suggestion, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                          getPriorityColor(suggestion.priority)
                        )}
                      >
                        <suggestion.icon className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium">{suggestion.title}</p>
                            <Badge variant={getPriorityBadge(suggestion.priority) as any} className="text-[10px] h-4 px-1.5">
                              {suggestion.priority === 'high' ? 'Urgent' : suggestion.priority === 'medium' ? 'Moyen' : 'Bonus'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{suggestion.description}</p>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={suggestion.onClick}>
                            {suggestion.action}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {suggestions.length > 4 && (
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      + {suggestions.length - 4} autres suggestions disponibles
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Product Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-square bg-muted">
                    {images.length > 0 ? (
                      <img
                        src={mainImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                        <Images className="h-12 w-12 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Aucune image</p>
                        <Button variant="outline" size="sm" onClick={handleEditImages}>
                          <ImagePlus className="h-4 w-4 mr-2" />
                          Ajouter des images
                        </Button>
                      </div>
                    )}
                    {images.length > 1 && (
                      <Badge className="absolute bottom-3 right-3 bg-black/50 backdrop-blur">
                        {selectedImageIndex + 1} / {images.length}
                      </Badge>
                    )}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <Badge className={cn("gap-1", getHealthColor(healthScore))}>
                        <Sparkles className="h-3 w-3" />
                        {healthScore}/100
                      </Badge>
                    </div>
                  </div>

                  {images.length > 1 && (
                    <div className="p-3 flex gap-2 overflow-x-auto">
                      {images.slice(0, 6).map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={cn(
                            "w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0",
                            idx === selectedImageIndex 
                              ? "border-primary ring-2 ring-primary/20" 
                              : "border-transparent hover:border-muted-foreground/30"
                          )}
                        >
                          <img src={img as string} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                      {images.length > 6 && (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-sm font-medium flex-shrink-0">
                          +{images.length - 6}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-4"
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold mb-2 line-clamp-2">{product.name}</h1>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {product.sku && (
                          <button 
                            onClick={handleCopySku}
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            <Tag className="h-3 w-3" />
                            SKU: {product.sku}
                            <Copy className="h-3 w-3 opacity-50" />
                          </button>
                        )}
                        {product.category && (
                          <>
                            <Separator orientation="vertical" className="h-4" />
                            <span className="flex items-center gap-1">
                              <Layers className="h-3 w-3" />
                              {product.category}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge {...getHealthBadge(healthScore)} className="gap-1">
                      {healthScore >= 80 ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {getHealthBadge(healthScore).label}
                    </Badge>
                  </div>

                  {/* Price Section */}
                  <div className="flex items-end gap-6 mb-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Prix de vente</p>
                      <p className="text-3xl font-bold text-primary">
                        {product.price > 0 ? `${product.price.toFixed(2)}€` : (
                          <span className="text-destructive">Non défini</span>
                        )}
                      </p>
                    </div>
                    {product.cost_price > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Prix d'achat</p>
                        <p className="text-xl font-semibold text-muted-foreground">{product.cost_price.toFixed(2)}€</p>
                      </div>
                    )}
                    {product.cost_price > 0 && product.price > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Marge</p>
                        <p className="text-xl font-semibold text-primary">
                          {((product.price - product.cost_price) / product.price * 100).toFixed(0)}%
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Box className="h-4 w-4" />
                        <span className="text-xs">Stock</span>
                      </div>
                      <p className={cn("text-lg font-semibold", product.stock_quantity <= 0 && "text-destructive")}>
                        {product.stock_quantity || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Eye className="h-4 w-4" />
                        <span className="text-xs">Vues (30j)</span>
                      </div>
                      <p className="text-lg font-semibold">{product.view_count || 0}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <ShoppingCart className="h-4 w-4" />
                        <span className="text-xs">Ventes</span>
                      </div>
                      <p className="text-lg font-semibold">{(product as any).sales_count || 0}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <BarChart3 className="h-4 w-4" />
                        <span className="text-xs">Score IA</span>
                      </div>
                      <p className={cn("text-lg font-semibold", getHealthColor(healthScore))}>{healthScore}/100</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={handleOptimizeAI} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Optimiser IA
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2" onClick={handleOptimizeSEO} disabled={isOptimizingSeo}>
                        {isOptimizingSeo ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        SEO
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2" onClick={handleEditImages}>
                        <Images className="h-4 w-4" />
                        Éditer images
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Mis à jour {product.updated_at ? new Date(product.updated_at).toLocaleDateString('fr-FR') : 'récemment'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description Preview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {product.description ? (
                    <>
                      <p className={cn("text-sm text-muted-foreground", !showDescriptionFull && "line-clamp-3")}>
                        {product.description}
                      </p>
                      {product.description.length > 150 && (
                        <Button 
                          variant="link" 
                          className="px-0 h-auto text-xs mt-1" 
                          onClick={() => setShowDescriptionFull(!showDescriptionFull)}
                        >
                          {showDescriptionFull ? 'Voir moins' : 'Voir plus'}
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Aucune description disponible.</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleOptimizeAI} disabled={isGenerating}>
                        <Sparkles className="h-3 w-3 mr-1" />
                        Générer avec IA
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            id="product-tabs"
          >
            <Card>
              <CardContent className="pt-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="flex flex-wrap w-full gap-1 h-auto p-1">
                    <TabsTrigger value="audit" className="gap-2 py-2">
                      <Target className="h-4 w-4" />
                      <span className="hidden sm:inline">Audit IA</span>
                    </TabsTrigger>
                    <TabsTrigger value="variants" className="gap-2 py-2">
                      <Layers className="h-4 w-4" />
                      <span className="hidden sm:inline">Variantes</span>
                      {(product.variants?.length > 0) && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">{product.variants.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="suppliers" className="gap-2 py-2">
                      <Truck className="h-4 w-4" />
                      <span className="hidden sm:inline">Fournisseurs</span>
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="gap-2 py-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="hidden sm:inline">Performance</span>
                    </TabsTrigger>
                    <TabsTrigger value="channels" className="gap-2 py-2">
                      <Globe className="h-4 w-4" />
                      <span className="hidden sm:inline">Multi-canal</span>
                    </TabsTrigger>
                    <TabsTrigger value="gallery" className="gap-2 py-2">
                      <Images className="h-4 w-4" />
                      <span className="hidden sm:inline">Images</span>
                    </TabsTrigger>
                    <TabsTrigger value="videos" className="gap-2 py-2">
                      <Video className="h-4 w-4" />
                      <span className="hidden sm:inline">Vidéos</span>
                      {(product.videos?.length > 0) && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">{product.videos.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="translations" className="gap-2 py-2">
                      <Languages className="h-4 w-4" />
                      <span className="hidden sm:inline">Traductions</span>
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="gap-2 py-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="hidden sm:inline">Avis</span>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2 py-2">
                      <History className="h-4 w-4" />
                      <span className="hidden sm:inline">Historique</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="audit" className="space-y-4">
                    <ProductAuditBlock 
                      product={product}
                      onOptimize={() => refetch()}
                    />
                  </TabsContent>

                  <TabsContent value="variants">
                    <ProductVariantEditor
                      variants={(product.variants || []).map((v: any, i: number) => ({
                        id: v.id || `v-${i}`,
                        sku: v.sku || '',
                        price: v.price ?? null,
                        cost_price: v.cost_price ?? null,
                        stock_quantity: v.stock_quantity ?? 0,
                        weight: v.weight ?? null,
                        barcode: v.barcode ?? null,
                        is_active: v.is_active !== false,
                        attributes: v.attributes || {},
                        image_url: v.image_url,
                      }))}
                      options={(() => {
                        const optMap: Record<string, Set<string>> = {}
                        ;(product.variants || []).forEach((v: any) => {
                          if (v.attributes) {
                            Object.entries(v.attributes).forEach(([k, val]) => {
                              if (!optMap[k]) optMap[k] = new Set()
                              optMap[k].add(val as string)
                            })
                          }
                        })
                        return Object.entries(optMap).map(([name, vals]) => ({
                          name,
                          values: Array.from(vals)
                        }))
                      })()}
                      basePrice={product.price || 0}
                      baseSku={product.sku}
                      onVariantsChange={(newVariants) => {
                        updateProduct.mutate({
                          id: product.id,
                          updates: { variants: newVariants } as any
                        }, { onSuccess: () => refetch() })
                      }}
                      onOptionsChange={() => {}}
                    />
                  </TabsContent>

                  <TabsContent value="suppliers">
                    <ProductSuppliersPanel 
                      productId={product.id}
                      productPrice={product.price || 0}
                    />
                  </TabsContent>

                  <TabsContent value="performance">
                    <ProductPerformanceMetrics 
                      productId={product.id} 
                      sourceTable={product.source === 'products' ? 'products' : 'imported_products'} 
                    />
                  </TabsContent>

                  <TabsContent value="channels">
                    <MultiChannelReadiness product={product} />
                  </TabsContent>

                  <TabsContent value="gallery">
                    <ProductImageManager productId={product.id} />
                  </TabsContent>

                  <TabsContent value="videos">
                    <ProductVideoPlayer
                      videos={product.videos || []}
                      onVideosChange={(newVideos) => {
                        updateProduct.mutate({
                          id: product.id,
                          updates: { videos: newVideos } as any
                        }, { onSuccess: () => refetch() })
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="translations">
                    <ProductTranslations productId={product.id} />
                  </TabsContent>

                  <TabsContent value="reviews">
                    <ProductReviews productId={product.id} />
                  </TabsContent>

                  <TabsContent value="history">
                    <OptimizationHistory 
                      productId={product.id}
                      sourceTable={product.source === 'products' ? 'products' : 'imported_products'}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Supprimer ce produit ?"
        description="Cette action est irréversible. Le produit sera définitivement supprimé."
        confirmText="Supprimer"
        variant="destructive"
        onConfirm={confirmDelete}
      />

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le produit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom du produit</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Prix de vente (€)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price}
                  onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cost">Prix d'achat (€)</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.cost_price}
                  onChange={(e) => setEditForm(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-stock">Stock</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  min="0"
                  value={editForm.stock_quantity}
                  onChange={(e) => setEditForm(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Catégorie</Label>
                <Input
                  id="edit-category"
                  value={editForm.category}
                  onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Annuler</Button>
            <Button onClick={handleSaveEdit} disabled={updateProduct.isPending}>
              {updateProduct.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
