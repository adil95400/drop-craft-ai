import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, DollarSign, TrendingUp, AlertTriangle, Bot, Sparkles, Upload, Plus } from 'lucide-react'
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts'
import { EnhancedProductsTable } from '@/components/products/EnhancedProductsTable'
import { AdvancedFiltersBar, AdvancedFiltersState } from '@/components/products/AdvancedFiltersBar'
import { BulkActionsToolbar } from '@/components/products/BulkActionsToolbar'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function AdvancedProductsPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<AdvancedFiltersState>({
    search: '',
    category: 'all',
    status: 'all',
    priceMin: '',
    priceMax: '',
    stockMin: '',
    lowStock: false,
    source: 'all',
    marginMin: '',
    hasImages: false,
    sortBy: 'name-asc'
  })

  const { products, stats, isLoading, updateProduct, deleteProduct } = useUnifiedProducts({
    search: filters.search,
    category: filters.category !== 'all' ? filters.category : undefined,
    status: filters.status !== 'all' ? filters.status as 'active' | 'inactive' : undefined,
    minPrice: filters.priceMin ? parseFloat(filters.priceMin) : undefined,
    maxPrice: filters.priceMax ? parseFloat(filters.priceMax) : undefined,
    lowStock: filters.lowStock
  })

  // Filtrage et tri des produits
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products]

    // Filtres supplémentaires
    if (filters.source !== 'all') {
      result = result.filter(p => p.source === filters.source)
    }
    if (filters.stockMin) {
      result = result.filter(p => (p.stock_quantity || 0) >= parseInt(filters.stockMin))
    }
    if (filters.marginMin) {
      result = result.filter(p => (p.profit_margin || 0) >= parseFloat(filters.marginMin))
    }
    if (filters.hasImages) {
      result = result.filter(p => p.image_url || (p.images && p.images.length > 0))
    }

    // Tri
    const [sortBy, order] = filters.sortBy.split('-')
    result.sort((a, b) => {
      let compareA: any = a[sortBy as keyof typeof a]
      let compareB: any = b[sortBy as keyof typeof b]

      if (sortBy === 'name') {
        compareA = a.name.toLowerCase()
        compareB = b.name.toLowerCase()
      }

      if (compareA < compareB) return order === 'asc' ? -1 : 1
      if (compareA > compareB) return order === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [products, filters])

  const categories = useMemo(() => 
    Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[],
    [products]
  )

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredAndSortedProducts.map(p => p.id) : [])
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => 
      checked ? [...prev, id] : prev.filter(pid => pid !== id)
    )
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleBulkAction = async (action: string) => {
    toast.info(`Action "${action}" sur ${selectedIds.length} produits...`)
    
    // Simuler l'action
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast.success(`Action "${action}" terminée avec succès!`)
    setSelectedIds([])
  }

  const handleView = (product: any) => {
    toast.info(`Affichage du produit: ${product.name}`)
  }

  const handleEdit = (product: any) => {
    toast.info(`Édition du produit: ${product.name}`)
  }

  const handleDuplicate = (product: any) => {
    toast.info(`Duplication du produit: ${product.name}`)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      await deleteProduct(id)
    }
  }

  const statsCards = [
    {
      label: 'Total Produits',
      value: stats.total,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Produits Actifs',
      value: stats.active,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10'
    },
    {
      label: 'Valeur Totale',
      value: `${stats.totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10'
    },
    {
      label: 'Stock Faible',
      value: stats.lowStock,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10'
    }
  ]

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Produits</h1>
          <p className="text-muted-foreground mt-1">
            Interface avancée de gestion et d'optimisation de votre catalogue
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Bot className="h-4 w-4 mr-2" />
            IA Assistant
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau produit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold">
                      {stat.value}
                    </p>
                  </div>
                  <div className={cn("p-3 rounded-full", stat.bgColor)}>
                    <Icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <AdvancedFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
      />

      {/* Bulk Actions */}
      <BulkActionsToolbar
        selectedCount={selectedIds.length}
        onAction={handleBulkAction}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Products Table */}
      <EnhancedProductsTable
        products={filteredAndSortedProducts}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}
        onView={handleView}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        isPro={true}
      />
    </div>
  )
}