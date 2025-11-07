import { useParams } from 'react-router-dom'
import { ProductVariantsManager } from '@/components/products/ProductVariantsManager'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ProductVariants() {
  const { productId } = useParams()
  const navigate = useNavigate()

  if (!productId) {
    return <div>Produit non trouvé</div>
  }

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate('/products')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux produits
      </Button>
      
      <h1 className="text-3xl font-bold mb-6">Gestion des variantes</h1>
      
      <ProductVariantsManager productId={productId} />
    </div>
  )
}
