import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRealProducts } from '@/hooks/useRealProducts'
import { useToast } from '@/hooks/use-toast'

interface CreateProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProductDialog({ open, onOpenChange }: CreateProductDialogProps) {
  const { addProduct, isAdding } = useRealProducts()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost_price: '',
    sku: '',
    category: '',
    stock_quantity: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.price) {
      toast({
        title: "Erreur",
        description: "Nom et prix sont requis",
        variant: "destructive"
      })
      return
    }

    try {
      await addProduct({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        cost_price: parseFloat(formData.cost_price) || 0,
        sku: formData.sku || `SKU-${Date.now()}`,
        category: formData.category || 'Non catégorisé',
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        status: 'active'
      })
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        cost_price: '',
        sku: '',
        category: '',
        stock_quantity: ''
      })
      
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le produit",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau produit</DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau produit à votre catalogue
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: iPhone 15 Pro Max"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du produit..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Prix de vente (€) *</Label>
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
                <Label htmlFor="cost_price">Prix d'achat (€)</Label>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="SKU automatique si vide"
                />
              </div>
              
              <div>
                <Label htmlFor="stock">Quantité en stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Électronique">Électronique</SelectItem>
                  <SelectItem value="Mode">Mode</SelectItem>
                  <SelectItem value="Maison">Maison</SelectItem>
                  <SelectItem value="Informatique">Informatique</SelectItem>
                  <SelectItem value="Audio">Audio</SelectItem>
                  <SelectItem value="Sport">Sport</SelectItem>
                  <SelectItem value="Livres">Livres</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isAdding}>
              {isAdding ? 'Création...' : 'Créer le produit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}