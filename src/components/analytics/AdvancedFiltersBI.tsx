import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
  Filter, 
  X,
  Save,
  RotateCcw,
  Calendar as CalendarIcon,
  DollarSign,
  Percent,
  TrendingUp,
  Package,
  Tag,
  Store,
  Megaphone,
  Search
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

interface FilterPreset {
  id: string
  name: string
  filters: FilterState
}

interface FilterState {
  dateRange: { from: Date; to: Date }
  categories: string[]
  channels: string[]
  marginRange: [number, number]
  roiRange: [number, number]
  revenueRange: [number, number]
  includeReturns: boolean
  onlyProfitable: boolean
  minOrders: number
}

const defaultFilters: FilterState = {
  dateRange: { 
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)), 
    to: new Date() 
  },
  categories: [],
  channels: [],
  marginRange: [0, 100],
  roiRange: [0, 500],
  revenueRange: [0, 100000],
  includeReturns: true,
  onlyProfitable: false,
  minOrders: 0
}

const availableCategories = [
  'Électronique', 'Mode', 'Maison', 'Beauté', 'Sport', 'Alimentation', 'Jouets', 'Livres'
]

const availableChannels = [
  'Organic Search', 'Paid Ads', 'Email Marketing', 'Social Media', 'Direct', 'Affiliés'
]

const savedPresets: FilterPreset[] = [
  { id: '1', name: 'Top Performers', filters: { ...defaultFilters, onlyProfitable: true, marginRange: [30, 100] } },
  { id: '2', name: 'Ads Analysis', filters: { ...defaultFilters, channels: ['Paid Ads'], roiRange: [100, 500] } },
  { id: '3', name: 'Q4 2024', filters: { ...defaultFilters, dateRange: { from: new Date(2024, 9, 1), to: new Date(2024, 11, 31) } } }
]

