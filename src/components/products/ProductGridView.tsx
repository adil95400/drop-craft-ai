import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { 
  MoreVertical, 
  Eye, 
  Edit, 
  Copy, 
  Trash2,
  Package
} from 'lucide-react'
import { Product } from '@/hooks/useRealProducts'
import { cn } from '@/lib/utils'

interface ProductGridViewProps {
  products: Product[]
  selectedIds: string[]
  onSelectOne: (id: string, checked: boolean) => void
  onView: (product: Product) => void
  onEdit: (product: Product) => void
  onDuplicate: (product: Product) => void
  onDelete: (id: string) => void
  isPro?: boolean
}

export function ProductGridView({
  products,
  selectedIds,
  onSelectOne,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  isPro = false
}: ProductGridViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      default: return 'outline'
    }
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Package className="h-16 w-16 mb-4" />
        <p className="text-lg font-medium">Aucun produit trouvé</p>
        <p className="text-sm">Essayez d'ajuster vos filtres</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card 
          key={product.id}
          className={cn(
            "overflow-hidden hover:shadow-lg transition-all duration-200",
            selectedIds.includes(product.id) && "ring-2 ring-primary"
          )}
        >
          {/* Image avec sélection */}
          <div className="relative aspect-square bg-muted group">
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
            
            {/* Overlay avec actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => onView(product)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Voir
              </Button>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => onEdit(product)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </Button>
            </div>

            {/* Checkbox sélection */}
            <div className="absolute top-2 left-2">
              <Checkbox
                checked={selectedIds.includes(product.id)}
                onCheckedChange={(checked) => onSelectOne(product.id, checked as boolean)}
                className="bg-white border-2"
              />
            </div>

            {/* Menu actions */}
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(product)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Voir les détails
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(product)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(product)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Dupliquer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(product.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Badge statut */}
            <div className="absolute bottom-2 left-2">
              <Badge variant={getStatusColor(product.status)}>
                {product.status}
              </Badge>
            </div>

            {/* Badge stock faible */}
            {(product.stock_quantity || 0) < 10 && (
              <div className="absolute bottom-2 right-2">
                <Badge variant="destructive">
                  Stock faible
                </Badge>
              </div>
            )}
          </div>

          {/* Contenu */}
          <CardContent className="p-4 space-y-2">
            <div className="space-y-1">
              <h3 className="font-semibold line-clamp-2 min-h-[2.5rem]">
                {product.name}
              </h3>
              {product.category && (
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <p className="text-lg font-bold">
                  {formatCurrency(product.price)}
                </p>
                {isPro && product.cost_price && (
                  <p className="text-xs text-muted-foreground">
                    Coût: {formatCurrency(product.cost_price)}
                  </p>
                )}
              </div>
              
              {isPro && product.profit_margin && (
                <div className="text-right">
                  <Badge 
                    variant={product.profit_margin > 0 ? 'default' : 'destructive'}
                    className="font-mono"
                  >
                    +{product.profit_margin.toFixed(1)}%
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <span>SKU: {product.sku || 'N/A'}</span>
              <Badge variant="secondary" className="font-mono">
                Stock: {product.stock_quantity || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
