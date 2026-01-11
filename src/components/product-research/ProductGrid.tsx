import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WinnerProductCard, WinnerProduct } from './WinnerProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LayoutGrid, 
  List, 
  Loader2,
  Package,
  RefreshCw
} from 'lucide-react';

interface ProductGridProps {
  products: WinnerProduct[];
  isLoading?: boolean;
  onToggleFavorite?: (id: string) => void;
  onImport?: (product: WinnerProduct) => void;
  onViewDetails?: (product: WinnerProduct) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function ProductGrid({
  products,
  isLoading,
  onToggleFavorite,
  onImport,
  onViewDetails,
  onLoadMore,
  hasMore = false
}: ProductGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (isLoading && products.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Package className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Aucun produit trouvé</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Essayez de modifier vos filtres ou lancez une nouvelle recherche pour découvrir des produits gagnants.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser la recherche
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{products.length}</span> produits trouvés
        </p>
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Product Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div 
          className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }
          layout
        >
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
            >
              <WinnerProductCard
                product={product}
                onToggleFavorite={onToggleFavorite}
                onImport={onImport}
                onViewDetails={onViewDetails}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                Voir plus de produits
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
