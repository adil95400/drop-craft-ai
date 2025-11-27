import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductTranslations, ProductReviews } from '@/components/products'
import { ProductImageManager } from '@/components/products/ProductImageManager'
import { ProductAuditBlock } from '@/components/products/ProductAuditBlock'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package, Languages, MessageSquare, Images, Target } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProduct } from '@/hooks/useUnifiedProducts'
import { Loader2 } from 'lucide-react'

export default function ProductDetailsPage() {
  const navigate = useNavigate()
  const { productId } = useParams<{ productId: string }>()
  const { data: product, isLoading } = useProduct(productId || '')

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    )
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Produit introuvable</p>
        </div>
      </MainLayout>
    )
  }
  
  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Détails du Produit</h1>
              <p className="text-muted-foreground">Gestion complète de votre produit</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-2">
            <Package className="h-4 w-4" />
            {product.sku || 'Sans SKU'}
          </Badge>
        </div>

        {/* Bloc Audit IA */}
        <ProductAuditBlock 
          product={product}
          onOptimize={() => {
            // Refresh product data
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle>{product.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="audit" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="audit" className="gap-2">
                  <Target className="h-4 w-4" />
                  Audit IA
                </TabsTrigger>
                <TabsTrigger value="gallery" className="gap-2">
                  <Images className="h-4 w-4" />
                  Galerie Images
                </TabsTrigger>
                <TabsTrigger value="translations" className="gap-2">
                  <Languages className="h-4 w-4" />
                  Traductions
                </TabsTrigger>
                <TabsTrigger value="reviews" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Avis Clients
                </TabsTrigger>
              </TabsList>

              <TabsContent value="audit">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold">Informations Générales</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Prix:</span> {product.price}€</p>
                        <p><span className="font-medium">Stock:</span> {product.stock_quantity || 0}</p>
                        <p><span className="font-medium">Catégorie:</span> {product.category || 'Non défini'}</p>
                        <p><span className="font-medium">Statut:</span> {product.status}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">Description</h3>
                      <p className="text-sm text-muted-foreground">
                        {product.description || 'Aucune description'}
                      </p>
                    </div>
                  </div>
                </div>
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
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
