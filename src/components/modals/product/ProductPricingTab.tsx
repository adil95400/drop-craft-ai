/**
 * ProductPricingTab — Extracted from ProductViewModal
 * Handles pricing display, profit calculation, and inventory
 */
import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DollarSign, ShoppingCart } from 'lucide-react'

interface ProductPricingTabProps {
  product: any
  editedProduct: any
  setEditedProduct: (updater: (prev: any) => any) => void
  isEditing: boolean
  metrics: { profit: number; margin: number; stock: number } | null
  stockConfig: { color: any; label: string; icon: any } | null
  formatCurrency: (amount: number) => string
}

export const ProductPricingTab = memo(function ProductPricingTab({
  product, editedProduct, setEditedProduct, isEditing, metrics, stockConfig, formatCurrency
}: ProductPricingTabProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Prix de vente</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="number" step="0.01" value={editedProduct.price || ''}
                  onChange={(e) => setEditedProduct((prev: any) => ({ ...prev, price: e.target.value }))}
                  className="pl-9" />
              </div>
            ) : (
              <p className="text-3xl font-bold text-primary">{formatCurrency(product.price || 0)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Prix d'achat</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="number" step="0.01" value={editedProduct.cost_price || ''}
                  onChange={(e) => setEditedProduct((prev: any) => ({ ...prev, cost_price: e.target.value }))}
                  className="pl-9" />
              </div>
            ) : (
              <p className="text-3xl font-bold">{formatCurrency(product.cost_price || 0)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-success/5 to-success/10 border-success/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Profit par unité</p>
              <p className="text-2xl font-bold text-success">+{formatCurrency(metrics?.profit || 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Marge bénéficiaire</p>
              <p className="text-2xl font-bold text-success">{metrics?.margin.toFixed(1)}%</p>
            </div>
          </div>
          <Progress value={Math.min(metrics?.margin || 0, 100)} className="h-3" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />Inventaire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Quantité en stock</Label>
            {isEditing ? (
              <Input type="number" value={editedProduct.stock_quantity || ''}
                onChange={(e) => setEditedProduct((prev: any) => ({ ...prev, stock_quantity: e.target.value }))}
                className="w-32" />
            ) : (
              <div className="flex items-center gap-2">
                {stockConfig && (
                  <Badge variant={stockConfig.color} className="gap-1.5">
                    <stockConfig.icon className="h-3 w-3" />{stockConfig.label}
                  </Badge>
                )}
                <span className="text-xl font-bold">{metrics?.stock || 0}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
})
