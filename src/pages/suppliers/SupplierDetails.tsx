import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useRealSuppliers } from '@/hooks/useRealSuppliers'
import { useSupplierProducts, useSupplierProductCount } from '@/hooks/useSupplierProducts'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Edit,
  MoreVertical,
  Star,
  TrendingUp,
  Package,
  ShoppingCart,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  Globe,
  MapPin,
  Activity,
  BarChart3,
  Calendar,
  Truck,
  RefreshCw
} from 'lucide-react'

export default function SupplierDetails() {
  const { supplierId } = useParams()
  const navigate = useNavigate()
  const { suppliers, isLoading } = useRealSuppliers()
  const { data: supplierProductsData, isLoading: productsLoading } = useSupplierProducts(supplierId, 100)
  const { data: productCount } = useSupplierProductCount(supplierId)
  
  const supplier = suppliers.find(s => s.id === supplierId)

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Fournisseur introuvable</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/suppliers')}>
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Real products from database + fallback mock for orders
  const realProducts = supplierProductsData?.products || []
  
  const mockData = {
    performance: {
      reliability: 95.8,
      quality: 94.2,
      deliveryTime: 8.5,
      responseTime: 2.3
    },
    orders: {
      total: 247,
      pending: 12,
      completed: 230,
      cancelled: 5
    },
    financial: {
      totalSpent: 185420,
      averageOrderValue: 751,
      lastPayment: '2024-01-15',
      outstandingBalance: 12500
    },
    recentOrders: [
      { id: 'CMD-001', date: '2024-01-15', amount: 1250, status: 'delivered' },
      { id: 'CMD-002', date: '2024-01-10', amount: 890, status: 'in_transit' },
      { id: 'CMD-003', date: '2024-01-05', amount: 2340, status: 'processing' }
    ]
  }

  return (
    <>
      <Helmet>
        <title>{supplier.name} - Détails Fournisseur - ShopOpti</title>
        <meta name="description" content={`Informations détaillées sur ${supplier.name}`} />
      </Helmet>

      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/suppliers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{supplier.name}</h1>
                  <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                    {supplier.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{supplier.country}</span>
                  </div>
                  {supplier.website && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {supplier.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{supplier.rating || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => navigate(`/suppliers/${supplierId}/catalog`)}>
                  <Package className="h-4 w-4 mr-2" />
                  Catalogue
                </Button>
                <Button variant="outline" onClick={() => navigate(`/suppliers/${supplierId}/import`)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Importer
                </Button>
                <Button variant="outline" onClick={() => navigate(`/suppliers/${supplierId}/feeds`)}>
                  <Globe className="h-4 w-4 mr-2" />
                  Feeds
                </Button>
                <Button variant="outline" onClick={() => navigate(`/suppliers/${supplierId}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Commandes totales</p>
                  <p className="text-2xl font-bold">{mockData.orders.total}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    +12% vs mois dernier
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valeur totale</p>
                  <p className="text-2xl font-bold">€{mockData.financial.totalSpent.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Moy: €{mockData.financial.averageOrderValue}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fiabilité</p>
                  <p className="text-2xl font-bold">{mockData.performance.reliability}%</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <CheckCircle className="h-3 w-3" />
                    Excellent
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Délai moyen</p>
                  <p className="text-2xl font-bold">{mockData.performance.deliveryTime}j</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Temps réponse: {mockData.performance.responseTime}h
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            {/* Actions Rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
                onClick={() => navigate(`/suppliers/${supplierId}/catalog`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Catalogue</h3>
                      <p className="text-sm text-muted-foreground">
                        Produits du fournisseur
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20"
                onClick={() => navigate(`/suppliers/${supplierId}/import`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <RefreshCw className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Importer</h3>
                      <p className="text-sm text-muted-foreground">
                        Synchroniser les produits
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20"
                onClick={() => navigate(`/suppliers/${supplierId}/feeds`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <Globe className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Feeds</h3>
                      <p className="text-sm text-muted-foreground">
                        Flux multi-canaux
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations de contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">
                          {supplier.contact_email_masked || 'Non renseigné'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Téléphone</p>
                        <p className="text-sm text-muted-foreground">
                          {supplier.contact_phone_masked || 'Non renseigné'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Site web</p>
                        <p className="text-sm text-muted-foreground">
                          {supplier.website || 'Non renseigné'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Localisation</p>
                        <p className="text-sm text-muted-foreground">{supplier.country}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Créé le</span>
                      <span className="font-medium">
                        {new Date(supplier.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-muted-foreground">Dernière mise à jour</span>
                      <span className="font-medium">
                        {new Date(supplier.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Score */}
              <Card>
                <CardHeader>
                  <CardTitle>Score de Performance</CardTitle>
                  <CardDescription>Indicateurs clés de performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Fiabilité</span>
                        <span className="font-medium">{mockData.performance.reliability}%</span>
                      </div>
                      <Progress value={mockData.performance.reliability} />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Qualité</span>
                        <span className="font-medium">{mockData.performance.quality}%</span>
                      </div>
                      <Progress value={mockData.performance.quality} />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Délais de livraison</span>
                        <span className="font-medium">
                          {mockData.performance.deliveryTime} jours
                        </span>
                      </div>
                      <Progress value={85} />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Temps de réponse</span>
                        <span className="font-medium">
                          {mockData.performance.responseTime}h
                        </span>
                      </div>
                      <Progress value={92} />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Score global</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-green-600">94.2</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Excellent
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Commandes récentes */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Commandes récentes</CardTitle>
                  <CardDescription>Dernières transactions avec ce fournisseur</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockData.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{order.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold">€{order.amount.toLocaleString()}</p>
                          <Badge variant={
                            order.status === 'delivered' ? 'default' :
                            order.status === 'in_transit' ? 'secondary' : 'outline'
                          }>
                            {order.status === 'delivered' ? 'Livré' :
                             order.status === 'in_transit' ? 'En transit' : 'En cours'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Voir toutes les commandes
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Products */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Produits fournis</CardTitle>
                    <CardDescription>
                      {productCount || realProducts.length} produits disponibles
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(`/suppliers/${supplierId}/catalog`)}>
                      Voir tout
                    </Button>
                    <Button onClick={() => navigate(`/suppliers/${supplierId}/import`)}>
                      <Package className="h-4 w-4 mr-2" />
                      Importer
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : realProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Aucun produit importé</p>
                    <p className="text-sm mt-1">Importez des produits depuis ce fournisseur pour les voir ici</p>
                    <Button className="mt-4" onClick={() => navigate(`/suppliers/${supplierId}/import`)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Importer des produits
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {realProducts.slice(0, 20).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name} 
                              className="w-12 h-12 rounded object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg'
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">{product.name || 'Produit sans nom'}</p>
                            <p className="text-sm text-muted-foreground">SKU: {product.sku || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Prix</p>
                            <p className="font-bold">€{product.price?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Stock</p>
                            <p className="font-bold">{product.stock_quantity || 0}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/products/${product.id}`)}>
                            Détails
                          </Button>
                        </div>
                      </div>
                    ))}
                    {realProducts.length > 20 && (
                      <div className="text-center pt-4">
                        <Button variant="outline" onClick={() => navigate(`/suppliers/${supplierId}/catalog`)}>
                          Voir les {productCount || realProducts.length} produits
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des commandes</CardTitle>
                <CardDescription>
                  Toutes les transactions avec ce fournisseur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>L'historique complet des commandes sera affiché ici</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analyse de Performance</CardTitle>
                <CardDescription>
                  Métriques détaillées et évolution dans le temps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Les graphiques de performance seront affichés ici</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Documents & Certifications</CardTitle>
                    <CardDescription>
                      Contrats, certifications et documents administratifs
                    </CardDescription>
                  </div>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Ajouter un document
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Les documents seront affichés ici</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
