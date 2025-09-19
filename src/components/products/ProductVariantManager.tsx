import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Package } from 'lucide-react'

interface ProductVariant {
  id: string
  name: string
  sku: string
  price: number
  cost_price?: number
  stock_quantity: number
  attributes: Record<string, string>
  image_url?: string
}

interface ProductVariantManagerProps {
  productId: string
}

export function ProductVariantManager({ productId }: ProductVariantManagerProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      id: '1',
      name: 'T-shirt Blanc - Taille M',
      sku: 'TSH-WHT-M',
      price: 25.99,
      cost_price: 12.50,
      stock_quantity: 45,
      attributes: { color: 'Blanc', size: 'M' },
      image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100'
    },
    {
      id: '2',
      name: 'T-shirt Blanc - Taille L',
      sku: 'TSH-WHT-L',
      price: 25.99,
      cost_price: 12.50,
      stock_quantity: 32,
      attributes: { color: 'Blanc', size: 'L' },
      image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100'
    },
    {
      id: '3',
      name: 'T-shirt Noir - Taille M',
      sku: 'TSH-BLK-M',
      price: 25.99,
      cost_price: 12.50,
      stock_quantity: 28,
      attributes: { color: 'Noir', size: 'M' },
      image_url: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=100'
    }
  ])
  
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({
    name: '',
    sku: '',
    price: 0,
    cost_price: 0,
    stock_quantity: 0,
    attributes: {}
  })

  const handleCreateVariant = () => {
    const variant: ProductVariant = {
      id: Date.now().toString(),
      name: newVariant.name!,
      sku: newVariant.sku!,
      price: newVariant.price!,
      cost_price: newVariant.cost_price,
      stock_quantity: newVariant.stock_quantity!,
      attributes: newVariant.attributes!
    }
    
    setVariants([...variants, variant])
    setNewVariant({
      name: '',
      sku: '',
      price: 0,
      cost_price: 0,
      stock_quantity: 0,
      attributes: {}
    })
    setIsDialogOpen(false)
    toast.success('Variante créée avec succès')
  }

  const handleDeleteVariant = (variantId: string) => {
    setVariants(variants.filter(v => v.id !== variantId))
    toast.success('Variante supprimée')
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: 'destructive', label: 'Rupture' }
    if (stock < 10) return { color: 'warning', label: 'Faible' }
    return { color: 'success', label: 'En stock' }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestion des variantes</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les différentes versions de votre produit (taille, couleur, etc.)
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une variante
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Variantes existantes ({variants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {variants.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="text-lg font-semibold mb-2">Aucune variante</h4>
              <p className="text-muted-foreground mb-4">
                Ajoutez des variantes pour proposer différentes options (taille, couleur, etc.)
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer la première variante
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Attributs</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant) => {
                  const stockStatus = getStockStatus(variant.stock_quantity)
                  return (
                    <TableRow key={variant.id}>
                      <TableCell>
                        {variant.image_url ? (
                          <img 
                            src={variant.image_url} 
                            alt={variant.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{variant.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {variant.sku}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {Object.entries(variant.attributes).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{variant.price}€</TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.color as any}>
                          {variant.stock_quantity} - {stockStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingVariant(variant)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteVariant(variant.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Variant Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une nouvelle variante</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="variant-name">Nom de la variante</Label>
              <Input
                id="variant-name"
                value={newVariant.name}
                onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                placeholder="Ex: T-shirt Rouge - Taille L"
              />
            </div>

            <div>
              <Label htmlFor="variant-sku">SKU</Label>
              <Input
                id="variant-sku"
                value={newVariant.sku}
                onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                placeholder="Ex: TSH-RED-L"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="variant-price">Prix (€)</Label>
                <Input
                  id="variant-price"
                  type="number"
                  step="0.01"
                  value={newVariant.price}
                  onChange={(e) => setNewVariant({ ...newVariant, price: parseFloat(e.target.value) })}
                />
              </div>
              
              <div>
                <Label htmlFor="variant-cost">Prix coût (€)</Label>
                <Input
                  id="variant-cost"
                  type="number"
                  step="0.01"
                  value={newVariant.cost_price}
                  onChange={(e) => setNewVariant({ ...newVariant, cost_price: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="variant-stock">Stock</Label>
              <Input
                id="variant-stock"
                type="number"
                value={newVariant.stock_quantity}
                onChange={(e) => setNewVariant({ ...newVariant, stock_quantity: parseInt(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Couleur</Label>
                <Select onValueChange={(value) => 
                  setNewVariant({ 
                    ...newVariant, 
                    attributes: { ...newVariant.attributes, color: value }
                  })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir couleur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rouge">Rouge</SelectItem>
                    <SelectItem value="bleu">Bleu</SelectItem>
                    <SelectItem value="vert">Vert</SelectItem>
                    <SelectItem value="noir">Noir</SelectItem>
                    <SelectItem value="blanc">Blanc</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Taille</Label>
                <Select onValueChange={(value) => 
                  setNewVariant({ 
                    ...newVariant, 
                    attributes: { ...newVariant.attributes, size: value }
                  })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir taille" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XS">XS</SelectItem>
                    <SelectItem value="S">S</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="XL">XL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateVariant}>
              Créer la variante
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}