import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Star, Package, DollarSign, TrendingUp, 
  Globe, Calendar, Eye, Edit 
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ProductDetailsModalProps {
  product: any
  open: boolean
  onClose: () => void
}

export function ProductDetailsModal({ product, open, onClose }: ProductDetailsModalProps) {
  if (!product) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge className="bg-green-100 text-green-800">En stock</Badge>
      case 'out_of_stock':
        return <Badge variant="destructive">Rupture</Badge>
      case 'low_stock':
        return <Badge className="bg-yellow-100 text-yellow-800">Stock faible</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Détails du Produit
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image et informations principales */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex gap-2 flex-wrap">
              {product.is_bestseller && (
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Star className="h-3 w-3 mr-1" />Bestseller
                </Badge>
              )}
              {product.is_trending && (
                <Badge className="bg-blue-100 text-blue-800">
                  <TrendingUp className="h-3 w-3 mr-1" />Tendance
                </Badge>
              )}
              {product.is_winner && (
                <Badge className="bg-purple-100 text-purple-800">
                  <Package className="h-3 w-3 mr-1" />Gagnant
                </Badge>
              )}
              {getStatusBadge(product.availability_status)}
            </div>
          </div>

          {/* Informations détaillées */}
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            {/* Prix et stock */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Prix</p>
                      <p className="text-2xl font-bold">{formatCurrency(product.price || 0)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Stock</p>
                      <p className="text-2xl font-bold">{product.stock_quantity || 0}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Métriques */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Note</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{product.rating || 0}/5</span>
                  <span className="text-sm text-muted-foreground">({product.reviews_count || 0} avis)</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ventes</span>
                <span className="font-medium">{product.sales_count || 0} unités</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Catégorie</span>
                <Badge variant="secondary">{product.category}</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Fournisseur</span>
                <span className="font-medium">{product.supplier_name}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">SKU</span>
                <span className="font-mono text-sm">{product.sku || product.external_id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Détails techniques */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Détails Techniques</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Score tendance</span>
                  <span className="font-medium">{product.trend_score || 0}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Competition</span>
                  <span className="font-medium">{product.competition_score || 0}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Marge profit</span>
                  <span className="font-medium">{product.profit_margin || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Historique</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Créé le</span>
                  <span className="font-medium">
                    {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Modifié le</span>
                  <span className="font-medium">
                    {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}