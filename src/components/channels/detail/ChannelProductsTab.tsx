/**
 * ChannelProductsTab - Liste des produits synchronisés avec design premium
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Package, RefreshCw, Loader2, Search, Filter, Grid3X3, List, Image as ImageIcon } from 'lucide-react'
import { useState, useMemo } from 'react'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products
    const query = searchQuery.toLowerCase()
    return products.filter(p => 
      p.title?.toLowerCase().includes(query) ||
      p.sku?.toLowerCase().includes(query)
    )
  }, [products, searchQuery])

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30 text-xs">Actif</Badge>
      case 'draft':
        return <Badge variant="secondary" className="text-xs">Brouillon</Badge>
      case 'archived':
        return <Badge variant="outline" className="text-xs">Archivé</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status || 'draft'}</Badge>
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
              <CardTitle className="text-lg">Produits synchronisés</CardTitle>
              <p className="text-sm text-muted-foreground">{totalCount.toLocaleString('fr-FR')} produits au total</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2 rounded-xl"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Actualiser
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-border/50"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-xl shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
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
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Chargement des produits...</p>
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
                    className="flex items-center gap-4 p-4 border border-border/50 rounded-xl hover:bg-muted/30 transition-all group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0 border border-border/30">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.title || ''} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate group-hover:text-primary transition-colors">
                        {product.title || 'Sans titre'}
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
                    <div className="aspect-square relative bg-muted overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.title || ''} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(product.status)}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm truncate">{product.title || 'Sans titre'}</p>
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
              {searchQuery ? 'Aucun résultat' : 'Aucun produit synchronisé'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {searchQuery 
                ? `Aucun produit ne correspond à "${searchQuery}"`
                : 'Lancez une synchronisation pour importer vos produits depuis votre boutique'
              }
            </p>
            {!searchQuery && (
              <Button onClick={onSync} disabled={isSyncing} className="gap-2 rounded-xl">
                <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                {isSyncing ? 'Synchronisation...' : 'Lancer la synchronisation'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
