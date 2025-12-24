import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Link,
  Download,
  Package,
  Star,
  Truck,
  Plus,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import {
  useScrapeAliExpressProduct,
  useSearchAliExpressProducts,
  useBulkImportAliExpress,
  useAliExpressImportHistory,
  type AliExpressProduct
} from '@/hooks/useAliExpress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function AliExpressImporter() {
  const [singleUrl, setSingleUrl] = useState('');
  const [searchKeywords, setSearchKeywords] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [searchResults, setSearchResults] = useState<Partial<AliExpressProduct>[]>([]);
  const [scrapedProduct, setScrapedProduct] = useState<AliExpressProduct | null>(null);

  const scrapeProduct = useScrapeAliExpressProduct();
  const searchProducts = useSearchAliExpressProducts();
  const bulkImport = useBulkImportAliExpress();
  const { data: importHistory, isLoading: loadingHistory } = useAliExpressImportHistory();

  const handleSingleImport = async () => {
    if (!singleUrl.trim()) return;
    try {
      const result = await scrapeProduct.mutateAsync(singleUrl);
      setScrapedProduct(result.product);
      setSingleUrl('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSearch = async () => {
    if (!searchKeywords.trim()) return;
    try {
      const result = await searchProducts.mutateAsync({ keywords: searchKeywords });
      setSearchResults(result.products);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleBulkImport = async () => {
    const urls = bulkUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.startsWith('http'));

    if (urls.length === 0) return;

    try {
      await bulkImport.mutateAsync(urls);
      setBulkUrls('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Import AliExpress</h2>
        <p className="text-muted-foreground">
          Importez des produits depuis AliExpress par URL ou recherche
        </p>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">
            <Link className="h-4 w-4 mr-2" />
            Import URL
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Recherche
          </TabsTrigger>
          <TabsTrigger value="bulk">
            <Package className="h-4 w-4 mr-2" />
            Import en masse
          </TabsTrigger>
        </TabsList>

        {/* Single URL Import */}
        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Importer par URL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://www.aliexpress.com/item/123456.html"
                  value={singleUrl}
                  onChange={(e) => setSingleUrl(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSingleImport}
                  disabled={scrapeProduct.isPending || !singleUrl.trim()}
                >
                  {scrapeProduct.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Importer
                </Button>
              </div>

              {scrapedProduct && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {scrapedProduct.image_urls[0] && (
                        <img 
                          src={scrapedProduct.image_urls[0]} 
                          alt={scrapedProduct.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 space-y-2">
                        <h3 className="font-medium line-clamp-2">{scrapedProduct.title}</h3>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-bold text-lg text-primary">
                            ${scrapedProduct.price.toFixed(2)}
                          </span>
                          {scrapedProduct.original_price > scrapedProduct.price && (
                            <span className="line-through text-muted-foreground">
                              ${scrapedProduct.original_price.toFixed(2)}
                            </span>
                          )}
                          {scrapedProduct.discount_rate > 0 && (
                            <Badge variant="destructive">-{scrapedProduct.discount_rate}%</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {scrapedProduct.rating > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {scrapedProduct.rating}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {scrapedProduct.shipping_time}
                          </span>
                          <Badge variant="outline">{scrapedProduct.category}</Badge>
                        </div>
                      </div>
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rechercher des produits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: wireless earbuds, phone case, LED lights..."
                  value={searchKeywords}
                  onChange={(e) => setSearchKeywords(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  onClick={handleSearch}
                  disabled={searchProducts.isPending || !searchKeywords.trim()}
                >
                  {searchProducts.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {searchResults.map((product, index) => (
                      <Card key={product.product_id || index} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm line-clamp-1">
                              {product.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              {product.price && product.price > 0 && (
                                <span className="font-bold text-primary">
                                  ${product.price.toFixed(2)}
                                </span>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {product.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => window.open(product.source_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => {
                                if (product.source_url) {
                                  scrapeProduct.mutate(product.source_url);
                                }
                              }}
                              disabled={scrapeProduct.isPending}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Import */}
        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Import en masse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Collez les URLs AliExpress (une par ligne, max 10)
                </p>
                <Textarea
                  placeholder="https://www.aliexpress.com/item/123.html&#10;https://www.aliexpress.com/item/456.html&#10;https://www.aliexpress.com/item/789.html"
                  value={bulkUrls}
                  onChange={(e) => setBulkUrls(e.target.value)}
                  rows={6}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {bulkUrls.split('\n').filter(url => url.trim().startsWith('http')).length} URLs détectées
                </span>
                <Button 
                  onClick={handleBulkImport}
                  disabled={bulkImport.isPending}
                >
                  {bulkImport.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Importer tout
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique des imports</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : importHistory && importHistory.length > 0 ? (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {importHistory.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={item.status === 'draft' ? 'secondary' : 'default'}>
                        {item.status}
                      </Badge>
                      <span className="text-sm truncate max-w-[300px]">
                        {item.source_url}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>${item.price?.toFixed(2) || '0.00'}</span>
                      <span>{new Date(item.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucun import AliExpress</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
