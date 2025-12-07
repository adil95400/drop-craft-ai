/**
 * Éditeur de mapping visuel pour les champs produits
 * Interface drag-and-drop pour mapper les champs source vers destination
 */

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowRight, GripVertical, Plus, Trash2, Link2, Unlink, 
  AlertCircle, CheckCircle2, RefreshCw, Wand2, Save, Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface FieldMapping {
  id: string
  sourceField: string
  targetField: string
  transformation?: string
  defaultValue?: string
  required: boolean
  isConnected: boolean
}

interface VisualMappingEditorProps {
  channelId: string
  platform: string
  mappings: FieldMapping[]
  onSave: (mappings: FieldMapping[]) => Promise<void>
  isLoading?: boolean
}

// Champs source disponibles
const sourceFields = [
  { id: 'title', label: 'Titre', type: 'text', required: true },
  { id: 'description', label: 'Description', type: 'text', required: true },
  { id: 'price', label: 'Prix', type: 'number', required: true },
  { id: 'compare_at_price', label: 'Prix barré', type: 'number', required: false },
  { id: 'sku', label: 'SKU', type: 'text', required: false },
  { id: 'barcode', label: 'Code-barres / EAN', type: 'text', required: false },
  { id: 'inventory_quantity', label: 'Stock', type: 'number', required: true },
  { id: 'weight', label: 'Poids', type: 'number', required: false },
  { id: 'brand', label: 'Marque', type: 'text', required: false },
  { id: 'category', label: 'Catégorie', type: 'text', required: true },
  { id: 'image_url', label: 'Image principale', type: 'url', required: true },
  { id: 'images', label: 'Galerie images', type: 'array', required: false },
  { id: 'tags', label: 'Tags', type: 'array', required: false },
  { id: 'variants', label: 'Variantes', type: 'array', required: false },
  { id: 'meta_title', label: 'Meta titre SEO', type: 'text', required: false },
  { id: 'meta_description', label: 'Meta description SEO', type: 'text', required: false },
]

// Champs cibles par plateforme
const platformTargetFields: Record<string, typeof sourceFields> = {
  shopify: [
    { id: 'title', label: 'Title', type: 'text', required: true },
    { id: 'body_html', label: 'Body HTML', type: 'text', required: true },
    { id: 'vendor', label: 'Vendor', type: 'text', required: false },
    { id: 'product_type', label: 'Product Type', type: 'text', required: false },
    { id: 'tags', label: 'Tags', type: 'array', required: false },
    { id: 'variants.price', label: 'Price', type: 'number', required: true },
    { id: 'variants.compare_at_price', label: 'Compare at Price', type: 'number', required: false },
    { id: 'variants.sku', label: 'SKU', type: 'text', required: false },
    { id: 'variants.barcode', label: 'Barcode', type: 'text', required: false },
    { id: 'variants.inventory_quantity', label: 'Inventory', type: 'number', required: true },
    { id: 'variants.weight', label: 'Weight', type: 'number', required: false },
    { id: 'images.src', label: 'Image URL', type: 'url', required: true },
  ],
  amazon: [
    { id: 'item_name', label: 'Item Name', type: 'text', required: true },
    { id: 'product_description', label: 'Product Description', type: 'text', required: true },
    { id: 'brand_name', label: 'Brand Name', type: 'text', required: true },
    { id: 'standard_price', label: 'Standard Price', type: 'number', required: true },
    { id: 'list_price', label: 'List Price', type: 'number', required: false },
    { id: 'quantity', label: 'Quantity', type: 'number', required: true },
    { id: 'seller_sku', label: 'Seller SKU', type: 'text', required: true },
    { id: 'external_product_id', label: 'EAN/UPC', type: 'text', required: true },
    { id: 'main_image_url', label: 'Main Image URL', type: 'url', required: true },
    { id: 'browse_node', label: 'Category', type: 'text', required: true },
  ],
  ebay: [
    { id: 'Title', label: 'Title', type: 'text', required: true },
    { id: 'Description', label: 'Description', type: 'text', required: true },
    { id: 'StartPrice', label: 'Start Price', type: 'number', required: true },
    { id: 'Quantity', label: 'Quantity', type: 'number', required: true },
    { id: 'SKU', label: 'SKU', type: 'text', required: false },
    { id: 'PrimaryCategory', label: 'Category', type: 'text', required: true },
    { id: 'PictureURL', label: 'Picture URL', type: 'url', required: true },
    { id: 'Brand', label: 'Brand', type: 'text', required: false },
    { id: 'EAN', label: 'EAN', type: 'text', required: false },
  ],
  etsy: [
    { id: 'title', label: 'Title', type: 'text', required: true },
    { id: 'description', label: 'Description', type: 'text', required: true },
    { id: 'price', label: 'Price', type: 'number', required: true },
    { id: 'quantity', label: 'Quantity', type: 'number', required: true },
    { id: 'sku', label: 'SKU', type: 'text', required: false },
    { id: 'tags', label: 'Tags', type: 'array', required: false },
    { id: 'taxonomy_id', label: 'Category', type: 'text', required: true },
    { id: 'image', label: 'Image', type: 'url', required: true },
  ],
  // Generic for other platforms
  default: sourceFields
}

