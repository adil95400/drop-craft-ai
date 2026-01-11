/**
 * En-tête du Sitemap avec recherche
 */
import { memo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Map, Filter, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import type { PlanType } from '@/lib/unified-plan-system'

interface SitemapHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  planFilter: PlanType | 'all'
  onPlanFilterChange: (plan: PlanType | 'all') => void
}

export const SitemapHeader = memo<SitemapHeaderProps>(({
  searchQuery,
  onSearchChange,
  planFilter,
  onPlanFilterChange
}) => {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Map className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plan du Site</h1>
          <p className="text-sm text-muted-foreground">
            Explorez toutes les fonctionnalités disponibles par catégorie
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un module ou une fonctionnalité..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9 bg-background"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => onSearchChange('')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">
                {planFilter === 'all' ? 'Tous les plans' : planFilter === 'ultra_pro' ? 'Ultra Pro' : planFilter.charAt(0).toUpperCase() + planFilter.slice(1)}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Filtrer par plan</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={planFilter === 'all'}
              onCheckedChange={() => onPlanFilterChange('all')}
            >
              Tous les plans
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={planFilter === 'standard'}
              onCheckedChange={() => onPlanFilterChange('standard')}
            >
              Standard
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={planFilter === 'pro'}
              onCheckedChange={() => onPlanFilterChange('pro')}
            >
              Pro
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={planFilter === 'ultra_pro'}
              onCheckedChange={() => onPlanFilterChange('ultra_pro')}
            >
              Ultra Pro
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
})

SitemapHeader.displayName = 'SitemapHeader'
