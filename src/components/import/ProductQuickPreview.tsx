import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Image as ImageIcon, 
  Star, 
  DollarSign, 
  Package, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  ShoppingCart
} from 'lucide-react'

interface ProductQuickPreviewProps {
  product: {
    id: string
    name: string
    description?: string
    price: number
    currency: string
    image_urls?: string[]
    category?: string
    brand?: string
    sku?: string
    stock_quantity?: number
    status: string
    review_status: string
    ai_optimized?: boolean
    import_quality_score?: number
    data_completeness_score?: number
    created_at: string
    supplier_name?: string
  }
  onAction?: (productId: string, action: string) => void
  isSelected?: boolean
  onSelect?: (productId: string) => void
}

export const ProductQuickPreview = ({ 
  product, 
  onAction, 
  isSelected = false, 
  onSelect 
}: ProductQuickPreviewProps) => {
  const getStatusColor = (status: string, reviewStatus: string) => {
    if (status === 'published') return 'bg-green-100 text-green-800'
    if (reviewStatus === 'rejected') return 'bg-red-100 text-red-800'
    if (reviewStatus === 'approved') return 'bg-blue-100 text-blue-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  const getQualityColor = (score?: number) => {
    if (!score) return 'text-gray-500'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getQualityLabel = (score?: number) => {
    if (!score) return 'N/A'
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Bon'
    if (score >= 40) return 'Moyen'
    return 'Faible'
  }

  return (
    <Card className={`hover:shadow-md transition-all cursor-pointer ${
      isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/20'
    }`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Selection Checkbox */}
          {onSelect && (
            <div className="flex items-start pt-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(product.id)}
                className="w-4 h-4"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Product Image */}
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
            {product.image_urls && product.image_urls[0] && product.image_urls[0] !== "TRUE" ? (
              <img 
                src={product.image_urls[0]} 
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            )}
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate mb-1">{product.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-primary">
                    {product.price} {product.currency}
                  </span>
                  {product.brand && (
                    <Badge variant="outline" className="text-xs">
                      {product.brand}
                    </Badge>
                  )}
                </div>
              </div>
              
              <Badge className={getStatusColor(product.status, product.review_status)}>
                {product.status === 'published' ? 'Publié' : 
                 product.review_status === 'approved' ? 'Approuvé' : 
                 product.review_status === 'rejected' ? 'Rejeté' : 'En attente'}
              </Badge>
            </div>

            {/* Quality Indicators */}
            <div className="flex items-center gap-3 mb-2 text-xs">
              {product.import_quality_score && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  <span className={getQualityColor(product.import_quality_score)}>
                    {getQualityLabel(product.import_quality_score)}
                  </span>
                </div>
              )}
              
              {product.ai_optimized && (
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  IA
                </Badge>
              )}

              {product.stock_quantity !== null && product.stock_quantity > 0 && (
                <div className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  <span>{product.stock_quantity}</span>
                </div>
              )}
            </div>

            {/* Meta Info */}
            <div className="text-xs text-muted-foreground">
              {product.supplier_name && `${product.supplier_name} • `}
              {new Date(product.created_at).toLocaleDateString('fr-FR')}
              {product.sku && ` • SKU: ${product.sku}`}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-start gap-1 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onAction?.(product.id, 'view')
              }}
            >
              <Eye className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onAction?.(product.id, 'edit')
              }}
            >
              <Edit className="w-3 h-3" />
            </Button>
            {product.status !== 'published' && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onAction?.(product.id, 'publish')
                }}
              >
                <ShoppingCart className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}