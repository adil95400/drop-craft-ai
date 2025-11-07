import { useState, useMemo } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import { 
  ArrowUpDown, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Copy, 
  Trash2,
  Package,
  Columns,
  ChevronDown
} from 'lucide-react'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'
import { cn } from '@/lib/utils'

interface EnhancedProductsTableProps {
  products: UnifiedProduct[]
  selectedIds: string[]
  onSelectAll: (checked: boolean) => void
  onSelectOne: (id: string, checked: boolean) => void
  onSort: (field: string) => void
  sortField: string
  sortDirection: 'asc' | 'desc'
  onView: (product: UnifiedProduct) => void
  onEdit: (product: UnifiedProduct) => void
  onDuplicate: (product: UnifiedProduct) => void
  onDelete: (id: string) => void
  isPro?: boolean
}

interface ColumnConfig {
  id: string
  label: string
  visible: boolean
  width?: string
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'image', label: 'Image', visible: true, width: 'w-20' },
  { id: 'name', label: 'Nom', visible: true, width: 'min-w-[250px]' },
  { id: 'sku', label: 'SKU', visible: true, width: 'w-32' },
  { id: 'category', label: 'Catégorie', visible: true, width: 'w-36' },
  { id: 'price', label: 'Prix', visible: true, width: 'w-28' },
  { id: 'cost', label: 'Coût', visible: true, width: 'w-28' },
  { id: 'margin', label: 'Marge', visible: true, width: 'w-24' },
  { id: 'stock', label: 'Stock', visible: true, width: 'w-24' },
  { id: 'status', label: 'Statut', visible: true, width: 'w-28' },
  { id: 'source', label: 'Source', visible: true, width: 'w-32' }
]

