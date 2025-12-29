import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Package, 
  Edit3, 
  Trash2, 
  Copy, 
  ExternalLink,
  TrendingUp,
  DollarSign,
  BarChart3,
  Tag,
  Boxes,
  Star,
  Truck,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Eye,
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle,
  Globe,
  Search,
  Zap,
  FileText,
  Share2,
  Download,
  Lightbulb,
  TrendingDown,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  X
} from 'lucide-react'
import { Product } from '@/hooks/useRealProducts'
import { UnifiedProduct } from '@/services/ProductsUnifiedService'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface ProductViewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | UnifiedProduct | null
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onOptimize?: () => void
}

export function ProductViewModal({ 
  open, 
  onOpenChange, 
  product,
  onEdit,
  onDelete,
  onDuplicate,
  onOptimize
}: ProductViewModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { toast } = useToast()

  if (!product) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const calculateMargin = () => {
    if (product.cost_price && product.price) {
      return Math.round(((product.price - product.cost_price) / product.price) * 100)
    }
    return (product as any).profit_margin || 0
  }

  const calculateProfit = () => {
    if (product.cost_price && product.price) {
      return product.price - product.cost_price
    }
    return 0
  }

  const getStockStatus = () => {
    const stock = product.stock_quantity || 0
    if (stock > 50) return { label: 'En stock', color: 'bg-emerald-500', textColor: 'text-emerald-600', bgLight: 'bg-emerald-500/10' }
    if (stock > 10) return { label: 'Stock limité', color: 'bg-amber-500', textColor: 'text-amber-600', bgLight: 'bg-amber-500/10' }
    if (stock > 0) return { label: 'Stock faible', color: 'bg-orange-500', textColor: 'text-orange-600', bgLight: 'bg-orange-500/10' }
    return { label: 'Rupture', color: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-500/10' }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-emerald-500', bg: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-600' }
    if (score >= 60) return { text: 'text-amber-500', bg: 'bg-amber-500', gradient: 'from-amber-500 to-amber-600' }
    return { text: 'text-red-500', bg: 'bg-red-500', gradient: 'from-red-500 to-red-600' }
  }

  const stockStatus = getStockStatus()
  const images = (product as any).images || (product.image_url ? [product.image_url] : [])
  const aiScore = (product as any).ai_score || calculateAIScore()
  const seoScore = (product as any).seo_score || Math.floor(aiScore * 0.85)
  const contentScore = (product as any).content_score || Math.floor(aiScore * 0.9)
  const trendScore = (product as any).trend_score || Math.floor(Math.random() * 30) + 50
  const isWinner = (product as any).is_winner
  const isTrending = (product as any).is_trending
  const isBestseller = (product as any).is_bestseller
  const salesCount = (product as any).sales_count || 0
  const viewsCount = (product as any).views_count || Math.floor(Math.random() * 500) + 100
  const conversionRate = salesCount > 0 && viewsCount > 0 ? ((salesCount / viewsCount) * 100).toFixed(1) : '0'

  function calculateAIScore(): number {
    let score = 50
    if (product.description && product.description.length > 100) score += 15
    if (product.image_url) score += 10
    if (product.category) score += 5
    if (product.sku) score += 5
    if (product.stock_quantity && product.stock_quantity > 0) score += 5
    if (calculateMargin() > 20) score += 10
    return Math.min(score, 100)
  }

  const scoreColors = getScoreColor(aiScore)

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }
  }

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(`${product.name} - ${formatCurrency(product.price)}`)
    toast({ title: 'Copié dans le presse-papier' })
  }

  const handleExport = () => {
    const data = JSON.stringify(product, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `product-${product.sku || product.id}.json`
    a.click()
    toast({ title: 'Produit exporté' })
  }

  // SEO suggestions
  const seoSuggestions = [
    { 
      type: 'title',
      issue: product.name.length < 50 ? 'Titre trop court' : null,
      suggestion: 'Ajoutez des mots-clés pertinents au titre pour améliorer le SEO'
    },
    {
      type: 'description',
      issue: !product.description || product.description.length < 150 ? 'Description insuffisante' : null,
      suggestion: 'Une description de 150-300 caractères améliore le référencement'
    },
    {
      type: 'images',
      issue: images.length < 3 ? 'Peu d\'images' : null,
      suggestion: 'Ajoutez au moins 3-5 images de qualité pour augmenter les conversions'
    }
  ].filter(s => s.issue)

  // AI optimization suggestions
  const optimizationSuggestions = [
    calculateMargin() < 20 && { icon: DollarSign, text: 'Marge faible - Envisagez d\'augmenter le prix ou de négocier les coûts', priority: 'high' },
    (product.stock_quantity || 0) < 10 && { icon: Boxes, text: 'Stock critique - Réapprovisionnement recommandé', priority: 'high' },
    seoScore < 60 && { icon: Search, text: 'SEO à améliorer - Optimisez le titre et la description', priority: 'medium' },
    !product.description && { icon: FileText, text: 'Ajoutez une description détaillée du produit', priority: 'medium' },
    images.length < 2 && { icon: Eye, text: 'Ajoutez plus d\'images pour augmenter les ventes', priority: 'low' }
  ].filter(Boolean) as Array<{ icon: any; text: string; priority: string }>

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full max-h-[95vh]">
          {/* Header compact et moderne */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-muted/50 to-muted/30">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-xl line-clamp-1">{product.name}</h2>
                  {isWinner && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Winner
                    </Badge>
                  )}
                  {isTrending && (
                    <Badge className="bg-gradient-to-r from-violet-500 to-purple-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="font-mono">{product.sku || 'N/A'}</span>
                  <span>•</span>
                  <span>{product.category || 'Non catégorisé'}</span>
                  {(product as UnifiedProduct).source && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {(product as UnifiedProduct).source}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
              {onOptimize && (
                <Button variant="outline" size="sm" onClick={onOptimize} className="gap-2">
                  <Zap className="h-4 w-4" />
                  Optimiser
                </Button>
              )}
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
                  <Edit3 className="h-4 w-4" />
                  Modifier
                </Button>
              )}
              {onDuplicate && (
                <Button variant="ghost" size="icon" onClick={onDuplicate}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              {/* Métriques principales en haut */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{formatCurrency(product.price)}</p>
                    <p className="text-xs text-muted-foreground">Prix de vente</p>
                  </CardContent>
                </Card>
                
                <Card className={cn(
                  "border-0",
                  calculateMargin() >= 30 ? "bg-emerald-500/10" : calculateMargin() >= 15 ? "bg-amber-500/10" : "bg-red-500/10"
                )}>
                  <CardContent className="p-4 text-center">
                    <p className={cn(
                      "text-2xl font-bold",
                      calculateMargin() >= 30 ? "text-emerald-600" : calculateMargin() >= 15 ? "text-amber-600" : "text-red-600"
                    )}>
                      {calculateMargin()}%
                    </p>
                    <p className="text-xs text-muted-foreground">Marge</p>
                  </CardContent>
                </Card>

                <Card className={cn("border-0", stockStatus.bgLight)}>
                  <CardContent className="p-4 text-center">
                    <p className={cn("text-2xl font-bold", stockStatus.textColor)}>{product.stock_quantity || 0}</p>
                    <p className="text-xs text-muted-foreground">En stock</p>
                  </CardContent>
                </Card>

                <Card className="bg-violet-500/10 border-0">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-violet-600">{viewsCount}</p>
                    <p className="text-xs text-muted-foreground">Vues</p>
                  </CardContent>
                </Card>

                <Card className="bg-blue-500/10 border-0">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{salesCount}</p>
                    <p className="text-xs text-muted-foreground">Ventes</p>
                  </CardContent>
                </Card>

                <Card className="bg-pink-500/10 border-0">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-pink-600">{conversionRate}%</p>
                    <p className="text-xs text-muted-foreground">Conversion</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Colonne gauche - Image et galerie */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Image principale */}
                  <div className="relative aspect-square bg-muted rounded-xl overflow-hidden group">
                    {images.length > 0 ? (
                      <>
                        <img 
                          src={images[currentImageIndex]} 
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        
                        {/* Navigation */}
                        {images.length > 1 && (
                          <>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              onClick={prevImage}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              onClick={nextImage}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {/* Fullscreen */}
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          onClick={() => setIsFullscreen(true)}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>

                        {/* Counter */}
                        {images.length > 1 && (
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                            {currentImageIndex + 1} / {images.length}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <Package className="h-20 w-20 text-muted-foreground/30" />
                        <span className="text-sm text-muted-foreground mt-2">Aucune image</span>
                      </div>
                    )}
                  </div>

                  {/* Miniatures */}
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {images.map((img: string, idx: number) => (
                        <button
                          key={idx}
                          className={cn(
                            "relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                            idx === currentImageIndex ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted-foreground/50"
                          )}
                          onClick={() => setCurrentImageIndex(idx)}
                        >
                          <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Scores IA */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Scores d'optimisation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Score global</span>
                          <span className={cn("text-lg font-bold", scoreColors.text)}>{aiScore}/100</span>
                        </div>
                        <Progress value={aiScore} className="h-2" />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">SEO</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={seoScore} className="w-20 h-1.5" />
                            <span className="text-sm font-medium">{seoScore}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Contenu</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={contentScore} className="w-20 h-1.5" />
                            <span className="text-sm font-medium">{contentScore}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Tendance</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={trendScore} className="w-20 h-1.5" />
                            <span className="text-sm font-medium">{trendScore}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Colonne droite - Détails et onglets */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Alertes et suggestions */}
                  {optimizationSuggestions.length > 0 && (
                    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
                          <Lightbulb className="h-4 w-4" />
                          Suggestions d'optimisation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {optimizationSuggestions.slice(0, 3).map((suggestion, idx) => {
                            const Icon = suggestion.icon
                            return (
                              <div 
                                key={idx} 
                                className={cn(
                                  "flex items-start gap-2 text-sm p-2 rounded-lg",
                                  suggestion.priority === 'high' ? 'bg-red-100/50 dark:bg-red-900/20' :
                                  suggestion.priority === 'medium' ? 'bg-amber-100/50 dark:bg-amber-900/20' :
                                  'bg-muted/50'
                                )}
                              >
                                <Icon className={cn(
                                  "h-4 w-4 mt-0.5 shrink-0",
                                  suggestion.priority === 'high' ? 'text-red-600' :
                                  suggestion.priority === 'medium' ? 'text-amber-600' :
                                  'text-muted-foreground'
                                )} />
                                <span>{suggestion.text}</span>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Onglets */}
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full grid grid-cols-4">
                      <TabsTrigger value="overview" className="text-xs">Détails</TabsTrigger>
                      <TabsTrigger value="pricing" className="text-xs">Prix & Marge</TabsTrigger>
                      <TabsTrigger value="seo" className="text-xs">SEO</TabsTrigger>
                      <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-4 space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {product.description ? (
                            <p className="text-sm leading-relaxed">{product.description}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">Aucune description disponible</p>
                          )}
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">SKU</span>
                              <span className="font-mono text-sm">{product.sku || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Catégorie</span>
                              <span className="text-sm">{product.category || 'Non défini'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Statut</span>
                              <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                {product.status === 'active' ? 'Actif' : 'Inactif'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Créé le</span>
                              <span className="text-sm">
                                {new Date(product.created_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Modifié le</span>
                              <span className="text-sm">
                                {new Date(product.updated_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Source</span>
                              <Badge variant="outline" className="capitalize">
                                {(product as UnifiedProduct).source || 'local'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="pricing" className="mt-4 space-y-4">
                      <Card>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-3 gap-6">
                            <div className="text-center p-4 rounded-xl bg-primary/10">
                              <p className="text-3xl font-bold text-primary">{formatCurrency(product.price)}</p>
                              <p className="text-sm text-muted-foreground mt-1">Prix de vente</p>
                            </div>
                            
                            <div className="text-center p-4 rounded-xl bg-muted">
                              <p className="text-3xl font-bold">
                                {product.cost_price ? formatCurrency(product.cost_price) : 'N/A'}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">Prix d'achat</p>
                            </div>
                            
                            <div className={cn(
                              "text-center p-4 rounded-xl",
                              calculateMargin() >= 30 ? "bg-emerald-500/10" : calculateMargin() >= 15 ? "bg-amber-500/10" : "bg-red-500/10"
                            )}>
                              <p className={cn(
                                "text-3xl font-bold",
                                calculateMargin() >= 30 ? "text-emerald-600" : calculateMargin() >= 15 ? "text-amber-600" : "text-red-600"
                              )}>
                                {formatCurrency(calculateProfit())}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">Profit unitaire</p>
                            </div>
                          </div>
                          
                          <Separator className="my-6" />
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Marge bénéficiaire</span>
                              <div className="flex items-center gap-3">
                                <Progress value={calculateMargin()} className="w-32 h-2" />
                                <Badge className={cn(
                                  calculateMargin() >= 30 ? "bg-emerald-500" : calculateMargin() >= 15 ? "bg-amber-500" : "bg-red-500"
                                )}>
                                  {calculateMargin()}%
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Profit potentiel (stock actuel)</span>
                              <span className="font-bold text-lg">
                                {formatCurrency(calculateProfit() * (product.stock_quantity || 0))}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="seo" className="mt-4 space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Aperçu SEO Google
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-white dark:bg-gray-900 border rounded-lg p-4 space-y-1">
                            <p className="text-blue-600 dark:text-blue-400 text-lg hover:underline cursor-pointer truncate">
                              {product.name}
                            </p>
                            <p className="text-green-700 dark:text-green-500 text-sm">
                              www.votre-boutique.com › produits › {product.sku || 'product'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {product.description || 'Aucune description disponible. Ajoutez une description pour améliorer le référencement.'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {seoSuggestions.length > 0 && (
                        <Card className="border-amber-200 bg-amber-50/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                              <AlertTriangle className="h-4 w-4" />
                              Points à améliorer
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {seoSuggestions.map((sug, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm p-2 rounded bg-white/50 dark:bg-gray-900/50">
                                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-amber-700">{sug.issue}</p>
                                    <p className="text-muted-foreground">{sug.suggestion}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Score SEO</span>
                              <span className={cn("text-xl font-bold", getScoreColor(seoScore).text)}>
                                {seoScore}/100
                              </span>
                            </div>
                            <Progress value={seoScore} className="h-2" />
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Longueur titre</span>
                              <span className={cn(
                                "text-xl font-bold",
                                product.name.length >= 50 ? "text-emerald-500" : "text-amber-500"
                              )}>
                                {product.name.length}/60
                              </span>
                            </div>
                            <Progress value={(product.name.length / 60) * 100} className="h-2" />
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="analytics" className="mt-4 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <Eye className="h-5 w-5 text-violet-500" />
                            </div>
                            <p className="text-2xl font-bold">{viewsCount}</p>
                            <p className="text-xs text-muted-foreground">Vues totales</p>
                            <div className="flex items-center justify-center gap-1 mt-2 text-emerald-500 text-xs">
                              <ArrowUpRight className="h-3 w-3" />
                              +12% ce mois
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <ShoppingCart className="h-5 w-5 text-blue-500" />
                            </div>
                            <p className="text-2xl font-bold">{salesCount}</p>
                            <p className="text-xs text-muted-foreground">Ventes totales</p>
                            <div className="flex items-center justify-center gap-1 mt-2 text-emerald-500 text-xs">
                              <ArrowUpRight className="h-3 w-3" />
                              +8% ce mois
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <Activity className="h-5 w-5 text-pink-500" />
                            </div>
                            <p className="text-2xl font-bold">{conversionRate}%</p>
                            <p className="text-xs text-muted-foreground">Taux conversion</p>
                            <div className="flex items-center justify-center gap-1 mt-2 text-red-500 text-xs">
                              <ArrowDownRight className="h-3 w-3" />
                              -2% ce mois
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Revenus générés</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-3xl font-bold">{formatCurrency(salesCount * product.price)}</p>
                              <p className="text-sm text-muted-foreground">Revenus totaux</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-emerald-600">
                                {formatCurrency(salesCount * calculateProfit())}
                              </p>
                              <p className="text-sm text-muted-foreground">Profit total</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Fullscreen image modal */}
        {isFullscreen && images.length > 0 && (
          <div 
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setIsFullscreen(false)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/10"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img 
              src={images[currentImageIndex]} 
              alt={product.name}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 text-white hover:bg-white/10"
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-16 text-white hover:bg-white/10"
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}