/**
 * ProductViewModal - Modal complet avec édition, optimisation AI, SEO et publication
 */

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useProductAIOptimizer } from '@/hooks/useProductAIOptimizer'
import { usePublishProducts } from '@/hooks/usePublishProducts'
import { Product } from '@/hooks/useRealProducts'
import { UnifiedProduct } from '@/services/ProductsUnifiedService'
import {
  Edit3,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  Calendar,
  DollarSign,
  Tag,
  Layers,
  ShoppingCart,
  History,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  Copy,
  Trash2,
  Share2,
  Heart,
  Sparkles,
  RefreshCw,
  Archive,
  Percent,
  Box,
  FileText,
  Globe,
  Loader2,
  Send,
  Wand2,
  Search,
  Zap,
  Star,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ProductViewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | UnifiedProduct | null
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
}

export function ProductViewModal({ 
  open, 
  onOpenChange, 
  product,
  onEdit,
  onDelete,
  onDuplicate
}: ProductViewModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [editedProduct, setEditedProduct] = useState<any>(product)
  const [activeTab, setActiveTab] = useState('overview')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Hooks pour l'optimisation AI et la publication
  const { optimizeProduct, isOptimizing } = useProductAIOptimizer()
  const { publishProduct, unpublishProduct, isPublishing, isUnpublishing } = usePublishProducts()

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setEditedProduct({
        ...product,
        seo_title: (product as any).seo_title || '',
        seo_description: (product as any).seo_description || '',
      })
      setCurrentImageIndex(0)
      setIsEditing(false)
      setActiveTab('overview')
    }
  }, [product])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0)
  }

  // Images handling
  const images = useMemo(() => {
    if (!product) return []
    return (product as any).images?.length 
      ? (product as any).images 
      : product.image_url 
        ? [product.image_url] 
        : []
  }, [product])

  const hasMultipleImages = images.length > 1

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!product) return null
    
    const price = product.price || 0
    const costPrice = product.cost_price || 0
    const profit = price - costPrice
    const margin = price > 0 ? ((profit / price) * 100) : 0
    const stock = product.stock_quantity || 0
    
    return {
      price,
      costPrice,
      profit,
      margin,
      stock,
      isLowStock: stock > 0 && stock < 10,
      isOutOfStock: stock <= 0,
    }
  }, [product])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', product!.id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['unified-products'] })
      toast({
        title: '✅ Produit mis à jour',
        description: 'Les modifications ont été enregistrées avec succès',
      })
      setIsEditing(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product!.id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['unified-products'] })
      toast({
        title: 'Produit supprimé',
        description: 'Le produit a été supprimé avec succès',
      })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  if (!product) return null

  const handleSave = () => {
    updateMutation.mutate({
      name: editedProduct.name,
      description: editedProduct.description,
      price: parseFloat(editedProduct.price) || 0,
      cost_price: parseFloat(editedProduct.cost_price) || 0,
      sku: editedProduct.sku,
      category: editedProduct.category,
      stock_quantity: parseInt(editedProduct.stock_quantity) || 0,
      status: editedProduct.status,
      seo_title: editedProduct.seo_title,
      seo_description: editedProduct.seo_description,
    })
  }

  const handleCancel = () => {
    setEditedProduct(product)
    setIsEditing(false)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleCopySku = () => {
    if (product.sku) {
      navigator.clipboard.writeText(product.sku)
      toast({ title: 'SKU copié', description: product.sku })
    }
  }

  // Optimisation AI handlers
  const handleOptimizeTitle = async () => {
    try {
      const result = await optimizeProduct({
        productId: product.id,
        productSource: 'products',
        optimizationType: 'title',
        tone: 'professional',
        currentData: {
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
        }
      })
      if (result?.result?.optimized_title) {
        setEditedProduct((prev: any) => ({ ...prev, name: result.result.optimized_title }))
        toast({ title: '✨ Titre optimisé', description: 'Vérifiez et enregistrez les modifications.' })
      }
    } catch (error) {
      console.error('Optimization error:', error)
    }
  }

  const handleOptimizeDescription = async () => {
    try {
      const result = await optimizeProduct({
        productId: product.id,
        productSource: 'products',
        optimizationType: 'description',
        tone: 'professional',
        currentData: {
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
        }
      })
      if (result?.result?.optimized_description) {
        setEditedProduct((prev: any) => ({ ...prev, description: result.result.optimized_description }))
        toast({ title: '✨ Description optimisée', description: 'Vérifiez et enregistrez les modifications.' })
      }
    } catch (error) {
      console.error('Optimization error:', error)
    }
  }

  const handleOptimizeSEO = async () => {
    try {
      const result = await optimizeProduct({
        productId: product.id,
        productSource: 'products',
        optimizationType: 'seo_meta',
        tone: 'professional',
        currentData: {
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
        }
      })
      if (result?.result) {
        setEditedProduct((prev: any) => ({
          ...prev,
          seo_title: result.result.meta_title || prev.seo_title,
          seo_description: result.result.meta_description || prev.seo_description,
        }))
        setIsEditing(true)
        toast({ title: '✨ SEO optimisé', description: 'Vérifiez et enregistrez les modifications.' })
      }
    } catch (error) {
      console.error('SEO Optimization error:', error)
    }
  }

  const handleFullOptimization = async () => {
    try {
      const result = await optimizeProduct({
        productId: product.id,
        productSource: 'products',
        optimizationType: 'full',
        tone: 'professional',
        currentData: {
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
        }
      })
      if (result?.result) {
        setEditedProduct((prev: any) => ({
          ...prev,
          name: result.result.optimized_title || prev.name,
          description: result.result.optimized_description || prev.description,
          seo_title: result.result.meta_title || prev.seo_title,
          seo_description: result.result.meta_description || prev.seo_description,
        }))
        setIsEditing(true)
        toast({
          title: '✨ Optimisation complète',
          description: 'Titre, description et SEO optimisés ! Vérifiez et enregistrez.',
        })
      }
    } catch (error) {
      console.error('Full Optimization error:', error)
    }
  }

  // Publication handlers
  const handlePublish = () => {
    publishProduct(product.id)
  }

  const handleUnpublish = () => {
    unpublishProduct(product.id)
  }

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'published':
      case 'active':
        return { label: 'Publié', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle }
      case 'draft':
        return { label: 'Brouillon', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: FileText }
      case 'archived':
        return { label: 'Archivé', color: 'bg-muted text-muted-foreground border-border', icon: Archive }
      default:
        return { label: status || 'Brouillon', color: 'bg-muted text-muted-foreground border-border', icon: FileText }
    }
  }

  const getStockStatusConfig = () => {
    if (!metrics) return null
    if (metrics.isOutOfStock) {
      return { label: 'Rupture de stock', color: 'destructive' as const, icon: AlertTriangle }
    }
    if (metrics.isLowStock) {
      return { label: 'Stock faible', color: 'secondary' as const, icon: AlertTriangle }
    }
    return { label: 'En stock', color: 'default' as const, icon: CheckCircle }
  }

  const statusConfig = getStatusConfig(product.status)
  const stockConfig = getStockStatusConfig()
  const isPublished = (product.status as string) === 'published' || product.status === 'active'
  const aiScore = (product as any).ai_score || 0
  const isWinner = (product as any).is_winner

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0 gap-0 overflow-hidden bg-background">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-6 py-4 border-b bg-muted/30"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Badge className={cn("shrink-0 gap-1.5", statusConfig.color)}>
                <statusConfig.icon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
              
              {stockConfig && (
                <Badge variant={stockConfig.color} className="shrink-0 gap-1.5">
                  <stockConfig.icon className="h-3 w-3" />
                  {stockConfig.label}
                </Badge>
              )}
              
              {isWinner && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1.5">
                  <Star className="h-3 w-3" />
                  Winner
                </Badge>
              )}
              
              {(product as any).source && (
                <Badge variant="outline" className="shrink-0 gap-1.5">
                  <Globe className="h-3 w-3" />
                  {(product as any).source}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsLiked(!isLiked)}
                    >
                      <Heart className={cn("h-4 w-4 transition-all", isLiked && "fill-red-500 text-red-500 scale-110")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ajouter aux favoris</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Partager</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="bg-primary"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1.5" />
                    )}
                    Enregistrer
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-1.5" />
                    Modifier
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Supprimer
                  </Button>
                </>
              )}
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-5 h-full max-h-[calc(95vh-73px)]">
            {/* Left: Image Gallery */}
            <div className="lg:col-span-2 bg-muted/20 p-6 border-r overflow-y-auto">
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative aspect-square rounded-xl overflow-hidden bg-background shadow-lg border">
                  <AnimatePresence mode="wait">
                    {images.length > 0 ? (
                      <motion.img
                        key={currentImageIndex}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        src={images[currentImageIndex]}
                        alt={product.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Package className="h-24 w-24 text-muted-foreground/30" />
                      </div>
                    )}
                  </AnimatePresence>

                  {/* AI Score overlay */}
                  {aiScore > 0 && (
                    <div className="absolute top-3 right-3">
                      <div className="px-3 py-1.5 rounded-full backdrop-blur-md bg-background/80 border border-border flex items-center gap-2 shadow-lg">
                        <Sparkles className={cn("h-4 w-4", aiScore >= 80 ? 'text-green-500' : aiScore >= 60 ? 'text-yellow-500' : 'text-red-500')} />
                        <span className={cn("font-bold text-sm", aiScore >= 80 ? 'text-green-500' : aiScore >= 60 ? 'text-yellow-500' : 'text-red-500')}>
                          {Math.round(aiScore * 100)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Navigation Arrows */}
                  {hasMultipleImages && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg bg-background/90 backdrop-blur-sm"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg bg-background/90 backdrop-blur-sm"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </>
                  )}

                  {/* Image Counter */}
                  {hasMultipleImages && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm text-sm font-medium shadow-lg">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {hasMultipleImages && (
                  <div className="flex justify-center gap-2">
                    {images.slice(0, 6).map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={cn(
                          "w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200",
                          idx === currentImageIndex
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg'
                          }}
                        />
                      </button>
                    ))}
                    {images.length > 6 && (
                      <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                        +{images.length - 6}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Actions */}
                <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Actions rapides
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* AI Optimization Button */}
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 h-10"
                      onClick={handleFullOptimization}
                      disabled={isOptimizing}
                    >
                      {isOptimizing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-purple-500" />
                      )}
                      <span>Optimisation complète IA</span>
                    </Button>
                    
                    {/* SEO Optimization Button */}
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 h-10"
                      onClick={handleOptimizeSEO}
                      disabled={isOptimizing}
                    >
                      {isOptimizing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4 text-blue-500" />
                      )}
                      <span>Optimiser SEO</span>
                    </Button>
                    
                    {/* Publish/Unpublish Button */}
                    {isPublished ? (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 h-10"
                        onClick={handleUnpublish}
                        disabled={isUnpublishing}
                      >
                        {isUnpublishing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Archive className="h-4 w-4 text-orange-500" />
                        )}
                        <span>Dépublier</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 h-10 border-green-500/30 hover:bg-green-500/10"
                        onClick={handlePublish}
                        disabled={isPublishing}
                      >
                        {isPublishing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 text-green-500" />
                        )}
                        <span>Publier dans le catalogue</span>
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="bg-primary/5 border-primary/10">
                    <CardContent className="p-3 text-center">
                      <DollarSign className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(metrics?.price || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Prix de vente</p>
                    </CardContent>
                  </Card>
                  
                  <Card className={cn(
                    "border",
                    (metrics?.margin || 0) >= 30 
                      ? "bg-green-500/5 border-green-500/10" 
                      : (metrics?.margin || 0) >= 15 
                        ? "bg-yellow-500/5 border-yellow-500/10"
                        : "bg-red-500/5 border-red-500/10"
                  )}>
                    <CardContent className="p-3 text-center">
                      <Percent className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className={cn(
                        "text-lg font-bold",
                        (metrics?.margin || 0) >= 30 
                          ? "text-green-600" 
                          : (metrics?.margin || 0) >= 15 
                            ? "text-yellow-600"
                            : "text-red-600"
                      )}>
                        {metrics?.margin.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Marge</p>
                    </CardContent>
                  </Card>
                  
                  <Card className={cn(
                    "border",
                    metrics?.isOutOfStock 
                      ? "bg-red-500/5 border-red-500/10" 
                      : metrics?.isLowStock 
                        ? "bg-yellow-500/5 border-yellow-500/10"
                        : "bg-muted/50 border-border"
                  )}>
                    <CardContent className="p-3 text-center">
                      <Box className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className={cn(
                        "text-lg font-bold",
                        metrics?.isOutOfStock 
                          ? "text-red-600" 
                          : metrics?.isLowStock 
                            ? "text-yellow-600"
                            : "text-foreground"
                      )}>
                        {metrics?.stock || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">En stock</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Right: Product Details */}
            <ScrollArea className="lg:col-span-3 h-full">
              <div className="flex flex-col h-full">
                {/* Product Title & SKU */}
                <div className="px-6 pt-6 pb-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Input
                            value={editedProduct.name || ''}
                            onChange={(e) =>
                              setEditedProduct({ ...editedProduct, name: e.target.value })
                            }
                            className="text-xl font-bold h-auto py-2 flex-1"
                            placeholder="Nom du produit"
                          />
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={handleOptimizeTitle}
                                  disabled={isOptimizing}
                                >
                                  {isOptimizing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Wand2 className="h-4 w-4 text-purple-500" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Optimiser le titre avec l'IA</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ) : (
                        <h2 className="text-xl font-bold truncate">
                          {product.name || 'Sans nom'}
                        </h2>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className="font-mono text-xs gap-1.5">
                      SKU: {product.sku || 'N/A'}
                      <button onClick={handleCopySku} className="hover:text-primary transition-colors">
                        <Copy className="h-3 w-3" />
                      </button>
                    </Badge>
                    
                    {product.category && (
                      <Badge variant="secondary" className="gap-1.5">
                        <Tag className="h-3 w-3" />
                        {product.category}
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1">
                  <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 px-6">
                    {[
                      { value: 'overview', label: 'Aperçu', icon: Eye },
                      { value: 'pricing', label: 'Prix & Stock', icon: DollarSign },
                      { value: 'details', label: 'Détails', icon: FileText },
                      { value: 'seo', label: 'SEO', icon: Search },
                      { value: 'history', label: 'Historique', icon: History },
                    ].map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-4 gap-2"
                      >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <div className="p-6">
                    {/* Overview Tab */}
                    <TabsContent value="overview" className="m-0 space-y-6">
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Layers className="h-4 w-4" />
                              Description
                            </CardTitle>
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleOptimizeDescription}
                                disabled={isOptimizing}
                                className="h-7 text-xs"
                              >
                                {isOptimizing ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Sparkles className="h-3 w-3 mr-1 text-purple-500" />
                                )}
                                Optimiser
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {isEditing ? (
                            <Textarea
                              value={editedProduct.description || ''}
                              onChange={(e) =>
                                setEditedProduct({
                                  ...editedProduct,
                                  description: e.target.value,
                                })
                              }
                              rows={5}
                              className="resize-none"
                              placeholder="Description du produit..."
                            />
                          ) : (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {product.description || 'Aucune description disponible'}
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <DollarSign className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Prix d'achat</p>
                              <p className="text-xl font-bold">
                                {formatCurrency(product.cost_price || 0)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                              <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Profit</p>
                              <p className="text-xl font-bold text-green-600">
                                +{formatCurrency(metrics?.profit || 0)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Informations
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Créé le</span>
                            <span className="text-sm font-medium">
                              {product.created_at 
                                ? new Date(product.created_at).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })
                                : 'N/A'
                              }
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Modifié le</span>
                            <span className="text-sm font-medium">
                              {product.updated_at 
                                ? new Date(product.updated_at).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })
                                : 'N/A'
                              }
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Pricing Tab */}
                    <TabsContent value="pricing" className="m-0 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Prix de vente</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {isEditing ? (
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editedProduct.price || ''}
                                  onChange={(e) =>
                                    setEditedProduct({
                                      ...editedProduct,
                                      price: e.target.value,
                                    })
                                  }
                                  className="pl-9"
                                />
                              </div>
                            ) : (
                              <p className="text-3xl font-bold text-primary">
                                {formatCurrency(product.price || 0)}
                              </p>
                            )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Prix d'achat</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {isEditing ? (
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editedProduct.cost_price || ''}
                                  onChange={(e) =>
                                    setEditedProduct({
                                      ...editedProduct,
                                      cost_price: e.target.value,
                                    })
                                  }
                                  className="pl-9"
                                />
                              </div>
                            ) : (
                              <p className="text-3xl font-bold">
                                {formatCurrency(product.cost_price || 0)}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-green-500/20">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Profit par unité</p>
                              <p className="text-2xl font-bold text-green-600">
                                +{formatCurrency(metrics?.profit || 0)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Marge bénéficiaire</p>
                              <p className="text-2xl font-bold text-green-600">
                                {metrics?.margin.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          <Progress 
                            value={Math.min(metrics?.margin || 0, 100)} 
                            className="h-3"
                          />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Inventaire
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Quantité en stock</Label>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editedProduct.stock_quantity || ''}
                                onChange={(e) =>
                                  setEditedProduct({
                                    ...editedProduct,
                                    stock_quantity: e.target.value,
                                  })
                                }
                                className="w-32"
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                {stockConfig && (
                                  <Badge variant={stockConfig.color} className="gap-1.5">
                                    <stockConfig.icon className="h-3 w-3" />
                                    {stockConfig.label}
                                  </Badge>
                                )}
                                <span className="text-xl font-bold">{metrics?.stock || 0}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Details Tab */}
                    <TabsContent value="details" className="m-0 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>SKU</Label>
                          {isEditing ? (
                            <Input
                              value={editedProduct.sku || ''}
                              onChange={(e) =>
                                setEditedProduct({ ...editedProduct, sku: e.target.value })
                              }
                              placeholder="SKU-001"
                            />
                          ) : (
                            <p className="font-mono text-sm p-2 bg-muted rounded-md">
                              {product.sku || 'N/A'}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Catégorie</Label>
                          {isEditing ? (
                            <Input
                              value={editedProduct.category || ''}
                              onChange={(e) =>
                                setEditedProduct({ ...editedProduct, category: e.target.value })
                              }
                              placeholder="Catégorie"
                            />
                          ) : (
                            <p className="text-sm p-2 bg-muted rounded-md">
                              {product.category || 'Non catégorisé'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Statut</Label>
                        {isEditing ? (
                          <Select
                            value={editedProduct.status || 'draft'}
                            onValueChange={(value) =>
                              setEditedProduct({ ...editedProduct, status: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Brouillon</SelectItem>
                              <SelectItem value="published">Publié</SelectItem>
                              <SelectItem value="active">Actif</SelectItem>
                              <SelectItem value="archived">Archivé</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={cn("text-sm", statusConfig.color)}>
                            <statusConfig.icon className="h-3 w-3 mr-1.5" />
                            {statusConfig.label}
                          </Badge>
                        )}
                      </div>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Tags
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {(product as any).tags?.map((tag: string, idx: number) => (
                              <Badge key={idx} variant="secondary">{tag}</Badge>
                            )) || <p className="text-sm text-muted-foreground">Aucun tag</p>}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* SEO Tab */}
                    <TabsContent value="seo" className="m-0 space-y-6">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Optimisation SEO
                              </CardTitle>
                              <CardDescription>
                                Optimisez votre produit pour les moteurs de recherche
                              </CardDescription>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleOptimizeSEO}
                              disabled={isOptimizing}
                            >
                              {isOptimizing ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                              )}
                              Optimiser SEO
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Titre SEO</Label>
                            <Input
                              value={isEditing ? editedProduct.seo_title : ((product as any).seo_title || product.name || '')}
                              onChange={(e) =>
                                setEditedProduct({ ...editedProduct, seo_title: e.target.value })
                              }
                              placeholder="Titre pour les moteurs de recherche"
                              disabled={!isEditing}
                            />
                            <p className="text-xs text-muted-foreground">
                              {(isEditing ? editedProduct.seo_title : ((product as any).seo_title || product.name || '')).length}/60 caractères
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Meta description</Label>
                            <Textarea
                              value={isEditing ? editedProduct.seo_description : ((product as any).seo_description || product.description?.slice(0, 160) || '')}
                              onChange={(e) =>
                                setEditedProduct({ ...editedProduct, seo_description: e.target.value })
                              }
                              placeholder="Description pour les moteurs de recherche"
                              disabled={!isEditing}
                              rows={3}
                            />
                            <p className="text-xs text-muted-foreground">
                              {(isEditing ? editedProduct.seo_description : ((product as any).seo_description || product.description?.slice(0, 160) || '')).length}/160 caractères
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>URL slug</Label>
                            <Input
                              value={(product as any).slug || product.name?.toLowerCase().replace(/\s+/g, '-') || ''}
                              placeholder="url-du-produit"
                              disabled
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Aperçu Google
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="p-4 bg-white rounded-lg border space-y-1">
                            <p className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                              {isEditing ? editedProduct.seo_title : ((product as any).seo_title || product.name || 'Titre du produit')}
                            </p>
                            <p className="text-green-700 text-sm truncate">
                              www.votre-boutique.com › produits › {(product as any).slug || product.name?.toLowerCase().replace(/\s+/g, '-') || 'produit'}
                            </p>
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {isEditing ? editedProduct.seo_description : ((product as any).seo_description || product.description?.slice(0, 160) || 'Description du produit pour les moteurs de recherche...')}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history" className="m-0 space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Historique des modifications
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <RefreshCw className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">Dernière modification</p>
                                <p className="text-xs text-muted-foreground">
                                  {product.updated_at 
                                    ? new Date(product.updated_at).toLocaleString('fr-FR')
                                    : 'N/A'
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">Création</p>
                                <p className="text-xs text-muted-foreground">
                                  {product.created_at 
                                    ? new Date(product.created_at).toLocaleString('fr-FR')
                                    : 'N/A'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le produit "{product.name}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
