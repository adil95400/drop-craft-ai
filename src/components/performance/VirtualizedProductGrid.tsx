import { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Eye } from 'lucide-react';
import { LazyImage } from './LazyImage';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  handle?: string;
  inStock?: boolean;
}

interface VirtualizedProductGridProps {
  products: Product[];
  columns?: number;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  className?: string;
  rowHeight?: number;
  gap?: number;
}

export const VirtualizedProductGrid = ({
  products,
  columns = 4,
  onProductClick,
  onAddToCart,
  className,
  rowHeight = 380,
  gap = 16
}: VirtualizedProductGridProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate rows based on products and columns
  const rowCount = Math.ceil(products.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => rowHeight + gap, [rowHeight, gap]),
    overscan: 2
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const calculateDiscount = (price: number, compareAt: number) => {
    return Math.round(((compareAt - price) / compareAt) * 100);
  };

  return (
    <div
      ref={parentRef}
      className={cn('h-[600px] overflow-auto', className)}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowProducts = products.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${rowHeight}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <div
                className="grid h-full"
                style={{
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gap: `${gap}px`
                }}
              >
                {rowProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300"
                    onClick={() => onProductClick?.(product)}
                  >
                    <div className="relative">
                      <LazyImage
                        src={product.imageUrl || '/placeholder.svg'}
                        alt={product.title}
                        aspectRatio="square"
                        className="w-full"
                      />

                      {/* Discount badge */}
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <Badge className="absolute top-2 left-2 bg-destructive">
                          -{calculateDiscount(product.price, product.compareAtPrice)}%
                        </Badge>
                      )}

                      {/* Out of stock */}
                      {product.inStock === false && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <Badge variant="secondary">Rupture de stock</Badge>
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            onProductClick?.(product);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart?.(product);
                          }}
                          disabled={product.inStock === false}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                    </div>

                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">
                          {formatPrice(product.price)}
                        </span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Empty cells for incomplete rows */}
                {Array.from({ length: columns - rowProducts.length }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
