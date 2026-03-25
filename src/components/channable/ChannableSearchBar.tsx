/**
 * Barre de recherche style Channable — Premium avec filtres
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Search, SlidersHorizontal, X, ArrowUpDown, Plus } from 'lucide-react'

interface FilterOption { id: string; label: string; checked: boolean }
interface SortOption { id: string; label: string }

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
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      {/* Search input — refined */}
      <div className="relative flex-1 group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors duration-200" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10 h-10 bg-background border-border/50 focus:border-primary/40 focus:shadow-sm transition-all duration-200 rounded-xl text-[13px]"
        />
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {/* Sort */}
        {sortOptions && sortOptions.length > 0 && onSortChange && (
          <Select value={currentSort} onValueChange={onSortChange}>
            <SelectTrigger className="w-[170px] h-10 rounded-xl border-border/50 text-[13px]">
              <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Trier par..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.id} value={option.id} className="text-[13px]">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Filters */}
        {showFilters && filters && filters.length > 0 && (
          <DropdownMenu open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 rounded-xl border-border/50 text-[13px] gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filtres
                {activeFiltersCount > 0 && (
                  <Badge className="ml-1 h-5 min-w-[20px] p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground rounded-full">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {filters.map((filterGroup, index) => (
                <div key={filterGroup.label}>
                  {index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
                    {filterGroup.label}
                  </DropdownMenuLabel>
                  {filterGroup.options.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.id}
                      checked={option.checked}
                      onCheckedChange={(checked) => filterGroup.onChange(option.id, checked)}
                      className="text-[13px]"
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Add new */}
        {onAddNew && (
          <Button 
            onClick={onAddNew}
            className="h-10 rounded-xl text-[13px] gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            {addNewLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
