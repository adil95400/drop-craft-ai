import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
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
  Globe
} from 'lucide-react'
import { Product } from '@/hooks/useRealProducts'
import { UnifiedProduct } from '@/services/ProductsUnifiedService'

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
  const [activeTab, setActiveTab] = useState('overview')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

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
    if (stock > 50) return { label: 'En stock', color: 'bg-green-500', variant: 'success' as const }
    if (stock > 10) return { label: 'Stock limité', color: 'bg-orange-500', variant: 'warning' as const }
    if (stock > 0) return { label: 'Stock faible', color: 'bg-red-500', variant: 'destructive' as const }
    return { label: 'Rupture', color: 'bg-destructive', variant: 'destructive' as const }
  }

  const getAiScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const stockStatus = getStockStatus()
  const images = (product as any).images || (product.image_url ? [product.image_url] : [])
  const aiScore = (product as any).ai_score || 0
  const trendScore = (product as any).trend_score || 0
  const isWinner = (product as any).is_winner
  const isTrending = (product as any).is_trending

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full max-h-[95vh]">
          {/* Header avec actions */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg line-clamp-1">{product.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>SKU: {product.sku || 'N/A'}</span>
                  <span>•</span>
                  <span>{product.category || 'Non catégorisé'}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit3 className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
              )}
              {onDuplicate && (
                <Button variant="outline" size="sm" onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-1" />
                  Dupliquer
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" size="sm" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              {/* Badges de statut en haut */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
                <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                  {product.status === 'active' ? 'Actif' : 'Inactif'}
                </Badge>
                {(product as UnifiedProduct).source && (
                  <Badge variant="outline" className="capitalize">
                    <Globe className="h-3 w-3 mr-1" />
                    {(product as UnifiedProduct).source}
                  </Badge>
                )}
                {isWinner && (
                  <Badge className="bg-yellow-500">
                    <Star className="h-3 w-3 mr-1" />
                    Winner
                  </Badge>
                )}
                {isTrending && (
                  <Badge className="bg-purple-500">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Colonne gauche - Image et galerie */}
                <div className="space-y-4">
                  {/* Image principale avec navigation */}
                  <div className="relative aspect-square bg-muted rounded-xl overflow-hidden group">
                    {images.length > 0 ? (
                      <>
                        <img 
                          src={images[currentImageIndex]} 
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {images.length > 1 && (
                          <>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={prevImage}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={nextImage}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 px-2 py-1 rounded-full text-xs">
                              {currentImageIndex + 1} / {images.length}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                        <Package className="h-20 w-20 mb-2" />
                        <span className="text-sm">Aucune image</span>
                      </div>
                    )}
                  </div>

                  {/* Miniatures */}
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {images.map((img: string, idx: number) => (
                        <button
                          key={idx}
                          className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                            idx === currentImageIndex ? 'border-primary' : 'border-transparent'
                          }`}
                          onClick={() => setCurrentImageIndex(idx)}
                        >
                          <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Score IA */}
                  {aiScore > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Score IA
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Score global</span>
                            <span className={`text-2xl font-bold ${getAiScoreColor(aiScore)}`}>
                              {aiScore}/100
                            </span>
                          </div>
                          <Progress value={aiScore} className="h-2" />
                          {trendScore > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Tendance</span>
                              <span className="font-medium">{trendScore}%</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Colonne droite - Informations détaillées */}
                <div className="space-y-4">
                  {/* Prix et marge - Mise en avant */}
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-primary">{formatCurrency(product.price)}</p>
                          <p className="text-xs text-muted-foreground mt-1">Prix de vente</p>
                        </div>
                        <div className="text-center border-x border-border">
                          <p className={`text-3xl font-bold ${calculateMargin() > 30 ? 'text-green-500' : 'text-orange-500'}`}>
                            {calculateMargin()}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Marge</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-blue-500">{product.stock_quantity || 0}</p>
                          <p className="text-xs text-muted-foreground mt-1">En stock</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Onglets de détails */}
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger value="overview">Détails</TabsTrigger>
                      <TabsTrigger value="pricing">Prix</TabsTrigger>
                      <TabsTrigger value="stock">Stock</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-4 space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Informations produit
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {product.description && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                              <p className="text-sm leading-relaxed">{product.description}</p>
                            </div>
                          )}
                          
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">SKU</p>
                              <p className="font-mono text-sm">{product.sku || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Catégorie</p>
                              <p className="text-sm">{product.category || 'Non défini'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Créé le</p>
                              <p className="text-sm">
                                {new Date(product.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Modifié le</p>
                              <p className="text-sm">
                                {new Date(product.updated_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="pricing" className="mt-4 space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Analyse des prix
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center py-3 border-b">
                              <span className="text-muted-foreground">Prix de vente</span>
                              <span className="font-bold text-xl">{formatCurrency(product.price)}</span>
                            </div>
                            
                            {product.cost_price && (
                              <>
                                <div className="flex justify-between items-center py-3 border-b">
                                  <span className="text-muted-foreground">Prix d'achat</span>
                                  <span className="font-medium">{formatCurrency(product.cost_price)}</span>
                                </div>

                                <div className="flex justify-between items-center py-3 border-b">
                                  <span className="text-muted-foreground flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                    Bénéfice unitaire
                                  </span>
                                  <span className="font-bold text-green-600 text-lg">
                                    {formatCurrency(calculateProfit())}
                                  </span>
                                </div>
                              </>
                            )}

                            <div className="flex justify-between items-center py-3">
                              <span className="text-muted-foreground">Marge bénéficiaire</span>
                              <div className="flex items-center gap-2">
                                <Progress value={calculateMargin()} className="w-24 h-2" />
                                <Badge className={calculateMargin() > 30 ? 'bg-green-500' : 'bg-orange-500'}>
                                  {calculateMargin()}%
                                </Badge>
                              </div>
                            </div>

                            {/* Indicateur de rentabilité */}
                            <div className="mt-4 p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2">
                                {calculateMargin() >= 30 ? (
                                  <>
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span className="text-sm font-medium text-green-600">Bonne rentabilité</span>
                                  </>
                                ) : calculateMargin() >= 15 ? (
                                  <>
                                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                                    <span className="text-sm font-medium text-orange-600">Rentabilité moyenne</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                    <span className="text-sm font-medium text-red-600">Rentabilité faible</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="stock" className="mt-4 space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Boxes className="h-4 w-4" />
                            Gestion du stock
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b">
                              <span className="text-muted-foreground">Quantité disponible</span>
                              <span className="font-bold text-2xl">{product.stock_quantity || 0}</span>
                            </div>

                            <div className="flex justify-between items-center py-3 border-b">
                              <span className="text-muted-foreground">Statut</span>
                              <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
                            </div>

                            {product.price && product.stock_quantity && product.stock_quantity > 0 && (
                              <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-muted-foreground">Valeur du stock (vente)</span>
                                <span className="font-medium">
                                  {formatCurrency(product.price * product.stock_quantity)}
                                </span>
                              </div>
                            )}

                            {product.cost_price && product.stock_quantity && product.stock_quantity > 0 && (
                              <div className="flex justify-between items-center py-3">
                                <span className="text-muted-foreground">Valeur du stock (achat)</span>
                                <span className="font-medium">
                                  {formatCurrency(product.cost_price * product.stock_quantity)}
                                </span>
                              </div>
                            )}

                            {/* Alerte de stock */}
                            {(product.stock_quantity || 0) <= 10 && (
                              <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-destructive" />
                                  <span className="text-sm font-medium text-destructive">
                                    {product.stock_quantity === 0 
                                      ? 'Produit en rupture de stock !'
                                      : 'Stock faible - Pensez à réapprovisionner'}
                                  </span>
                                </div>
                              </div>
                            )}
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
      </DialogContent>
    </Dialog>
  )
}