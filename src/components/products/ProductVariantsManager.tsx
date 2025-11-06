import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { ProductVariant } from '@/services/ProductsUnifiedService'
import { Plus, Trash2, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ProductVariantsManagerProps {
  variants: ProductVariant[]
  onVariantsChange: (variants: ProductVariant[]) => void
}

export function ProductVariantsManager({ variants, onVariantsChange }: ProductVariantsManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({
    name: '',
    sku: '',
    price: undefined,
    stock_quantity: undefined,
    attributes: {}
  })

  const handleAddVariant = () => {
    if (!newVariant.name) return

    const variant: ProductVariant = {
      id: `var_${Date.now()}`,
      name: newVariant.name,
      sku: newVariant.sku || `VAR-${Date.now()}`,
      price: newVariant.price,
      stock_quantity: newVariant.stock_quantity || 0,
      attributes: newVariant.attributes || {}
    }

    onVariantsChange([...variants, variant])
    setNewVariant({ name: '', sku: '', price: undefined, stock_quantity: undefined, attributes: {} })
    setShowAddForm(false)
  }

  const handleRemoveVariant = (id: string) => {
    onVariantsChange(variants.filter(v => v.id !== id))
  }

  const handleUpdateVariant = (id: string, updates: Partial<ProductVariant>) => {
    onVariantsChange(variants.map(v => v.id === id ? { ...v, ...updates } : v))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Variantes du produit</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les différentes versions de ce produit (taille, couleur, etc.)
          </p>
        </div>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une variante
        </Button>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <Card className="p-4 border-dashed">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="variant-name">Nom de la variante *</Label>
                <Input
                  id="variant-name"
                  placeholder="Ex: Taille L - Noir"
                  value={newVariant.name}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="variant-sku">SKU</Label>
                <Input
                  id="variant-sku"
                  placeholder="Auto si vide"
                  value={newVariant.sku}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, sku: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="variant-price">Prix (€)</Label>
                <Input
                  id="variant-price"
                  type="number"
                  step="0.01"
                  placeholder="Prix par défaut si vide"
                  value={newVariant.price || ''}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, price: parseFloat(e.target.value) || undefined }))}
                />
              </div>
              <div>
                <Label htmlFor="variant-stock">Stock</Label>
                <Input
                  id="variant-stock"
                  type="number"
                  placeholder="0"
                  value={newVariant.stock_quantity || ''}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                Annuler
              </Button>
              <Button type="button" size="sm" onClick={handleAddVariant}>
                Ajouter
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Liste des variantes */}
      {variants.length === 0 ? (
        <Card className="p-8 flex flex-col items-center justify-center text-center border-dashed">
          <Package className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Aucune variante</p>
          <p className="text-xs text-muted-foreground mt-1">
            Ajoutez des variantes pour gérer différentes versions du produit
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {variants.map((variant) => (
            <Card key={variant.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 grid grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nom</Label>
                    <Input
                      value={variant.name}
                      onChange={(e) => handleUpdateVariant(variant.id, { name: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">SKU</Label>
                    <Input
                      value={variant.sku || ''}
                      onChange={(e) => handleUpdateVariant(variant.id, { sku: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Prix (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variant.price || ''}
                      onChange={(e) => handleUpdateVariant(variant.id, { price: parseFloat(e.target.value) || undefined })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Stock</Label>
                    <Input
                      type="number"
                      value={variant.stock_quantity || 0}
                      onChange={(e) => handleUpdateVariant(variant.id, { stock_quantity: parseInt(e.target.value) || 0 })}
                      className="h-8"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveVariant(variant.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
