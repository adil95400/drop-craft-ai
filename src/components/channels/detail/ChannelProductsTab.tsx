/**
 * ChannelProductsTab - Liste des produits synchronisés avec design premium
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Package, RefreshCw, Loader2, Search, Filter, Grid3X3, List, Image as ImageIcon, Check, CheckSquare, Square } from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { ChannelBulkActions } from './ChannelBulkActions'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'

interface Product {
  id: string
  title: string | null
  image_url: string | null
  price: number | null
  inventory_quantity: number | null
  status: string | null
  sku: string | null
}

interface ChannelProductsTabProps {
  products: Product[]
  totalCount: number
  isLoading: boolean
  onRefresh: () => void
  onSync: () => void
  isSyncing: boolean
}

export function ChannelProductsTab({
  products,
  totalCount,
  isLoading,
  onRefresh,
  onSync,
  isSyncing
}: ChannelProductsTabProps) {
  const { t } = useTranslation('channels')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const filteredProducts = useMemo(() => {
    let filtered = products
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query)
      )
    }
    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter)
    }
    return filtered
  }, [products, searchQuery, statusFilter])

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30 text-xs">{t('products.active')}</Badge>
      case 'draft':
        return <Badge variant="secondary" className="text-xs">{t('products.draft')}</Badge>
      case 'archived':
        return <Badge variant="outline" className="text-xs">{t('products.archived')}</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status || 'draft'}</Badge>
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return t('products.active')
      case 'draft': return t('products.draft')
      case 'archived': return t('products.archived')
      default: return status
    }
  }

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-r from-muted/50 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">{t('products.syncedProducts')}</CardTitle>
              <p className="text-sm text-muted-foreground">{t('products.totalProducts', { count: totalCount })}</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onRefresh()}
            disabled={isLoading}
            className="gap-2 rounded-xl"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            {t('products.refresh')}
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('products.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-border/50"
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={statusFilter ? "default" : "outline"} 
                  size="icon" 
                  className="rounded-xl shrink-0"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{t('products.filterByStatus')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                  <span className="flex-1">{t('products.all')}</span>
                  {statusFilter === null && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                  <span className="flex-1">{t('products.active')}</span>
                  {statusFilter === 'active' && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('draft')}>
                  <span className="flex-1">{t('products.draft')}</span>
                  {statusFilter === 'draft' && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('archived')}>
                  <span className="flex-1">{t('products.archived')}</span>
                  {statusFilter === 'archived' && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex rounded-xl border border-border/50 overflow-hidden">
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="icon"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active filter badge */}
        {statusFilter && (
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="secondary" className="gap-1.5">
              {t('products.statusLabel', { status: getStatusLabel(statusFilter) })}
              <button
                onClick={() => setStatusFilter(null)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Bulk Actions */}
        <ChannelBulkActions
          products={filteredProducts}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onAction={async (action, ids, params) => {
            try {
              switch (action) {
                case 'activate':
                case 'deactivate': {
                  const newStatus = action === 'activate' ? 'active' : 'draft'
                  const { error } = await supabase
                    .from('products')
                    .update({ status: newStatus })
                    .in('id', ids)
                  if (error) throw error
                  onRefresh()
                  break
                }
                case 'delete': {
                  const { error } = await supabase
                    .from('products')
                    .delete()
                    .in('id', ids)
                  if (error) throw error
                  onRefresh()
                  break
                }
                case 'update_price': {
                  if (!params?.value) break
                  const adjustment = parseFloat(params.value)
                  const { data: prods } = await supabase
                    .from('products')
                    .select('id, price')
                    .in('id', ids)
                  if (prods) {
                    for (const p of prods) {
                      const currentPrice = p.price || 0
                      const newPrice = params.type === 'percent'
                        ? currentPrice * (1 + adjustment / 100)
                        : currentPrice + adjustment
                      await supabase
                        .from('products')
                        .update({ price: Math.max(0, Math.round(newPrice * 100) / 100) })
                        .eq('id', p.id)
                    }
                  }
                  onRefresh()
                  break
                }
                case 'export':
                  break
              }
            } catch (error: any) {
              toast.error(error.message || t('products.bulkError'))
              throw error
            }
          }}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">{t('products.loading')}</p>
            </div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {viewMode === 'list' ? (
              <div className="space-y-2">
                {filteredProducts.map((product, index) => (
                  <motion.div 
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    onClick={() => toggleSelection(product.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/30 transition-all group cursor-pointer",
                      selectedIds.includes(product.id) 
                        ? "border-primary bg-primary/5" 
                        : "border-border/50"
                    )}
                  >
                    <div className="flex items-center justify-center w-5 h-5">
                      {selectedIds.includes(product.id) ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                      )}
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0 border border-border/30 [&.fallback-active_img]:hidden [&.fallback-active_[data-fallback]]:flex">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget
                            target.style.display = 'none'
                            target.parentElement?.classList.add('fallback-active')
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full items-center justify-center bg-muted ${product.image_url ? 'hidden' : 'flex'}`} data-fallback>
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate group-hover:text-primary transition-colors">
                        {product.title || t('products.untitled')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {product.sku && <span className="font-mono">SKU: {product.sku}</span>}
                        {product.sku && product.inventory_quantity !== null && ' • '}
                        {product.inventory_quantity !== null && `Stock: ${product.inventory_quantity}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-lg">€{product.price?.toFixed(2) || '0.00'}</p>
                      {getStatusBadge(product.status)}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product, index) => (
                  <motion.div 
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    className="border border-border/50 rounded-xl overflow-hidden hover:shadow-lg transition-all group bg-card"
                  >
                    <div className="aspect-square relative bg-muted overflow-hidden [&.fallback-active_img]:hidden [&.fallback-active_[data-fallback]]:flex">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget
                            target.style.display = 'none'
                            target.parentElement?.classList.add('fallback-active')
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full items-center justify-center ${product.image_url ? 'hidden' : 'flex'}`} data-fallback>
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(product.status)}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm truncate">{product.title || t('products.untitled')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {product.sku && `SKU: ${product.sku}`}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-bold">€{product.price?.toFixed(2) || '0.00'}</p>
                        <p className="text-xs text-muted-foreground">
                          Stock: {product.inventory_quantity ?? 0}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? t('products.noResults') : t('products.noSynced')}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {searchQuery 
                ? t('products.noResultsFor', { query: searchQuery })
                : t('products.noSyncedDesc')
              }
            </p>
            {!searchQuery && (
              <Button onClick={onSync} disabled={isSyncing} className="gap-2 rounded-xl">
                <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                {isSyncing ? t('products.syncing') : t('products.startSync')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
