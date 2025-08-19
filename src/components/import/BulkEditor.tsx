import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Edit3, 
  Save, 
  Filter, 
  RefreshCw,
  Check,
  X,
  DollarSign,
  Tag,
  Globe,
  Wand2,
  Zap,
  Calculator
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Product {
  id: string
  name: string
  sku: string
  price: number
  costPrice: number
  category: string
  status: string
  stock: number
  tags: string[]
  supplier: string
  margin: number
}

interface BulkEditorProps {
  products: Product[]
  onProductsUpdate: (products: Product[]) => void
}

export const BulkEditor = ({ products, onProductsUpdate }: BulkEditorProps) => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [filterCategory, setFilterCategory] = useState("")
  const [filterSupplier, setFilterSupplier] = useState("")
  const { toast } = useToast()

  const [bulkChanges, setBulkChanges] = useState({
    priceAdjustment: { type: 'none', value: 0 }, // none, percentage, fixed
    marginTarget: 0,
    category: '',
    tags: '',
    status: '',
    supplier: ''
  })

  const filteredProducts = products.filter(product => {
    const categoryMatch = !filterCategory || product.category.toLowerCase().includes(filterCategory.toLowerCase())
    const supplierMatch = !filterSupplier || product.supplier.toLowerCase().includes(filterSupplier.toLowerCase())
    return categoryMatch && supplierMatch
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(p => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId])
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Aucune sélection",
        description: "Veuillez sélectionner au moins un produit",
        variant: "destructive"
      })
      return
    }

    setIsEditing(true)
    setProgress(0)

    // Simulation du traitement
    const updateSteps = selectedProducts.length
    let currentStep = 0

    const updatedProducts = products.map(product => {
      if (selectedProducts.includes(product.id)) {
        currentStep++
        setProgress((currentStep / updateSteps) * 100)
        
        let updatedProduct = { ...product }

        // Ajustement des prix
        if (bulkChanges.priceAdjustment.type === 'percentage') {
          updatedProduct.price = product.price * (1 + bulkChanges.priceAdjustment.value / 100)
        } else if (bulkChanges.priceAdjustment.type === 'fixed') {
          updatedProduct.price = product.price + bulkChanges.priceAdjustment.value
        }

        // Ajustement par marge cible
        if (bulkChanges.marginTarget > 0) {
          updatedProduct.price = product.costPrice * (1 + bulkChanges.marginTarget / 100)
        }

        // Autres modifications
        if (bulkChanges.category) updatedProduct.category = bulkChanges.category
        if (bulkChanges.status) updatedProduct.status = bulkChanges.status
        if (bulkChanges.supplier) updatedProduct.supplier = bulkChanges.supplier
        
        // Ajout de tags
        if (bulkChanges.tags) {
          const newTags = bulkChanges.tags.split(',').map(tag => tag.trim())
          updatedProduct.tags = [...new Set([...product.tags, ...newTags])]
        }

        // Recalcul de la marge
        updatedProduct.margin = Math.round(((updatedProduct.price - product.costPrice) / product.costPrice) * 100)

        return updatedProduct
      }
      return product
    })

    // Simulation du délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1000))

    onProductsUpdate(updatedProducts)
    setIsEditing(false)
    setProgress(0)
    setSelectedProducts([])

    toast({
      title: "Mise à jour terminée",
      description: `${selectedProducts.length} produits ont été mis à jour avec succès`
    })
  }

  const calculateMarginFromPrice = (price: number, costPrice: number) => {
    if (costPrice === 0) return 0
    return Math.round(((price - costPrice) / costPrice) * 100)
  }

  const calculatePriceFromMargin = (costPrice: number, margin: number) => {
    return costPrice * (1 + margin / 100)
  }

  const previewChanges = () => {
    return selectedProducts.map(id => {
      const product = products.find(p => p.id === id)!
      let newPrice = product.price

      if (bulkChanges.priceAdjustment.type === 'percentage') {
        newPrice = product.price * (1 + bulkChanges.priceAdjustment.value / 100)
      } else if (bulkChanges.priceAdjustment.type === 'fixed') {
        newPrice = product.price + bulkChanges.priceAdjustment.value
      } else if (bulkChanges.marginTarget > 0) {
        newPrice = calculatePriceFromMargin(product.costPrice, bulkChanges.marginTarget)
      }

      return {
        ...product,
        newPrice,
        newMargin: calculateMarginFromPrice(newPrice, product.costPrice)
      }
    })
  }

  const categories = [...new Set(products.map(p => p.category))]
  const suppliers = [...new Set(products.map(p => p.supplier))]

  if (isEditing) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
            Édition en cours...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progression</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
          
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <Edit3 className="w-8 h-8 mx-auto mb-2 text-primary animate-pulse" />
            <p className="text-sm font-medium">
              Mise à jour de {selectedProducts.length} produits en cours...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              Éditeur en Masse
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {selectedProducts.length} sélectionné(s)
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="select" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="select">Sélection</TabsTrigger>
              <TabsTrigger value="edit">Édition</TabsTrigger>
              <TabsTrigger value="preview">Aperçu</TabsTrigger>
            </TabsList>

            <TabsContent value="select" className="mt-6">
              <div className="space-y-4">
                {/* Filtres */}
                <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor="filter-category">Filtrer par catégorie</Label>
                    <select
                      id="filter-category"
                      className="w-full mt-1 p-2 border rounded-md"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option value="">Toutes les catégories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="filter-supplier">Filtrer par fournisseur</Label>
                    <select
                      id="filter-supplier"
                      className="w-full mt-1 p-2 border rounded-md"
                      value={filterSupplier}
                      onChange={(e) => setFilterSupplier(e.target.value)}
                    >
                      <option value="">Tous les fournisseurs</option>
                      {suppliers.map(sup => (
                        <option key={sup} value={sup}>{sup}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline">
                      <Filter className="w-4 h-4 mr-2" />
                      Filtres avancés
                    </Button>
                  </div>
                </div>

                {/* Table de sélection */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Marge</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">€{product.price.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">Coût: €{product.costPrice.toFixed(2)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.margin > 50 ? "default" : "secondary"}>
                              {product.margin}%
                            </Badge>
                          </TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.status === 'active' ? "default" : "secondary"}>
                              {product.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="edit" className="mt-6">
              <div className="space-y-6">
                {/* Ajustement des prix */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Ajustement des Prix
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Type d'ajustement</Label>
                        <select
                          className="w-full mt-1 p-2 border rounded-md"
                          value={bulkChanges.priceAdjustment.type}
                          onChange={(e) => setBulkChanges({
                            ...bulkChanges,
                            priceAdjustment: { ...bulkChanges.priceAdjustment, type: e.target.value as any }
                          })}
                        >
                          <option value="none">Aucun changement</option>
                          <option value="percentage">Pourcentage</option>
                          <option value="fixed">Montant fixe</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label>Valeur</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={bulkChanges.priceAdjustment.value}
                          onChange={(e) => setBulkChanges({
                            ...bulkChanges,
                            priceAdjustment: { ...bulkChanges.priceAdjustment, value: parseFloat(e.target.value) || 0 }
                          })}
                          disabled={bulkChanges.priceAdjustment.type === 'none'}
                        />
                      </div>

                      <div>
                        <Label>Marge cible (%)</Label>
                        <Input
                          type="number"
                          value={bulkChanges.marginTarget}
                          onChange={(e) => setBulkChanges({
                            ...bulkChanges,
                            marginTarget: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Modifications des attributs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Attributs Produits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bulk-category">Nouvelle catégorie</Label>
                        <Input
                          id="bulk-category"
                          placeholder="Laisser vide pour ne pas modifier"
                          value={bulkChanges.category}
                          onChange={(e) => setBulkChanges({...bulkChanges, category: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="bulk-supplier">Nouveau fournisseur</Label>
                        <Input
                          id="bulk-supplier"
                          placeholder="Laisser vide pour ne pas modifier"
                          value={bulkChanges.supplier}
                          onChange={(e) => setBulkChanges({...bulkChanges, supplier: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bulk-tags">Ajouter des tags (séparés par des virgules)</Label>
                        <Input
                          id="bulk-tags"
                          placeholder="promo, nouveauté, bestseller"
                          value={bulkChanges.tags}
                          onChange={(e) => setBulkChanges({...bulkChanges, tags: e.target.value})}
                        />
                      </div>

                      <div>
                        <Label htmlFor="bulk-status">Statut</Label>
                        <select
                          id="bulk-status"
                          className="w-full mt-1 p-2 border rounded-md"
                          value={bulkChanges.status}
                          onChange={(e) => setBulkChanges({...bulkChanges, status: e.target.value})}
                        >
                          <option value="">Ne pas modifier</option>
                          <option value="active">Actif</option>
                          <option value="inactive">Inactif</option>
                          <option value="draft">Brouillon</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions rapides */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      Actions Rapides
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBulkChanges({
                          ...bulkChanges,
                          priceAdjustment: { type: 'percentage', value: 20 }
                        })}
                      >
                        <Calculator className="w-3 h-3 mr-1" />
                        +20% Prix
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBulkChanges({
                          ...bulkChanges,
                          marginTarget: 50
                        })}
                      >
                        <DollarSign className="w-3 h-3 mr-1" />
                        Marge 50%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBulkChanges({
                          ...bulkChanges,
                          tags: 'promo, -20%'
                        })}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        Tags Promo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBulkChanges({
                          ...bulkChanges,
                          status: 'active'
                        })}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Activer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Aperçu des modifications</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedProducts.length} produit(s) seront modifié(s)
                    </p>
                  </div>
                  <Button onClick={handleBulkUpdate} disabled={selectedProducts.length === 0}>
                    <Save className="w-4 h-4 mr-2" />
                    Appliquer les modifications
                  </Button>
                </div>

                {selectedProducts.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead>Prix Actuel</TableHead>
                          <TableHead>Nouveau Prix</TableHead>
                          <TableHead>Marge Actuelle</TableHead>
                          <TableHead>Nouvelle Marge</TableHead>
                          <TableHead>Impact</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewChanges().map((preview) => (
                          <TableRow key={preview.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{preview.name}</p>
                                <p className="text-xs text-muted-foreground">{preview.sku}</p>
                              </div>
                            </TableCell>
                            <TableCell>€{preview.price.toFixed(2)}</TableCell>
                            <TableCell>
                              <span className={preview.newPrice !== preview.price ? 'font-medium text-primary' : ''}>
                                €{preview.newPrice.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>{preview.margin}%</TableCell>
                            <TableCell>
                              <span className={preview.newMargin !== preview.margin ? 'font-medium text-primary' : ''}>
                                {preview.newMargin}%
                              </span>
                            </TableCell>
                            <TableCell>
                              {preview.newPrice > preview.price ? (
                                <Badge variant="default" className="bg-green-500">
                                  +{((preview.newPrice - preview.price) / preview.price * 100).toFixed(1)}%
                                </Badge>
                              ) : preview.newPrice < preview.price ? (
                                <Badge variant="destructive">
                                  {((preview.newPrice - preview.price) / preview.price * 100).toFixed(1)}%
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Aucun</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}