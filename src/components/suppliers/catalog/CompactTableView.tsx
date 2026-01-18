/**
 * CompactTableView - Vue tableau compacte pour le catalogue
 * Affichage dense avec tri, sélection et actions rapides
 */

import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Heart,
  ShoppingCart,
  MoreHorizontal,
  Crown,
  TrendingUp,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CatalogProduct } from './CatalogProductCard';

interface CompactTableViewProps {
  products: CatalogProduct[];
  selectedProducts: Set<string>;
  favorites: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onFavorite: (id: string) => void;
  onImport: (id: string) => void;
  onView: (product: CatalogProduct) => void;
  isImporting?: boolean;
}

type SortField = 'name' | 'retail_price' | 'cost_price' | 'profit_margin' | 'ai_score' | 'stock_quantity' | 'orders_count';
type SortDirection = 'asc' | 'desc';

export const CompactTableView = memo(function CompactTableView({
  products,
  selectedProducts,
  favorites,
  onSelect,
  onSelectAll,
  onFavorite,
  onImport,
  onView,
  isImporting,
}: CompactTableViewProps) {
  const [sortField, setSortField] = useState<SortField>('ai_score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * multiplier;
      }
      return ((aVal as number) - (bVal as number)) * multiplier;
    });
  }, [products, sortField, sortDirection]);

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      )}
    </button>
  );

  const getStockBadge = (status: string, quantity: number) => {
    switch (status) {
      case 'in_stock':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            {quantity}
          </Badge>
        );
      case 'low_stock':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {quantity}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-xs">
            <Package className="h-3 w-3 mr-1" />
            0
          </Badge>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[40px]">
              <Checkbox
                checked={selectedProducts.size === products.length && products.length > 0}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead className="w-[60px]">Image</TableHead>
            <TableHead className="min-w-[200px]">
              <SortHeader field="name">Produit</SortHeader>
            </TableHead>
            <TableHead className="w-[100px] text-right">
              <SortHeader field="retail_price">Prix Vente</SortHeader>
            </TableHead>
            <TableHead className="w-[100px] text-right">
              <SortHeader field="cost_price">Prix Achat</SortHeader>
            </TableHead>
            <TableHead className="w-[100px] text-right">
              <SortHeader field="profit_margin">Marge</SortHeader>
            </TableHead>
            <TableHead className="w-[100px] text-center">
              <SortHeader field="ai_score">Score IA</SortHeader>
            </TableHead>
            <TableHead className="w-[100px] text-center">
              <SortHeader field="stock_quantity">Stock</SortHeader>
            </TableHead>
            <TableHead className="w-[100px] text-center">
              <SortHeader field="orders_count">Ventes</SortHeader>
            </TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {sortedProducts.map((product, index) => {
              const aiScorePercent = Math.round(product.ai_score * 100);
              const isSelected = selectedProducts.has(product.id);
              const isFav = favorites.has(product.id);

              return (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "group hover:bg-muted/50 transition-colors",
                    isSelected && "bg-primary/5"
                  )}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onSelect(product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      {product.is_winner && (
                        <div className="absolute -top-0.5 -right-0.5">
                          <Crown className="h-3 w-3 text-amber-500 fill-amber-500" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate max-w-[180px]" title={product.name}>
                          {product.name}
                        </span>
                        {product.is_winner && (
                          <Badge className="bg-amber-500/10 text-amber-600 text-[10px] px-1">Winner</Badge>
                        )}
                        {product.is_trending && (
                          <Badge className="bg-purple-500/10 text-purple-600 text-[10px] px-1">
                            <TrendingUp className="h-2.5 w-2.5" />
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {product.supplier_name} • {product.sku}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {product.retail_price.toFixed(2)}€
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {product.cost_price.toFixed(2)}€
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      +{product.profit_margin.toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Sparkles className={cn("h-3.5 w-3.5", getScoreColor(aiScorePercent))} />
                      <span className={cn("text-sm font-medium", getScoreColor(aiScorePercent))}>
                        {aiScorePercent}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStockBadge(product.stock_status, product.stock_quantity)}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {product.orders_count.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onFavorite(product.id)}
                      >
                        <Heart className={cn(
                          "h-3.5 w-3.5",
                          isFav && "fill-red-500 text-red-500"
                        )} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onView(product)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => onImport(product.id)}
                        disabled={isImporting}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Import
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
});
