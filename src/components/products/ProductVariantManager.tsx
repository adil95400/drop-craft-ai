import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
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
import type { Database } from '@/integrations/supabase/types'

type ProductVariant = Database['public']['Tables']['product_variants']['Row']

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

export function ProductVariantManager({
  productId,
  variants,
  onRefetch,
}: ProductVariantManagerProps) {
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('product_variants').insert([
        {
          product_id: productId,
          user_id: user.id,
          name: variant.name,
          variant_sku: variant.variant_sku || null,
          price: variant.price,
          cost_price: variant.cost_price || null,
          stock_quantity: variant.stock_quantity || null,
          image_url: variant.image_url || null,
          options: variant.options || {},
          is_active: true,
        },
      ])

      if (error) throw error
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('product_variants')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId)
        .eq('user_id', user.id)

      if (error) throw error
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('product_variants').insert(
        variantsToCreate.map((v) => ({
          ...v,
          product_id: productId,
          user_id: user.id,
          is_active: true,
        }))
      )

      if (error) throw error
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
        <div>
          <h3 className="text-lg font-semibold">Variantes de produit</h3>
          <p className="text-sm text-muted-foreground">
            {variants.length} variante{variants.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAutoGenerate(true)}>
            <Wand2 className="h-4 w-4 mr-2" />
            Auto-générer
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBulkUpload(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button size="sm" onClick={() => setIsAddingVariant(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Variant List */}
      <div className="space-y-3">
        {variants.map((variant) => (
          <Card key={variant.id}>
            <CardContent className="p-4">
              {editingVariant === variant.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nom</Label>
                      <Input
                        value={editedVariant?.name || ''}
                        onChange={(e) =>
                          setEditedVariant({ ...editedVariant, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>SKU</Label>
                      <Input
                        value={editedVariant?.variant_sku || ''}
                        onChange={(e) =>
                          setEditedVariant({ ...editedVariant, variant_sku: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Prix</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editedVariant?.price || ''}
                        onChange={(e) =>
                          setEditedVariant({ ...editedVariant, price: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Prix de revient</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editedVariant?.cost_price || ''}
                        onChange={(e) =>
                          setEditedVariant({ ...editedVariant, cost_price: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        value={editedVariant?.stock_quantity || ''}
                        onChange={(e) =>
                          setEditedVariant({ ...editedVariant, stock_quantity: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <VariantImageUpload
                    imageUrl={editedVariant?.image_url}
                    onImageChange={(url) =>
                      setEditedVariant({ ...editedVariant, image_url: url })
                    }
                  />

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateVariant(variant.id)}
                      disabled={updateVariantMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingVariant(null)
                        setEditedVariant(null)
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  {variant.image_url && (
                    <img
                      src={variant.image_url}
                      alt={variant.name}
                      className="h-20 w-20 object-cover rounded-lg border flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{variant.name}</h4>
                      <Badge variant={variant.is_active ? 'default' : 'secondary'}>
                        {variant.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      {variant.variant_sku && (
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {variant.variant_sku}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {variant.price.toFixed(2)} €
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Stock: {variant.stock_quantity || 0}
                      </div>
                      {variant.options && Object.keys(variant.options).length > 0 && (
                        <div className="flex gap-1 flex-wrap col-span-2 md:col-span-1">
                          {Object.entries(variant.options as Record<string, any>).map(
                            ([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {String(value)}
                              </Badge>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditingVariant(variant)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeletingVariant(variant.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Variant Dialog */}
      <Dialog open={isAddingVariant} onOpenChange={setIsAddingVariant}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une variante</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateVariant} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom *</Label>
                <Input
                  value={newVariant.name}
                  onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              <div>
                <Label>SKU</Label>
                <Input
                  value={newVariant.variant_sku}
                  onChange={(e) => setNewVariant({ ...newVariant, variant_sku: e.target.value })}
                />
              </div>
              <div>
                <Label>Prix *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newVariant.price}
                  onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                />
                {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
              </div>
              <div>
                <Label>Prix de revient</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newVariant.cost_price}
                  onChange={(e) => setNewVariant({ ...newVariant, cost_price: e.target.value })}
                />
              </div>
              <div>
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={newVariant.stock_quantity}
                  onChange={(e) => setNewVariant({ ...newVariant, stock_quantity: e.target.value })}
                />
              </div>
            </div>

            <VariantImageUpload
              imageUrl={newVariant.image_url}
              onImageChange={(url) => setNewVariant({ ...newVariant, image_url: url })}
            />

            <div className="space-y-2">
              <Label>Options</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nom (ex: couleur)"
                  value={newOption.name}
                  onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                />
                <Input
                  placeholder="Valeur (ex: rouge)"
                  value={newOption.value}
                  onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                />
                <Button type="button" size="sm" onClick={addOptionToNewVariant}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {Object.entries(newVariant.options).length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(newVariant.options).map(([key, value]) => (
                    <Badge key={key} variant="secondary">
                      {key}: {value}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeOptionFromNewVariant(key)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={createVariantMutation.isPending}>
              {createVariantMutation.isPending ? 'Création...' : 'Créer la variante'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import CSV de variantes</DialogTitle>
            <DialogDescription>
              Importez plusieurs variantes à la fois via un fichier CSV
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadCSVTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger le modèle
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <FileText className="h-4 w-4 mr-2" />
                Choisir un fichier
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCSVUpload}
              />
            </div>

            {csvErrors.length > 0 && (
              <div className="p-4 border border-destructive rounded-lg">
                <h4 className="font-medium text-destructive mb-2">Erreurs détectées</h4>
                <ul className="list-disc list-inside text-sm">
                  {csvErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {csvData.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Aperçu ({csvData.length} variantes)</h4>
                <div className="max-h-64 overflow-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Nom</th>
                        <th className="p-2 text-left">SKU</th>
                        <th className="p-2 text-left">Prix</th>
                        <th className="p-2 text-left">Stock</th>
                        <th className="p-2 text-left">Image</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{row.name}</td>
                          <td className="p-2">{row.variant_sku || '-'}</td>
                          <td className="p-2">{row.price} €</td>
                          <td className="p-2">{row.stock_quantity || 0}</td>
                          <td className="p-2">{row.image_url ? '✓' : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button
                  onClick={handleBulkImport}
                  disabled={bulkCreateVariantsMutation.isPending}
                  className="w-full"
                >
                  {bulkCreateVariantsMutation.isPending
                    ? 'Import en cours...'
                    : `Importer ${csvData.length} variantes`}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Auto Generate Dialog */}
      <Dialog open={showAutoGenerate} onOpenChange={setShowAutoGenerate}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Auto-générer les variantes</DialogTitle>
            <DialogDescription>
              Créez automatiquement toutes les combinaisons de couleurs, tailles et matériaux
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label>Couleurs (séparées par des virgules)</Label>
                <Input
                  placeholder="ex: Rouge, Bleu, Vert"
                  value={autoGenOptions.colors}
                  onChange={(e) =>
                    setAutoGenOptions({ ...autoGenOptions, colors: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Tailles (séparées par des virgules)</Label>
                <Input
                  placeholder="ex: S, M, L, XL"
                  value={autoGenOptions.sizes}
                  onChange={(e) => setAutoGenOptions({ ...autoGenOptions, sizes: e.target.value })}
                />
              </div>
              <div>
                <Label>Matériaux (séparées par des virgules)</Label>
                <Input
                  placeholder="ex: Coton, Polyester, Laine"
                  value={autoGenOptions.materials}
                  onChange={(e) =>
                    setAutoGenOptions({ ...autoGenOptions, materials: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Prix de base</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="29.99"
                  value={autoGenOptions.basePrice}
                  onChange={(e) =>
                    setAutoGenOptions({ ...autoGenOptions, basePrice: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Prix de revient</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="15.00"
                  value={autoGenOptions.baseCostPrice}
                  onChange={(e) =>
                    setAutoGenOptions({ ...autoGenOptions, baseCostPrice: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Stock par défaut</Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={autoGenOptions.baseStock}
                  onChange={(e) =>
                    setAutoGenOptions({ ...autoGenOptions, baseStock: e.target.value })
                  }
                />
              </div>
            </div>

            <Button onClick={generateVariantCombinations} variant="outline" className="w-full">
              <Wand2 className="h-4 w-4 mr-2" />
              Générer les combinaisons
            </Button>

            {generatedVariants.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">
                  Aperçu ({generatedVariants.length} variantes à créer)
                </h4>
                <div className="max-h-64 overflow-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Nom</th>
                        <th className="p-2 text-left">SKU</th>
                        <th className="p-2 text-left">Prix</th>
                        <th className="p-2 text-left">Options</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedVariants.map((variant, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{variant.name}</td>
                          <td className="p-2">{variant.variant_sku}</td>
                          <td className="p-2">{variant.price.toFixed(2)} €</td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              {Object.values(variant.options).map((val: any, j: number) => (
                                <Badge key={j} variant="outline" className="text-xs">
                                  {String(val)}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button
                  onClick={handleGenerateVariants}
                  disabled={bulkCreateVariantsMutation.isPending}
                  className="w-full"
                >
                  {bulkCreateVariantsMutation.isPending
                    ? 'Création en cours...'
                    : `Créer ${generatedVariants.length} variantes`}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingVariant} onOpenChange={() => setDeletingVariant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette variante ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingVariant) {
                  deleteVariantMutation.mutate(deletingVariant)
                }
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
