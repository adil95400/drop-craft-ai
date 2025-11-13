import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Papa from 'papaparse'
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
          options: variant.options || {},
          is_active: true,
        },
      ])

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      toast({
        title: 'Variant created',
        description: 'Product variant added successfully',
      })
      setIsAddingVariant(false)
      resetNewVariant()
      onRefetch()
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create variant',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const bulkCreateVariantsMutation = useMutation({
    mutationFn: async (variants: any[]) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('product_variants').insert(
        variants.map((v) => ({
          product_id: productId,
          user_id: user.id,
          name: v.name,
          variant_sku: v.variant_sku || null,
          price: v.price,
          cost_price: v.cost_price || null,
          stock_quantity: v.stock_quantity || null,
          options: v.options || {},
          is_active: true,
        }))
      )

      if (error) throw error
      return variants.length
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      toast({
        title: 'Bulk import successful',
        description: `${count} variants created successfully`,
      })
      setShowBulkUpload(false)
      setCsvData([])
      setCsvErrors([])
      onRefetch()
    },
    onError: (error: any) => {
      toast({
        title: 'Bulk import failed',
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
        title: 'Variant updated',
        description: 'Changes saved successfully',
      })
      setEditingVariant(null)
      setEditedVariant(null)
      onRefetch()
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update variant',
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
        title: 'Variant deleted',
        description: 'Product variant removed successfully',
      })
      setDeletingVariant(null)
      onRefetch()
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete variant',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const downloadCSVTemplate = () => {
    const template = `name,variant_sku,price,cost_price,stock_quantity,color,size
Red / Small,PRD-RED-SM,29.99,15.00,50,Red,Small
Red / Medium,PRD-RED-MD,29.99,15.00,75,Red,Medium
Red / Large,PRD-RED-LG,29.99,15.00,60,Red,Large
Blue / Small,PRD-BLU-SM,29.99,15.00,45,Blue,Small
Blue / Medium,PRD-BLU-MD,29.99,15.00,80,Blue,Medium`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'variant-template.csv'
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: 'Template downloaded',
      description: 'CSV template has been downloaded',
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVVariant[]
        const validationErrors: string[] = []
        const validVariants: any[] = []

        data.forEach((row, index) => {
          if (!row.name) {
            validationErrors.push(`Row ${index + 1}: Name is required`)
            return
          }
          if (!row.price || isNaN(parseFloat(row.price))) {
            validationErrors.push(`Row ${index + 1}: Valid price is required`)
            return
          }

          const options: Record<string, string> = {}
          Object.keys(row).forEach((key) => {
            if (
              !['name', 'variant_sku', 'price', 'cost_price', 'stock_quantity'].includes(key) &&
              row[key]
            ) {
              options[key] = row[key]!
            }
          })

          validVariants.push({
            name: row.name,
            variant_sku: row.variant_sku || '',
            price: parseFloat(row.price),
            cost_price: row.cost_price ? parseFloat(row.cost_price) : null,
            stock_quantity: row.stock_quantity ? parseInt(row.stock_quantity) : null,
            options,
          })
        })

        if (validationErrors.length > 0) {
          setCsvErrors(validationErrors)
          toast({
            title: 'Validation errors',
            description: `${validationErrors.length} errors found in CSV`,
            variant: 'destructive',
          })
        } else {
          setCsvData(validVariants)
          setCsvErrors([])
          toast({
            title: 'CSV parsed successfully',
            description: `${validVariants.length} variants ready to import`,
          })
        }
      },
      error: (error) => {
        toast({
          title: 'CSV parse error',
          description: error.message,
          variant: 'destructive',
        })
      },
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleBulkImport = () => {
    if (csvData.length === 0) {
      toast({
        title: 'No data',
        description: 'Please upload a CSV file first',
        variant: 'destructive',
      })
      return
    }

    bulkCreateVariantsMutation.mutate(csvData)
  }

  const resetNewVariant = () => {
    setNewVariant({
      name: '',
      variant_sku: '',
      price: '',
      cost_price: '',
      stock_quantity: '',
      options: {},
    })
    setNewOption({ name: '', value: '' })
    setErrors({})
  }

  const validateVariant = (variant: any) => {
    try {
      variantSchema.parse({
        name: variant.name,
        variant_sku: variant.variant_sku || undefined,
        price: variant.price ? parseFloat(variant.price) : undefined,
        cost_price: variant.cost_price ? parseFloat(variant.cost_price) : undefined,
        stock_quantity: variant.stock_quantity ? parseInt(variant.stock_quantity) : undefined,
        options: variant.options,
      })
      setErrors({})
      return true
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
      return false
    }
  }

  const handleAddVariant = () => {
    if (!validateVariant(newVariant)) return

    createVariantMutation.mutate({
      name: newVariant.name,
      variant_sku: newVariant.variant_sku || null,
      price: parseFloat(newVariant.price),
      cost_price: newVariant.cost_price ? parseFloat(newVariant.cost_price) : null,
      stock_quantity: newVariant.stock_quantity ? parseInt(newVariant.stock_quantity) : null,
      options: newVariant.options,
    })
  }

  const handleUpdateVariant = (variantId: string) => {
    if (!editedVariant || !validateVariant(editedVariant)) return

    updateVariantMutation.mutate({
      id: variantId,
      updates: {
        name: editedVariant.name,
        variant_sku: editedVariant.variant_sku || null,
        price: editedVariant.price,
        cost_price: editedVariant.cost_price || null,
        stock_quantity: editedVariant.stock_quantity || null,
        options: editedVariant.options || {},
      },
    })
  }

  const startEdit = (variant: ProductVariant) => {
    setEditingVariant(variant.id)
    setEditedVariant({ ...variant })
  }

  const cancelEdit = () => {
    setEditingVariant(null)
    setEditedVariant(null)
    setErrors({})
  }

  const addOption = () => {
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

  const removeOption = (optionName: string) => {
    const { [optionName]: _, ...rest } = newVariant.options
    setNewVariant({ ...newVariant, options: rest })
  }

  const generateVariantCombinations = () => {
    const colors = autoGenOptions.colors
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c)
    const sizes = autoGenOptions.sizes
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s)
    const materials = autoGenOptions.materials
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m)

    if (colors.length === 0 && sizes.length === 0 && materials.length === 0) {
      toast({
        title: 'No options provided',
        description: 'Please enter at least one option (color, size, or material)',
        variant: 'destructive',
      })
      return
    }

    const basePrice = parseFloat(autoGenOptions.basePrice) || 0
    const baseCostPrice = autoGenOptions.baseCostPrice
      ? parseFloat(autoGenOptions.baseCostPrice)
      : null
    const baseStock = autoGenOptions.baseStock ? parseInt(autoGenOptions.baseStock) : null

    const combinations: any[] = []

    // Generate all combinations
    if (colors.length > 0 && sizes.length > 0 && materials.length > 0) {
      // All three options
      colors.forEach((color) => {
        sizes.forEach((size) => {
          materials.forEach((material) => {
            combinations.push({
              name: `${color} / ${size} / ${material}`,
              variant_sku: `${color.substring(0, 3).toUpperCase()}-${size.toUpperCase()}-${material.substring(0, 3).toUpperCase()}`,
              price: basePrice,
              cost_price: baseCostPrice,
              stock_quantity: baseStock,
              options: { color, size, material },
            })
          })
        })
      })
    } else if (colors.length > 0 && sizes.length > 0) {
      // Color + Size
      colors.forEach((color) => {
        sizes.forEach((size) => {
          combinations.push({
            name: `${color} / ${size}`,
            variant_sku: `${color.substring(0, 3).toUpperCase()}-${size.toUpperCase()}`,
            price: basePrice,
            cost_price: baseCostPrice,
            stock_quantity: baseStock,
            options: { color, size },
          })
        })
      })
    } else if (colors.length > 0 && materials.length > 0) {
      // Color + Material
      colors.forEach((color) => {
        materials.forEach((material) => {
          combinations.push({
            name: `${color} / ${material}`,
            variant_sku: `${color.substring(0, 3).toUpperCase()}-${material.substring(0, 3).toUpperCase()}`,
            price: basePrice,
            cost_price: baseCostPrice,
            stock_quantity: baseStock,
            options: { color, material },
          })
        })
      })
    } else if (sizes.length > 0 && materials.length > 0) {
      // Size + Material
      sizes.forEach((size) => {
        materials.forEach((material) => {
          combinations.push({
            name: `${size} / ${material}`,
            variant_sku: `${size.toUpperCase()}-${material.substring(0, 3).toUpperCase()}`,
            price: basePrice,
            cost_price: baseCostPrice,
            stock_quantity: baseStock,
            options: { size, material },
          })
        })
      })
    } else if (colors.length > 0) {
      // Only colors
      colors.forEach((color) => {
        combinations.push({
          name: color,
          variant_sku: color.substring(0, 3).toUpperCase(),
          price: basePrice,
          cost_price: baseCostPrice,
          stock_quantity: baseStock,
          options: { color },
        })
      })
    } else if (sizes.length > 0) {
      // Only sizes
      sizes.forEach((size) => {
        combinations.push({
          name: size,
          variant_sku: size.toUpperCase(),
          price: basePrice,
          cost_price: baseCostPrice,
          stock_quantity: baseStock,
          options: { size },
        })
      })
    } else if (materials.length > 0) {
      // Only materials
      materials.forEach((material) => {
        combinations.push({
          name: material,
          variant_sku: material.substring(0, 3).toUpperCase(),
          price: basePrice,
          cost_price: baseCostPrice,
          stock_quantity: baseStock,
          options: { material },
        })
      })
    }

    setGeneratedVariants(combinations)
    toast({
      title: 'Variants generated',
      description: `${combinations.length} variant combinations created`,
    })
  }

  const handleAutoGenerate = () => {
    if (generatedVariants.length === 0) {
      toast({
        title: 'No variants generated',
        description: 'Please generate variants first',
        variant: 'destructive',
      })
      return
    }

    bulkCreateVariantsMutation.mutate(generatedVariants)
  }

  const resetAutoGenerate = () => {
    setAutoGenOptions({
      colors: '',
      sizes: '',
      materials: '',
      basePrice: '',
      baseCostPrice: '',
      baseStock: '',
    })
    setGeneratedVariants([])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Product Variants</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAutoGenerate(true)}
          >
            <Package className="h-4 w-4 mr-2" />
            Auto Generate
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowBulkUpload(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddingVariant(true)}
            disabled={isAddingVariant}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
        </div>
      </div>

      {isAddingVariant && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">New Variant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Variant Name *</Label>
                <Input
                  placeholder="e.g., Red / Large"
                  value={newVariant.name}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, name: e.target.value })
                  }
                />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <Label>SKU</Label>
                <Input
                  placeholder="Variant SKU"
                  value={newVariant.variant_sku}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, variant_sku: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newVariant.price}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, price: e.target.value })
                  }
                />
                {errors.price && (
                  <p className="text-xs text-destructive mt-1">{errors.price}</p>
                )}
              </div>
              <div>
                <Label>Cost Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newVariant.cost_price}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, cost_price: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Stock Quantity</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newVariant.stock_quantity}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, stock_quantity: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="mb-2 block">Variant Options (Color, Size, etc.)</Label>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Option name (e.g., Color)"
                  value={newOption.name}
                  onChange={(e) =>
                    setNewOption({ ...newOption, name: e.target.value })
                  }
                  className="flex-1"
                />
                <Input
                  placeholder="Value (e.g., Red)"
                  value={newOption.value}
                  onChange={(e) =>
                    setNewOption({ ...newOption, value: e.target.value })
                  }
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addOption}
                  disabled={!newOption.name || !newOption.value}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(newVariant.options).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="gap-2">
                    <span className="font-semibold">{key}:</span> {value}
                    <button
                      onClick={() => removeOption(key)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingVariant(false)
                  resetNewVariant()
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddVariant}
                disabled={createVariantMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Create Variant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {variants.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No variants yet. Add your first variant or import from CSV.
              </p>
            </CardContent>
          </Card>
        ) : (
          variants.map((variant) => (
            <Card key={variant.id}>
              <CardContent className="p-4">
                {editingVariant === variant.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Variant Name</Label>
                        <Input
                          value={editedVariant.name}
                          onChange={(e) =>
                            setEditedVariant({
                              ...editedVariant,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>SKU</Label>
                        <Input
                          value={editedVariant.variant_sku || ''}
                          onChange={(e) =>
                            setEditedVariant({
                              ...editedVariant,
                              variant_sku: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editedVariant.price || ''}
                          onChange={(e) =>
                            setEditedVariant({
                              ...editedVariant,
                              price: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Cost Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editedVariant.cost_price || ''}
                          onChange={(e) =>
                            setEditedVariant({
                              ...editedVariant,
                              cost_price: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Stock</Label>
                        <Input
                          type="number"
                          value={editedVariant.stock_quantity || ''}
                          onChange={(e) =>
                            setEditedVariant({
                              ...editedVariant,
                              stock_quantity: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleUpdateVariant(variant.id)}
                        disabled={updateVariantMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">{variant.name}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        {variant.variant_sku && (
                          <div className="flex items-center gap-2">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">SKU:</span>
                            <span className="font-mono">{variant.variant_sku}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Price:</span>
                          <span className="font-semibold">${variant.price.toFixed(2)}</span>
                        </div>
                        {variant.stock_quantity !== null && (
                          <div className="flex items-center gap-2">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Stock:</span>
                            <Badge
                              variant={
                                variant.stock_quantity > 0 ? 'default' : 'destructive'
                              }
                            >
                              {variant.stock_quantity}
                            </Badge>
                          </div>
                        )}
                      </div>
                      {variant.options &&
                        typeof variant.options === 'object' &&
                        Object.keys(variant.options).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {Object.entries(variant.options as Record<string, string>).map(
                              ([key, value]) => (
                                <Badge key={key} variant="outline">
                                  <span className="font-semibold">{key}:</span> {value}
                                </Badge>
                              )
                            )}
                          </div>
                        )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(variant)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingVariant(variant.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showAutoGenerate} onOpenChange={setShowAutoGenerate}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Auto-Generate Variants</DialogTitle>
            <DialogDescription>
              Enter your product options and automatically generate all combinations. Separate
              multiple values with commas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Product Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Colors (comma-separated)</Label>
                    <Input
                      placeholder="e.g., Red, Blue, Green, Black"
                      value={autoGenOptions.colors}
                      onChange={(e) =>
                        setAutoGenOptions({ ...autoGenOptions, colors: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Example: Red, Blue, Green
                    </p>
                  </div>
                  <div>
                    <Label>Sizes (comma-separated)</Label>
                    <Input
                      placeholder="e.g., XS, S, M, L, XL"
                      value={autoGenOptions.sizes}
                      onChange={(e) =>
                        setAutoGenOptions({ ...autoGenOptions, sizes: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Example: S, M, L, XL
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label>Materials (comma-separated) - Optional</Label>
                    <Input
                      placeholder="e.g., Cotton, Polyester, Wool"
                      value={autoGenOptions.materials}
                      onChange={(e) =>
                        setAutoGenOptions({ ...autoGenOptions, materials: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Example: Cotton, Polyester
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="mb-3 block">Base Pricing & Inventory</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Base Price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="29.99"
                        value={autoGenOptions.basePrice}
                        onChange={(e) =>
                          setAutoGenOptions({
                            ...autoGenOptions,
                            basePrice: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Base Cost Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="15.00"
                        value={autoGenOptions.baseCostPrice}
                        onChange={(e) =>
                          setAutoGenOptions({
                            ...autoGenOptions,
                            baseCostPrice: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Base Stock</Label>
                      <Input
                        type="number"
                        placeholder="50"
                        value={autoGenOptions.baseStock}
                        onChange={(e) =>
                          setAutoGenOptions({
                            ...autoGenOptions,
                            baseStock: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={generateVariantCombinations}
                    className="flex-1"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Generate Combinations
                  </Button>
                  <Button variant="outline" onClick={resetAutoGenerate}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {generatedVariants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Generated Variants ({generatedVariants.length})</span>
                    <Badge variant="secondary">{generatedVariants.length} variants</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {generatedVariants.map((variant, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <p className="font-semibold">{variant.name}</p>
                            <Badge variant="outline" className="font-mono text-xs">
                              {variant.variant_sku}
                            </Badge>
                          </div>
                          <div className="flex gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              <span>Price: ${variant.price.toFixed(2)}</span>
                            </div>
                            {variant.cost_price && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <span>Cost: ${variant.cost_price.toFixed(2)}</span>
                              </div>
                            )}
                            {variant.stock_quantity !== null && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Package className="h-3 w-3" />
                                <span>Stock: {variant.stock_quantity}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Object.entries(variant.options).map(([key, value]) => (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {key}: {String(value)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-start gap-3">
                      <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Ready to Create</p>
                        <p className="text-xs text-muted-foreground">
                          {generatedVariants.length} variants will be created with the options
                          you specified. You can edit individual variants after creation.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAutoGenerate(false)
                  resetAutoGenerate()
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAutoGenerate}
                disabled={generatedVariants.length === 0 || bulkCreateVariantsMutation.isPending}
              >
                {bulkCreateVariantsMutation.isPending ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create {generatedVariants.length} Variants
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Import Variants from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import multiple variants at once. Download the template
              to see the required format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadCSVTemplate} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {csvErrors.length > 0 && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-sm text-destructive">
                    Validation Errors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {csvErrors.map((error, index) => (
                      <li key={index} className="text-destructive">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {csvData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Preview ({csvData.length} variants)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {csvData.slice(0, 10).map((variant, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded text-sm"
                      >
                        <div className="flex-1">
                          <p className="font-semibold">{variant.name}</p>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>SKU: {variant.variant_sku || 'N/A'}</span>
                            <span>Price: ${variant.price}</span>
                            {variant.stock_quantity && (
                              <span>Stock: {variant.stock_quantity}</span>
                            )}
                          </div>
                          {Object.keys(variant.options || {}).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(variant.options || {}).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}: {value}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {csvData.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center">
                        ... and {csvData.length - 10} more variants
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowBulkUpload(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkImport}
                disabled={csvData.length === 0 || bulkCreateVariantsMutation.isPending}
              >
                {bulkCreateVariantsMutation.isPending ? (
                  <>Importing...</>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import {csvData.length} Variants
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingVariant}
        onOpenChange={(open) => !open && setDeletingVariant(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Variant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this variant? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingVariant && deleteVariantMutation.mutate(deletingVariant)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
