import { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image, Search, CheckSquare, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ProductWithImageCount {
  id: string;
  title: string;
  image_url: string | null;
  images: string[];
  supplier_url: string | null;
  imageCount: number;
}

interface ImageAuditProductListProps {
  products: ProductWithImageCount[];
  selectedProducts: string[];
  onToggleProduct: (id: string) => void;
  onToggleAll: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loading?: boolean;
}

const getImageBadge = (count: number) => {
  if (count === 0) return <Badge variant="destructive" className="text-xs">0</Badge>;
  if (count === 1) return <Badge className="bg-orange-500/20 text-orange-600 text-xs">1</Badge>;
  if (count === 2) return <Badge className="bg-yellow-500/20 text-yellow-600 text-xs">2</Badge>;
  return <Badge className="bg-green-500/20 text-green-600 text-xs">{count}</Badge>;
};

export function ImageAuditProductList({
  products,
  selectedProducts,
  onToggleProduct,
  onToggleAll,
  searchQuery,
  onSearchChange,
  loading
}: ImageAuditProductListProps) {
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.title.toLowerCase().includes(query) ||
      p.supplier_url?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const displayedProducts = filteredProducts.slice(0, 200);
  const allSelected = displayedProducts.length > 0 && displayedProducts.every(p => selectedProducts.includes(p.id));

  const handleRowClick = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleProduct(id);
  }, [onToggleProduct]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-muted rounded-lg" />
            <div className="h-4 w-48 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <CardTitle className="flex items-center gap-2 flex-1">
            <Image className="h-5 w-5 text-primary" />
            Produits ({filteredProducts.length})
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleAll}
              className="whitespace-nowrap"
            >
              {allSelected ? <CheckSquare className="h-4 w-4 mr-1" /> : <Square className="h-4 w-4 mr-1" />}
              {allSelected ? 'Désél.' : 'Tout'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucun produit dans cette catégorie</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
            {displayedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.01, 0.5) }}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all",
                  "hover:bg-muted/50 hover:border-primary/30",
                  selectedProducts.includes(product.id) && "bg-primary/5 border-primary/50"
                )}
                onClick={(e) => handleRowClick(product.id, e)}
              >
                <Checkbox 
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => onToggleProduct(product.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt="" 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Image className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{product.title}</div>
                  {product.supplier_url && (
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {new URL(product.supplier_url).hostname.replace('www.', '')}
                    </div>
                  )}
                </div>
                
                {getImageBadge(product.imageCount)}
              </motion.div>
            ))}
            
            {filteredProducts.length > 200 && (
              <div className="text-center py-3 text-sm text-muted-foreground border-t mt-2">
                + {filteredProducts.length - 200} autres produits
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
