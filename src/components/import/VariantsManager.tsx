import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Image, 
  Palette, 
  Ruler,
  DollarSign,
  Package,
  Bot,
  Wand2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Variant {
  id: string
  sku: string
  name: string
  color: string
  size: string
  material: string
  price: number
  costPrice: number
  stock: number
  imageUrl: string
  isActive: boolean
}

interface VariantsManagerProps {
  productId: string
  variants: Variant[]
  onVariantsUpdate: (variants: Variant[]) => void
}

export const VariantsManager = ({ productId, variants, onVariantsUpdate }: VariantsManagerProps) => {
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false)
  const { toast } = useToast()

  const [newVariant, setNewVariant] = useState<Partial<Variant>>({
    sku: '',
    name: '',
    color: '',
    size: '',
    material: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    imageUrl: '',
    isActive: true
  })

  const colorOptions = [
    { name: 'Rouge', hex: '#EF4444', value: 'red' },
    { name: 'Bleu', hex: '#3B82F6', value: 'blue' },
    { name: 'Vert', hex: '#10B981', value: 'green' },
    { name: 'Noir', hex: '#1F2937', value: 'black' },
    { name: 'Blanc', hex: '#FFFFFF', value: 'white' },
    { name: 'Gris', hex: '#6B7280', value: 'gray' },
    { name: 'Jaune', hex: '#F59E0B', value: 'yellow' },
    { name: 'Violet', hex: '#8B5CF6', value: 'purple' }
  ]

  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size']
  const materialOptions = ['Coton', 'Polyester', 'Cuir', 'Métal', 'Plastique', 'Bois', 'Verre']

  const handleAddVariant = () => {
    if (!newVariant.name || !newVariant.sku) {
      toast({
        title: "Erreur",
        description: "Le nom et le SKU sont obligatoires",
        variant: "destructive"
      })
      return
    }

    const variant: Variant = {
      id: `var_${Date.now()}`,
      sku: newVariant.sku || '',
      name: newVariant.name || '',
      color: newVariant.color || '',
      size: newVariant.size || '',
      material: newVariant.material || '',
      price: newVariant.price || 0,
      costPrice: newVariant.costPrice || 0,
      stock: newVariant.stock || 0,
      imageUrl: newVariant.imageUrl || '',
      isActive: true
    }

    const updatedVariants = [...variants, variant]
    onVariantsUpdate(updatedVariants)
    setNewVariant({
      sku: '',
      name: '',
      color: '',
      size: '',
      material: '',
      price: 0,
      costPrice: 0,
      stock: 0,
      imageUrl: '',
      isActive: true
    })
    setShowAddForm(false)

    toast({
      title: "Variante ajoutée",
      description: "La nouvelle variante a été ajoutée avec succès"
    })
  }

  const handleDeleteVariant = (variantId: string) => {
    const updatedVariants = variants.filter(v => v.id !== variantId)
    onVariantsUpdate(updatedVariants)
    
    toast({
      title: "Variante supprimée",
      description: "La variante a été supprimée avec succès"
    })
  }

  const handleUpdateVariant = (updatedVariant: Variant) => {
    const updatedVariants = variants.map(v => 
      v.id === updatedVariant.id ? updatedVariant : v
    )
    onVariantsUpdate(updatedVariants)
    setEditingVariant(null)
    
    toast({
      title: "Variante mise à jour",
      description: "La variante a été mise à jour avec succès"
    })
  }

  const generateAIVariants = async () => {
    setIsGeneratingVariants(true)
    
    // Simulation de la génération IA
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const aiGeneratedVariants: Variant[] = [
      {
        id: `ai_var_${Date.now()}_1`,
        sku: `${productId}_RED_M`,
        name: 'Rouge - Taille M',
        color: 'red',
        size: 'M',
        material: 'Coton',
        price: 29.99,
        costPrice: 15.99,
        stock: 50,
        imageUrl: '',
        isActive: true
      },
      {
        id: `ai_var_${Date.now()}_2`,
        sku: `${productId}_BLUE_L`,
        name: 'Bleu - Taille L',
        color: 'blue',
        size: 'L',
        material: 'Coton',
        price: 29.99,
        costPrice: 15.99,
        stock: 30,
        imageUrl: '',
        isActive: true
      },
      {
        id: `ai_var_${Date.now()}_3`,
        sku: `${productId}_BLACK_S`,
        name: 'Noir - Taille S',
        color: 'black',
        size: 'S',
        material: 'Coton',
        price: 29.99,
        costPrice: 15.99,
        stock: 25,
        imageUrl: '',
        isActive: true
      }
    ]
    
    const updatedVariants = [...variants, ...aiGeneratedVariants]
    onVariantsUpdate(updatedVariants)
    setIsGeneratingVariants(false)
    
    toast({
      title: "Variantes générées par IA",
      description: `${aiGeneratedVariants.length} variantes ont été générées automatiquement`
    })
  }

  const calculateTotalValue = () => {
    return variants.reduce((total, variant) => total + (variant.price * variant.stock), 0)
  }

  const calculateMargin = (price: number, costPrice: number) => {
    if (costPrice === 0) return 0
    return Math.round(((price - costPrice) / costPrice) * 100)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Gestionnaire de Variantes
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={generateAIVariants}
                disabled={isGeneratingVariants}
              >
                {isGeneratingVariants ? (
                  <>
                    <Bot className="w-4 h-4 mr-2 animate-pulse" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Générer avec IA
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Variante
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Package className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <p className="text-sm font-medium">{variants.length}</p>
              <p className="text-xs text-muted-foreground">Variantes</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <p className="text-sm font-medium">€{calculateTotalValue().toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Valeur Stock</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <Palette className="w-5 h-5 mx-auto mb-1 text-orange-600" />
              <p className="text-sm font-medium">{new Set(variants.map(v => v.color).filter(Boolean)).size}</p>
              <p className="text-xs text-muted-foreground">Couleurs</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Ruler className="w-5 h-5 mx-auto mb-1 text-purple-600" />
              <p className="text-sm font-medium">{new Set(variants.map(v => v.size).filter(Boolean)).size}</p>
              <p className="text-xs text-muted-foreground">Tailles</p>
            </div>
          </div>

          {/* Formulaire d'ajout */}
          {showAddForm && (
            <Card className="mb-6 border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Nouvelle Variante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="variant-name">Nom de la variante</Label>
                    <Input
                      id="variant-name"
                      placeholder="Rouge - Taille M"
                      value={newVariant.name}
                      onChange={(e) => setNewVariant({...newVariant, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="variant-sku">SKU</Label>
                    <Input
                      id="variant-sku"
                      placeholder="PROD_RED_M"
                      value={newVariant.sku}
                      onChange={(e) => setNewVariant({...newVariant, sku: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Couleur</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setNewVariant({...newVariant, color: color.value})}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newVariant.color === color.value ? 'border-primary' : 'border-gray-200'
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Taille</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {sizeOptions.map((size) => (
                        <Badge
                          key={size}
                          variant={newVariant.size === size ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setNewVariant({...newVariant, size})}
                        >
                          {size}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Matériau</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {materialOptions.map((material) => (
                        <Badge
                          key={material}
                          variant={newVariant.material === material ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => setNewVariant({...newVariant, material})}
                        >
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="variant-price">Prix (€)</Label>
                    <Input
                      id="variant-price"
                      type="number"
                      step="0.01"
                      value={newVariant.price}
                      onChange={(e) => setNewVariant({...newVariant, price: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="variant-cost">Prix coût (€)</Label>
                    <Input
                      id="variant-cost"
                      type="number"
                      step="0.01"
                      value={newVariant.costPrice}
                      onChange={(e) => setNewVariant({...newVariant, costPrice: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="variant-stock">Stock</Label>
                    <Input
                      id="variant-stock"
                      type="number"
                      value={newVariant.stock}
                      onChange={(e) => setNewVariant({...newVariant, stock: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button onClick={handleAddVariant} className="flex-1">
                      Ajouter
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddForm(false)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table des variantes */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Nom / SKU</TableHead>
                  <TableHead>Attributs</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Marge</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell>
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        {variant.imageUrl ? (
                          <img src={variant.imageUrl} alt={variant.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Image className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{variant.name}</p>
                        <p className="text-xs text-muted-foreground">{variant.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {variant.color && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: colorOptions.find(c => c.value === variant.color)?.hex }}
                            />
                            {variant.color}
                          </Badge>
                        )}
                        {variant.size && (
                          <Badge variant="outline" className="text-xs">{variant.size}</Badge>
                        )}
                        {variant.material && (
                          <Badge variant="outline" className="text-xs">{variant.material}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">€{variant.price.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Coût: €{variant.costPrice.toFixed(2)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={calculateMargin(variant.price, variant.costPrice) > 50 ? "default" : "secondary"}>
                        {calculateMargin(variant.price, variant.costPrice)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <p className="font-medium">{variant.stock}</p>
                        <p className="text-xs text-muted-foreground">
                          €{(variant.price * variant.stock).toFixed(2)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingVariant(variant)}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteVariant(variant.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {variants.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune variante créée</p>
              <p className="text-sm">Ajoutez votre première variante pour commencer</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}