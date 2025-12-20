import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Papa from 'papaparse'
import { VariantImageUpload } from './VariantImageUpload'
import {
  Plus,
  X,
  Edit2,
  Trash2,
  Save,
  Package,
  DollarSign,
  Hash,
  Upload,
  Download,
  FileText,
  Wand2,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { z } from 'zod'

// Mock ProductVariant type since product_variants table doesn't exist
interface ProductVariant {
  id: string
  product_id: string
  user_id: string
  name: string
  variant_sku: string | null
  price: number
  cost_price: number | null
  stock_quantity: number | null
  image_url: string | null
  options: Record<string, string> | null
  is_active: boolean
  created_at: string
}

const variantSchema = z.object({
  name: z.string().min(1, 'Variant name is required').max(100),
  variant_sku: z.string().max(50).optional(),
  price: z.number().min(0, 'Price must be positive'),
  cost_price: z.number().min(0, 'Cost price must be positive').optional(),
  stock_quantity: z.number().int().min(0, 'Stock must be non-negative').optional(),
  options: z.record(z.string()).optional(),
})

interface ProductVariantManagerProps {
  productId: string
  variants: ProductVariant[]
  onRefetch: () => void
}

interface CSVVariant {
  name: string
  variant_sku?: string
  price: string
  cost_price?: string
  stock_quantity?: string
  image_url?: string
  [key: string]: string | undefined
}

// Helper to get variants from localStorage
const getStoredVariants = (productId: string): ProductVariant[] => {
  try {
    const stored = localStorage.getItem(`product_variants_${productId}`)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Helper to save variants to localStorage
const saveStoredVariants = (productId: string, variants: ProductVariant[]) => {
  localStorage.setItem(`product_variants_${productId}`, JSON.stringify(variants))
}

export function ProductVariantManager({
  productId,
  variants: initialVariants,
  onRefetch,
}: ProductVariantManagerProps) {
  const [variants, setVariants] = useState<ProductVariant[]>(() => {
    // Merge initial variants with stored ones
    const stored = getStoredVariants(productId)
    return stored.length > 0 ? stored : initialVariants
  })
  const [isAddingVariant, setIsAddingVariant] = useState(false)
  const [editingVariant, setEditingVariant] = useState<string | null>(null)
  const [deletingVariant, setDeletingVariant] = useState<string | null>(null)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [showAutoGenerate, setShowAutoGenerate] = useState(false)
  const [csvData, setCsvData] = useState<CSVVariant[]>([])
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [autoGenOptions, setAutoGenOptions] = useState({
    colors: '',
    sizes: '',
    materials: '',
    basePrice: '',
    baseCostPrice: '',
    baseStock: '',
  })
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([])
  const [newVariant, setNewVariant] = useState({
    name: '',
    variant_sku: '',
    price: '',
    cost_price: '',
    stock_quantity: '',
    image_url: '',
    options: {} as Record<string, string>,
  })
  const [editedVariant, setEditedVariant] = useState<any>(null)
  const [newOption, setNewOption] = useState({ name: '', value: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const createVariantMutation = useMutation({
    mutationFn: async (variant: any) => {
      // Using localStorage mock since product_variants table doesn't exist
      const newVariant: ProductVariant = {
        id: crypto.randomUUID(),
        product_id: productId,
        user_id: 'local-user',
        name: variant.name,
        variant_sku: variant.variant_sku || null,
        price: variant.price,
        cost_price: variant.cost_price || null,
        stock_quantity: variant.stock_quantity || null,
        image_url: variant.image_url || null,
        options: variant.options || {},
        is_active: true,
        created_at: new Date().toISOString(),
      }
      
      const updated = [...variants, newVariant]
      setVariants(updated)
      saveStoredVariants(productId, updated)
      return newVariant
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      toast({
        title: 'Variante créée',
        description: 'La variante a été ajoutée avec succès',
      })
      setIsAddingVariant(false)
      setNewVariant({
        name: '',
        variant_sku: '',
        price: '',
        cost_price: '',
        stock_quantity: '',
        image_url: '',
        options: {},
      })
      onRefetch()
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const updateVariantMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const updated = variants.map(v => v.id === id ? { ...v, ...updates } : v)
      setVariants(updated)
      saveStoredVariants(productId, updated)
      return updated.find(v => v.id === id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      toast({
        title: 'Variante mise à jour',
        description: 'Les modifications ont été enregistrées',
      })
      setEditingVariant(null)
      setEditedVariant(null)
      onRefetch()
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const deleteVariantMutation = useMutation({
    mutationFn: async (variantId: string) => {
      const updated = variants.filter(v => v.id !== variantId)
      setVariants(updated)
      saveStoredVariants(productId, updated)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      toast({
        title: 'Variante supprimée',
        description: 'La variante a été supprimée avec succès',
      })
      setDeletingVariant(null)
      onRefetch()
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const bulkCreateVariantsMutation = useMutation({
    mutationFn: async (variantsToCreate: any[]) => {
      const newVariants: ProductVariant[] = variantsToCreate.map(v => ({
        id: crypto.randomUUID(),
        product_id: productId,
        user_id: 'local-user',
        name: v.name,
        variant_sku: v.variant_sku || null,
        price: v.price,
        cost_price: v.cost_price || null,
        stock_quantity: v.stock_quantity || null,
        image_url: v.image_url || null,
        options: v.options || {},
        is_active: true,
        created_at: new Date().toISOString(),
      }))
      
      const updated = [...variants, ...newVariants]
      setVariants(updated)
      saveStoredVariants(productId, updated)
      return newVariants
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      toast({
        title: 'Variantes créées',
        description: 'Toutes les variantes ont été ajoutées avec succès',
      })
      setCsvData([])
      setShowBulkUpload(false)
      setGeneratedVariants([])
      setShowAutoGenerate(false)
      onRefetch()
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleCreateVariant = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      const validatedData = variantSchema.parse({
        name: newVariant.name,
        variant_sku: newVariant.variant_sku || undefined,
        price: parseFloat(newVariant.price),
        cost_price: newVariant.cost_price ? parseFloat(newVariant.cost_price) : undefined,
        stock_quantity: newVariant.stock_quantity ? parseInt(newVariant.stock_quantity) : undefined,
        options: newVariant.options,
      })

      createVariantMutation.mutate({
        ...validatedData,
        image_url: newVariant.image_url || null,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message
          }
        })
        setErrors(newErrors)
      }
    }
  }

  const handleUpdateVariant = (variantId: string) => {
    if (!editedVariant) return

    try {
      const validatedData = variantSchema.parse({
        name: editedVariant.name,
        variant_sku: editedVariant.variant_sku || undefined,
        price: parseFloat(editedVariant.price),
        cost_price: editedVariant.cost_price ? parseFloat(editedVariant.cost_price) : undefined,
        stock_quantity: editedVariant.stock_quantity ? parseInt(editedVariant.stock_quantity) : undefined,
        options: editedVariant.options || {},
      })

      updateVariantMutation.mutate({
        id: variantId,
        updates: {
          ...validatedData,
          image_url: editedVariant.image_url || null,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Erreur de validation',
          description: error.errors[0].message,
          variant: 'destructive',
        })
      }
    }
  }

  const startEditingVariant = (variant: ProductVariant) => {
    setEditingVariant(variant.id)
    setEditedVariant({
      name: variant.name,
      variant_sku: variant.variant_sku || '',
      price: variant.price.toString(),
      cost_price: variant.cost_price?.toString() || '',
      stock_quantity: variant.stock_quantity?.toString() || '',
      image_url: variant.image_url || '',
      options: variant.options || {},
    })
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as CSVVariant[]
        const errors: string[] = []
        const validData: CSVVariant[] = []

        data.forEach((row, index) => {
          if (!row.name || !row.price) {
            errors.push(`Ligne ${index + 1}: nom et prix requis`)
          } else if (isNaN(parseFloat(row.price))) {
            errors.push(`Ligne ${index + 1}: prix invalide`)
          } else {
            validData.push(row)
          }
        })

        setCsvErrors(errors)
        setCsvData(validData)

        if (validData.length > 0) {
          toast({
            title: `${validData.length} variantes chargées`,
            description: errors.length > 0 ? `${errors.length} erreurs détectées` : undefined,
          })
        }
      },
      error: () => {
        toast({
          title: 'Erreur',
          description: 'Impossible de lire le fichier CSV',
          variant: 'destructive',
        })
      },
    })
  }

  const handleBulkImport = () => {
    const variantsToCreate = csvData.map((row) => {
      const options: Record<string, string> = {}
      Object.keys(row).forEach((key) => {
        if (!['name', 'variant_sku', 'price', 'cost_price', 'stock_quantity', 'image_url'].includes(key) && row[key]) {
          options[key] = row[key] as string
        }
      })

      return {
        name: row.name,
        variant_sku: row.variant_sku || null,
        price: parseFloat(row.price),
        cost_price: row.cost_price ? parseFloat(row.cost_price) : null,
        stock_quantity: row.stock_quantity ? parseInt(row.stock_quantity) : null,
        image_url: row.image_url || null,
        options,
      }
    })

    bulkCreateVariantsMutation.mutate(variantsToCreate)
  }

  const downloadCSVTemplate = () => {
    const template = 'name,variant_sku,price,cost_price,stock_quantity,image_url,color,size,material\n"T-Shirt Rouge M","RED-M",29.99,15.00,50,"https://example.com/red.jpg","Rouge","M","Coton"'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'variants_template.csv'
    a.click()
  }

  const generateVariantCombinations = () => {
    const colors = autoGenOptions.colors.split(',').map((s) => s.trim()).filter(Boolean)
    const sizes = autoGenOptions.sizes.split(',').map((s) => s.trim()).filter(Boolean)
    const materials = autoGenOptions.materials.split(',').map((s) => s.trim()).filter(Boolean)

    const allOptions = [
      colors.length > 0 ? { name: 'color', values: colors } : null,
      sizes.length > 0 ? { name: 'size', values: sizes } : null,
      materials.length > 0 ? { name: 'material', values: materials } : null,
    ].filter(Boolean) as Array<{ name: string; values: string[] }>

    if (allOptions.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir au moins une option',
        variant: 'destructive',
      })
      return
    }

    const combinations = generateCombinations(allOptions)
    const basePrice = parseFloat(autoGenOptions.basePrice) || 0
    const baseCostPrice = parseFloat(autoGenOptions.baseCostPrice) || 0
    const baseStock = parseInt(autoGenOptions.baseStock) || 0

    const generated = combinations.map((combo) => {
      const name = combo.map((c) => c.value).join(' / ')
      const sku = combo.map((c) => c.value.substring(0, 3).toUpperCase()).join('-')
      const options: Record<string, string> = {}
      combo.forEach((c) => {
        options[c.name] = c.value
      })

      return {
        name,
        variant_sku: sku,
        price: basePrice,
        cost_price: baseCostPrice || null,
        stock_quantity: baseStock || null,
        image_url: null,
        options,
      }
    })

    setGeneratedVariants(generated)
  }

  const generateCombinations = (
    options: Array<{ name: string; values: string[] }>
  ): Array<Array<{ name: string; value: string }>> => {
    if (options.length === 0) return []
    if (options.length === 1) {
      return options[0].values.map((v) => [{ name: options[0].name, value: v }])
    }

    const result: Array<Array<{ name: string; value: string }>> = []
    const firstOption = options[0]
    const restCombinations = generateCombinations(options.slice(1))

    for (const value of firstOption.values) {
      for (const combo of restCombinations) {
        result.push([{ name: firstOption.name, value }, ...combo])
      }
    }

    return result
  }

  const handleGenerateVariants = () => {
    if (generatedVariants.length === 0) return
    bulkCreateVariantsMutation.mutate(generatedVariants)
  }

  const addOptionToNewVariant = () => {
    if (!newOption.name || !newOption.value) return
    setNewVariant({
      ...newVariant,
      options: {
        ...newVariant.options,
        [newOption.name]: newOption.value,
      },
    })
    setNewOption({ name: '', value: '' })
  }

  const removeOptionFromNewVariant = (optionName: string) => {
    const { [optionName]: _, ...rest } = newVariant.options
    setNewVariant({ ...newVariant, options: rest })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Variantes du produit</h3>
          <Badge variant="secondary">{variants.length} variante(s)</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadCSVTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Modèle CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBulkUpload(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAutoGenerate(true)}>
            <Wand2 className="h-4 w-4 mr-2" />
            Auto-générer
          </Button>
          <Button size="sm" onClick={() => setIsAddingVariant(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Variants List */}
      {variants.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune variante pour ce produit</p>
            <p className="text-sm">Ajoutez des variantes ou importez un fichier CSV</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {variants.map((variant) => (
            <Card key={variant.id}>
              <CardContent className="py-4">
                {editingVariant === variant.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nom</Label>
                        <Input
                          value={editedVariant?.name || ''}
                          onChange={(e) => setEditedVariant({ ...editedVariant, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>SKU</Label>
                        <Input
                          value={editedVariant?.variant_sku || ''}
                          onChange={(e) => setEditedVariant({ ...editedVariant, variant_sku: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Prix</Label>
                        <Input
                          type="number"
                          value={editedVariant?.price || ''}
                          onChange={(e) => setEditedVariant({ ...editedVariant, price: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Prix coûtant</Label>
                        <Input
                          type="number"
                          value={editedVariant?.cost_price || ''}
                          onChange={(e) => setEditedVariant({ ...editedVariant, cost_price: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Stock</Label>
                        <Input
                          type="number"
                          value={editedVariant?.stock_quantity || ''}
                          onChange={(e) => setEditedVariant({ ...editedVariant, stock_quantity: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdateVariant(variant.id)}>
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingVariant(null)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {variant.image_url ? (
                        <img src={variant.image_url} alt={variant.name} className="h-12 w-12 object-cover rounded" />
                      ) : (
                        <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{variant.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {variant.variant_sku && <span>SKU: {variant.variant_sku}</span>}
                          <span>•</span>
                          <span>{variant.price}€</span>
                          {variant.stock_quantity !== null && (
                            <>
                              <span>•</span>
                              <span>Stock: {variant.stock_quantity}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => startEditingVariant(variant)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeletingVariant(variant.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Variant Dialog */}
      <Dialog open={isAddingVariant} onOpenChange={setIsAddingVariant}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une variante</DialogTitle>
            <DialogDescription>Créez une nouvelle variante pour ce produit</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateVariant} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom *</Label>
                <Input
                  value={newVariant.name}
                  onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                  placeholder="Ex: Rouge / M"
                />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label>SKU</Label>
                <Input
                  value={newVariant.variant_sku}
                  onChange={(e) => setNewVariant({ ...newVariant, variant_sku: e.target.value })}
                  placeholder="Ex: PROD-RED-M"
                />
              </div>
              <div>
                <Label>Prix *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newVariant.price}
                  onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                  placeholder="0.00"
                />
                {errors.price && <p className="text-sm text-destructive mt-1">{errors.price}</p>}
              </div>
              <div>
                <Label>Prix coûtant</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newVariant.cost_price}
                  onChange={(e) => setNewVariant({ ...newVariant, cost_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Quantité en stock</Label>
                <Input
                  type="number"
                  value={newVariant.stock_quantity}
                  onChange={(e) => setNewVariant({ ...newVariant, stock_quantity: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nom (ex: Couleur)"
                  value={newOption.name}
                  onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                />
                <Input
                  placeholder="Valeur (ex: Rouge)"
                  value={newOption.value}
                  onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                />
                <Button type="button" variant="outline" onClick={addOptionToNewVariant}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {Object.entries(newVariant.options).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(newVariant.options).map(([name, value]) => (
                    <Badge key={name} variant="secondary" className="flex items-center gap-1">
                      {name}: {value}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeOptionFromNewVariant(name)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddingVariant(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createVariantMutation.isPending}>
                {createVariantMutation.isPending ? 'Création...' : 'Créer la variante'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import CSV de variantes</DialogTitle>
            <DialogDescription>Importez plusieurs variantes à partir d'un fichier CSV</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground"
            />
            {csvErrors.length > 0 && (
              <div className="text-sm text-destructive">
                {csvErrors.slice(0, 5).map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
                {csvErrors.length > 5 && <p>...et {csvErrors.length - 5} autres erreurs</p>}
              </div>
            )}
            {csvData.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {csvData.length} variante(s) prête(s) à être importée(s)
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkUpload(false)}>
                Annuler
              </Button>
              <Button onClick={handleBulkImport} disabled={csvData.length === 0 || bulkCreateVariantsMutation.isPending}>
                {bulkCreateVariantsMutation.isPending ? 'Import...' : 'Importer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auto Generate Dialog */}
      <Dialog open={showAutoGenerate} onOpenChange={setShowAutoGenerate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Générer des variantes automatiquement</DialogTitle>
            <DialogDescription>
              Créez toutes les combinaisons possibles à partir des options
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Couleurs (séparées par virgules)</Label>
              <Input
                placeholder="Rouge, Bleu, Vert"
                value={autoGenOptions.colors}
                onChange={(e) => setAutoGenOptions({ ...autoGenOptions, colors: e.target.value })}
              />
            </div>
            <div>
              <Label>Tailles (séparées par virgules)</Label>
              <Input
                placeholder="S, M, L, XL"
                value={autoGenOptions.sizes}
                onChange={(e) => setAutoGenOptions({ ...autoGenOptions, sizes: e.target.value })}
              />
            </div>
            <div>
              <Label>Matériaux (séparées par virgules)</Label>
              <Input
                placeholder="Coton, Polyester"
                value={autoGenOptions.materials}
                onChange={(e) => setAutoGenOptions({ ...autoGenOptions, materials: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Prix de base</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={autoGenOptions.basePrice}
                  onChange={(e) => setAutoGenOptions({ ...autoGenOptions, basePrice: e.target.value })}
                />
              </div>
              <div>
                <Label>Coût de base</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={autoGenOptions.baseCostPrice}
                  onChange={(e) => setAutoGenOptions({ ...autoGenOptions, baseCostPrice: e.target.value })}
                />
              </div>
              <div>
                <Label>Stock de base</Label>
                <Input
                  type="number"
                  value={autoGenOptions.baseStock}
                  onChange={(e) => setAutoGenOptions({ ...autoGenOptions, baseStock: e.target.value })}
                />
              </div>
            </div>

            <Button variant="outline" onClick={generateVariantCombinations} className="w-full">
              <Wand2 className="h-4 w-4 mr-2" />
              Prévisualiser les combinaisons
            </Button>

            {generatedVariants.length > 0 && (
              <div className="max-h-40 overflow-y-auto border rounded p-2 text-sm">
                {generatedVariants.map((v, i) => (
                  <div key={i} className="py-1 border-b last:border-0">
                    {v.name} - {v.price}€
                  </div>
                ))}
                <p className="text-muted-foreground mt-2">{generatedVariants.length} variantes à créer</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAutoGenerate(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleGenerateVariants}
                disabled={generatedVariants.length === 0 || bulkCreateVariantsMutation.isPending}
              >
                {bulkCreateVariantsMutation.isPending ? 'Création...' : 'Créer les variantes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingVariant} onOpenChange={() => setDeletingVariant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette variante ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La variante sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingVariant && deleteVariantMutation.mutate(deletingVariant)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
