import { useState, useEffect } from 'react'
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
import { Save, FolderOpen, Trash2, BookmarkPlus, ChevronDown, ShoppingCart, Globe, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'

interface MappingPreset {
  id: string
  name: string
  icon: string
  mapping: Record<string, string>
  createdAt: string
  isBuiltIn?: boolean
}

interface MappingPresetsProps {
  currentMapping: Record<string, string>
  onApplyPreset: (mapping: Record<string, string>) => void
  headers: string[]
}

const STORAGE_KEY = 'shopopti_mapping_presets'

// Built-in presets
const BUILT_IN_PRESETS: MappingPreset[] = [
  {
    id: 'shopify-fr',
    name: 'Shopify FR',
    icon: 'shopify',
    isBuiltIn: true,
    createdAt: '',
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
    isBuiltIn: true,
    createdAt: '',
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
    isBuiltIn: true,
    createdAt: '',
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
  const [customPresets, setCustomPresets] = useState<MappingPreset[]>([])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setCustomPresets(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  const savePresets = (presets: MappingPreset[]) => {
    setCustomPresets(presets)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  }

  const handleSave = () => {
    if (!presetName.trim()) return

    const newPreset: MappingPreset = {
      id: `custom-${Date.now()}`,
      name: presetName.trim(),
      icon: 'csv',
      mapping: { ...currentMapping },
      createdAt: new Date().toISOString(),
    }

    savePresets([...customPresets, newPreset])
    setSaveDialogOpen(false)
    setPresetName('')
    toast.success(`Preset "${newPreset.name}" sauvegardé`)
  }

  const handleDelete = (id: string) => {
    savePresets(customPresets.filter(p => p.id !== id))
    toast.success('Preset supprimé')
  }

  const applyPreset = (preset: MappingPreset) => {
    // Only apply mappings for headers that exist in current file
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

  const allPresets = [...BUILT_IN_PRESETS, ...customPresets]
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
              <DropdownMenuItem key={preset.id} onClick={() => applyPreset(preset)} className="gap-2">
                {getPresetIcon(preset.icon)}
                <span>{preset.name}</span>
                <Badge variant="secondary" className="ml-auto text-[10px]">Intégré</Badge>
              </DropdownMenuItem>
            ))}

            {customPresets.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Mes presets
                </div>
                {customPresets.map(preset => (
                  <DropdownMenuItem key={preset.id} className="gap-2 group">
                    <FileSpreadsheet className="w-4 h-4 text-primary" />
                    <span className="flex-1" onClick={() => applyPreset(preset)}>{preset.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(preset.id) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  </DropdownMenuItem>
                ))}
              </>
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
              Enregistrez ce mapping pour le réutiliser lors de futurs imports.
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
            <Button onClick={handleSave} disabled={!presetName.trim()} className="gap-2">
              <Save className="w-4 h-4" />
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
