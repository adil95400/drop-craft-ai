/**
 * Éditeur de mapping produit - Style Channable
 * Permet de mapper les champs produits entre ShopOpti et les canaux
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ArrowRight, Plus, Trash2, Save, RefreshCw, Sparkles,
  AlertCircle, CheckCircle2, Link2, Unlink, Settings2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Champs source ShopOpti
const SOURCE_FIELDS = [
  { id: 'title', label: 'Titre', type: 'text', required: true },
  { id: 'description', label: 'Description', type: 'text', required: true },
  { id: 'price', label: 'Prix', type: 'number', required: true },
  { id: 'compare_at_price', label: 'Prix barré', type: 'number' },
  { id: 'sku', label: 'SKU', type: 'text' },
  { id: 'barcode', label: 'Code-barres (EAN/GTIN)', type: 'text' },
  { id: 'stock_quantity', label: 'Quantité en stock', type: 'number', required: true },
  { id: 'weight', label: 'Poids (kg)', type: 'number' },
  { id: 'category', label: 'Catégorie', type: 'text' },
  { id: 'brand', label: 'Marque', type: 'text' },
  { id: 'images', label: 'Images', type: 'array' },
  { id: 'tags', label: 'Tags', type: 'array' },
  { id: 'variant_title', label: 'Variante', type: 'text' },
  { id: 'shipping_class', label: 'Classe expédition', type: 'text' },
]

// Champs destination par plateforme
const DESTINATION_FIELDS: Record<string, Array<{ id: string; label: string; required?: boolean }>> = {
  shopify: [
    { id: 'title', label: 'Title', required: true },
    { id: 'body_html', label: 'Body HTML', required: true },
    { id: 'vendor', label: 'Vendor' },
    { id: 'product_type', label: 'Product Type' },
    { id: 'tags', label: 'Tags' },
    { id: 'price', label: 'Price', required: true },
    { id: 'compare_at_price', label: 'Compare At Price' },
    { id: 'sku', label: 'SKU' },
    { id: 'barcode', label: 'Barcode' },
    { id: 'inventory_quantity', label: 'Inventory Quantity' },
    { id: 'weight', label: 'Weight' },
    { id: 'weight_unit', label: 'Weight Unit' },
  ],
  amazon: [
    { id: 'item_name', label: 'Item Name', required: true },
    { id: 'product_description', label: 'Product Description', required: true },
    { id: 'brand', label: 'Brand', required: true },
    { id: 'standard_price', label: 'Price', required: true },
    { id: 'quantity', label: 'Quantity', required: true },
    { id: 'sku', label: 'Seller SKU', required: true },
    { id: 'external_product_id', label: 'EAN/UPC', required: true },
    { id: 'bullet_point1', label: 'Bullet Point 1' },
    { id: 'bullet_point2', label: 'Bullet Point 2' },
    { id: 'main_image_url', label: 'Main Image URL', required: true },
  ],
  ebay: [
    { id: 'Title', label: 'Title', required: true },
    { id: 'Description', label: 'Description', required: true },
    { id: 'StartPrice', label: 'Start Price', required: true },
    { id: 'Quantity', label: 'Quantity', required: true },
    { id: 'SKU', label: 'SKU' },
    { id: 'Brand', label: 'Brand' },
    { id: 'EAN', label: 'EAN' },
    { id: 'PrimaryCategory', label: 'Category ID', required: true },
    { id: 'PictureURL', label: 'Picture URL', required: true },
  ],
  default: [
    { id: 'name', label: 'Nom', required: true },
    { id: 'description', label: 'Description' },
    { id: 'price', label: 'Prix', required: true },
    { id: 'stock', label: 'Stock' },
    { id: 'sku', label: 'SKU' },
    { id: 'ean', label: 'EAN' },
    { id: 'images', label: 'Images' },
    { id: 'category', label: 'Catégorie' },
  ]
}

interface FieldMapping {
  id: string
  source: string
  destination: string
  transform?: string
  enabled: boolean
}

interface ProductMappingEditorProps {
  platform: string
  platformName: string
  initialMappings?: FieldMapping[]
  onSave?: (mappings: FieldMapping[]) => void
  onCancel?: () => void
}

export function ProductMappingEditor({
  platform,
  platformName,
  initialMappings,
  onSave,
  onCancel
}: ProductMappingEditorProps) {
  const destinationFields = DESTINATION_FIELDS[platform] || DESTINATION_FIELDS.default
  
  // Initialize mappings with auto-matching
  const [mappings, setMappings] = useState<FieldMapping[]>(() => {
    if (initialMappings?.length) return initialMappings
    
    // Auto-match fields by similar names
    return destinationFields.map((destField, index) => {
      const matchingSource = SOURCE_FIELDS.find(
        s => s.id.toLowerCase() === destField.id.toLowerCase() ||
             s.label.toLowerCase().includes(destField.label.toLowerCase()) ||
             destField.label.toLowerCase().includes(s.label.toLowerCase())
      )
      return {
        id: `mapping-${index}`,
        source: matchingSource?.id || '',
        destination: destField.id,
        enabled: !!matchingSource
      }
    })
  })

  const updateMapping = (id: string, updates: Partial<FieldMapping>) => {
    setMappings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))
  }

  const addCustomMapping = () => {
    setMappings(prev => [...prev, {
      id: `custom-${Date.now()}`,
      source: '',
      destination: '',
      enabled: true
    }])
  }

  const removeMapping = (id: string) => {
    setMappings(prev => prev.filter(m => m.id !== id))
  }

  const autoMatch = () => {
    setMappings(prev => prev.map(m => {
      const destField = destinationFields.find(d => d.id === m.destination)
      if (!destField || m.source) return m
      
      const matchingSource = SOURCE_FIELDS.find(
        s => s.id.toLowerCase() === destField.id.toLowerCase() ||
             s.label.toLowerCase().includes(destField.label.toLowerCase())
      )
      return matchingSource ? { ...m, source: matchingSource.id, enabled: true } : m
    }))
  }

  const mappedCount = mappings.filter(m => m.source && m.enabled).length
  const requiredCount = destinationFields.filter(d => d.required).length
  const mappedRequiredCount = mappings.filter(m => {
    const destField = destinationFields.find(d => d.id === m.destination)
    return destField?.required && m.source && m.enabled
  }).length

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Mapping des champs - {platformName}
            </CardTitle>
            <CardDescription>
              Associez les champs ShopOpti aux champs {platformName}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              {mappedCount}/{destinationFields.length} mappés
            </Badge>
            {mappedRequiredCount < requiredCount && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {requiredCount - mappedRequiredCount} requis manquants
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={autoMatch} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Auto-mapper
          </Button>
          <Button variant="outline" size="sm" onClick={addCustomMapping} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter champ
          </Button>
        </div>

        <Separator />

        {/* Mapping Table Header */}
        <div className="grid grid-cols-[1fr,40px,1fr,auto] gap-2 px-2 text-sm font-medium text-muted-foreground">
          <span>Champ ShopOpti</span>
          <span></span>
          <span>Champ {platformName}</span>
          <span className="w-20 text-center">Actions</span>
        </div>

        {/* Mappings */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {mappings.map((mapping) => {
              const destField = destinationFields.find(d => d.id === mapping.destination)
              const sourceField = SOURCE_FIELDS.find(s => s.id === mapping.source)
              
              return (
                <div
                  key={mapping.id}
                  className={cn(
                    "grid grid-cols-[1fr,40px,1fr,auto] gap-2 items-center p-2 rounded-lg border transition-colors",
                    mapping.enabled ? "bg-card" : "bg-muted/50 opacity-60",
                    destField?.required && !mapping.source && "border-destructive/50"
                  )}
                >
                  {/* Source field */}
                  <Select
                    value={mapping.source}
                    onValueChange={(value) => updateMapping(mapping.id, { source: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- Non mappé --</SelectItem>
                      {SOURCE_FIELDS.map(field => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.label}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    {mapping.source && mapping.enabled ? (
                      <Link2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Unlink className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Destination field */}
                  <div className="flex items-center gap-2">
                    <Input
                      value={destField?.label || mapping.destination}
                      disabled
                      className="h-9 bg-muted"
                    />
                    {destField?.required && (
                      <Badge variant="secondary" className="text-xs shrink-0">Requis</Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 w-20 justify-center">
                    <Switch
                      checked={mapping.enabled}
                      onCheckedChange={(checked) => updateMapping(mapping.id, { enabled: checked })}
                    />
                    {mapping.id.startsWith('custom') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeMapping(mapping.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <Separator />

        {/* Footer actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {mappedRequiredCount >= requiredCount ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Tous les champs requis sont mappés
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-destructive" />
                Mappez tous les champs requis pour continuer
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            )}
            <Button 
              onClick={() => onSave?.(mappings)}
              disabled={mappedRequiredCount < requiredCount}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Enregistrer le mapping
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProductMappingEditor
