import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAliExpressConnector, AliExpressProduct } from '@/hooks/useAliExpressConnector';
import { Search, TrendingUp, Download, Loader2, AlertTriangle, ExternalLink, Star } from 'lucide-react';

export const AliExpressConnector = () => {
  const { products, total, isLoading, setupRequired, searchProducts, getHotProducts, importProducts } = useAliExpressConnector();
  const [keywords, setKeywords] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('SALE_PRICE_ASC');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const handleSearch = () => {
    if (!keywords.trim()) return;
    setPage(1);
    setSelectedIds(new Set());
    searchProducts({
      keywords: keywords.trim(),
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      sort,
      pageNo: 1,
      pageSize: 20,
    });
  };

  const handleHotProducts = () => {
    setPage(1);
    setSelectedIds(new Set());
    getHotProducts({ pageSize: 20 });
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
            Les clés API AliExpress ne sont pas encore configurées.<br />
            Ajoutez <code className="bg-muted px-1 rounded">ALIEXPRESS_APP_KEY</code> et{' '}
            <code className="bg-muted px-1 rounded">ALIEXPRESS_APP_SECRET</code> dans vos secrets.
          </p>
          <Button variant="outline" asChild>
            <a href="https://portals.aliexpress.com/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Obtenir vos clés API
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="w-4 h-4" />
            Rechercher sur AliExpress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Mots-clés (ex: wireless earbuds, LED strip...)"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading || !keywords.trim()}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <Input
              placeholder="Prix min (€)"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-28"
            />
            <Input
              placeholder="Prix max (€)"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-28"
            />
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SALE_PRICE_ASC">Prix ↑</SelectItem>
                <SelectItem value="SALE_PRICE_DESC">Prix ↓</SelectItem>
                <SelectItem value="LAST_VOLUME_ASC">Ventes ↑</SelectItem>
                <SelectItem value="LAST_VOLUME_DESC">Ventes ↓</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleHotProducts} disabled={isLoading}>
              <TrendingUp className="w-4 h-4 mr-1" />
              Tendances
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions bar */}
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

      {/* Product Grid */}
      {isLoading && products.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.product_id}
            product={product}
            selected={selectedIds.has(product.product_id)}
            onToggle={() => toggleSelect(product.product_id)}
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
              searchProducts({ keywords, pageNo: nextPage, pageSize: 20, sort });
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

function ProductCard({
  product,
  selected,
  onToggle,
}: {
  product: AliExpressProduct;
  selected: boolean;
  onToggle: () => void;
}) {
  const discount = product.original_price > product.sale_price
    ? Math.round((1 - product.sale_price / product.original_price) * 100)
    : 0;

  return (
    <Card className={`overflow-hidden transition-all ${selected ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
      <div className="relative">
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.title}
          className="w-full h-44 object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 left-2">
          <Checkbox checked={selected} onCheckedChange={onToggle} />
        </div>
        {discount > 0 && (
          <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs">
            -{discount}%
          </Badge>
        )}
      </div>
      <CardContent className="p-3 space-y-2">
        <p className="text-sm font-medium line-clamp-2 leading-tight">{product.title}</p>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-primary">
            {product.sale_price.toFixed(2)} {product.currency}
          </span>
          {product.original_price > product.sale_price && (
            <span className="text-xs text-muted-foreground line-through">
              {product.original_price.toFixed(2)}
            </span>
          )}
        </div>
        {product.evaluate_rate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="w-3 h-3 fill-primary text-primary" />
            {product.evaluate_rate}
          </div>
        )}
        <div className="flex gap-1">
          {product.product_url && (
            <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" asChild>
              <a href={product.product_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 mr-1" />
                Voir
              </a>
            </Button>
          )}
          <Button variant={selected ? 'default' : 'outline'} size="sm" className="h-7 text-xs flex-1" onClick={onToggle}>
            {selected ? '✓ Sélectionné' : 'Sélectionner'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
