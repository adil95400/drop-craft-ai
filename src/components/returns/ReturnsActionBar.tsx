/**
 * Barre d'actions rapides pour la gestion des retours
 * Recherche, filtres et création de retour
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  Plus, 
  RefreshCw, 
  Filter,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Download
} from 'lucide-react'
import { CreateReturnDialog } from './CreateReturnDialog'

interface ReturnsActionBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  viewMode: 'kanban' | 'list'
  onViewModeChange: (mode: 'kanban' | 'list') => void
  onRefresh: () => void
  isLoading?: boolean
  activeFilters?: string[]
}

const REASON_FILTERS = [
  { value: 'defective', label: 'Défectueux' },
  { value: 'wrong_item', label: 'Mauvais article' },
  { value: 'not_as_described', label: 'Non conforme' },
  { value: 'changed_mind', label: 'Changement avis' },
  { value: 'damaged_shipping', label: 'Endommagé' },
  { value: 'other', label: 'Autre' },
]

export function ReturnsActionBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  onRefresh,
  isLoading,
  activeFilters = []
}: ReturnsActionBarProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [reasonFilters, setReasonFilters] = useState<string[]>([])

  const handleReasonToggle = (reason: string) => {
    setReasonFilters(prev => 
      prev.includes(reason) 
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    )
  }

  const totalActiveFilters = (statusFilter !== 'all' ? 1 : 0) + reasonFilters.length

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search & Filters */}
        <div className="flex flex-wrap gap-2 items-center flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher RMA, raison..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvés</SelectItem>
              <SelectItem value="received">Reçus</SelectItem>
              <SelectItem value="inspecting">En inspection</SelectItem>
              <SelectItem value="refunded">Remboursés</SelectItem>
              <SelectItem value="rejected">Rejetés</SelectItem>
              <SelectItem value="completed">Terminés</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <SlidersHorizontal className="h-4 w-4" />
                {reasonFilters.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
                  >
                    {reasonFilters.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Filtrer par raison</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {REASON_FILTERS.map(reason => (
                <DropdownMenuCheckboxItem
                  key={reason.value}
                  checked={reasonFilters.includes(reason.value)}
                  onCheckedChange={() => handleReasonToggle(reason.value)}
                >
                  {reason.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {totalActiveFilters > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                onStatusFilterChange('all')
                setReasonFilters([])
              }}
            >
              Effacer filtres
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                {totalActiveFilters}
              </Badge>
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 items-center shrink-0">
          {/* View Toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none h-9"
              onClick={() => onViewModeChange('kanban')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none h-9"
              onClick={() => onViewModeChange('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau retour
          </Button>
        </div>
      </div>

      <CreateReturnDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </>
  )
}
