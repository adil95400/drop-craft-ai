import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Star, TrendingUp, Package } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MobileProductCardProps {
  product: {
    id: string
    name: string
    price: number
    image_url?: string
    stock_quantity?: number
    status?: string
    ai_score?: number
    is_winner?: boolean
    is_trending?: boolean
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onPublish?: (id: string) => void
  onClick?: (id: string) => void
}

export function MobileProductCard({ 
  product, 
  onEdit, 
  onDelete, 
  onPublish,
  onClick 
}: MobileProductCardProps) {
  return (
    <Card 
      className="overflow-hidden touch-manipulation active:scale-[0.98] transition-transform"
      onClick={() => onClick?.(product.id)}
    >
      <CardContent className="p-0">
        <div className="flex gap-3 p-3">
          {/* Image */}
          <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            {product.is_winner && (
              <Badge className="absolute top-1 left-1 px-1 py-0 text-[10px] bg-yellow-500">
                <Star className="h-2 w-2 mr-0.5" />
                Winner
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                {product.name || 'Produit sans nom'}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(product.id); }}>
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPublish?.(product.id); }}>
                    Publier
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={(e) => { e.stopPropagation(); onDelete?.(product.id); }}
                  >
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-base font-semibold text-primary">
                {product.price?.toFixed(2) || '0.00'}€
              </span>
              {product.is_trending && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  <TrendingUp className="h-2 w-2 mr-0.5" />
                  Trend
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={product.stock_quantity && product.stock_quantity > 0 ? 'default' : 'destructive'}
                  className="text-[10px] px-1.5 py-0"
                >
                  Stock: {product.stock_quantity || 0}
                </Badge>
                {product.ai_score && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    AI: {product.ai_score}%
                  </Badge>
                )}
              </div>
              <Badge 
                variant={product.status === 'published' ? 'default' : 'secondary'}
                className="text-[10px] px-1.5 py-0"
              >
                {product.status === 'published' ? 'Publié' : 'Brouillon'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
