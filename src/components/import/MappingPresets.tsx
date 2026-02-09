import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Save, FolderOpen, Trash2, BookmarkPlus, ChevronDown, ShoppingCart, Globe, FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMappingPresets } from '@/hooks/useMappingPresets'

interface MappingPresetsProps {
  currentMapping: Record<string, string>
  onApplyPreset: (mapping: Record<string, string>) => void
  headers: string[]
}

interface BuiltInPreset {
  id: string
  name: string
  icon: string
  mapping: Record<string, string>
}

// Built-in presets (not persisted in DB)
const BUILT_IN_PRESETS: BuiltInPreset[] = [
  {
    id: 'shopify-fr',
    name: 'Shopify FR',
    icon: 'shopify',
    mapping: {
      'Title': 'name',
      'Handle': 'handle',
      'Body (HTML)': 'description',
      'Vendor': 'brand',
      'Type': 'category',
      'Tags': 'tags',
      'Published': 'published',
      'Variant SKU': 'sku',
      'Variant Price': 'price',
      'Variant Compare At Price': 'compare_at_price',
      'Variant Inventory Qty': 'stock_quantity',
      'Variant Grams': 'weight',
      'Image Src': 'image_url',
      'Image Alt Text': 'image_alt',
      'SEO Title': 'seo_title',
      'SEO Description': 'seo_description',
      'Variant Barcode': 'barcode',
      'Option1 Name': 'variant_option1_name',
      'Option1 Value': 'variant_option1_value',
      'Option2 Name': 'variant_option2_name',
      'Option2 Value': 'variant_option2_value',
      'Variant Taxable': 'taxable',
      'Variant Requires Shipping': 'requires_shipping',
      'Variant Fulfillment Service': 'fulfillment_service',
      'Variant Inventory Policy': 'inventory_policy',
      'Gift Card': 'gift_card',
    },
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    icon: 'woo',
    mapping: {
      'Name': 'name',
      'Description': 'description',
      'Regular price': 'price',
      'Sale price': 'compare_at_price',
      'SKU': 'sku',
      'Categories': 'category',
      'Tags': 'tags',
      'Images': 'image_url',
      'Stock': 'stock_quantity',
      'Weight (kg)': 'weight',
      'Published': 'published',
    },
  },
  {
    id: 'generic-csv',
    name: 'CSV Générique',
    icon: 'csv',
    mapping: {
      'name': 'name',
      'title': 'name',
      'description': 'description',
      'price': 'price',
      'sku': 'sku',
      'category': 'category',
      'brand': 'brand',
      'stock': 'stock_quantity',
      'image': 'image_url',
      'weight': 'weight',
      'tags': 'tags',
    },
  },
]

function getPresetIcon(icon: string) {
  switch (icon) {
    case 'shopify': return <ShoppingCart className="w-4 h-4 text-green-500" />
    case 'woo': return <Globe className="w-4 h-4 text-purple-500" />
    default: return <FileSpreadsheet className="w-4 h-4 text-primary" />
  }
}

export function MappingPresets({ currentMapping, onApplyPreset, headers }: MappingPresetsProps) {
  const { presets: customPresets, isLoading, createPreset, deletePreset, trackUsage, isSaving } = useMappingPresets()
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState('')

  const handleSave = () => {
    if (!presetName.trim()) return
    createPreset({
      name: presetName.trim(),
      icon: 'csv',
      mapping: { ...currentMapping },
    })
    setSaveDialogOpen(false)
    setPresetName('')
  }

  const handleDelete = (id: string) => {
    deletePreset(id)
  }

  const applyBuiltInPreset = (preset: BuiltInPreset) => {
    const applicableMapping: Record<string, string> = {}
    let matched = 0
    headers.forEach(header => {
      if (preset.mapping[header]) {
        applicableMapping[header] = preset.mapping[header]
        matched++
      }
    })
    onApplyPreset(applicableMapping)
    toast.success(`Preset "${preset.name}" appliqué (${matched} colonnes mappées)`)
  }

  const applyCustomPreset = (preset: { id: string; name: string; mapping: Record<string, string> }) => {
    const applicableMapping: Record<string, string> = {}
    let matched = 0
    const mapping = (typeof preset.mapping === 'object' ? preset.mapping : {}) as Record<string, string>
    headers.forEach(header => {
      if (mapping[header]) {
        applicableMapping[header] = mapping[header]
        matched++
      }
    })
    onApplyPreset(applicableMapping)
    trackUsage(preset.id)
    toast.success(`Preset "${preset.name}" appliqué (${matched} colonnes mappées)`)
  }

  const hasMappings = Object.values(currentMapping).some(v => v && v !== 'ignore')

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              Presets
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Templates prédéfinis
            </div>
            {BUILT_IN_PRESETS.map(preset => (
              <DropdownMenuItem key={preset.id} onClick={() => applyBuiltInPreset(preset)} className="gap-2">
                {getPresetIcon(preset.icon)}
                <span>{preset.name}</span>
                <Badge variant="secondary" className="ml-auto text-[10px]">Intégré</Badge>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Mes presets
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : customPresets.length === 0 ? (
              <div className="px-2 py-2 text-xs text-muted-foreground text-center">
                Aucun preset sauvegardé
              </div>
            ) : (
              customPresets.map(preset => (
                <DropdownMenuItem key={preset.id} className="gap-2 group" onClick={() => applyCustomPreset(preset)}>
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  <span className="flex-1">{preset.name}</span>
                  {preset.use_count > 0 && (
                    <span className="text-[10px] text-muted-foreground">{preset.use_count}×</span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(preset.id) }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasMappings && (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setSaveDialogOpen(true)}>
            <BookmarkPlus className="w-4 h-4" />
            Sauvegarder
          </Button>
        )}
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Sauvegarder le mapping
            </DialogTitle>
            <DialogDescription>
              Enregistrez ce mapping pour le réutiliser lors de futurs imports, accessible depuis tous vos appareils.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Nom du preset (ex: Mon catalogue Shopify)"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <p className="text-sm text-muted-foreground">
              {Object.values(currentMapping).filter(v => v && v !== 'ignore').length} colonnes seront sauvegardées dans ce preset.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={!presetName.trim() || isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
