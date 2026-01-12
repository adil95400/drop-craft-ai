/**
 * Barre de recherche style Channable avec filtres
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  ArrowUpDown,
  Filter,
  Plus
} from 'lucide-react'

interface FilterOption {
  id: string
  label: string
  checked: boolean
}

interface SortOption {
  id: string
  label: string
}

interface ChannableSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onAddNew?: () => void
  addNewLabel?: string
  filters?: {
    label: string
    options: FilterOption[]
    onChange: (id: string, checked: boolean) => void
  }[]
  sortOptions?: SortOption[]
  currentSort?: string
  onSortChange?: (sortId: string) => void
  activeFiltersCount?: number
  className?: string
  showFilters?: boolean
}

export function ChannableSearchBar({
  value,
  onChange,
  placeholder = "Rechercher...",
  onAddNew,
  addNewLabel = "Ajouter",
  filters,
  sortOptions,
  currentSort,
  onSortChange,
  activeFiltersCount = 0,
  className,
  showFilters = true
}: ChannableSearchBarProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  return (
    <div className={cn("flex flex-col sm:flex-row gap-3", className)}>
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10 h-11 bg-muted/30 border-border/50 focus:bg-background focus:border-primary/50 transition-all"
        />
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {/* Sort dropdown */}
        {sortOptions && sortOptions.length > 0 && onSortChange && (
          <Select value={currentSort} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px] h-11">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Trier par..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Filters dropdown */}
        {showFilters && filters && filters.length > 0 && (
          <DropdownMenu open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 relative">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filtres
                {activeFiltersCount > 0 && (
                  <Badge 
                    className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {filters.map((filterGroup, index) => (
                <div key={filterGroup.label}>
                  {index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel>{filterGroup.label}</DropdownMenuLabel>
                  {filterGroup.options.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.id}
                      checked={option.checked}
                      onCheckedChange={(checked) => filterGroup.onChange(option.id, checked)}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Add new button */}
        {onAddNew && (
          <Button 
            onClick={onAddNew}
            className="h-11 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            {addNewLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
