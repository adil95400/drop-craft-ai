import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRealProducts } from '@/hooks/useRealProducts'
import { useProductAudit } from '@/hooks/useProductAuditEngine'
import { ProductEditDialog } from '@/components/products/ProductEditDialog'
import { ProductQuickEditDialog } from '@/components/products/ProductQuickEditDialog'
import { ProductAuditPanel } from '@/components/products/ProductAuditPanel'
import { 
  ArrowLeft, Edit, MoreHorizontal, Share, Heart, 
  Package, DollarSign, BarChart3, Users, TrendingUp,
  Star, Eye, ShoppingCart, AlertTriangle, Settings,
  Copy, Trash2, RefreshCw, Download, Target
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { products, updateProduct, deleteProduct } = useRealProducts()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showQuickEdit, setShowQuickEdit] = useState(false)

  const product = products.find(p => p.id === id)
  
  // Audit du produit
  const auditResult = useProductAudit(product as any);

  // Données simulées pour les analytics
  const salesData = [
    { date: '2024-01-01', sales: 12, revenue: 15600, views: 450 },
    { date: '2024-01-02', sales: 18, revenue: 23400, views: 520 },
    { date: '2024-01-03', sales: 15, revenue: 19500, views: 480 },
    { date: '2024-01-04', sales: 22, revenue: 28600, views: 610 },
    { date: '2024-01-05', sales: 19, revenue: 24700, views: 550 },
    { date: '2024-01-06', sales: 25, revenue: 32500, views: 680 },
    { date: '2024-01-07', sales: 20, revenue: 26000, views: 590 }
  ]

  const reviews = [
    {
      id: '1',
      author: 'Marie D.',
      rating: 5,
      date: '2024-01-15',
      comment: 'Excellent produit, très satisfaite de mon achat. La qualité est au rendez-vous.'
    },
    {
      id: '2', 
      author: 'Pierre M.',
      rating: 4,
      date: '2024-01-10',
      comment: 'Bon produit dans l\'ensemble, livraison rapide. Un petit bémol sur l\'emballage.'
    },
    {
      id: '3',
      author: 'Sophie L.',
      rating: 5,
      date: '2024-01-08',
      comment: 'Parfait ! Conforme à mes attentes. Je recommande vivement.'
    }
  ]

  if (!product) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Produit non trouvé</h3>
            <p className="text-muted-foreground mb-4">
              Le produit que vous recherchez n'existe pas ou a été supprimé.
            </p>
            <Button onClick={() => navigate('/products')}>
              Retour aux produits
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const calculateMargin = () => {
    if (!product.cost_price) return 0
    return ((product.price - product.cost_price) / product.price * 100)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const getStockStatus = () => {
    const stock = product.stock_quantity || 0
    if (stock === 0) return { status: 'Rupture de stock', color: 'text-red-600', variant: 'destructive' as const }
    if (stock < 10) return { status: 'Stock faible', color: 'text-orange-600', variant: 'secondary' as const }
    return { status: 'En stock', color: 'text-green-600', variant: 'secondary' as const }
  }

  const stockStatus = getStockStatus()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/products')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">
              {product.category} • SKU: {product.sku || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowQuickEdit(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Édition rapide
          </Button>
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
          <Button variant="outline">
            <Share className="h-4 w-4 mr-2" />
            Partager
          </Button>
          <Button variant="outline">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prix de vente</p>
                <p className="text-2xl font-bold">{formatPrice(product.price)}</p>
              </div>
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock</p>
                <p className="text-2xl font-bold">{product.stock_quantity || 0}</p>
                <Badge variant={stockStatus.variant} className="mt-1">
                  {stockStatus.status}
                </Badge>
              </div>
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Marge</p>
                <p className="text-2xl font-bold">{calculateMargin().toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">
                  {product.cost_price ? formatPrice(product.price - product.cost_price) : 'N/A'}
                </p>
              </div>
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventes (30j)</p>
                <p className="text-2xl font-bold">156</p>
                <div className="flex items-center text-green-600 text-sm">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5%
                </div>
              </div>
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Details */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Aperçu</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="audit" className="gap-2">
                <Target className="h-4 w-4" />
                Audit Qualité
              </TabsTrigger>
              <TabsTrigger value="reviews">Avis (23)</TabsTrigger>
              <TabsTrigger value="inventory">Stock</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Description du produit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {product.description || 'Aucune description disponible'}
                  </p>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">électronique</Badge>
                      <Badge variant="outline">premium</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informations détaillées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Catégorie</p>
                      <p className="font-medium">{product.category || 'Non classé'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fournisseur</p>
                      <p className="font-medium">N/A</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Prix de revient</p>
                      <p className="font-medium">
                        {product.cost_price ? formatPrice(product.cost_price) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Poids</p>
                      <p className="font-medium">N/A</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date de création</p>
                      <p className="font-medium">
                        {new Date(product.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dernière MAJ</p>
                      <p className="font-medium">
                        {new Date(product.updated_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Évolution des ventes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenus par jour</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="space-y-4">
              {auditResult ? (
                <ProductAuditPanel 
                  auditResult={auditResult}
                  product={product}
                  productSource="products"
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Chargement de l'audit...
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Avis clients
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-medium">4.7/5</span>
                      <span className="text-sm text-muted-foreground">(23 avis)</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{review.author}</span>
                          <div className="flex">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion du stock</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Stock actuel</p>
                      <p className="text-2xl font-bold">{product.stock_quantity || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Stock minimum</p>
                      <p className="text-2xl font-bold">10</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline">Ajuster le stock</Button>
                    <Button variant="outline">Historique</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" onClick={() => setShowQuickEdit(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button variant="outline" className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer
              </Button>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button variant="destructive" className="w-full" onClick={() => deleteProduct(product.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance récente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Vues aujourd'hui</span>
                <span className="font-medium">342</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ventes cette semaine</span>
                <span className="font-medium">28</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taux de conversion</span>
                <span className="font-medium">3.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Revenus ce mois</span>
                <span className="font-medium">{formatPrice(8945)}</span>
              </div>
            </CardContent>
          </Card>

          {(product.stock_quantity || 0) < 10 && (
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-5 w-5" />
                  Alerte stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-700">
                  Le stock de ce produit est faible. Pensez à le réapprovisionner.
                </p>
                <Button variant="outline" className="w-full mt-3">
                  Réapprovisionner
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ProductEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        product={product}
        onProductUpdated={() => setShowEditDialog(false)}
      />

      <ProductQuickEditDialog
        open={showQuickEdit}
        onOpenChange={setShowQuickEdit}
        product={product}
        onProductUpdated={() => setShowQuickEdit(false)}
      />
    </div>
  )
}