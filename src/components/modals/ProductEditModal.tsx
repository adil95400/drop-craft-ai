import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useProductsUnified, UnifiedProduct } from '@/hooks/unified'
import { Plus, X, Upload } from 'lucide-react'

interface ProductEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: UnifiedProduct
}

export function ProductEditModal({ open, onOpenChange, product }: ProductEditModalProps) {
  const { update: updateProduct } = useProductsUnified()
  const [formData, setFormData] = useState<Partial<UnifiedProduct>>({
    name: product.name,
    description: product.description,
    price: product.price,
    cost_price: product.cost_price,
    sku: product.sku,
    category: product.category,
    status: product.status,
    stock_quantity: product.stock_quantity,
    image_url: product.image_url
  })
  const [tags, setTags] = useState<string[]>(['premium', 'bestseller'])
  const [newTag, setNewTag] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await updateProduct({ 
        id: product.id, 
        updates: {
          ...formData,
          profit_margin: formData.cost_price ? 
            ((formData.price! - formData.cost_price) / formData.cost_price * 100) : 0
        }
      })
      
      toast.success('Produit mis à jour avec succès')
      onOpenChange(false)
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du produit')
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le produit</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="pricing">Prix</TabsTrigger>
              <TabsTrigger value="inventory">Stock</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom du produit</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Ex: PRD-001"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Description détaillée du produit..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select value={formData.category || ''} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronique">Électronique</SelectItem>
                      <SelectItem value="vetements">Vêtements</SelectItem>
                      <SelectItem value="maison">Maison & Jardin</SelectItem>
                      <SelectItem value="sport">Sport & Loisirs</SelectItem>
                      <SelectItem value="beaute">Beauté & Santé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'paused' | 'draft' | 'archived' })}>
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

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Ajouter un tag..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration des prix</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Prix de vente (€)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price || ''}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cost_price">Prix coût (€)</Label>
                      <Input
                        id="cost_price"
                        type="number"
                        step="0.01"
                        value={formData.cost_price || ''}
                        onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || undefined })}
                        placeholder="Optionnel"
                      />
                    </div>
                  </div>

                  {formData.price && formData.cost_price && (
                    <div className="p-4 bg-accent rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Marge bénéficiaire:</span>
                        <span className="text-lg font-bold text-success">
                          {(((formData.price - formData.cost_price) / formData.cost_price) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-muted-foreground">Bénéfice par unité:</span>
                        <span className="text-sm font-medium">
                          {(formData.price - formData.cost_price).toFixed(2)}€
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion des stocks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="stock_quantity">Quantité en stock</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      value={formData.stock_quantity || ''}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-accent rounded-lg">
                      <div className="text-sm text-muted-foreground">Seuil d'alerte</div>
                      <div className="text-2xl font-bold">10</div>
                    </div>
                    <div className="p-4 bg-accent rounded-lg">
                      <div className="text-sm text-muted-foreground">Stock de sécurité</div>
                      <div className="text-2xl font-bold">5</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="track-stock" defaultChecked />
                    <Label htmlFor="track-stock">Suivre automatiquement le stock</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Optimisation SEO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="seo_title">Titre SEO</Label>
                    <Input
                      id="seo_title"
                      placeholder="Titre optimisé pour les moteurs de recherche"
                      maxLength={60}
                    />
                    <div className="text-xs text-muted-foreground mt-1">0/60 caractères</div>
                  </div>

                  <div>
                    <Label htmlFor="seo_description">Meta Description</Label>
                    <Textarea
                      id="seo_description"
                      placeholder="Description pour les résultats de recherche"
                      maxLength={160}
                      rows={3}
                    />
                    <div className="text-xs text-muted-foreground mt-1">0/160 caractères</div>
                  </div>

                  <div>
                    <Label>Image principale</Label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Cliquez pour uploader une image ou glissez-déposez
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Sauvegarder les modifications
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}