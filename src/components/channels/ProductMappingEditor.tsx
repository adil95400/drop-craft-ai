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

// Colonnes du fichier CSV Shopify - Source fields
const SOURCE_FIELDS = [
  // Informations de base
  { id: 'title', label: 'Titre', required: true },
  { id: 'handle', label: 'Ancre d\'URL' },
  { id: 'description', label: 'Description' },
  { id: 'vendor', label: 'Fournisseur' },
  { id: 'product_category', label: 'Catégorie de produit' },
  { id: 'type', label: 'Type' },
  { id: 'tags', label: 'Balises' },
  { id: 'published_on_online_store', label: 'Publié sur la boutique en ligne' },
  { id: 'status', label: 'Statut' },
  
  // SKU et inventaire
  { id: 'sku', label: 'SKU' },
  { id: 'barcode', label: 'Code-barres' },
  
  // Options et variantes
  { id: 'option1_name', label: 'Nom de l\'option1' },
  { id: 'option1_value', label: 'Valeur de l\'option 1' },
  { id: 'option1_linked_to', label: 'Option 1 liée à' },
  { id: 'option2_name', label: 'Nom de l\'option2' },
  { id: 'option2_value', label: 'Valeur de l\'option 2' },
  { id: 'option3_name', label: 'Nom de l\'option3' },
  { id: 'option3_value', label: 'Valeur de l\'option 3' },
  
  // Prix
  { id: 'price', label: 'Prix', required: true },
  { id: 'price_international', label: 'Prix / International' },
  { id: 'compare_at_price', label: 'Prix de comparaison' },
  { id: 'compare_at_price_international', label: 'Prix de comparaison / International' },
  { id: 'cost_per_item', label: 'Coût par article' },
  
  // Taxes
  { id: 'charge_tax', label: 'Facturer les taxes' },
  
  // Stock
  { id: 'inventory_tracker', label: 'Suivi des stocks' },
  { id: 'inventory_qty', label: 'Quantité en stock', required: true },
  { id: 'continue_selling_when_out_of_stock', label: 'Continuer à vendre en cas de rupture de stock' },
  
  // Poids et expédition
  { id: 'weight_grams', label: 'Valeur du poids (grammes)' },
  { id: 'weight_unit', label: 'Unité de poids pour l\'affichage' },
  { id: 'requires_shipping', label: 'Nécessite une expédition' },
  { id: 'fulfillment_service', label: 'Service de traitement des commandes' },
  
  // International
  { id: 'included_primary', label: 'Inclus / [Principal]' },
  { id: 'included_international', label: 'Inclus / International' },
  
  // Images
  { id: 'image_src', label: 'URL de l\'image de produit' },
  { id: 'image_position', label: 'Position de l\'image' },
  { id: 'image_alt_text', label: 'Texte alternatif de l\'image' },
  { id: 'variant_image', label: 'URL de l\'image de la variante' },
  
  // Carte-cadeau
  { id: 'gift_card', label: 'Carte-cadeau' },
  
  // SEO
  { id: 'seo_title', label: 'Titre pour le référencement naturel (SEO)' },
  { id: 'seo_description', label: 'Description pour le référencement naturel (SEO)' },
  
  // Google Shopping
  { id: 'google_product_category', label: 'Google Shopping / Catégorie de produits Google' },
  { id: 'google_gender', label: 'Google Shopping / Sexe' },
  { id: 'google_age_group', label: 'Google Shopping / Tranche d\'âge' },
  { id: 'google_mpn', label: 'Google Shopping / Référence fabricant' },
  { id: 'google_condition', label: 'Google Shopping / État' },
  { id: 'google_custom_product', label: 'Google Shopping / Produit personnalisé' },
  { id: 'google_custom_label_0', label: 'Google Shopping / Étiquette personnalisée 0' },
  { id: 'google_custom_label_1', label: 'Google Shopping / Étiquette personnalisée 1' },
  { id: 'google_custom_label_2', label: 'Google Shopping / Étiquette personnalisée 2' },
  { id: 'google_custom_label_3', label: 'Google Shopping / Étiquette personnalisée 3' },
  { id: 'google_custom_label_4', label: 'Google Shopping / Étiquette personnalisée 4' },
  
  // Champs méta
  { id: 'metafield_boolean', label: 'Champ méta / Booléen' },
  { id: 'metafield_color', label: 'Champ méta / Couleur' },
  { id: 'metafield_date', label: 'Champ méta / Date' },
  { id: 'metafield_dimension', label: 'Champ méta / Dimension' },
  { id: 'metafield_money', label: 'Champ méta / Argent' },
  { id: 'metafield_number', label: 'Champ méta / Nombre' },
  { id: 'metafield_text', label: 'Champ méta / Texte' },
  { id: 'metafield_url', label: 'Champ méta / URL' },
  { id: 'metafield_weight', label: 'Champ méta / Poids' },
  { id: 'metafield_volume', label: 'Champ méta / Volume' },
]

