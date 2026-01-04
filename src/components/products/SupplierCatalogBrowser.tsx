import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSupplierCatalog, useImportToMyProducts, useSyncSupplierCatalog, CatalogProduct } from '@/hooks/useSupplierCatalog';
import { Package, Search, RefreshCw, Download, Loader2, Check, ImageOff } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function SupplierCatalogBrowser() {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: products = [], isLoading } = useSupplierCatalog('B2B Sports Wholesale');
  const importMutation = useImportToMyProducts();
  const syncMutation = useSyncSupplierCatalog();

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const handleImport = async () => {
    await importMutation.mutateAsync(selectedIds);
    setSelectedIds([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">Catalogue</span> B2B Sports
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Catalogue B2B Sports Wholesale
          </DialogTitle>
          <DialogDescription>
            Parcourez le catalogue et importez les produits dans votre boutique.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 py-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
              onCheckedChange={selectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} sélectionné(s) sur {filteredProducts.length}
            </span>
          </div>
          <Badge variant="secondary">{products.length} produits</Badge>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {products.length === 0 
                  ? 'Aucun produit dans le catalogue. Cliquez sur le bouton refresh pour synchroniser.'
                  : 'Aucun produit ne correspond à votre recherche.'}
              </p>
              {products.length === 0 && (
                <Button 
                  onClick={() => syncMutation.mutate()} 
                  className="mt-4"
                  disabled={syncMutation.isPending}
                >
                  {syncMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Synchroniser le catalogue
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-1">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isSelected={selectedIds.includes(product.id)}
                  onToggle={() => toggleSelect(product.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fermer
          </Button>
          <Button 
            onClick={handleImport}
            disabled={selectedIds.length === 0 || importMutation.isPending}
            className="gap-2"
          >
            {importMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Importer {selectedIds.length > 0 && `(${selectedIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductCard({ 
  product, 
  isSelected, 
  onToggle 
}: { 
  product: CatalogProduct; 
  isSelected: boolean; 
  onToggle: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      onClick={onToggle}
    >
      <CardContent className="p-3">
        <div className="flex gap-3">
          <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
            {product.image_url && !imgError ? (
              <img
                src={product.image_url}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageOff className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            {isSelected && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <Check className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{product.title}</h4>
            <p className="text-xs text-muted-foreground truncate">
              {product.brand} • {product.sku}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-semibold text-sm">
                {formatCurrency(product.price || 0)}
              </span>
              {product.cost_price && (
                <span className="text-xs text-muted-foreground">
                  Coût: {formatCurrency(product.cost_price)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-2 pt-0 flex gap-1">
        <Badge variant="outline" className="text-xs">{product.category}</Badge>
        <Badge variant={product.stock_quantity > 0 ? 'secondary' : 'destructive'} className="text-xs">
          Stock: {product.stock_quantity}
        </Badge>
      </CardFooter>
    </Card>
  );
}
