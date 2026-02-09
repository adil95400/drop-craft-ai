import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAmazonConnector, AmazonProduct } from '@/hooks/useAmazonConnector';
import { Search, Download, Loader2, AlertTriangle, ExternalLink, Star } from 'lucide-react';

const CATEGORIES = [
  { value: 'All', label: 'Toutes catégories' },
  { value: 'Electronics', label: 'Électronique' },
  { value: 'HomeAndKitchen', label: 'Maison & Cuisine' },
  { value: 'Fashion', label: 'Mode' },
  { value: 'Beauty', label: 'Beauté' },
  { value: 'SportsAndOutdoors', label: 'Sports' },
  { value: 'ToysAndGames', label: 'Jouets' },
  { value: 'OfficeProducts', label: 'Bureau' },
];

const MARKETPLACES = [
  { value: 'www.amazon.fr', label: '🇫🇷 Amazon.fr' },
  { value: 'www.amazon.com', label: '🇺🇸 Amazon.com' },
  { value: 'www.amazon.de', label: '🇩🇪 Amazon.de' },
  { value: 'www.amazon.co.uk', label: '🇬🇧 Amazon.co.uk' },
  { value: 'www.amazon.es', label: '🇪🇸 Amazon.es' },
  { value: 'www.amazon.it', label: '🇮🇹 Amazon.it' },
];

export const AmazonConnector = () => {
  const { products, total, isLoading, setupRequired, searchProducts, importProducts } = useAmazonConnector();
  const [keywords, setKeywords] = useState('');
  const [category, setCategory] = useState('All');
  const [marketplace, setMarketplace] = useState('www.amazon.fr');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const handleSearch = () => {
    if (!keywords.trim()) return;
    setPage(1);
    setSelectedIds(new Set());
    searchProducts({ keywords: keywords.trim(), category, marketplace, pageNum: 1 });
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
            Les clés Amazon PA-API ne sont pas encore configurées.<br />
            Ajoutez <code className="bg-muted px-1 rounded">AMAZON_ACCESS_KEY</code>,{' '}
            <code className="bg-muted px-1 rounded">AMAZON_SECRET_KEY</code> et{' '}
            <code className="bg-muted px-1 rounded">AMAZON_PARTNER_TAG</code> dans vos secrets.
          </p>
          <Button variant="outline" asChild>
            <a href="https://affiliate-program.amazon.com/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Programme Amazon Associates
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
            Rechercher sur Amazon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Mots-clés (ex: wireless charger, kitchen gadget...)"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading || !keywords.trim()}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={marketplace} onValueChange={setMarketplace}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MARKETPLACES.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <AmazonProductCard
            key={product.asin}
            product={product}
            selected={selectedIds.has(product.asin)}
            onToggle={() => toggleSelect(product.asin)}
          />
        ))}
      </div>

      {/* Pagination */}
      {products.length >= 10 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              searchProducts({ keywords, category, marketplace, pageNum: nextPage });
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

function AmazonProductCard({ product, selected, onToggle }: { product: AmazonProduct; selected: boolean; onToggle: () => void }) {
  const discount = product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  return (
    <Card className={`overflow-hidden transition-all ${selected ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
      <div className="relative">
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.title}
          className="w-full h-44 object-contain bg-background p-2"
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
        {product.brand && (
          <p className="text-xs text-muted-foreground">{product.brand}</p>
        )}
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-primary">
            {product.price.toFixed(2)} {product.currency}
          </span>
          {product.original_price > product.price && (
            <span className="text-xs text-muted-foreground line-through">
              {product.original_price.toFixed(2)}
            </span>
          )}
        </div>
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
