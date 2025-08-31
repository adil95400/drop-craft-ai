import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, Store, Package, Folder, Calendar, X } from 'lucide-react'

interface SelectorItem {
  id: string
  name: string
  type: 'store' | 'product' | 'category' | 'event'
  metadata?: any
  count?: number
  status?: 'active' | 'inactive' | 'draft'
}

interface OptimizedSelectorProps {
  title: string
  type: 'stores' | 'products' | 'categories' | 'events'
  items: SelectorItem[]
  selectedIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  multiSelect?: boolean
  showSearch?: boolean
  showFilters?: boolean
  maxHeight?: string
}

const typeIcons = {
  stores: Store,
  products: Package, 
  categories: Folder,
  events: Calendar
}

const typeLabels = {
  stores: 'magasin',
  products: 'produit',
  categories: 'catégorie', 
  events: 'événement'
}

export function OptimizedSelector({
  title,
  type,
  items,
  selectedIds,
  onSelectionChange,
  multiSelect = true,
  showSearch = true,
  showFilters = true,
  maxHeight = "400px"
}: OptimizedSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const Icon = typeIcons[type]
  const label = typeLabels[type]

  // Filtrage et recherche optimisés avec useMemo
  const filteredItems = useMemo(() => {
    let filtered = items

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    return filtered
  }, [items, searchTerm, statusFilter])

  // Gestion optimisée des sélections
  const handleToggleItem = useCallback((itemId: string) => {
    if (multiSelect) {
      const newSelected = selectedIds.includes(itemId)
        ? selectedIds.filter(id => id !== itemId)
        : [...selectedIds, itemId]
      onSelectionChange(newSelected)
    } else {
      onSelectionChange(selectedIds.includes(itemId) ? [] : [itemId])
    }
  }, [selectedIds, multiSelect, onSelectionChange])

  const handleSelectAll = useCallback(() => {
    const allIds = filteredItems.map(item => item.id)
    onSelectionChange(allIds)
  }, [filteredItems, onSelectionChange])

  const handleClearAll = useCallback(() => {
    onSelectionChange([])
  }, [onSelectionChange])

  const selectedCount = selectedIds.length
  const totalCount = items.length

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selectedCount}/{totalCount}
            </Badge>
            {multiSelect && (
              <div className="flex gap-1">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleSelectAll}
                  disabled={filteredItems.length === 0}
                >
                  Tout sélectionner
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleClearAll}
                  disabled={selectedCount === 0}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barre de recherche et filtres */}
        <div className="flex gap-2">
          {showSearch && (
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Rechercher un ${label}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {showFilters && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
                <SelectItem value="draft">Brouillons</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Liste des éléments */}
        <div 
          className="space-y-2 overflow-y-auto pr-2" 
          style={{ maxHeight }}
        >
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucun {label} trouvé</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.id)
              
              return (
                <div
                  key={item.id}
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer
                    ${isSelected 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-border hover:bg-muted/50'
                    }
                  `}
                  onClick={() => handleToggleItem(item.id)}
                >
                  <Checkbox 
                    checked={isSelected}
                    onChange={() => handleToggleItem(item.id)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{item.name}</p>
                      {item.status && (
                        <Badge 
                          variant={
                            item.status === 'active' ? 'default' : 
                            item.status === 'inactive' ? 'secondary' : 
                            'outline'
                          }
                          className="ml-2"
                        >
                          {item.status}
                        </Badge>
                      )}
                    </div>
                    {item.count !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        {item.count} éléments
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Résumé de la sélection */}
        {selectedCount > 0 && (
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{selectedCount}</span> {label}
              {selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}