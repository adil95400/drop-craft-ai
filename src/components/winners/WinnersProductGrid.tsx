import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Grid3x3, List, SlidersHorizontal } from 'lucide-react';
import { WinnerProduct } from '@/domains/winners/types';
import { WinnersProductCard } from './WinnersProductCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface WinnersProductGridProps {
  products: WinnerProduct[];
  onImportProduct: (product: WinnerProduct) => void;
  isImporting?: boolean;
  isLoading?: boolean;
}

export const WinnersProductGrid = ({ 
  products, 
  onImportProduct,
  isImporting = false,
  isLoading = false
}: WinnersProductGridProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('score');

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return (b.final_score || 0) - (a.final_score || 0);
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'trending':
        return b.trending_score - a.trending_score;
      case 'profit':
        const profitA = a.profit_margin || (a.price - (a.estimated_cost || a.price * 0.4));
        const profitB = b.profit_margin || (b.price - (b.estimated_cost || b.price * 0.4));
        return profitB - profitA;
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
          <TrendingUp className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold mb-2">Aucun produit trouvé</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Lancez une recherche pour découvrir des produits gagnants avec notre IA
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-9 w-9 p-0"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-9 w-9 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <div className="h-6 w-px bg-border" />
          <span className="text-sm font-medium text-muted-foreground">
            {sortedProducts.length} produit{sortedProducts.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder="Trier par..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Score le plus élevé
                </div>
              </SelectItem>
              <SelectItem value="trending">Tendance actuelle</SelectItem>
              <SelectItem value="profit">Profit estimé</SelectItem>
              <SelectItem value="price-asc">Prix croissant</SelectItem>
              <SelectItem value="price-desc">Prix décroissant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Product Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div 
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'flex flex-col gap-4'
          }
          layout
        >
          {sortedProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.05,
                ease: "easeOut"
              }}
              layout
            >
              <WinnersProductCard
                product={product}
                onImportProduct={onImportProduct}
                isImporting={isImporting}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};