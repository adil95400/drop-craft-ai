import React from 'react'
import { TrendingUp } from 'lucide-react'
import { WinnerProduct } from '@/domains/winners/types'
import { WinnersProductCard } from './WinnersProductCard'

interface WinnersProductGridProps {
  products: WinnerProduct[]
  onImportProduct: (product: WinnerProduct) => void
  isImporting?: boolean
}

export const WinnersProductGrid = ({ 
  products, 
  onImportProduct,
  isImporting = false 
}: WinnersProductGridProps) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
        <p className="text-muted-foreground">
          Lancez une recherche pour découvrir des produits gagnants
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <WinnersProductCard
          key={product.id}
          product={product}
          onImportProduct={onImportProduct}
          isImporting={isImporting}
        />
      ))}
    </div>
  )
}
