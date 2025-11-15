import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ProductVariantsAdvancedManager } from '@/components/products/ProductVariantsAdvancedManager'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function ProductVariants() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)

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
      
      <h1 className="text-3xl font-bold mb-6">Gestion avancée des variantes</h1>
      
      <ProductVariantsAdvancedManager 
        productId={productId} 
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen)
          if (!newOpen) navigate('/products')
        }}
      />
    </div>
  )
}
