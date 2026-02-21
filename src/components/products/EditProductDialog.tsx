import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductImageGallery } from './ProductImageGallery'
import { ProductVariantsManager } from './ProductVariantsManager'
import { UnifiedProduct } from '@/services/ProductsUnifiedService'
import { Package, Image, Layers, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface EditProductDialogProps {
  product: UnifiedProduct
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (product: Partial<UnifiedProduct>) => Promise<void>
}

export function EditProductDialog({ product, open, onOpenChange, onSave }: EditProductDialogProps) {
  const [formData, setFormData] = useState(product)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setFormData(product)
  }, [product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const profitMargin = formData.cost_price && formData.price
    ? ((formData.price - formData.cost_price) / formData.price * 100).toFixed(1)
    : '0'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Éditer le produit</DialogTitle>
            <Badge variant={formData.status === 'active' ? 'default' : 'secondary'}>
              {formData.status === 'active' ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Général
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Images
              </TabsTrigger>
              <TabsTrigger value="variants" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Variantes
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Prix & Marges
              </TabsTrigger>
            </TabsList>

            {/* Tab Général */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Nom du produit *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    placeholder="Description détaillée du produit..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="Code produit unique"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Catégorie</Label>
                    <Select 
                      value={formData.category || ''} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Électronique">Électronique</SelectItem>
                        <SelectItem value="Mode">Mode</SelectItem>
                        <SelectItem value="Maison">Maison</SelectItem>
                        <SelectItem value="Informatique">Informatique</SelectItem>
                        <SelectItem value="Audio">Audio</SelectItem>
                        <SelectItem value="Sport">Sport</SelectItem>
                        <SelectItem value="Beauté">Beauté</SelectItem>
                        <SelectItem value="Jouets">Jouets</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock_quantity || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Statut</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value: 'active' | 'paused' | 'draft' | 'archived') => setFormData(prev => ({ ...prev, status: value }))}
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
              </div>
            </TabsContent>

            {/* Tab Images */}
            <TabsContent value="images" className="mt-4">
              <ProductImageGallery
                images={formData.images || []}
                onImagesChange={(images) => setFormData(prev => ({ 
                  ...prev, 
                  images,
                  image_url: images[0] || prev.image_url
                }))}
              />
            </TabsContent>

            {/* Tab Variantes */}
            <TabsContent value="variants" className="mt-4">
              <ProductVariantsManager
                variants={formData.variants || []}
                onVariantsChange={(variants) => setFormData(prev => ({ ...prev, variants }))}
              />
            </TabsContent>

            {/* Tab Prix & Marges */}
            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Prix de vente (€) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cost_price">Prix d'achat (€)</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      value={formData.cost_price || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                {/* Calcul de marge */}
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h4 className="font-semibold">Analyse de marge</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Marge brute</p>
                      <p className="text-2xl font-bold">
                        {((formData.price - (formData.cost_price || 0))).toFixed(2)} €
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Marge (%)</p>
                      <p className="text-2xl font-bold text-success">{profitMargin}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Recommandé</p>
                      <p className="text-sm mt-1">
                        Marge cible : <span className="font-semibold">30-40%</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
