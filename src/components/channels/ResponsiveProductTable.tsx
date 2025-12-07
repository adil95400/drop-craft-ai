/**
 * Tableau produits responsive avec vue mobile cards
 * Améliore l'UX sur mobile avec une vue adaptée
 */

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Package, MoreVertical, Search, Filter, ArrowUpDown,
  Eye, Edit2, Trash2, RefreshCw, ExternalLink, CheckCircle2,
  AlertCircle, Clock, ChevronLeft, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/use-media-query'

interface Product {
  id: string
  title: string
  image_url?: string
  price?: number
  compare_at_price?: number
  sku?: string
  vendor?: string
  inventory_quantity?: number
  status?: string
  synced_at?: string
}

interface ResponsiveProductTableProps {
  products: Product[]
  isLoading?: boolean
  onRefresh?: () => void
  onProductClick?: (product: Product) => void
  onProductEdit?: (product: Product) => void
  onProductDelete?: (product: Product) => void
  showSelection?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}

export function ResponsiveProductTable({
  products,
  isLoading,
  onRefresh,
  onProductClick,
  onProductEdit,
  onProductDelete,
  showSelection = false,
  selectedIds = [],
  onSelectionChange,
}: ResponsiveProductTableProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = isMobile ? 10 : 20

  // Filter products
  const filteredProducts = products.filter(p =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const toggleSelection = (productId: string) => {
    if (!onSelectionChange) return
    const newSelection = selectedIds.includes(productId)
      ? selectedIds.filter(id => id !== productId)
      : [...selectedIds, productId]
    onSelectionChange(newSelection)
  }

  const toggleAllSelection = () => {
    if (!onSelectionChange) return
    if (selectedIds.length === paginatedProducts.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(paginatedProducts.map(p => p.id))
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-700 text-xs">Actif</Badge>
      case 'draft':
        return <Badge variant="secondary" className="text-xs">Brouillon</Badge>
      case 'archived':
        return <Badge variant="outline" className="text-xs">Archivé</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status || 'Inconnu'}</Badge>
    }
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Search & Actions */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {onRefresh && (
            <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          )}
        </div>

        {/* Products Count */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}</span>
          {selectedIds.length > 0 && (
            <Badge variant="secondary">{selectedIds.length} sélectionné{selectedIds.length !== 1 ? 's' : ''}</Badge>
          )}
        </div>

        {/* Product Cards */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : paginatedProducts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun produit trouvé</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {paginatedProducts.map(product => (
              <Card 
                key={product.id} 
                className={cn(
                  "transition-all cursor-pointer active:scale-[0.98]",
                  selectedIds.includes(product.id) && "ring-2 ring-primary"
                )}
                onClick={() => onProductClick?.(product)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Selection */}
                    {showSelection && (
                      <div 
                        className="flex items-start pt-1"
                        onClick={(e) => { e.stopPropagation(); toggleSelection(product.id) }}
                      >
                        <Checkbox checked={selectedIds.includes(product.id)} />
                      </div>
                    )}

                    {/* Image */}
                    <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.title || ''} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{product.title || 'Sans titre'}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {product.sku && `SKU: ${product.sku}`}
                            {product.vendor && ` • ${product.vendor}`}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onProductClick?.(product)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onProductEdit?.(product)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onProductDelete?.(product)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-semibold text-sm">
                          €{product.price?.toFixed(2) || '0.00'}
                        </span>
                        {product.compare_at_price && product.compare_at_price > (product.price || 0) && (
                          <span className="text-xs text-muted-foreground line-through">
                            €{product.compare_at_price.toFixed(2)}
                          </span>
                        )}
                        {getStatusBadge(product.status)}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          Stock: {product.inventory_quantity ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Desktop Table View
  return (
    <div className="space-y-4">
      {/* Search & Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher produits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">
            {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}
          </span>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Actualiser
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {showSelection && (
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0}
                    onCheckedChange={toggleAllSelection}
                  />
                </TableHead>
              )}
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead className="text-right">Prix</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {showSelection && <TableCell><div className="h-4 w-4 bg-muted rounded" /></TableCell>}
                  <TableCell><div className="h-10 w-10 bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-48" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-16 ml-auto" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-12 mx-auto" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-16 mx-auto" /></TableCell>
                  <TableCell><div className="h-4 w-4 bg-muted rounded mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showSelection ? 7 : 6} className="h-32 text-center">
                  <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Aucun produit trouvé</p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map(product => (
                <TableRow 
                  key={product.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50",
                    selectedIds.includes(product.id) && "bg-primary/5"
                  )}
                  onClick={() => onProductClick?.(product)}
                >
                  {showSelection && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedIds.includes(product.id)}
                        onCheckedChange={() => toggleSelection(product.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="w-10 h-10 rounded-md bg-muted overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt="" 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium truncate max-w-xs">{product.title || 'Sans titre'}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.sku && `SKU: ${product.sku}`}
                        {product.vendor && ` • ${product.vendor}`}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <span className="font-medium">€{product.price?.toFixed(2) || '0.00'}</span>
                      {product.compare_at_price && product.compare_at_price > (product.price || 0) && (
                        <p className="text-xs text-muted-foreground line-through">
                          €{product.compare_at_price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "font-medium",
                      (product.inventory_quantity ?? 0) === 0 && "text-destructive",
                      (product.inventory_quantity ?? 0) > 0 && (product.inventory_quantity ?? 0) <= 5 && "text-orange-600"
                    )}>
                      {product.inventory_quantity ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(product.status)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onProductClick?.(product)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onProductEdit?.(product)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onProductDelete?.(product)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Affichage {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} sur {filteredProducts.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
            <span className="text-sm px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
