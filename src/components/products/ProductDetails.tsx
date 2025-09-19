import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Edit, 
  Copy, 
  Archive, 
  BarChart3, 
  Image as ImageIcon, 
  Package, 
  TrendingUp,
  Star,
  Heart,
  Share2,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  ShoppingCart
} from 'lucide-react'
import { useRealProducts } from '@/hooks/useRealProducts'
import { ProductEditModal } from '@/components/modals/ProductEditModal'
import { ProductVariantManager } from '@/components/products/ProductVariantManager'
import { ProductImageManager } from '@/components/products/ProductImageManager'
import { ProductPerformanceAnalytics } from '@/components/products/ProductPerformanceAnalytics'

interface ProductDetailsProps {
  productId: string
  onClose: () => void
}

export function ProductDetails({ productId, onClose }: ProductDetailsProps) {
  const { products } = useRealProducts()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  const product = products.find(p => p.id === productId)
  
  if (!product) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-warning mb-4" />
        <h3 className="text-lg font-semibold mb-2">Produit non trouvé</h3>
        <p className="text-muted-foreground">Le produit demandé n'existe pas ou a été supprimé.</p>
        <Button onClick={onClose} className="mt-4">Fermer</Button>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20'
      case 'inactive': return 'bg-muted text-muted-foreground border-muted'
      default: return 'bg-muted text-muted-foreground border-muted'
    }
  }

  const getStockStatus = () => {
    const stock = product.stock_quantity || 0
    if (stock === 0) return { label: 'Rupture de stock', color: 'text-destructive', icon: AlertTriangle }
    if (stock < 10) return { label: 'Stock faible', color: 'text-warning', icon: Clock }
    return { label: 'En stock', color: 'text-success', icon: CheckCircle }
  }

  const stockStatus = getStockStatus()
  const profitMargin = product.cost_price ? 
    ((product.price - product.cost_price) / product.cost_price * 100) : 0

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <Badge className={getStatusColor(product.status)}>
              {product.status === 'active' ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
          <p className="text-muted-foreground">{product.description}</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Dupliquer
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold">{product.price}€</div>
            <div className="text-sm text-muted-foreground">Prix de vente</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="flex items-center justify-center gap-2">
              <stockStatus.icon className={`h-5 w-5 ${stockStatus.color}`} />
              <span className="text-2xl font-bold">{product.stock_quantity || 0}</span>
            </div>
            <div className="text-sm text-muted-foreground">{stockStatus.label}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-info mx-auto mb-2" />
            <div className="text-2xl font-bold">{profitMargin.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Marge bénéficiaire</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold">4.2</div>
            <div className="text-sm text-muted-foreground">Note moyenne</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="variants">Variantes</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU:</span>
                  <span className="font-mono">{product.sku || 'Non défini'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Catégorie:</span>
                  <Badge variant="outline">{product.category || 'Non catégorisé'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prix coût:</span>
                  <span>{product.cost_price ? `${product.cost_price}€` : 'Non défini'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créé le:</span>
                  <span>{new Date(product.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Taux de conversion</span>
                    <span className="text-sm font-medium">3.2%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Satisfaction client</span>
                    <span className="text-sm font-medium">84%</span>
                  </div>
                  <Progress value={84} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Score SEO</span>
                    <span className="text-sm font-medium">67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'Vente', details: '2 unités vendues', time: 'Il y a 2 heures', icon: ShoppingCart, color: 'text-success' },
                  { action: 'Stock mis à jour', details: 'Stock réduit de 50 à 48', time: 'Il y a 4 heures', icon: Package, color: 'text-info' },
                  { action: 'Prix modifié', details: 'De 45€ à 49€', time: 'Il y a 1 jour', icon: DollarSign, color: 'text-warning' },
                  { action: 'Avis client', details: 'Nouvelle évaluation 5★', time: 'Il y a 2 jours', icon: Star, color: 'text-warning' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
                    <activity.icon className={`h-5 w-5 ${activity.color}`} />
                    <div className="flex-1">
                      <div className="font-medium">{activity.action}</div>
                      <div className="text-sm text-muted-foreground">{activity.details}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{activity.time}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variants">
          <ProductVariantManager productId={productId} />
        </TabsContent>

        <TabsContent value="images">
          <ProductImageManager productId={productId} />
        </TabsContent>

        <TabsContent value="analytics">
          <ProductPerformanceAnalytics productId={productId} />
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>Optimisation SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Titre SEO</label>
                <div className="text-sm text-muted-foreground mb-2">
                  {product.name} | Achat en ligne - Description optimisée
                </div>
                <Progress value={75} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">Bon titre, pourrait être optimisé</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Meta Description</label>
                <div className="text-sm text-muted-foreground mb-2">
                  Découvrez {product.name} à prix compétitif. {product.description?.slice(0, 100)}...
                </div>
                <Progress value={60} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">Description correcte, peut être améliorée</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Mots-clés principaux</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">{product.category}</Badge>
                    <Badge variant="outline">{product.name?.split(' ')[0]}</Badge>
                    <Badge variant="outline">qualité</Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Score global SEO</label>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={67} className="flex-1 h-2" />
                    <span className="text-sm font-medium">67%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProductEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        product={product}
      />
    </div>
  )
}