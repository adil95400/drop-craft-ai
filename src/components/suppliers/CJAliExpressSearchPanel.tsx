import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Package, 
  RefreshCw, 
  ShoppingCart,
  Check,
  AlertCircle,
  ExternalLink,
  Filter
} from 'lucide-react';
import { useCJAliExpressConnector, useSupplierConnectionStatus } from '@/hooks/useCJAliExpressConnector';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  stock?: number;
}

export function CJAliExpressSearchPanel() {
  const [activeSupplier, setActiveSupplier] = useState<'cj' | 'aliexpress'>('cj');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  
  const cjConnector = useCJAliExpressConnector('cj');
  const aeConnector = useCJAliExpressConnector('aliexpress');
  const { data: cjStatus } = useSupplierConnectionStatus('cj');
  const { data: aeStatus } = useSupplierConnectionStatus('aliexpress');

  const connector = activeSupplier === 'cj' ? cjConnector : aeConnector;
  const isConnected = activeSupplier === 'cj' ? cjStatus?.connected : aeStatus?.connected;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const result = await connector.searchProducts({ keyword: searchQuery, pageSize: 20 });
      setSearchResults(result.products?.map((p: any) => ({
        id: p.pid || p.product_id || p.id,
        name: p.productNameEn || p.title || p.name,
        price: parseFloat(p.sellPrice || p.price || '0'),
        image: p.productImage || p.image_url || p.image,
        category: p.categoryName || p.category,
        stock: p.inventory || p.stock || 0,
      })) || []);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleSync = async () => {
    // This would require a supplier_id - in a real implementation
    // you'd select which supplier to sync to
    await connector.syncProductsAsync({ supplier_id: 'default', limit: 50 });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recherche Fournisseurs</CardTitle>
            <CardDescription>
              CJ Dropshipping & AliExpress - API intégrée
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <ConnectionBadge supplier="CJ" connected={cjStatus?.connected || false} />
            <ConnectionBadge supplier="AE" connected={aeStatus?.connected || false} />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeSupplier} onValueChange={(v) => setActiveSupplier(v as 'cj' | 'aliexpress')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="cj" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              CJ Dropshipping
            </TabsTrigger>
            <TabsTrigger value="aliexpress" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              AliExpress
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeSupplier} className="space-y-4">
            {!isConnected ? (
              <div className="p-6 text-center border rounded-lg bg-muted/50">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">
                  {activeSupplier === 'cj' ? 'CJ Dropshipping' : 'AliExpress'} non connecté
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connectez votre compte pour rechercher et importer des produits
                </p>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Configurer la connexion
                </Button>
              </div>
            ) : (
              <>
                {/* Search Bar */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher des produits..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={connector.isSearching}>
                    {connector.isSearching ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>

                {/* Results */}
                <ScrollArea className="h-[400px]">
                  {searchResults.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Recherchez des produits pour les importer</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {searchResults.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onImport={() => {
                            // Import logic would go here
                          }}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Sync Button */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {searchResults.length} produits trouvés
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handleSync}
                    disabled={connector.isSyncing}
                  >
                    {connector.isSyncing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Synchroniser catalogue
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ConnectionBadge({ supplier, connected }: { supplier: string; connected: boolean }) {
  return (
    <Badge variant={connected ? 'default' : 'secondary'} className="text-xs">
      {supplier}: {connected ? 'Connecté' : 'Non connecté'}
    </Badge>
  );
}

function ProductCard({ product, onImport }: { product: Product; onImport: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <img
        src={product.image || '/placeholder.svg'}
        alt={product.name}
        className="w-16 h-16 object-cover rounded"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm line-clamp-2">{product.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            €{product.price.toFixed(2)}
          </Badge>
          {product.category && (
            <span className="text-xs text-muted-foreground">{product.category}</span>
          )}
        </div>
      </div>
      <Button size="sm" onClick={onImport}>
        <ShoppingCart className="h-4 w-4 mr-1" />
        Importer
      </Button>
    </div>
  );
}
