/**
 * Page de détail produit - Utilise ProductsUnifiedService et ProductAnalyticsService
 */

import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProductsUnifiedService } from '@/services/ProductsUnifiedService'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Helmet } from 'react-helmet-async'

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
        
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Page de détail complète en cours de finalisation avec analytics réelles
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default ProductDetailPage
