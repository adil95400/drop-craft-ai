import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useCJConnector, CJProduct } from '@/hooks/useCJConnector';
import { Search, Download, Loader2, AlertTriangle, ExternalLink, Package } from 'lucide-react';

export const CJConnector = () => {
  const { products, total, isLoading, setupRequired, searchProducts, importProducts } = useCJConnector();
  const [keyword, setKeyword] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const handleSearch = () => {
    if (!keyword.trim()) return;
    setPage(1);
    setSelectedIds(new Set());
    searchProducts({ keyword: keyword.trim(), pageNum: 1, pageSize: 20 });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) return;
    await importProducts(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  if (setupRequired) {
    return (
      <Card className="border-border bg-muted/50">
        <CardContent className="p-6 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-accent-foreground mx-auto" />
          <h3 className="text-lg font-semibold">Configuration requise</h3>
          <p className="text-sm text-muted-foreground">
            Le token API CJ Dropshipping n'est pas encore configuré.<br />
            Ajoutez <code className="bg-muted px-1 rounded">CJ_ACCESS_TOKEN</code> dans vos secrets.
          </p>
          <Button variant="outline" asChild>
            <a href="https://developers.cjdropshipping.com/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Obtenir votre token API
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="w-4 h-4" />
            Rechercher sur CJ Dropshipping
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Mots-clés (ex: phone case, LED light...)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading || !keyword.trim()}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {products.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} résultats — {selectedIds.size} sélectionné(s)
          </p>
          <Button onClick={handleImport} disabled={selectedIds.size === 0 || isLoading} size="sm">
            <Download className="w-4 h-4 mr-1" />
            Importer {selectedIds.size > 0 && `(${selectedIds.size})`}
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && products.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <CJProductCard
            key={product.pid}
            product={product}
            selected={selectedIds.has(product.pid)}
            onToggle={() => toggleSelect(product.pid)}
          />
        ))}
      </div>

      {/* Pagination */}
      {products.length >= 20 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              searchProducts({ keyword, pageNum: nextPage, pageSize: 20 });
            }}
            disabled={isLoading}
          >
            Charger plus
          </Button>
        </div>
      )}
    </div>
  );
};

function CJProductCard({ product, selected, onToggle }: { product: CJProduct; selected: boolean; onToggle: () => void }) {
  return (
    <Card className={`overflow-hidden transition-all ${selected ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
      <div className="relative">
        <img
          src={product.productImage || '/placeholder.svg'}
          alt={product.productNameEn}
          className="w-full h-44 object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 left-2">
          <Checkbox checked={selected} onCheckedChange={onToggle} />
        </div>
        {product.categoryName && (
          <Badge className="absolute top-2 right-2 bg-background/80 text-foreground text-xs">
            {product.categoryName}
          </Badge>
        )}
      </div>
      <CardContent className="p-3 space-y-2">
        <p className="text-sm font-medium line-clamp-2 leading-tight">{product.productNameEn}</p>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-primary">
            ${product.sellPrice?.toFixed(2) || '0.00'}
          </span>
          {product.productWeight && (
            <span className="text-xs text-muted-foreground">
              {product.productWeight}g
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" asChild>
            <a href={`https://cjdropshipping.com/product-p-${product.pid}.html`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 mr-1" />
              Voir
            </a>
          </Button>
          <Button variant={selected ? 'default' : 'outline'} size="sm" className="h-7 text-xs flex-1" onClick={onToggle}>
            {selected ? '✓ Sélectionné' : 'Sélectionner'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
