import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useProductsUnified } from '@/hooks/unified'
import { useToast } from '@/hooks/use-toast'
import { Package, DollarSign, Warehouse, Tag } from 'lucide-react'

interface ProductQuickEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  onProductUpdated: () => void
}

export function ProductQuickEditDialog({ 
  open, 
  onOpenChange, 
  product, 
  onProductUpdated 
}: ProductQuickEditDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost_price: '',
    stock_quantity: '',
    status: 'active'
  })
  const [loading, setLoading] = useState(false)
  
  const { update: updateProduct } = useProductsUnified()
  const { toast } = useToast()

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price?.toString() || '',
        cost_price: product.cost_price?.toString() || '',
        stock_quantity: product.stock_quantity?.toString() || '',
        status: product.status || 'active'
      })
    }
  }, [product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setLoading(true)
    try {
      const updates = {
        name: formData.name,
        price: parseFloat(formData.price) || 0,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
        status: formData.status as 'active' | 'paused' | 'draft' | 'archived'
      }

      await updateProduct({ id: product.id, updates })
      onProductUpdated()
      toast({
        title: "Produit mis à jour",
        description: "Les modifications ont été enregistrées avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le produit",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateMargin = () => {
    const price = parseFloat(formData.price) || 0
    const cost = parseFloat(formData.cost_price) || 0
    if (price > 0 && cost > 0) {
      return ((price - cost) / price * 100).toFixed(1)
    }
    return '0'
  }

  const calculateProfit = () => {
    const price = parseFloat(formData.price) || 0
    const cost = parseFloat(formData.cost_price) || 0
    return (price - cost).toFixed(2)
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Édition rapide
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name */}
          <div>
            <Label htmlFor="name">Nom du produit</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nom du produit"
              required
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price" className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Prix de vente
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="cost_price">Prix de revient</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Margin Display */}
          {formData.price && formData.cost_price && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Marge</div>
                <Badge variant={parseFloat(calculateMargin()) > 30 ? "secondary" : "outline"}>
                  {calculateMargin()}%
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Profit</div>
                <div className="font-medium text-green-600">
                  +{calculateProfit()}€
                </div>
              </div>
            </div>
          )}

          {/* Stock and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock" className="flex items-center gap-1">
                <Warehouse className="h-4 w-4" />
                Stock
              </Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="status" className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                Statut
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="paused">En pause</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">SKU:</span>
              <span className="font-mono">{product.sku || 'Non défini'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Catégorie:</span>
              <span>{product.category || 'Non classé'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Créé le:</span>
              <span>{new Date(product.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}