export function EnhancedProductsTable({
  products,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onSort,
  sortField,
  sortDirection,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  isPro = false
}: EnhancedProductsTableProps) {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)

  const toggleColumn = (columnId: string) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ))
  }

  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible && (isPro || !['cost', 'margin'].includes(col.id))),
    [columns, isPro]
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const calculateMargin = (price: number, cost?: number) => {
    if (!cost || cost === 0) return null
    return ((price - cost) / price * 100).toFixed(1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
      case 'inactive': return 'bg-gray-500/10 text-gray-700 border-gray-200'
      default: return 'bg-blue-500/10 text-blue-700 border-blue-200'
    }
  }

  const getSourceBadge = (source: string) => {
    const configs = {
      imported: { label: 'Importé', className: 'bg-blue-500/10 text-blue-700 border-blue-200' },
      catalog: { label: 'Catalogue', className: 'bg-purple-500/10 text-purple-700 border-purple-200' },
      premium: { label: 'Premium', className: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0' },
      products: { label: 'Manuel', className: 'bg-green-500/10 text-green-700 border-green-200' }
    }
    const config = configs[source as keyof typeof configs] || { label: source, className: '' }
    return <Badge variant="outline" className={cn("text-xs", config.className)}>{config.label}</Badge>
  }

  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 -ml-3 hover:bg-transparent"
      onClick={() => onSort(field)}
    >
      <span className="font-semibold">{children}</span>
      <ArrowUpDown className={cn(
        "ml-2 h-4 w-4 transition-colors",
        sortField === field ? "text-primary" : "text-muted-foreground"
      )} />
    </Button>
  )

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border rounded-lg bg-muted/20">
        <Package className="h-20 w-20 mb-4 opacity-50" />
        <p className="text-lg font-medium mb-1">Aucun produit trouvé</p>
        <p className="text-sm text-muted-foreground">Essayez d'ajuster vos filtres ou d'importer des produits</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar avec personnalisation colonnes */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {selectedIds.length > 0 ? (
            <span className="font-medium text-primary">
              {selectedIds.length} produit(s) sélectionné(s)
            </span>
          ) : (
            <span>{products.length} produit(s) au total</span>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns className="h-4 w-4 mr-2" />
              Colonnes
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm font-semibold">Afficher/Masquer colonnes</div>
            <DropdownMenuSeparator />
            {columns.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={col.visible}
                onCheckedChange={() => toggleColumn(col.id)}
                disabled={!isPro && ['cost', 'margin'].includes(col.id)}
              >
                {col.label}
                {!isPro && ['cost', 'margin'].includes(col.id) && (
                  <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge>
                )}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-background shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="w-12 bg-muted/50">
                  <Checkbox
                    checked={selectedIds.length === products.length && products.length > 0}
                    onCheckedChange={onSelectAll}
                  />
                </TableHead>
                {visibleColumns.map((col) => (
                  <TableHead key={col.id} className={cn(col.width, "bg-muted/50")}>
                    {['name', 'sku', 'category', 'price', 'stock'].includes(col.id) ? (
                      <SortButton field={col.id}>{col.label}</SortButton>
                    ) : (
                      <span className="font-semibold">{col.label}</span>
                    )}
                  </TableHead>
                ))}
                <TableHead className="w-16 text-right bg-muted/50">
                  <span className="font-semibold">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow
                  key={product.id}
                  className={cn(
                    "hover:bg-muted/50 transition-colors",
                    selectedIds.includes(product.id) && "bg-primary/5",
                    index % 2 === 0 ? "bg-background" : "bg-muted/20"
                  )}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(product.id)}
                      onCheckedChange={(checked) => onSelectOne(product.id, checked as boolean)}
                    />
                  </TableCell>
                  
                  {visibleColumns.find(c => c.id === 'image')?.visible && (
                    <TableCell>
                      <div className="w-14 h-14 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                        {(product.images?.[0] || product.image_url) ? (
                          <img 
                            src={product.images?.[0] || product.image_url || ''} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                  )}
                  
                  {visibleColumns.find(c => c.id === 'name')?.visible && (
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span className="line-clamp-2 leading-tight">{product.name}</span>
                        {product.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {product.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  )}
                  
                  {visibleColumns.find(c => c.id === 'sku')?.visible && (
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {product.sku || 'N/A'}
                      </code>
                    </TableCell>
                  )}
                  
                  {visibleColumns.find(c => c.id === 'category')?.visible && (
                    <TableCell>
                      {product.category ? (
                        <Badge variant="outline" className="font-normal">
                          {product.category}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  
                  {visibleColumns.find(c => c.id === 'price')?.visible && (
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(product.price)}
                    </TableCell>
                  )}
                  
                  {visibleColumns.find(c => c.id === 'cost')?.visible && isPro && (
                    <TableCell className="text-right text-muted-foreground">
                      {product.cost_price ? formatCurrency(product.cost_price) : '-'}
                    </TableCell>
                  )}
                  
                  {visibleColumns.find(c => c.id === 'margin')?.visible && isPro && (
                    <TableCell className="text-right">
                      {product.profit_margin || calculateMargin(product.price, product.cost_price) ? (
                        <Badge 
                          variant="outline"
                          className={cn(
                            "font-medium",
                            (product.profit_margin || 0) > 30 
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" 
                              : (product.profit_margin || 0) > 15
                              ? "bg-yellow-500/10 text-yellow-700 border-yellow-200"
                              : "bg-red-500/10 text-red-700 border-red-200"
                          )}
                        >
                          {product.profit_margin?.toFixed(1) || calculateMargin(product.price, product.cost_price)}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  )}
                  
                  {visibleColumns.find(c => c.id === 'stock')?.visible && (
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline"
                        className={cn(
                          "font-mono",
                          (product.stock_quantity || 0) < 10 
                            ? "bg-red-500/10 text-red-700 border-red-200" 
                            : (product.stock_quantity || 0) < 50
                            ? "bg-yellow-500/10 text-yellow-700 border-yellow-200"
                            : "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                        )}
                      >
                        {product.stock_quantity || 0}
                      </Badge>
                    </TableCell>
                  )}
                  
                  {visibleColumns.find(c => c.id === 'status')?.visible && (
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(product.status)}>
                        {product.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                  )}
                  
                  {visibleColumns.find(c => c.id === 'source')?.visible && (
                    <TableCell>
                      {getSourceBadge(product.source)}
                    </TableCell>
                  )}
                  
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onView(product)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir les détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(product)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(product)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(product.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Footer info */}
      <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
        <span>Affichage de {products.length} produit(s)</span>
        <span>Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}</span>
      </div>
    </div>
  )
}
