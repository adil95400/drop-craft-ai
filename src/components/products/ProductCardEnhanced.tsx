import { useState, useEffect } from 'react'
import { MoreVertical, Edit, Trash2, Copy, Sparkles, Eye, TrendingUp, DollarSign, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { ProductScoreBadge, ProductBadgeGroup } from './ProductScoreBadge'
import { ProductPerformanceWidget } from './ProductPerformanceWidget'
import { MultiSupplierComparison } from './MultiSupplierComparison'
import { useSupplierComparison } from '@/hooks/useSupplierComparison'
import { useProductTracking } from '@/hooks/useProductTracking'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

interface ProductCardEnhancedProps {
  product: any
  onEdit?: (product: any) => void
  onDelete?: (productId: string) => void
  onDuplicate?: (product: any) => void
  onOptimize?: (productId: string) => void
  onClick?: () => void
  selected?: boolean
  onSelect?: (selected: boolean) => void
}

export function ProductCardEnhanced({
  product,
  onEdit,
  onDelete,
  onDuplicate,
  onOptimize,
  onClick,
  selected,
  onSelect
}: ProductCardEnhancedProps) {
  const [imageError, setImageError] = useState(false)
  const [userId, setUserId] = useState<string>('')
  
  const { data: comparisonData, isLoading: isLoadingComparison } = useSupplierComparison(
    product.id, 
    userId
  )
  const { trackView } = useProductTracking()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    fetchUser()
  }, [])

  const imageUrl = product.image_url || product.image_urls?.[0] || '/placeholder.svg'
  const profitMargin = product.profit_margin || (product.price && product.cost_price 
    ? ((product.price - product.cost_price) / product.price * 100) 
    : 0)

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="menuitem"]')) {
      return
    }
    if (userId && product.id) {
      trackView.mutate({ productId: product.id, userId, source: 'catalog' })
    }
    onClick?.()
  }

  const hasMultipleSuppliers = (comparisonData?.comparisons?.length || 0) > 1

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200 cursor-pointer',
        'hover:shadow-lg hover:scale-[1.02]',
        selected && 'ring-2 ring-primary'
      )}
      onClick={handleCardClick}
    >
      {/* Selection checkbox */}
      {onSelect && (
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation()
              onSelect(e.target.checked)
            }}
            className="h-4 w-4 rounded border-gray-300"
          />
        </div>
      )}

      {/* Actions menu */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="secondary" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
            )}
            {onOptimize && (
              <DropdownMenuItem onClick={() => onOptimize(product.id)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Optimiser avec IA
              </DropdownMenuItem>
            )}
            {onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(product)}>
                <Copy className="mr-2 h-4 w-4" />
                Dupliquer
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={() => onDelete(product.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {!imageError ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
        
        {/* Badges overlay */}
        <div className="absolute top-2 left-2 right-12">
          <ProductBadgeGroup
            isWinner={product.is_winner}
            isTrending={product.is_trending}
            isBestseller={product.is_bestseller}
            size="sm"
          />
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <div>
          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
            {product.name}
          </h3>
          {product.sku && (
            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
          )}
        </div>

        {/* AI Scores */}
        {(product.ai_score || product.trend_score || product.profit_potential) && (
          <div className="flex flex-wrap gap-1.5">
            {product.ai_score > 0 && (
              <ProductScoreBadge score={product.ai_score} type="ai" size="sm" showLabel={false} />
            )}
            {product.trend_score > 0 && (
              <ProductScoreBadge score={product.trend_score} type="trend" size="sm" showLabel={false} />
            )}
            {product.profit_potential > 0 && (
              <ProductScoreBadge score={product.profit_potential} type="profit" size="sm" showLabel={false} />
            )}
          </div>
        )}

        {/* Price & Margin */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-foreground">
                {product.price?.toFixed(2)}€
              </p>
              {product.cost_price > 0 && (
                <p className="text-xs text-muted-foreground">
                  Coût: {product.cost_price?.toFixed(2)}€
                </p>
              )}
            </div>
            {profitMargin > 0 && (
              <Badge 
                variant={profitMargin >= 40 ? 'default' : profitMargin >= 20 ? 'secondary' : 'destructive'}
                className="font-semibold"
              >
                +{profitMargin.toFixed(0)}%
              </Badge>
            )}
          </div>

          {/* Multi-supplier info */}
          {product.supplier_count > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              {product.supplier_count} fournisseur{product.supplier_count > 1 ? 's' : ''}
              {product.best_supplier_price && product.best_supplier_price < product.cost_price && (
                <span className="text-green-600 font-medium">
                  (Meilleur: {product.best_supplier_price.toFixed(2)}€)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Performance Widget */}
        {(product.view_count || 0) > 0 && (
          <div className="pt-2 border-t">
            <ProductPerformanceWidget
              viewCount={product.view_count || 0}
              conversionRate={product.conversion_rate || 0}
              revenue={0}
              orders={0}
            />
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center gap-2 pt-2 border-t">
          {hasMultipleSuppliers && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => e.stopPropagation()}
                  className="gap-1 flex-1 text-xs"
                >
                  <Package className="h-3 w-3" />
                  Comparer ({comparisonData?.comparisons?.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96" onClick={(e) => e.stopPropagation()}>
                <MultiSupplierComparison
                  comparisons={comparisonData?.comparisons || []}
                  isLoading={isLoadingComparison}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Category & Status */}
        <div className="flex items-center justify-between pt-2 border-t">
          {product.category && (
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
          )}
          <Badge 
            variant={product.status === 'active' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {product.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
