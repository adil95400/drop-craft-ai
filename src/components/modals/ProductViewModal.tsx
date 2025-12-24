import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Package, 
  Edit3, 
  Trash2, 
  Copy, 
  ExternalLink,
  TrendingUp,
  DollarSign,
  BarChart3,
  Tag,
  Boxes,
  Image as ImageIcon
} from 'lucide-react'
import { Product } from '@/hooks/useRealProducts'
import { UnifiedProduct } from '@/services/ProductsUnifiedService'

interface ProductViewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | UnifiedProduct
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
}

export function ProductViewModal({ 
  open, 
  onOpenChange, 
  product,
  onEdit,
  onDelete,
  onDuplicate
}: ProductViewModalProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const calculateMargin = () => {
    if (product.cost_price && product.price) {
      return Math.round(((product.price - product.cost_price) / product.price) * 100)
    }
    return (product as any).profit_margin || 0
  }

  const getStockStatus = () => {
    const stock = product.stock_quantity || 0
    if (stock > 50) return { label: 'En stock', color: 'bg-green-500' }
    if (stock > 10) return { label: 'Stock limité', color: 'bg-orange-500' }
    if (stock > 0) return { label: 'Stock faible', color: 'bg-red-500' }
    return { label: 'Rupture', color: 'bg-destructive' }
  }

  const stockStatus = getStockStatus()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{product.name}</DialogTitle>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit3 className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
              )}
              {onDuplicate && (
                <Button variant="outline" size="sm" onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-1" />
                  Dupliquer
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" size="sm" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {/* Image principale */}
          <div className="md:col-span-1">
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

            {/* Status badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge className={stockStatus.color}>
                {stockStatus.label}
              </Badge>
              <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                {product.status === 'active' ? 'Actif' : 'Inactif'}
              </Badge>
              {(product as UnifiedProduct).source && (
                <Badge variant="outline">
                  {(product as UnifiedProduct).source}
                </Badge>
              )}
            </div>
          </div>

          {/* Informations détaillées */}
          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="pricing" className="flex-1">Prix & Marge</TabsTrigger>
                <TabsTrigger value="stock" className="flex-1">Stock</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Informations générales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {product.description && (
                      <div>
                        <span className="text-sm text-muted-foreground">Description</span>
                        <p className="text-sm mt-1">{product.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      {product.sku && (
                        <div>
                          <span className="text-sm text-muted-foreground">SKU</span>
                          <p className="font-mono text-sm">{product.sku}</p>
                        </div>
                      )}
                      {product.category && (
                        <div>
                          <span className="text-sm text-muted-foreground">Catégorie</span>
                          <p className="text-sm">{product.category}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <DollarSign className="h-6 w-6 mx-auto text-primary mb-2" />
                        <p className="text-lg font-bold">{formatCurrency(product.price)}</p>
                        <p className="text-xs text-muted-foreground">Prix de vente</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <TrendingUp className="h-6 w-6 mx-auto text-green-500 mb-2" />
                        <p className="text-lg font-bold">{calculateMargin()}%</p>
                        <p className="text-xs text-muted-foreground">Marge</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <Boxes className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                        <p className="text-lg font-bold">{product.stock_quantity || 0}</p>
                        <p className="text-xs text-muted-foreground">En stock</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Détails des prix
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Prix de vente</span>
                        <span className="font-bold text-lg">{formatCurrency(product.price)}</span>
                      </div>
                      
                      {product.cost_price && (
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-muted-foreground">Prix d'achat</span>
                          <span className="font-medium">{formatCurrency(product.cost_price)}</span>
                        </div>
                      )}

                      {product.cost_price && (
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-muted-foreground">Bénéfice unitaire</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(product.price - product.cost_price)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Marge bénéficiaire</span>
                        <Badge className={calculateMargin() > 30 ? 'bg-green-500' : 'bg-orange-500'}>
                          {calculateMargin()}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stock" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Boxes className="h-4 w-4" />
                      État du stock
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Quantité disponible</span>
                        <span className="font-bold text-lg">{product.stock_quantity || 0} unités</span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Statut</span>
                        <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
                      </div>

                      {product.cost_price && product.stock_quantity && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-muted-foreground">Valeur du stock</span>
                          <span className="font-medium">
                            {formatCurrency(product.price * product.stock_quantity)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
