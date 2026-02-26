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
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

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
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="urls">URLs à importer</Label>
                  <Textarea
                    id="urls"
                    placeholder="Entrez une URL par ligne"
                    value={urls}
                    onChange={e => setUrls(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="importType">Type d'import</Label>
                  <RadioGroup defaultValue={importType} onValueChange={value => setImportType(value as any)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="products" id="products" />
                      <Label htmlFor="products">Produits</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="reviews" id="reviews" />
                      <Label htmlFor="reviews">Avis</Label>
                    </div>
                  </RadioGroup>
                </div>

                {importType === 'products' && (
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="autoPublish">Publier automatiquement</Label>
                    <Switch
                      id="autoPublish"
                      checked={autoPublish}
                      onCheckedChange={checked => setAutoPublish(checked)}
                    />
                  </div>
                )}

                {importType === 'products' && (
                  <div className="grid gap-2">
                    <Label htmlFor="priceMultiplier">Multiplicateur de prix</Label>
                    <Input
                      type="number"
                      id="priceMultiplier"
                      placeholder="1.5"
                      value={priceMultiplier}
                      onChange={e => setPriceMultiplier(e.target.value)}
                    />
                  </div>
                )}

                {lastResults.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Derniers résultats</h3>
                    <div className="space-y-1">
                      {lastResults.map((result, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-2 p-2 rounded-md ${result.success ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'}`}
                        >
                          {result.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          <a href={result.url} target="_blank" rel="noopener noreferrer" className="underline">
                            {result.url}
                          </a>
                          <span className="ml-auto">{getPlatformIcon(result.platform)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
            </TabsContent>

            {/* Onglet Historique */}
            <TabsContent value="history" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Historique des imports</h3>
                <Button variant="outline" size="sm" onClick={() => refetchHistory()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>

              {!importHistory || importHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun import pour le moment</p>
                  <p className="text-sm">Vos imports apparaîtront ici</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {importHistory.map((history) => (
                    <div
                      key={history.id}
                      className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {history.status === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : history.status === 'failed' ? (
                              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            )}
                            <span className="text-lg">{getPlatformIcon(history.job_type)}</span>
                            <Badge variant="outline" className="uppercase text-xs">
                              {history.job_type || 'import'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(history.created_at), 'PPp', { locale: getDateFnsLocale() })}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground truncate font-mono">
                            {history.supplier_id || 'Import manuel'}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-3 h-3" />
                              {history.successful_imports} importé{history.successful_imports > 1 ? 's' : ''}
                            </span>
                            {history.failed_imports > 0 && (
                              <span className="flex items-center gap-1 text-red-600">
                                <XCircle className="w-3 h-3" />
                                {history.failed_imports} échoué{history.failed_imports > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          
                          {history.error_message && (
                            <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
                              Erreur: {history.error_message}
                            </p>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUrls(history.supplier_id || '');
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

            {/* Options avancées */}
            <TabsContent value="advanced" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Options de pricing</h3>

                <div className="grid gap-2">
                  <Label htmlFor="pricingType">Type de pricing</Label>
                  <Select value={pricingType} onValueChange={value => setPricingType(value as any)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Multiplier fixe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed_multiplier">Multiplier fixe</SelectItem>
                      <SelectItem value="fixed_margin">Marge fixe</SelectItem>
                      {/* <SelectItem value="tiered">Tiered Pricing (Coming Soon)</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>

                {pricingType === 'fixed_multiplier' && (
                  <div className="grid gap-2">
                    <Label htmlFor="priceMultiplier">Multiplicateur</Label>
                    <Input
                      type="number"
                      id="priceMultiplier"
                      placeholder="1.5"
                      value={priceMultiplier}
                      onChange={e => setPriceMultiplier(e.target.value)}
                    />
                  </div>
                )}

                {pricingType === 'fixed_margin' && (
                  <div className="grid gap-2">
                    <Label htmlFor="fixedMargin">Marge fixe (€)</Label>
                    <Input
                      type="number"
                      id="fixedMargin"
                      placeholder="10"
                      value={fixedMargin}
                      onChange={e => setFixedMargin(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Label htmlFor="roundPrice">Arrondir le prix</Label>
                  <Switch
                    id="roundPrice"
                    checked={roundPrice}
                    onCheckedChange={checked => setRoundPrice(checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Options de stock</h3>

                <div className="flex items-center space-x-2">
                  <Label htmlFor="importActualStock">Importer le stock actuel</Label>
                  <Switch
                    id="importActualStock"
                    checked={importActualStock}
                    onCheckedChange={checked => setImportActualStock(checked)}
                  />
                </div>

                {!importActualStock && (
                  <div className="grid gap-2">
                    <Label htmlFor="fixedStock">Stock fixe</Label>
                    <Input
                      type="number"
                      id="fixedStock"
                      placeholder="50"
                      value={fixedStock}
                      onChange={e => setFixedStock(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Mapping des catégories</h3>
                <p className="text-sm text-muted-foreground">
                  Associez les catégories d'origine à vos catégories de boutique.
                </p>

                {/* TODO: Implémenter le mapping des catégories */}
                <Badge variant="secondary">Bientôt disponible</Badge>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
