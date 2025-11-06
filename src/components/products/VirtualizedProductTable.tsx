import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
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
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { 
  ArrowUpDown, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Copy, 
  Trash2,
  Package
} from 'lucide-react'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'
import { cn } from '@/lib/utils'

interface VirtualizedProductTableProps {
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

export function VirtualizedProductTable({
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
}: VirtualizedProductTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 73, // Hauteur estimée d'une ligne
    overscan: 5
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      default: return 'outline'
    }
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'imported':
        return <Badge variant="secondary" className="text-xs">Importé</Badge>
      case 'catalog':
        return <Badge variant="outline" className="text-xs">Catalogue</Badge>
      case 'premium':
        return <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500">Premium</Badge>
      case 'products':
        return <Badge variant="default" className="text-xs">Manuel</Badge>
      default:
        return null
    }
  }

  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 -ml-3"
      onClick={() => onSort(field)}
    >
      {children}
      <ArrowUpDown className={cn(
        "ml-2 h-4 w-4",
        sortField === field && "text-primary"
      )} />
    </Button>
  )

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-md">
        <Package className="h-16 w-16 mb-4" />
        <p className="text-lg font-medium">Aucun produit trouvé</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto"
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === products.length && products.length > 0}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              <TableHead className="w-20">Image</TableHead>
              <TableHead className="min-w-[200px]">
                <SortButton field="name">Nom</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="sku">SKU</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="category">Catégorie</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="price">Prix</SortButton>
              </TableHead>
              {isPro && (
                <>
                  <TableHead className="text-right">Coût</TableHead>
                  <TableHead className="text-right">Marge</TableHead>
                </>
              )}
              <TableHead className="text-center">
                <SortButton field="stock_quantity">Stock</SortButton>
              </TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              <td />
            </tr>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const product = products[virtualRow.index]
              return (
                <TableRow
                  key={product.id}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                  className={cn(
                    "hover:bg-muted/50 transition-colors",
                    selectedIds.includes(product.id) && "bg-muted/30"
                  )}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(product.id)}
                      onCheckedChange={(checked) => onSelectOne(product.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="w-12 h-12 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                      {(product.images && product.images[0]) || product.image_url ? (
                        <img 
                          src={(product.images && product.images[0]) || product.image_url || ''} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span className="line-clamp-1">{product.name}</span>
                      {product.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {product.description}
                        </span>
                      )}
                      {getSourceBadge(product.source)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {product.sku || 'N/A'}
                    </code>
                  </TableCell>
                  <TableCell>
                    {product.category ? (
                      <Badge variant="outline" className="font-normal">
                        {product.category}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(product.price)}
                  </TableCell>
                  {isPro && (
                    <>
                      <TableCell className="text-right text-muted-foreground">
                        {product.cost_price ? formatCurrency(product.cost_price) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.profit_margin ? (
                          <span className={cn(
                            "font-medium",
                            product.profit_margin > 0 ? "text-emerald-600" : "text-red-600"
                          )}>
                            {product.profit_margin.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="text-center">
                    <Badge 
                      variant={(product.stock_quantity || 0) < 10 ? 'destructive' : 'secondary'}
                      className="font-mono"
                    >
                      {product.stock_quantity || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(product.status)}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
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
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <div className="p-2 border-t text-xs text-muted-foreground text-center">
        Affichage de {products.length} produit(s) • Virtualisation activée
      </div>
    </div>
  )
}