export function AdvancedFiltersBI() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)
  const [presetName, setPresetName] = useState('')
  const [presets, setPresets] = useState<FilterPreset[]>(savedPresets)

  const updateFilters = (partial: Partial<FilterState>) => {
    const newFilters = { ...filters, ...partial }
    setFilters(newFilters)
    
    // Count active filters
    let count = 0
    if (newFilters.categories.length > 0) count++
    if (newFilters.channels.length > 0) count++
    if (newFilters.marginRange[0] > 0 || newFilters.marginRange[1] < 100) count++
    if (newFilters.roiRange[0] > 0 || newFilters.roiRange[1] < 500) count++
    if (newFilters.revenueRange[0] > 0 || newFilters.revenueRange[1] < 100000) count++
    if (!newFilters.includeReturns) count++
    if (newFilters.onlyProfitable) count++
    if (newFilters.minOrders > 0) count++
    setActiveFiltersCount(count)
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
    setActiveFiltersCount(0)
    toast.success('Filtres réinitialisés')
  }

  const applyFilters = () => {
    toast.success(`${activeFiltersCount} filtre(s) appliqué(s)`)
  }

  const savePreset = () => {
    if (!presetName) {
      toast.error('Veuillez entrer un nom pour le preset')
      return
    }
    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: { ...filters }
    }
    setPresets([...presets, newPreset])
    setPresetName('')
    toast.success(`Preset "${presetName}" sauvegardé`)
  }

  const loadPreset = (preset: FilterPreset) => {
    setFilters(preset.filters)
    toast.success(`Preset "${preset.name}" chargé`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Filter className="h-6 w-6 text-primary" />
            Filtres Avancés BI
            {activeFiltersCount > 0 && (
              <Badge className="ml-2">{activeFiltersCount} actif(s)</Badge>
            )}
          </h2>
          <p className="text-muted-foreground">
            Filtrez vos données par catégories, marges, ROI publicitaire et plus
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button onClick={applyFilters}>
            <Search className="h-4 w-4 mr-2" />
            Appliquer les filtres
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Presets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Save className="h-4 w-4" />
              Presets Sauvegardés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {presets.map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => loadPreset(preset)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-2">
              <Input
                placeholder="Nom du preset"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
              <Button className="w-full" variant="secondary" onClick={savePreset}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder le preset actuel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters Panel */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Configuration des Filtres</CardTitle>
            <CardDescription>Affinez vos analyses avec des filtres précis</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={['dates', 'segments', 'performance']} className="space-y-2">
              {/* Date Range */}
              <AccordionItem value="dates">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Période
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label>Date de début</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(filters.dateRange.from, 'dd MMM yyyy', { locale: fr })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={filters.dateRange.from}
                            onSelect={(date) => date && updateFilters({ dateRange: { ...filters.dateRange, from: date } })}
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Date de fin</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(filters.dateRange.to, 'dd MMM yyyy', { locale: fr })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={filters.dateRange.to}
                            onSelect={(date) => date && updateFilters({ dateRange: { ...filters.dateRange, to: date } })}
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Segments */}
              <AccordionItem value="segments">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Catégories & Canaux
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Catégories
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableCategories.map((cat) => (
                          <div key={cat} className="flex items-center space-x-2">
                            <Checkbox
                              id={cat}
                              checked={filters.categories.includes(cat)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  updateFilters({ categories: [...filters.categories, cat] })
                                } else {
                                  updateFilters({ categories: filters.categories.filter(c => c !== cat) })
                                }
                              }}
                            />
                            <label htmlFor={cat} className="text-sm">{cat}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4" />
                        Canaux d'acquisition
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableChannels.map((channel) => (
                          <div key={channel} className="flex items-center space-x-2">
                            <Checkbox
                              id={channel}
                              checked={filters.channels.includes(channel)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  updateFilters({ channels: [...filters.channels, channel] })
                                } else {
                                  updateFilters({ channels: filters.channels.filter(c => c !== channel) })
                                }
                              }}
                            />
                            <label htmlFor={channel} className="text-sm">{channel}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Performance */}
              <AccordionItem value="performance">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Performance & Rentabilité
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-2">
                    {/* Margin Range */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Marge (%)
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {filters.marginRange[0]}% - {filters.marginRange[1]}%
                        </span>
                      </div>
                      <Slider
                        value={filters.marginRange}
                        onValueChange={(value) => updateFilters({ marginRange: value as [number, number] })}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* ROI Range */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          ROI Publicitaire (%)
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {filters.roiRange[0]}% - {filters.roiRange[1]}%
                        </span>
                      </div>
                      <Slider
                        value={filters.roiRange}
                        onValueChange={(value) => updateFilters({ roiRange: value as [number, number] })}
                        max={500}
                        step={10}
                        className="w-full"
                      />
                    </div>

                    {/* Revenue Range */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Revenu (€)
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {filters.revenueRange[0].toLocaleString()}€ - {filters.revenueRange[1].toLocaleString()}€
                        </span>
                      </div>
                      <Slider
                        value={filters.revenueRange}
                        onValueChange={(value) => updateFilters({ revenueRange: value as [number, number] })}
                        max={100000}
                        step={1000}
                        className="w-full"
                      />
                    </div>

                    {/* Min Orders */}
                    <div className="space-y-3">
                      <Label>Commandes minimum</Label>
                      <Input
                        type="number"
                        value={filters.minOrders}
                        onChange={(e) => updateFilters({ minOrders: parseInt(e.target.value) || 0 })}
                        min={0}
                      />
                    </div>

                    {/* Toggles */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Inclure les retours</Label>
                        <Switch
                          checked={filters.includeReturns}
                          onCheckedChange={(checked) => updateFilters({ includeReturns: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Uniquement rentables</Label>
                        <Switch
                          checked={filters.onlyProfitable}
                          onCheckedChange={(checked) => updateFilters({ onlyProfitable: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Filtres actifs:</p>
                <div className="flex flex-wrap gap-2">
                  {filters.categories.length > 0 && (
                    <Badge variant="secondary">
                      Catégories: {filters.categories.length}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilters({ categories: [] })} />
                    </Badge>
                  )}
                  {filters.channels.length > 0 && (
                    <Badge variant="secondary">
                      Canaux: {filters.channels.length}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilters({ channels: [] })} />
                    </Badge>
                  )}
                  {(filters.marginRange[0] > 0 || filters.marginRange[1] < 100) && (
                    <Badge variant="secondary">
                      Marge: {filters.marginRange[0]}-{filters.marginRange[1]}%
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilters({ marginRange: [0, 100] })} />
                    </Badge>
                  )}
                  {filters.onlyProfitable && (
                    <Badge variant="secondary">
                      Rentables uniquement
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilters({ onlyProfitable: false })} />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
