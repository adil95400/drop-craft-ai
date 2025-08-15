import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, TrendingUp, ShoppingCart, ExternalLink, Import } from 'lucide-react'
import { WinnerProduct } from '@/hooks/useRealWinnersAPI'
import { cn } from '@/lib/utils'

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
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'ebay':
      case 'ebay_simulation':
        return 'bg-yellow-500'
      case 'amazon':
      case 'amazon_simulation':
        return 'bg-orange-500'
      case 'google_trends':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(price)
  }

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="group hover:shadow-lg transition-shadow">
          <CardContent className="p-4 space-y-3">
            {/* Product Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg'
                }}
              />
              
              {/* Score Badge */}
              {product.final_score && (
                <Badge 
                  className={cn(
                    "absolute top-2 right-2",
                    getScoreColor(product.final_score)
                  )}
                >
                  {product.final_score}
                </Badge>
              )}
              
              {/* Source Badge */}
              <Badge 
                className={cn(
                  "absolute top-2 left-2 text-white",
                  getSourceColor(product.source)
                )}
              >
                {product.source.replace('_simulation', '')}
              </Badge>
            </div>

            {/* Product Info */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm line-clamp-2" title={product.title}>
                {product.title}
              </h3>
              
              {/* Price */}
              <div className="text-lg font-bold text-primary">
                {formatPrice(product.price, product.currency)}
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {product.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{product.rating.toFixed(1)}</span>
                  </div>
                )}
                
                {product.reviews && (
                  <span>{product.reviews.toLocaleString()} avis</span>
                )}
                
                {product.sales && (
                  <div className="flex items-center gap-1">
                    <ShoppingCart className="h-3 w-3" />
                    <span>{product.sales.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Trending Score */}
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="h-3 w-3" />
                <span>Tendance: {Math.round(product.trending_score)}/100</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onImportProduct(product)}
                disabled={isImporting}
                className="flex-1"
              >
                <Import className="h-3 w-3 mr-1" />
                Importer
              </Button>
              
              {product.url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(product.url, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}