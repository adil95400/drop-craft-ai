import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Link as LinkIcon, Package, Star, Settings, History, CheckCircle2, XCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useImportHistory } from '@/hooks/useImportHistory';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ImportResult {
  url: string;
  success: boolean;
  product?: any;
  reviews?: any[];
  error?: string;
  platform?: string;
}

export const OneClickImportConfig: React.FC = () => {
  const [urls, setUrls] = useState('');
  const [importType, setImportType] = useState<'products' | 'reviews'>('products');
  const [autoPublish, setAutoPublish] = useState(true);
  const [priceMultiplier, setPriceMultiplier] = useState('1.5');
  const [loading, setLoading] = useState(false);
  const [lastResults, setLastResults] = useState<ImportResult[]>([]);
  
  // Options avancées
  const [pricingType, setPricingType] = useState<'fixed_multiplier' | 'fixed_margin' | 'tiered'>('fixed_multiplier');
  const [fixedMargin, setFixedMargin] = useState('10');
  const [roundPrice, setRoundPrice] = useState(true);
  const [importActualStock, setImportActualStock] = useState(true);
  const [fixedStock, setFixedStock] = useState('50');
  const [categoryMapping, setCategoryMapping] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const { data: importHistory, refetch: refetchHistory } = useImportHistory();

  const handleImport = async () => {
    if (!urls.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer au moins une URL',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setLastResults([]);

    try {
      const urlList = urls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const requestBody: any = {
        urls: urlList,
        importType,
        autoPublish,
        priceMultiplier: parseFloat(priceMultiplier) || 1.5,
      };

      // Ajouter les règles de pricing avancées
      if (importType === 'products') {
        requestBody.pricingRules = {
          type: pricingType,
          value: pricingType === 'fixed_margin' 
            ? parseFloat(fixedMargin) 
            : parseFloat(priceMultiplier),
          roundPrice,
        };

        requestBody.stockSettings = {
          importActualStock,
          fixedStock: !importActualStock ? parseInt(fixedStock) : undefined,
        };

        if (Object.keys(categoryMapping).length > 0) {
          requestBody.categoryMapping = categoryMapping;
        }
      }

      const { data, error } = await supabase.functions.invoke('extension-one-click-import', {
        body: requestBody,
      });

      if (error) throw error;

      if (data.success) {
        setLastResults(data.results || []);
        toast({
          title: 'Import réussi !',
          description: `${data.imported} ${importType} importé(s) avec succès${data.failed > 0 ? ` (${data.failed} échec(s))` : ''}`,
        });
        
        if (data.imported > 0) {
          setUrls('');
        }
        
        // Rafraîchir l'historique
        refetchHistory();
      } else {
        throw new Error(data.error || 'Erreur lors de l\'import');
      }
    } catch (error: any) {
      console.error('Erreur import:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Échec de l\'import',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform?: string) => {
    const platformMap: Record<string, string> = {
      aliexpress: '🛍️',
      amazon: '📦',
      ebay: '🔨',
      shopify: '🏪',
      generic: '🌐',
    };
    return platformMap[platform || 'generic'] || '🌐';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Import Multi-Plateformes en Un Clic
          </CardTitle>
          <CardDescription>
            Importez des produits ou des avis depuis AliExpress, Amazon, eBay, Shopify et plus encore
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="import">Import</TabsTrigger>
              <TabsTrigger value="advanced">Options avancées</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>

            {/* Onglet Import */}
            <TabsContent value="import" className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label>Type d'import</Label>
                <RadioGroup value={importType} onValueChange={(value: any) => setImportType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="products" id="products" />
                    <Label htmlFor="products" className="flex items-center gap-2 cursor-pointer">
                      <Package className="w-4 h-4" />
                      Produits
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="reviews" id="reviews" />
                    <Label htmlFor="reviews" className="flex items-center gap-2 cursor-pointer">
                      <Star className="w-4 h-4" />
                      Avis clients
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="urls">
                  URLs à importer (une par ligne)
                </Label>
                <Textarea
                  id="urls"
                  placeholder={`https://www.aliexpress.com/item/123456.html
https://www.amazon.com/dp/B08XYZ123
https://www.ebay.com/itm/789012
https://store.myshopify.com/products/example`}
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  <span>Supporté:</span>
                  <Badge variant="outline" className="gap-1">🛍️ AliExpress</Badge>
                  <Badge variant="outline" className="gap-1">📦 Amazon</Badge>
                  <Badge variant="outline" className="gap-1">🔨 eBay</Badge>
                  <Badge variant="outline" className="gap-1">🏪 Shopify</Badge>
                </div>
              </div>

              {importType === 'products' && (
                <>
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-publish">Publication automatique</Label>
                      <p className="text-sm text-muted-foreground">
                        Publier les produits immédiatement après import
                      </p>
                    </div>
                    <Switch
                      id="auto-publish"
                      checked={autoPublish}
                      onCheckedChange={setAutoPublish}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price-multiplier">Multiplicateur de prix</Label>
                    <Input
                      id="price-multiplier"
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={priceMultiplier}
                      onChange={(e) => setPriceMultiplier(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Prix de vente = Prix d'achat × {priceMultiplier} (Marge: {((parseFloat(priceMultiplier) - 1) * 100).toFixed(0)}%)
                    </p>
                  </div>
                </>
              )}

              <Button
                onClick={handleImport}
                disabled={loading || !urls.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Importer maintenant
                  </>
                )}
              </Button>

              {/* Résultats du dernier import */}
              {lastResults.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  <h4 className="font-semibold text-sm">Résultats de l'import</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {lastResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.success 
                            ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                            : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {result.success ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{getPlatformIcon(result.platform)}</span>
                              <p className="text-xs font-mono truncate text-muted-foreground">
                                {result.url}
                              </p>
                            </div>
                            {result.success ? (
                              <p className="text-sm">
                                {result.product && `✅ ${result.product.name} (${result.product.sku})`}
                                {result.reviews && `✅ ${result.reviews.length} avis importés`}
                              </p>
                            ) : (
                              <p className="text-sm text-red-600 dark:text-red-400">
                                ❌ {result.error}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Comment ça marche ?
                </h4>
                <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
                  <li>Copiez les URLs des produits depuis les marketplaces</li>
                  <li>Collez-les dans le champ ci-dessus (une URL par ligne)</li>
                  <li>Configurez vos options (prix, stock, catégories...)</li>
                  <li>Cliquez sur "Importer maintenant" - automatique ! 🚀</li>
                </ol>
              </div>
            </TabsContent>

            {/* Onglet Options avancées */}
            <TabsContent value="advanced" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configuration avancée
                  </h3>
                </div>

                {/* Règles de pricing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Règles de pricing intelligentes</CardTitle>
                    <CardDescription>Définissez comment calculer vos prix de vente</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Type de pricing</Label>
                      <Select value={pricingType} onValueChange={(value: any) => setPricingType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed_multiplier">Multiplicateur fixe</SelectItem>
                          <SelectItem value="fixed_margin">Marge fixe (€)</SelectItem>
                          <SelectItem value="tiered">Pricing par paliers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {pricingType === 'fixed_margin' && (
                      <div className="space-y-2">
                        <Label htmlFor="fixed-margin">Marge fixe (€)</Label>
                        <Input
                          id="fixed-margin"
                          type="number"
                          step="0.5"
                          min="0"
                          value={fixedMargin}
                          onChange={(e) => setFixedMargin(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Prix de vente = Prix d'achat + {fixedMargin}€
                        </p>
                      </div>
                    )}

                    {pricingType === 'tiered' && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm font-semibold mb-2">Paliers automatiques :</p>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Produits &lt; 10€ : Marge 150%</li>
                          <li>• Produits 10-50€ : Marge 100%</li>
                          <li>• Produits &gt; 50€ : Marge 50%</li>
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="round-price">Prix arrondis</Label>
                        <p className="text-sm text-muted-foreground">
                          Arrondir à X.99€ (ex: 19.99€)
                        </p>
                      </div>
                      <Switch
                        id="round-price"
                        checked={roundPrice}
                        onCheckedChange={setRoundPrice}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Gestion du stock */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Gestion du stock</CardTitle>
                    <CardDescription>Configurez comment gérer les quantités en stock</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="import-stock">Importer le stock réel</Label>
                        <p className="text-sm text-muted-foreground">
                          Utiliser les quantités des fournisseurs
                        </p>
                      </div>
                      <Switch
                        id="import-stock"
                        checked={importActualStock}
                        onCheckedChange={setImportActualStock}
                      />
                    </div>

                    {!importActualStock && (
                      <div className="space-y-2">
                        <Label htmlFor="fixed-stock">Stock fixe</Label>
                        <Input
                          id="fixed-stock"
                          type="number"
                          min="0"
                          value={fixedStock}
                          onChange={(e) => setFixedStock(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Tous les produits auront cette quantité en stock
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Configuration API */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Clés API (Optionnel)</CardTitle>
                    <CardDescription>
                      Pour un import optimal, configurez les clés API dans les secrets Supabase
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span>AliExpress API</span>
                        <Badge variant="outline">ALIEXPRESS_API_KEY</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span>Amazon PA-API</span>
                        <Badge variant="outline">AMAZON_ACCESS_KEY</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span>eBay Shopping API</span>
                        <Badge variant="outline">EBAY_API_KEY</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        💡 Sans les clés API, le système utilise des données simulées pour le développement
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Onglet Historique */}
            <TabsContent value="history" className="space-y-4 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Historique des imports</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchHistory()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>
              
              {!importHistory || importHistory.length === 0 ? (
                <div className="bg-muted/50 p-8 rounded-lg text-center">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Aucun import pour le moment
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Vos imports apparaîtront ici avec tous les détails
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {importHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg border hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {item.status === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : item.status === 'failed' ? (
                              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            )}
                            <span className="text-lg">{getPlatformIcon(item.platform)}</span>
                            <Badge variant="outline" className="uppercase text-xs">
                              {item.platform}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(item.created_at), 'PPp', { locale: fr })}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground truncate font-mono">
                            {item.source_url}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-3 h-3" />
                              {item.products_imported} importé{item.products_imported > 1 ? 's' : ''}
                            </span>
                            {item.products_failed > 0 && (
                              <span className="flex items-center gap-1 text-red-600">
                                <XCircle className="w-3 h-3" />
                                {item.products_failed} échoué{item.products_failed > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          
                          {item.error_message && (
                            <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
                              Erreur: {item.error_message}
                            </p>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUrls(item.source_url);
                            toast({
                              title: "URL chargée",
                              description: "Vous pouvez maintenant ré-importer ce produit",
                            });
                          }}
                        >
                          Ré-importer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