// Transformations disponibles
const transformations = [
  { id: 'none', label: 'Aucune' },
  { id: 'uppercase', label: 'MAJUSCULES' },
  { id: 'lowercase', label: 'minuscules' },
  { id: 'capitalize', label: 'Capitalize' },
  { id: 'truncate_60', label: 'Tronquer (60 car.)' },
  { id: 'truncate_150', label: 'Tronquer (150 car.)' },
  { id: 'truncate_500', label: 'Tronquer (500 car.)' },
  { id: 'strip_html', label: 'Supprimer HTML' },
  { id: 'add_prefix', label: 'Ajouter préfixe' },
  { id: 'add_suffix', label: 'Ajouter suffixe' },
  { id: 'multiply_100', label: 'Multiplier par 100' },
  { id: 'divide_100', label: 'Diviser par 100' },
  { id: 'round_2', label: 'Arrondir (2 déc.)' },
  { id: 'replace', label: 'Rechercher/Remplacer' },
]

export function VisualMappingEditor({
  channelId,
  platform,
  mappings: initialMappings,
  onSave,
  isLoading
}: VisualMappingEditorProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>(initialMappings)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const { toast } = useToast()

  const targetFields = platformTargetFields[platform.toLowerCase()] || platformTargetFields.default

  // Update mapping
  const updateMapping = useCallback((id: string, updates: Partial<FieldMapping>) => {
    setMappings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))
    setIsDirty(true)
  }, [])

  // Add new mapping
  const addMapping = useCallback(() => {
    const newMapping: FieldMapping = {
      id: `mapping-${Date.now()}`,
      sourceField: '',
      targetField: '',
      transformation: 'none',
      defaultValue: '',
      required: false,
      isConnected: false
    }
    setMappings(prev => [...prev, newMapping])
    setIsDirty(true)
  }, [])

  // Remove mapping
  const removeMapping = useCallback((id: string) => {
    setMappings(prev => prev.filter(m => m.id !== id))
    setIsDirty(true)
  }, [])

  // Auto-map fields
  const autoMap = useCallback(() => {
    const autoMappings: FieldMapping[] = sourceFields.map((source, index) => {
      const matchingTarget = targetFields.find(t => 
        t.id.toLowerCase().includes(source.id.toLowerCase()) ||
        source.id.toLowerCase().includes(t.id.toLowerCase())
      )
      
      return {
        id: `mapping-${index}`,
        sourceField: source.id,
        targetField: matchingTarget?.id || '',
        transformation: 'none',
        defaultValue: '',
        required: source.required,
        isConnected: !!matchingTarget
      }
    })
    
    setMappings(autoMappings)
    setIsDirty(true)
    toast({ title: 'Auto-mapping appliqué', description: `${autoMappings.filter(m => m.isConnected).length} champs mappés` })
  }, [targetFields, toast])

  // Save mappings
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(mappings)
      setIsDirty(false)
      toast({ title: 'Mapping sauvegardé' })
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder le mapping', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  // Get field stats
  const stats = {
    total: mappings.length,
    connected: mappings.filter(m => m.isConnected && m.sourceField && m.targetField).length,
    required: mappings.filter(m => m.required).length,
    missingRequired: mappings.filter(m => m.required && (!m.sourceField || !m.targetField)).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Mapping des champs</h3>
          <p className="text-sm text-muted-foreground">
            Configurez comment les champs sont synchronisés vers {platform}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={autoMap} className="gap-2">
            <Wand2 className="h-4 w-4" />
            Auto-mapper
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.connected}</div>
            <div className="text-xs text-muted-foreground">Connectés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.required}</div>
            <div className="text-xs text-muted-foreground">Obligatoires</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={cn("text-2xl font-bold", stats.missingRequired > 0 ? "text-red-600" : "text-green-600")}>
              {stats.missingRequired}
            </div>
            <div className="text-xs text-muted-foreground">Manquants</div>
          </CardContent>
        </Card>
      </div>

      {/* Mapping list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Champs de mapping</CardTitle>
            <Button variant="outline" size="sm" onClick={addMapping} className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-3">
              {/* Header */}
              <div className="hidden md:grid grid-cols-12 gap-3 text-xs font-medium text-muted-foreground px-2">
                <div className="col-span-3">Champ source</div>
                <div className="col-span-1 text-center">→</div>
                <div className="col-span-3">Champ cible ({platform})</div>
                <div className="col-span-2">Transformation</div>
                <div className="col-span-2">Valeur par défaut</div>
                <div className="col-span-1"></div>
              </div>
              
              <Separator />

              {mappings.map((mapping) => (
                <div 
                  key={mapping.id}
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-lg border transition-colors",
                    mapping.isConnected && mapping.sourceField && mapping.targetField
                      ? "bg-green-500/5 border-green-500/20"
                      : mapping.required
                        ? "bg-orange-500/5 border-orange-500/20"
                        : "bg-muted/30"
                  )}
                >
                  {/* Source field */}
                  <div className="md:col-span-3">
                    <Label className="md:hidden text-xs">Source</Label>
                    <Select
                      value={mapping.sourceField}
                      onValueChange={(value) => updateMapping(mapping.id, { 
                        sourceField: value,
                        isConnected: !!value && !!mapping.targetField
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceFields.map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            <div className="flex items-center gap-2">
                              {field.label}
                              {field.required && (
                                <Badge variant="outline" className="text-xs">Requis</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:flex md:col-span-1 items-center justify-center">
                    {mapping.isConnected && mapping.sourceField && mapping.targetField ? (
                      <Link2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Unlink className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Target field */}
                  <div className="md:col-span-3">
                    <Label className="md:hidden text-xs">Cible ({platform})</Label>
                    <Select
                      value={mapping.targetField}
                      onValueChange={(value) => updateMapping(mapping.id, { 
                        targetField: value,
                        isConnected: !!mapping.sourceField && !!value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Non mappé</SelectItem>
                        {targetFields.map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            <div className="flex items-center gap-2">
                              {field.label}
                              {field.required && (
                                <Badge variant="outline" className="text-xs">Requis</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Transformation */}
                  <div className="md:col-span-2">
                    <Label className="md:hidden text-xs">Transformation</Label>
                    <Select
                      value={mapping.transformation || 'none'}
                      onValueChange={(value) => updateMapping(mapping.id, { transformation: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {transformations.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Default value */}
                  <div className="md:col-span-2">
                    <Label className="md:hidden text-xs">Valeur par défaut</Label>
                    <Input
                      value={mapping.defaultValue || ''}
                      onChange={(e) => updateMapping(mapping.id, { defaultValue: e.target.value })}
                      placeholder="Valeur si vide..."
                      className="h-9"
                    />
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-1 flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeMapping(mapping.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {mappings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucun mapping configuré</p>
                  <Button variant="outline" size="sm" onClick={autoMap} className="mt-4 gap-2">
                    <Wand2 className="h-4 w-4" />
                    Configurer automatiquement
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Validation warnings */}
      {stats.missingRequired > 0 && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-700">Champs obligatoires manquants</p>
                <p className="text-sm text-orange-600">
                  {stats.missingRequired} champ(s) obligatoire(s) ne sont pas encore mappés. 
                  La synchronisation pourrait échouer sans ces champs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default VisualMappingEditor
