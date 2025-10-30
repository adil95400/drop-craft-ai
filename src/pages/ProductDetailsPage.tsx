import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductTranslations, ProductReviews, ProductImageGallery } from '@/components/products'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package, Languages, MessageSquare, Images } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ProductDetailsPage() {
  const navigate = useNavigate()
  
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
            SKU-12345
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Produit Exemple</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="gallery" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
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

              <TabsContent value="gallery">
                <ProductImageGallery productId="sample-product-id" />
              </TabsContent>

              <TabsContent value="translations">
                <ProductTranslations productId="sample-product-id" />
              </TabsContent>

              <TabsContent value="reviews">
                <ProductReviews productId="sample-product-id" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
