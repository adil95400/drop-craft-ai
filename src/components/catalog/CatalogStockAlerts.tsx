/**
 * Stock Alerts Banner — alerte stock faible / rupture inline dans le catalogue
 */
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, PackageX, ChevronDown, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  sku?: string | null;
  stock_quantity?: number | null;
  price: number;
  cost_price?: number | null;
  supplier_name?: string | null;
}

interface CatalogStockAlertsProps {
  products: Product[];
  onSelectProducts: (ids: string[]) => void;
  onOpenAutoOrder: () => void;
}

export function CatalogStockAlerts({ products, onSelectProducts, onOpenAutoOrder }: CatalogStockAlertsProps) {
  const [expanded, setExpanded] = useState(false);

  const { outOfStock, lowStock } = useMemo(() => {
    const outOfStock = products.filter(p => (p.stock_quantity ?? 0) === 0);
    const lowStock = products.filter(p => {
      const qty = p.stock_quantity ?? 0;
      return qty > 0 && qty < 10;
    });
    return { outOfStock, lowStock };
  }, [products]);

  const totalAlerts = outOfStock.length + lowStock.length;
  if (totalAlerts === 0) return null;

  const handleReorder = (items: Product[]) => {
    onSelectProducts(items.map(p => p.id));
    onOpenAutoOrder();
  };

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5">
      <button
        className="w-full flex items-center gap-3 p-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="h-8 w-8 rounded-md bg-destructive/10 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {outOfStock.length > 0 && (
              <span className="text-destructive">{outOfStock.length} en rupture</span>
            )}
            {outOfStock.length > 0 && lowStock.length > 0 && ' · '}
            {lowStock.length > 0 && (
              <span className="text-amber-600 dark:text-amber-400">{lowStock.length} stock faible</span>
            )}
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {outOfStock.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PackageX className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-xs font-medium text-destructive">Rupture de stock</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => handleReorder(outOfStock)}
                    >
                      <ShoppingCart className="h-3 w-3" />
                      Réapprovisionner ({outOfStock.length})
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {outOfStock.slice(0, 8).map(p => (
                      <Badge key={p.id} variant="destructive" className="text-[10px] font-normal max-w-[200px] truncate">
                        {p.name}
                      </Badge>
                    ))}
                    {outOfStock.length > 8 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{outOfStock.length - 8} autres
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {lowStock.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Stock faible (&lt;10)</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => handleReorder(lowStock)}
                    >
                      <ShoppingCart className="h-3 w-3" />
                      Commander ({lowStock.length})
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {lowStock.slice(0, 8).map(p => (
                      <Badge key={p.id} variant="outline" className="text-[10px] font-normal border-amber-300 text-amber-700 dark:text-amber-300 max-w-[200px] truncate">
                        {p.name} ({p.stock_quantity})
                      </Badge>
                    ))}
                    {lowStock.length > 8 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{lowStock.length - 8} autres
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