// Champs destination par plateforme - Colonnes CSV Shopify complètes
const DESTINATION_FIELDS: Record<string, Array<{ id: string; label: string; required?: boolean }>> = {
  shopify: [
    // Informations de base
    { id: 'title', label: 'Titre', required: true },
    { id: 'handle', label: 'Ancre d\'URL' },
    { id: 'body_html', label: 'Description', required: true },
    { id: 'vendor', label: 'Fournisseur' },
    { id: 'product_category', label: 'Catégorie de produit' },
    { id: 'product_type', label: 'Type' },
    { id: 'tags', label: 'Balises' },
    { id: 'published', label: 'Publié sur la boutique en ligne' },
    { id: 'status', label: 'Statut' },
    
    // SKU et inventaire
    { id: 'sku', label: 'SKU' },
    { id: 'barcode', label: 'Code-barres' },
    
    // Options et variantes
    { id: 'option1_name', label: 'Nom de l\'option1' },
    { id: 'option1_value', label: 'Valeur de l\'option 1' },
    { id: 'option1_linked_to', label: 'Option 1 liée à' },
    { id: 'option2_name', label: 'Nom de l\'option2' },
    { id: 'option2_value', label: 'Valeur de l\'option 2' },
    { id: 'option3_name', label: 'Nom de l\'option3' },
    { id: 'option3_value', label: 'Valeur de l\'option 3' },
    
    // Prix
    { id: 'price', label: 'Prix', required: true },
    { id: 'price_international', label: 'Prix / International' },
    { id: 'compare_at_price', label: 'Prix de comparaison' },
    { id: 'compare_at_price_international', label: 'Prix de comparaison / International' },
    { id: 'cost_per_item', label: 'Coût par article' },
    
    // Taxes
    { id: 'taxable', label: 'Facturer les taxes' },
    
    // Stock
    { id: 'inventory_tracker', label: 'Suivi des stocks' },
    { id: 'inventory_quantity', label: 'Quantité en stock' },
    { id: 'inventory_policy', label: 'Continuer à vendre en cas de rupture de stock' },
    
    // Poids et expédition
    { id: 'weight', label: 'Valeur du poids (grammes)' },
    { id: 'weight_unit', label: 'Unité de poids pour l\'affichage' },
    { id: 'requires_shipping', label: 'Nécessite une expédition' },
    { id: 'fulfillment_service', label: 'Service de traitement des commandes' },
    
    // International
    { id: 'included_primary', label: 'Inclus / [Principal]' },
    { id: 'included_international', label: 'Inclus / International' },
    
    // Images
    { id: 'image_src', label: 'URL de l\'image de produit' },
    { id: 'image_position', label: 'Position de l\'image' },
    { id: 'image_alt_text', label: 'Texte alternatif de l\'image' },
    { id: 'variant_image', label: 'URL de l\'image de la variante' },
    
    // Carte-cadeau
    { id: 'gift_card', label: 'Carte-cadeau' },
    
    // SEO
    { id: 'seo_title', label: 'Titre pour le référencement naturel (SEO)' },
    { id: 'seo_description', label: 'Description pour le référencement naturel (SEO)' },
    
    // Google Shopping
    { id: 'google_product_category', label: 'Google Shopping / Catégorie de produits Google' },
    { id: 'google_gender', label: 'Google Shopping / Sexe' },
    { id: 'google_age_group', label: 'Google Shopping / Tranche d\'âge' },
    { id: 'google_mpn', label: 'Google Shopping / Référence fabricant' },
    { id: 'google_condition', label: 'Google Shopping / État' },
    { id: 'google_custom_product', label: 'Google Shopping / Produit personnalisé' },
    { id: 'google_custom_label_0', label: 'Google Shopping / Étiquette personnalisée 0' },
    { id: 'google_custom_label_1', label: 'Google Shopping / Étiquette personnalisée 1' },
    { id: 'google_custom_label_2', label: 'Google Shopping / Étiquette personnalisée 2' },
    { id: 'google_custom_label_3', label: 'Google Shopping / Étiquette personnalisée 3' },
    { id: 'google_custom_label_4', label: 'Google Shopping / Étiquette personnalisée 4' },
    
    // Champs méta
    { id: 'metafield_boolean', label: 'Champ méta / Booléen' },
    { id: 'metafield_color', label: 'Champ méta / Couleur' },
    { id: 'metafield_date', label: 'Champ méta / Date' },
    { id: 'metafield_dimension', label: 'Champ méta / Dimension' },
    { id: 'metafield_money', label: 'Champ méta / Argent' },
    { id: 'metafield_number', label: 'Champ méta / Nombre' },
    { id: 'metafield_text', label: 'Champ méta / Texte' },
    { id: 'metafield_url', label: 'Champ méta / URL' },
    { id: 'metafield_weight', label: 'Champ méta / Poids' },
    { id: 'metafield_volume', label: 'Champ méta / Volume' },
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
          <span className="w-24 text-center">Actions</span>
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
                  {/* Source field - Dropdown */}
                  <Select
                    value={mapping.source || '__none__'}
                    onValueChange={(value) => updateMapping(mapping.id, { source: value === '__none__' ? '' : value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      <SelectItem value="__none__">-- Non mappé --</SelectItem>
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

                  {/* Destination field - Static text like source dropdown style */}
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-background">
                    <span className="text-sm">
                      {destField?.label || mapping.destination}
                    </span>
                    {destField?.required && (
                      <Badge variant="secondary" className="text-xs shrink-0">Requis</Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 w-24 justify-center">
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
