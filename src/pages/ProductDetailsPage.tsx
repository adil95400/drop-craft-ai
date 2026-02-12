/**
 * Product Details Page - Premium Redesign v3.0
 * All mutations via FastAPI (useApiProducts, useApiAI)
 */
import { useState, useMemo } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductTranslations, ProductReviews } from '@/components/products'
import { ProductImageManager } from '@/components/products/ProductImageManager'
import { ProductAuditBlock } from '@/components/products/ProductAuditBlock'
import { ProductPerformanceMetrics } from '@/components/products/ProductPerformanceMetrics'
import { OptimizationHistory } from '@/components/products/OptimizationHistory'
import { MultiChannelReadiness } from '@/components/products/MultiChannelReadiness'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  ArrowLeft, Package, Languages, MessageSquare, Images, Target, 
  TrendingUp, History, Globe, Edit, ExternalLink, Copy, Sparkles,
  DollarSign, Tag, Box, BarChart3, Layers, ShoppingCart, Store,
  RefreshCw, Trash2, MoreVertical, CheckCircle2, AlertTriangle, 
  Share2, Download, Eye, Clock, Zap, FileText
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProduct } from '@/hooks/useUnifiedProducts'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useApiProducts, useApiAI } from '@/hooks/api'
import { useApiSync } from '@/hooks/api'

export default function ProductDetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { data: product, isLoading, refetch } = useProduct(id || '')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // FastAPI hooks for mutations
  const { updateProduct, deleteProduct } = useApiProducts()
  const { generateContent, optimizeSeo, isGenerating, isOptimizingSeo } = useApiAI()
  const { triggerSync } = useApiSync()

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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Chargement du produit...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!product) {
    return (
      <MainLayout>
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
      </MainLayout>
    )
  }

  const images = product.images?.length ? product.images : (product.image_url ? [product.image_url] : [])
  const mainImage = images[selectedImageIndex] || '/placeholder.svg'

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Header Navigation */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Box className="h-3 w-3" />
                    {product.source === 'products' ? 'Catalogue' : 'Importé'}
                  </Badge>
                  <Badge variant={['active', 'published'].includes(product.status) ? 'default' : 'secondary'}>
                    {['active', 'published'].includes(product.status) ? 'Publié' : product.status}
                  </Badge>
                </div>
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

                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>

                <Button size="sm" onClick={handlePublish}>
                  <Store className="h-4 w-4 mr-2" />
                  Publier
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Dupliquer
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="h-4 w-4 mr-2" />
                      Partager
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
          </div>
        </div>

        <div className="container py-6">
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
                  {/* Main Image */}
                  <div className="relative aspect-square bg-muted">
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg'
                      }}
                    />
                    {/* Image counter */}
                    {images.length > 1 && (
                      <Badge className="absolute bottom-3 right-3 bg-black/50 backdrop-blur">
                        {selectedImageIndex + 1} / {images.length}
                      </Badge>
                    )}
                    {/* Health score overlay */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <Badge className={cn("gap-1", getHealthColor(healthScore))}>
                        <Sparkles className="h-3 w-3" />
                        {healthScore}/100
                      </Badge>
                    </div>
                  </div>

                  {/* Thumbnail Gallery */}
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
                          <img src={img} alt="" className="w-full h-full object-cover" />
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
              {/* Title and Quick Info */}
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
                      <p className="text-3xl font-bold text-primary">{product.price?.toFixed(2) || '0.00'}€</p>
                    </div>
                    {product.cost_price && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Prix d'achat</p>
                        <p className="text-xl font-semibold text-muted-foreground">{product.cost_price?.toFixed(2)}€</p>
                      </div>
                    )}
                    {product.cost_price && product.price && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Marge</p>
                        <p className="text-xl font-semibold text-success">
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
                      <p className="text-lg font-semibold">{product.stock_quantity || 0}</p>
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
                      <Button variant="outline" size="sm" className="gap-2">
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
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {product.description || 'Aucune description. Utilisez l\'optimisation IA pour en générer une automatiquement.'}
                  </p>
                  {product.description && product.description.length > 150 && (
                    <Button variant="link" className="px-0 h-auto text-xs mt-1">
                      Voir plus
                    </Button>
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
          >
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="audit" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 gap-1 h-auto p-1">
                    <TabsTrigger value="audit" className="gap-2 py-2">
                      <Target className="h-4 w-4" />
                      <span className="hidden sm:inline">Audit IA</span>
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
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Supprimer ce produit ?"
        description="Cette action est irréversible. Le produit sera définitivement supprimé."
        confirmText="Supprimer"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </MainLayout>
  )
}
