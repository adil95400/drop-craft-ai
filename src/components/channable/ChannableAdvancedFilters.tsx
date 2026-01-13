/**
 * ChannableAdvancedFilters - Filtres avancés style Channable
 * Avec collapsible panel, chips, et saved filters
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Filter, X, ChevronDown, Save, Trash2, RotateCcw,
  Clock, CheckCircle2, AlertCircle, WifiOff, SlidersHorizontal
} from 'lucide-react'

export interface FilterConfig {
  status?: string[]
  syncStatus?: string[]
  dateRange?: 'today' | 'week' | 'month' | 'all'
  hasErrors?: boolean
  hasProducts?: boolean
  autoSync?: boolean
}

interface SavedFilter {
  id: string
  name: string
  config: FilterConfig
}

interface ChannableAdvancedFiltersProps {
  filters: FilterConfig
  onFiltersChange: (filters: FilterConfig) => void
  savedFilters?: SavedFilter[]
  onSaveFilter?: (name: string, config: FilterConfig) => void
  onDeleteFilter?: (id: string) => void
  className?: string
}

const STATUS_OPTIONS = [
  { value: 'connected', label: 'Connecté', icon: CheckCircle2, color: 'text-green-500' },
  { value: 'connecting', label: 'Synchronisation', icon: Clock, color: 'text-blue-500' },
  { value: 'error', label: 'Erreur', icon: AlertCircle, color: 'text-red-500' },
  { value: 'disconnected', label: 'Déconnecté', icon: WifiOff, color: 'text-muted-foreground' },
]

const DATE_OPTIONS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'all', label: 'Tout' },
]

export function ChannableAdvancedFilters({
  filters,
  onFiltersChange,
  savedFilters = [],
  onSaveFilter,
  onDeleteFilter,
  className
}: ChannableAdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filterName, setFilterName] = useState('')

  const activeFiltersCount = Object.values(filters).filter(v => 
    v !== undefined && v !== null && 
    (Array.isArray(v) ? v.length > 0 : v !== 'all' && v !== false)
  ).length

  const toggleStatus = (status: string) => {
    const current = filters.status || []
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status]
    onFiltersChange({ ...filters, status: updated })
  }

  const resetFilters = () => {
    onFiltersChange({})
  }

  const handleSaveFilter = () => {
    if (filterName.trim() && onSaveFilter) {
      onSaveFilter(filterName.trim(), filters)
      setFilterName('')
    }
  }

  const loadFilter = (config: FilterConfig) => {
    onFiltersChange(config)
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Main Filter Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className={cn(
              "gap-2 transition-all",
              activeFiltersCount > 0 && "border-primary text-primary"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtres avancés
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              isOpen && "rotate-180"
            )} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Filtres avancés</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
                className="h-8 px-2 text-muted-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Réinitialiser
              </Button>
            </div>
          </div>
          
          <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Statut
              </Label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(opt => {
                  const Icon = opt.icon
                  const isActive = filters.status?.includes(opt.value)
                  return (
                    <Button
                      key={opt.value}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleStatus(opt.value)}
                      className={cn(
                        "h-8 gap-1.5",
                        !isActive && "hover:border-primary"
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", !isActive && opt.color)} />
                      {opt.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Période
              </Label>
              <Select
                value={filters.dateRange || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value as any })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {DATE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Toggle Filters */}
            <div className="space-y-3">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Options
              </Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="hasErrors" className="text-sm cursor-pointer">
                    Avec erreurs uniquement
                  </Label>
                  <Switch
                    id="hasErrors"
                    checked={filters.hasErrors || false}
                    onCheckedChange={(checked) => onFiltersChange({ ...filters, hasErrors: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="hasProducts" className="text-sm cursor-pointer">
                    Avec produits synchronisés
                  </Label>
                  <Switch
                    id="hasProducts"
                    checked={filters.hasProducts || false}
                    onCheckedChange={(checked) => onFiltersChange({ ...filters, hasProducts: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoSync" className="text-sm cursor-pointer">
                    Auto-sync activé
                  </Label>
                  <Switch
                    id="autoSync"
                    checked={filters.autoSync || false}
                    onCheckedChange={(checked) => onFiltersChange({ ...filters, autoSync: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Saved Filters */}
            {savedFilters.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Filtres sauvegardés
                </Label>
                <div className="space-y-1">
                  {savedFilters.map(sf => (
                    <div 
                      key={sf.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-normal hover:bg-transparent"
                        onClick={() => loadFilter(sf.config)}
                      >
                        <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                        {sf.name}
                      </Button>
                      {onDeleteFilter && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeleteFilter(sf.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Filter */}
            {onSaveFilter && activeFiltersCount > 0 && (
              <div className="pt-2 border-t">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Sauvegarder ce filtre
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nom du filtre..."
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    className="h-9"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSaveFilter}
                    disabled={!filterName.trim()}
                    className="h-9"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filter Chips */}
      <AnimatePresence>
        {filters.status?.map(status => {
          const opt = STATUS_OPTIONS.find(o => o.value === status)
          if (!opt) return null
          const Icon = opt.icon
          return (
            <motion.div
              key={status}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Badge 
                variant="secondary"
                className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => toggleStatus(status)}
              >
                <Icon className={cn("h-3 w-3", opt.color)} />
                {opt.label}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            </motion.div>
          )
        })}
        {filters.dateRange && filters.dateRange !== 'all' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Badge 
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
              onClick={() => onFiltersChange({ ...filters, dateRange: 'all' })}
            >
              <Clock className="h-3 w-3" />
              {DATE_OPTIONS.find(d => d.value === filters.dateRange)?.label}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear All */}
      {activeFiltersCount > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
        >
          Effacer tout
        </Button>
      )}
    </div>
  )
}
