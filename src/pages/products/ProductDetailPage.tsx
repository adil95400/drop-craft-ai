/**
 * Page de détail produit - Utilise ProductsUnifiedService et ProductAnalyticsService
 */

import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductsUnifiedService } from '@/services/ProductsUnifiedService'
import { ProductAnalyticsService } from '@/services/ProductAnalyticsService'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { ArrowLeft, Loader2, Package, TrendingUp, History, Globe, Images, Languages, MessageSquare, Target, Settings } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { ProductVariantsAdvancedManager } from '@/components/products/ProductVariantsAdvancedManager'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    }
  })

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id, userData?.id],
    queryFn: () => ProductsUnifiedService.getProductById(id!, userData!.id),
    enabled: !!id && !!userData?.id
  })

  const { data: analytics } = useQuery({
    queryKey: ['product-analytics', id, userData?.id],
    queryFn: () => ProductAnalyticsService.getProductMetrics(id!, userData!.id),
    enabled: !!id && !!userData?.id
  })

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Chargement du produit...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Produit non trouvé</h3>
            <Button onClick={() => navigate('/products')}>Retour aux produits</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{product.name} - Détails Produit</title>
      </Helmet>
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/products')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <p className="text-muted-foreground">{product.category} • SKU: {product.sku || 'N/A'}</p>
            </div>
          </div>
          <Badge variant="outline">{product.source}</Badge>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" className="gap-2">
                  <Package className="h-4 w-4" />
                  Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-2">
                  <Target className="h-4 w-4" />
                  Audit Qualité
                </TabsTrigger>
                <TabsTrigger value="variants" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Variants
                </TabsTrigger>
                <TabsTrigger value="raw" className="gap-2">
                  <Package className="h-4 w-4" />
                  Données brutes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Informations Générales</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Prix:</span>
                          <span className="font-medium">{product.price}€</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stock:</span>
                          <span className="font-medium">{product.stock_quantity || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Catégorie:</span>
                          <span className="font-medium">{product.category || 'Non défini'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Statut:</span>
                          <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                            {product.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {product.image_url && (
                      <div>
                        <h3 className="font-semibold mb-2">Image Principale</h3>
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-sm text-muted-foreground">
                        {product.description || 'Aucune description'}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics">
                <div className="space-y-4">
                  {analytics ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Vues (7j)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{analytics.views7d || 0}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Ventes (7j)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{analytics.sales7d || 0}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Revenue (7j)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{analytics.revenue7d?.toFixed(2) || 0}€</div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Card className="bg-muted/50">
                      <CardContent className="pt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          Aucune donnée analytics disponible pour ce produit
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="audit">
                <Card>
                  <CardHeader>
                    <CardTitle>Audit Qualité Produit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Fonctionnalité d'audit en cours d'intégration avec le moteur d'audit unifié
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="variants">
                <Card>
                  <CardHeader>
                    <CardTitle>Gestion des Variants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProductVariantsAdvancedManager 
                      productId={product.id}
                      open={true}
                      onOpenChange={() => {}}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="raw">
                <Card>
                  <CardHeader>
                    <CardTitle>Données brutes du produit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Objet Complet</h3>
                        <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[500px]">
                          {JSON.stringify(product, null, 2)}
                        </pre>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">ID:</span>
                          <p className="font-mono text-xs mt-1">{product.id}</p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Source:</span>
                          <Badge variant="outline" className="mt-1">{product.source}</Badge>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Créé le:</span>
                          <p className="text-xs mt-1">{new Date(product.created_at).toLocaleString('fr-FR')}</p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Modifié le:</span>
                          <p className="text-xs mt-1">{new Date(product.updated_at).toLocaleString('fr-FR')}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default ProductDetailPage
