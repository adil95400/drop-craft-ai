import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Store, Package, ShoppingCart, Users, RefreshCw, Upload, Download,
  FileText, Check, X, Loader2, Search, Filter, ArrowUpDown, Eye,
  Edit, Trash2, Link, ExternalLink, Image as ImageIcon, Sparkles
} from 'lucide-react';
import { useConnectedStores } from '@/hooks/useConnectedStores';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Shopify API config
const SHOPIFY_STORE_PERMANENT_DOMAIN = 'drop-craft-ai-9874g.myshopify.com';
const SHOPIFY_API_VERSION = '2025-07';
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
const SHOPIFY_STOREFRONT_TOKEN = '9e33316887e1b93d1bdcca1d8344d104';

interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string | null;
      };
    }>;
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: { amount: string; currencyCode: string };
        availableForSale: boolean;
        inventoryQuantity?: number;
      };
    }>;
  };
}

async function storefrontApiRequest(query: string, variables: Record<string, unknown> = {}) {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 402) {
    toast.error("Shopify: Paiement requis", {
      description: "Votre boutique Shopify nécessite un plan payant actif."
    });
    return null;
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Erreur Shopify: ${data.errors.map((e: { message: string }) => e.message).join(', ')}`);
  }

  return data;
}

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          description
          handle
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 5) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
              }
            }
          }
        }
      }
    }
  }
`;

export function ShopifyContentSync() {
  const { stores, loading: storesLoading, syncStore, refreshStores } = useConnectedStores();
  const [activeTab, setActiveTab] = useState('stores');
  const [shopifyProducts, setShopifyProducts] = useState<ShopifyProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncOptions, setSyncOptions] = useState({
    syncStock: true,
    syncPrices: true,
    syncDescriptions: true,
    syncImages: true,
    autoSync: false,
    syncInterval: '1h'
  });
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishContent, setPublishContent] = useState({
    type: 'article',
    title: '',
    content: '',
    targetStore: '',
    metaTitle: '',
    metaDescription: ''
  });

  // Fetch Shopify products
  const fetchShopifyProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await storefrontApiRequest(PRODUCTS_QUERY, { first: 50 });
      if (data?.data?.products?.edges) {
        setShopifyProducts(data.data.products.edges.map((edge: { node: ShopifyProduct }) => edge.node));
        toast.success(`${data.data.products.edges.length} produits récupérés`);
      }
    } catch (error) {
      console.error('Error fetching Shopify products:', error);
      toast.error('Erreur lors de la récupération des produits');
    } finally {
      setLoadingProducts(false);
    }
  };

  // Import selected products to local database
  const importProducts = async () => {
    if (selectedProducts.length === 0) {
      toast.warning('Sélectionnez au moins un produit');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const productsToImport = shopifyProducts
        .filter(p => selectedProducts.includes(p.id))
        .map(p => ({
          user_id: user.id,
          title: p.title,
          description: p.description,
          sku: p.handle,
          sale_price: parseFloat(p.priceRange.minVariantPrice.amount),
          currency: p.priceRange.minVariantPrice.currencyCode,
          images: p.images.edges.map(img => img.node.url),
          source: 'shopify',
          source_id: p.id,
          status: 'active'
        }));

      const { error } = await supabase
        .from('products')
        .upsert(productsToImport as never[], { 
          onConflict: 'sku',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast.success(`${selectedProducts.length} produits importés avec succès`);
      setSelectedProducts([]);
    } catch (error) {
      console.error('Error importing products:', error);
      toast.error('Erreur lors de l\'importation');
    }
  };

  // Publish content to Shopify
  const publishToShopify = async () => {
    try {
      // This would typically call a Shopify Admin API endpoint
      // For now, we'll simulate the publish
      const { data, error } = await supabase.functions.invoke('shopify-publish-content', {
        body: {
          type: publishContent.type,
          title: publishContent.title,
          content: publishContent.content,
          metaTitle: publishContent.metaTitle,
          metaDescription: publishContent.metaDescription,
          storeId: publishContent.targetStore
        }
      });

      if (error) throw error;

      toast.success('Contenu publié sur Shopify');
      setPublishDialogOpen(false);
      setPublishContent({
        type: 'article',
        title: '',
        content: '',
        targetStore: '',
        metaTitle: '',
        metaDescription: ''
      });
    } catch (error) {
      console.error('Error publishing to Shopify:', error);
      toast.error('Erreur lors de la publication');
    }
  };

  // Sync all data
  const syncAllData = async (storeId: string) => {
    try {
      await syncStore(storeId);
      
      // Sync stock, orders, customers based on options
      if (syncOptions.syncStock) {
        await supabase.functions.invoke('shopify-sync-stock', {
          body: { storeId }
        });
      }

      toast.success('Synchronisation complète effectuée');
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erreur lors de la synchronisation');
    }
  };

  // Filter products
  const filteredProducts = shopifyProducts.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const connectedShopifyStores = stores.filter(s => s.platform_type === 'shopify' && s.connection_status === 'connected');
  const totalProducts = stores.reduce((sum, s) => sum + (s.products_count || 0), 0);
  const totalOrders = stores.reduce((sum, s) => sum + (s.orders_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Boutiques Connectées</p>
                <p className="text-2xl font-bold">{connectedShopifyStores.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Package className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produits Total</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commandes</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clients</p>
                <p className="text-2xl font-bold">--</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="stores" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Boutiques
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produits
          </TabsTrigger>
          <TabsTrigger value="publish" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Publier
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync
          </TabsTrigger>
        </TabsList>

        {/* Connected Stores Tab */}
        <TabsContent value="stores" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Boutiques Connectées</CardTitle>
                  <CardDescription>Gérez vos connexions e-commerce</CardDescription>
                </div>
                <Button variant="outline" onClick={refreshStores}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {storesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : stores.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune boutique connectée</p>
                  <Button className="mt-4" asChild>
                    <a href="/dashboard/stores/connect">Connecter une boutique</a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {stores.map(store => (
                    <div 
                      key={store.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{store.platform_name}</h4>
                          <p className="text-sm text-muted-foreground">{store.shop_domain}</p>
                        </div>
                        <Badge variant={
                          store.connection_status === 'connected' ? 'default' :
                          store.connection_status === 'syncing' ? 'secondary' :
                          'destructive'
                        }>
                          {store.connection_status === 'connected' ? 'Connecté' :
                           store.connection_status === 'syncing' ? 'Synchronisation...' :
                           'Erreur'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground mr-4">
                          <span className="font-medium">{store.products_count || 0}</span> produits •{' '}
                          <span className="font-medium">{store.orders_count || 0}</span> commandes
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => syncAllData(store.id)}
                          disabled={store.connection_status === 'syncing'}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${store.connection_status === 'syncing' ? 'animate-spin' : ''}`} />
                          Synchroniser
                        </Button>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Produits Shopify</CardTitle>
                  <CardDescription>Importez et gérez vos fiches produits</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={fetchShopifyProducts} disabled={loadingProducts}>
                    {loadingProducts ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Charger les produits
                  </Button>
                  {selectedProducts.length > 0 && (
                    <Button onClick={importProducts}>
                      <Upload className="h-4 w-4 mr-2" />
                      Importer ({selectedProducts.length})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search & Filter */}
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher des produits..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
              </div>

              {/* Products List */}
              <ScrollArea className="h-[400px]">
                {shopifyProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Cliquez sur "Charger les produits" pour récupérer vos produits Shopify</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Select All */}
                    <div className="flex items-center gap-2 p-2 border-b">
                      <Checkbox
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProducts(filteredProducts.map(p => p.id));
                          } else {
                            setSelectedProducts([]);
                          }
                        }}
                      />
                      <span className="text-sm font-medium">Tout sélectionner ({filteredProducts.length})</span>
                    </div>
                    
                    {filteredProducts.map(product => (
                      <div 
                        key={product.id}
                        className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProducts([...selectedProducts, product.id]);
                            } else {
                              setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                            }
                          }}
                        />
                        <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {product.images.edges[0] ? (
                            <img 
                              src={product.images.edges[0].node.url} 
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{product.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {product.description?.slice(0, 100) || 'Pas de description'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">
                              {product.priceRange.minVariantPrice.currencyCode} {product.priceRange.minVariantPrice.amount}
                            </Badge>
                            <Badge variant="secondary">
                              {product.variants.edges.length} variante(s)
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Publish Tab */}
        <TabsContent value="publish" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Publier du Contenu</CardTitle>
              <CardDescription>Publiez des articles, descriptions ou pages sur vos boutiques</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type de contenu</Label>
                  <Select 
                    value={publishContent.type} 
                    onValueChange={v => setPublishContent({...publishContent, type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">Article de blog</SelectItem>
                      <SelectItem value="page">Page</SelectItem>
                      <SelectItem value="product_description">Description produit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Boutique cible</Label>
                  <Select 
                    value={publishContent.targetStore} 
                    onValueChange={v => setPublishContent({...publishContent, targetStore: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une boutique" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.filter(s => s.connection_status === 'connected').map(store => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.platform_name} - {store.shop_domain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  placeholder="Titre de votre contenu..."
                  value={publishContent.title}
                  onChange={e => setPublishContent({...publishContent, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Contenu</Label>
                <Textarea
                  placeholder="Rédigez votre contenu ici..."
                  value={publishContent.content}
                  onChange={e => setPublishContent({...publishContent, content: e.target.value})}
                  rows={8}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meta Title (SEO)</Label>
                  <Input
                    placeholder="Titre SEO..."
                    value={publishContent.metaTitle}
                    onChange={e => setPublishContent({...publishContent, metaTitle: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meta Description (SEO)</Label>
                  <Input
                    placeholder="Description SEO..."
                    value={publishContent.metaDescription}
                    onChange={e => setPublishContent({...publishContent, metaDescription: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={publishToShopify} disabled={!publishContent.title || !publishContent.targetStore}>
                  <Upload className="h-4 w-4 mr-2" />
                  Publier sur Shopify
                </Button>
                <Button variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer avec IA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Tab */}
        <TabsContent value="sync" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Options de Synchronisation</CardTitle>
                <CardDescription>Configurez ce qui doit être synchronisé</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Synchroniser les stocks</Label>
                    <p className="text-sm text-muted-foreground">Mettre à jour les quantités en inventaire</p>
                  </div>
                  <Switch 
                    checked={syncOptions.syncStock}
                    onCheckedChange={v => setSyncOptions({...syncOptions, syncStock: v})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Synchroniser les prix</Label>
                    <p className="text-sm text-muted-foreground">Mettre à jour les prix des produits</p>
                  </div>
                  <Switch 
                    checked={syncOptions.syncPrices}
                    onCheckedChange={v => setSyncOptions({...syncOptions, syncPrices: v})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Synchroniser les descriptions</Label>
                    <p className="text-sm text-muted-foreground">Mettre à jour les titres et descriptions</p>
                  </div>
                  <Switch 
                    checked={syncOptions.syncDescriptions}
                    onCheckedChange={v => setSyncOptions({...syncOptions, syncDescriptions: v})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Synchroniser les images</Label>
                    <p className="text-sm text-muted-foreground">Mettre à jour les images produits</p>
                  </div>
                  <Switch 
                    checked={syncOptions.syncImages}
                    onCheckedChange={v => setSyncOptions({...syncOptions, syncImages: v})}
                  />
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Synchronisation automatique</Label>
                      <p className="text-sm text-muted-foreground">Synchroniser périodiquement</p>
                    </div>
                    <Switch 
                      checked={syncOptions.autoSync}
                      onCheckedChange={v => setSyncOptions({...syncOptions, autoSync: v})}
                    />
                  </div>
                  {syncOptions.autoSync && (
                    <div className="mt-4">
                      <Label>Intervalle</Label>
                      <Select 
                        value={syncOptions.syncInterval}
                        onValueChange={v => setSyncOptions({...syncOptions, syncInterval: v})}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15m">Toutes les 15 minutes</SelectItem>
                          <SelectItem value="1h">Toutes les heures</SelectItem>
                          <SelectItem value="6h">Toutes les 6 heures</SelectItem>
                          <SelectItem value="24h">Toutes les 24 heures</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historique de Synchronisation</CardTitle>
                <CardDescription>Dernières synchronisations effectuées</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {stores.filter(s => s.last_sync_at).slice(0, 5).map((store, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            store.connection_status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
                          }`} />
                          <div>
                            <p className="font-medium text-sm">{store.platform_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {store.last_sync_at ? new Date(store.last_sync_at).toLocaleString('fr-FR') : 'Jamais'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={store.connection_status === 'connected' ? 'default' : 'secondary'}>
                          {store.connection_status === 'connected' ? 'Succès' : 'En cours'}
                        </Badge>
                      </div>
                    ))}
                    {stores.filter(s => s.last_sync_at).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Aucune synchronisation récente</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
