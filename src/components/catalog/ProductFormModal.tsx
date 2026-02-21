import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Save } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface ProductFormModalProps {
  product?: any
  open: boolean
  onClose: () => void
}

export function ProductFormModal({ product, open, onClose }: ProductFormModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    sku: '',
    stock_quantity: '',
    supplier_name: '',
    availability_status: 'in_stock',
    is_trending: false,
    is_bestseller: false,
    is_winner: false,
    rating: '',
    image_url: ''
  })

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        category: product.category || '',
        brand: product.brand || '',
        sku: product.sku || '',
        stock_quantity: product.stock_quantity?.toString() || '',
        supplier_name: product.supplier_name || '',
        availability_status: product.availability_status || 'in_stock',
        is_trending: product.is_trending || false,
        is_bestseller: product.is_bestseller || false,
        is_winner: product.is_winner || false,
        rating: product.rating?.toString() || '',
        image_url: product.image_url || ''
      })
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        brand: '',
        sku: '',
        stock_quantity: '',
        supplier_name: '',
        availability_status: 'in_stock',
        is_trending: false,
        is_bestseller: false,
        is_winner: false,
        rating: '',
        image_url: ''
      })
    }
  }, [product, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Non authentifié')

      const productData = {
        title: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        category: formData.category,
        supplier_name: formData.supplier_name,
        status: formData.availability_status,
        is_imported: false,
        user_id: userData.user.id
      }

      if (product) {
        // Update existing product
        const { error } = await (supabase
          .from('products') as any)
          .update(productData)
          .eq('id', product.id)

        if (error) throw error

        toast({
          title: "Produit modifié",
          description: "Le produit a été modifié avec succès."
        })
      } else {
        // Create new product
        const { error } = await (supabase
          .from('products') as any)
          .insert([productData])

        if (error) throw error

        toast({
          title: "Produit créé",
          description: "Le nouveau produit a été créé avec succès."
        })
      }

      onClose()
    } catch (error) {
      console.error('Error saving product:', error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le produit.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {product ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {product ? 'Modifier le Produit' : 'Ajouter un Produit'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Prix et stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Prix (€) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="stock_quantity">Stock</Label>
              <Input
                id="stock_quantity"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="rating">Note (0-5)</Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={(e) => handleInputChange('rating', e.target.value)}
              />
            </div>
          </div>

          {/* Catégorie et marque */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="brand">Marque</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
              />
            </div>
          </div>

          {/* Fournisseur et statut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier_name">Fournisseur</Label>
              <Input
                id="supplier_name"
                value={formData.supplier_name}
                onChange={(e) => handleInputChange('supplier_name', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="availability_status">Statut</Label>
              <Select value={formData.availability_status} onValueChange={(value) => handleInputChange('availability_status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">En stock</SelectItem>
                  <SelectItem value="low_stock">Stock faible</SelectItem>
                  <SelectItem value="out_of_stock">Rupture</SelectItem>
                  <SelectItem value="discontinued">Discontinué</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <Label htmlFor="image_url">URL de l'image</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => handleInputChange('image_url', e.target.value)}
            />
          </div>

          {/* Badges spéciaux */}
          <div className="space-y-4">
            <Label>Badges spéciaux</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_trending"
                  checked={formData.is_trending}
                  onCheckedChange={(checked) => handleInputChange('is_trending', checked)}
                />
                <Label htmlFor="is_trending">Tendance</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_bestseller"
                  checked={formData.is_bestseller}
                  onCheckedChange={(checked) => handleInputChange('is_bestseller', checked)}
                />
                <Label htmlFor="is_bestseller">Bestseller</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_winner"
                  checked={formData.is_winner}
                  onCheckedChange={(checked) => handleInputChange('is_winner', checked)}
                />
                <Label htmlFor="is_winner">Gagnant</Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sauvegarde...' : product ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}