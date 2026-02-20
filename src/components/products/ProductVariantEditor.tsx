/**
 * ProductVariantEditor — Professional variant management
 * Supports option groups (Size, Color, Material) with per-variant SKU/Price/Stock
 */
import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Plus, Trash2, Package, Layers, Edit3, Save, X, 
  AlertTriangle, Copy, GripVertical, ChevronDown, ChevronUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from 'sonner'

export interface VariantOption {
  name: string    // e.g. "Size", "Color"
  values: string[] // e.g. ["S", "M", "L"]
}

export interface ProductVariantData {
  id: string
  sku: string
  price: number | null
  cost_price: number | null
  stock_quantity: number
  weight: number | null
  barcode: string | null
  is_active: boolean
  attributes: Record<string, string> // { Size: "M", Color: "Red" }
  image_url?: string
}

interface ProductVariantEditorProps {
  variants: ProductVariantData[]
  options: VariantOption[]
  basePrice: number
  baseSku?: string
  onVariantsChange: (variants: ProductVariantData[]) => void
  onOptionsChange: (options: VariantOption[]) => void
  readOnly?: boolean
}

export function ProductVariantEditor({
  variants,
  options,
  basePrice,
  baseSku,
  onVariantsChange,
  onOptionsChange,
  readOnly = false
}: ProductVariantEditorProps) {
  const [newOptionName, setNewOptionName] = useState('')
  const [newOptionValues, setNewOptionValues] = useState('')
  const [showAddOption, setShowAddOption] = useState(false)
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null)
  const [editingOption, setEditingOption] = useState<number | null>(null)

  // Stats
  const stats = useMemo(() => {
    const active = variants.filter(v => v.is_active).length
    const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
    const lowStock = variants.filter(v => v.is_active && v.stock_quantity > 0 && v.stock_quantity < 5).length
    const outOfStock = variants.filter(v => v.is_active && v.stock_quantity === 0).length
    return { active, totalStock, lowStock, outOfStock, total: variants.length }
  }, [variants])

  // Add option group
  const handleAddOption = useCallback(() => {
    if (!newOptionName.trim()) return
    const values = newOptionValues.split(',').map(v => v.trim()).filter(Boolean)
    if (values.length === 0) return

    const newOptions = [...options, { name: newOptionName.trim(), values }]
    onOptionsChange(newOptions)

    // Generate variants for new option values
    if (variants.length === 0) {
      // First option: create one variant per value
      const newVariants = values.map((val, i) => ({
        id: `var_${Date.now()}_${i}`,
        sku: baseSku ? `${baseSku}-${val.toUpperCase().slice(0, 3)}` : `VAR-${i + 1}`,
        price: null,
        cost_price: null,
        stock_quantity: 0,
        weight: null,
        barcode: null,
        is_active: true,
        attributes: { [newOptionName.trim()]: val }
      }))
      onVariantsChange(newVariants)
    } else {
      // Multiply existing variants by new values
      const newVariants: ProductVariantData[] = []
      for (const variant of variants) {
        for (const val of values) {
          newVariants.push({
            ...variant,
            id: `var_${Date.now()}_${newVariants.length}`,
            sku: `${variant.sku}-${val.toUpperCase().slice(0, 3)}`,
            attributes: { ...variant.attributes, [newOptionName.trim()]: val }
          })
        }
      }
      onVariantsChange(newVariants)
    }

    setNewOptionName('')
    setNewOptionValues('')
    setShowAddOption(false)
    toast.success(`Option "${newOptionName}" ajoutée avec ${values.length} valeurs`)
  }, [newOptionName, newOptionValues, options, variants, baseSku, onOptionsChange, onVariantsChange])

  // Remove option group
  const handleRemoveOption = useCallback((index: number) => {
    const optionName = options[index].name
    const newOptions = options.filter((_, i) => i !== index)
    onOptionsChange(newOptions)

    // Remove attribute from all variants
    const newVariants = variants.map(v => {
      const attrs = { ...v.attributes }
      delete attrs[optionName]
      return { ...v, attributes: attrs }
    })
    // Deduplicate variants that are now identical
    const seen = new Set<string>()
    const deduped = newVariants.filter(v => {
      const key = JSON.stringify(v.attributes)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    onVariantsChange(deduped)
  }, [options, variants, onOptionsChange, onVariantsChange])

  // Update variant field
  const handleUpdateVariant = useCallback((id: string, field: keyof ProductVariantData, value: any) => {
    onVariantsChange(variants.map(v => v.id === id ? { ...v, [field]: value } : v))
  }, [variants, onVariantsChange])

  // Delete variant
  const handleDeleteVariant = useCallback((id: string) => {
    onVariantsChange(variants.filter(v => v.id !== id))
  }, [variants, onVariantsChange])

  // Duplicate variant
  const handleDuplicateVariant = useCallback((variant: ProductVariantData) => {
    const dup: ProductVariantData = {
      ...variant,
      id: `var_${Date.now()}`,
      sku: `${variant.sku}-COPY`,
    }
    onVariantsChange([...variants, dup])
    toast.success('Variante dupliquée')
  }, [variants, onVariantsChange])

  // Bulk set price
  const handleBulkSetPrice = useCallback((price: number) => {
    onVariantsChange(variants.map(v => ({ ...v, price })))
    toast.success(`Prix mis à jour pour ${variants.length} variantes`)
  }, [variants, onVariantsChange])

  // Get margin for variant
  const getMargin = (v: ProductVariantData) => {
    const price = v.price ?? basePrice
    if (!v.cost_price || price <= 0) return null
    return ((price - v.cost_price) / price * 100).toFixed(0)
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Variantes</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Package className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-medium">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Actives</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{stats.totalStock}</p>
            <p className="text-xs text-muted-foreground">Stock total</p>
          </div>
        </div>
        {stats.lowStock > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">{stats.lowStock}</p>
              <p className="text-xs text-muted-foreground">Stock bas</p>
            </div>
          </div>
        )}
        {stats.outOfStock > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">{stats.outOfStock}</p>
              <p className="text-xs text-muted-foreground">Rupture</p>
            </div>
          </div>
        )}
      </div>

      {/* Option Groups */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Options (attributs)</h4>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={() => setShowAddOption(!showAddOption)}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter option
            </Button>
          )}
        </div>

        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2 p-3 rounded-lg border bg-card">
            <span className="text-sm font-medium min-w-[80px]">{opt.name}</span>
            <div className="flex flex-wrap gap-1 flex-1">
              {opt.values.map((val) => (
                <Badge key={val} variant="secondary" className="text-xs">{val}</Badge>
              ))}
            </div>
            {!readOnly && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveOption(i)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}

        {/* Add option form */}
        {showAddOption && (
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nom de l'option</Label>
                  <Input
                    placeholder="Ex: Taille, Couleur, Matière"
                    value={newOptionName}
                    onChange={(e) => setNewOptionName(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Valeurs (séparées par des virgules)</Label>
                  <Input
                    placeholder="Ex: S, M, L, XL"
                    value={newOptionValues}
                    onChange={(e) => setNewOptionValues(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowAddOption(false)}>
                  Annuler
                </Button>
                <Button size="sm" onClick={handleAddOption} disabled={!newOptionName.trim() || !newOptionValues.trim()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Créer l'option
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Variants Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Variantes ({variants.length})</h4>
        </div>

        {variants.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">Aucune variante</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ajoutez des options (Taille, Couleur...) pour générer automatiquement les variantes
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
              <div className="col-span-3">Variante</div>
              <div className="col-span-2">SKU</div>
              <div className="col-span-1">Prix €</div>
              <div className="col-span-1">Coût €</div>
              <div className="col-span-1">Marge</div>
              <div className="col-span-1">Stock</div>
              <div className="col-span-1">Actif</div>
              <div className="col-span-2">Actions</div>
            </div>

            {/* Rows */}
            {variants.map((variant) => {
              const margin = getMargin(variant)
              const displayPrice = variant.price ?? basePrice
              return (
                <Collapsible key={variant.id} open={expandedVariant === variant.id} onOpenChange={(open) => setExpandedVariant(open ? variant.id : null)}>
                  <div className={cn(
                    "grid grid-cols-12 gap-2 p-3 items-center border-b last:border-b-0 transition-colors",
                    !variant.is_active && "opacity-50",
                    variant.stock_quantity === 0 && variant.is_active && "bg-destructive/5"
                  )}>
                    {/* Variant name/attributes */}
                    <div className="col-span-3 flex items-center gap-2">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                          {expandedVariant === variant.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      </CollapsibleTrigger>
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(variant.attributes).map(([key, val]) => (
                            <Badge key={key} variant="outline" className="text-[10px] py-0">
                              {val}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* SKU */}
                    <div className="col-span-2">
                      <Input
                        value={variant.sku}
                        onChange={(e) => handleUpdateVariant(variant.id, 'sku', e.target.value)}
                        className="h-7 text-xs"
                        disabled={readOnly}
                      />
                    </div>

                    {/* Price */}
                    <div className="col-span-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={variant.price ?? ''}
                        placeholder={basePrice.toFixed(2)}
                        onChange={(e) => handleUpdateVariant(variant.id, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                        className="h-7 text-xs"
                        disabled={readOnly}
                      />
                    </div>

                    {/* Cost */}
                    <div className="col-span-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={variant.cost_price ?? ''}
                        onChange={(e) => handleUpdateVariant(variant.id, 'cost_price', e.target.value ? parseFloat(e.target.value) : null)}
                        className="h-7 text-xs"
                        disabled={readOnly}
                      />
                    </div>

                    {/* Margin */}
                    <div className="col-span-1 text-xs text-center">
                      {margin ? (
                        <span className={cn(
                          "font-medium",
                          parseFloat(margin) >= 30 ? "text-green-600" : parseFloat(margin) >= 15 ? "text-amber-600" : "text-red-600"
                        )}>
                          {margin}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>

                    {/* Stock */}
                    <div className="col-span-1">
                      <Input
                        type="number"
                        value={variant.stock_quantity}
                        onChange={(e) => handleUpdateVariant(variant.id, 'stock_quantity', parseInt(e.target.value) || 0)}
                        className={cn("h-7 text-xs", variant.stock_quantity === 0 && "border-destructive/50")}
                        disabled={readOnly}
                      />
                    </div>

                    {/* Active toggle */}
                    <div className="col-span-1 flex justify-center">
                      <Switch
                        checked={variant.is_active}
                        onCheckedChange={(checked) => handleUpdateVariant(variant.id, 'is_active', checked)}
                        disabled={readOnly}
                        className="scale-75"
                      />
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicateVariant(variant)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      {!readOnly && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteVariant(variant.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  <CollapsibleContent>
                    <div className="p-4 bg-muted/30 border-b space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Code-barres (EAN/UPC)</Label>
                          <Input
                            value={variant.barcode ?? ''}
                            onChange={(e) => handleUpdateVariant(variant.id, 'barcode', e.target.value || null)}
                            className="h-8 text-xs"
                            placeholder="Code-barres"
                            disabled={readOnly}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Poids (kg)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={variant.weight ?? ''}
                            onChange={(e) => handleUpdateVariant(variant.id, 'weight', e.target.value ? parseFloat(e.target.value) : null)}
                            className="h-8 text-xs"
                            placeholder="Poids"
                            disabled={readOnly}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Image URL</Label>
                          <Input
                            value={variant.image_url ?? ''}
                            onChange={(e) => handleUpdateVariant(variant.id, 'image_url', e.target.value || undefined)}
                            className="h-8 text-xs"
                            placeholder="URL de l'image"
                            disabled={readOnly}
                          />
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
