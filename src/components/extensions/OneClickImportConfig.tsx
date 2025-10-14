import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Link as LinkIcon, Package, Star } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export const OneClickImportConfig: React.FC = () => {
  const [urls, setUrls] = useState('');
  const [importType, setImportType] = useState<'products' | 'reviews'>('products');
  const [autoPublish, setAutoPublish] = useState(true);
  const [priceMultiplier, setPriceMultiplier] = useState('1.5');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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

    try {
      const urlList = urls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const { data, error } = await supabase.functions.invoke('extension-one-click-import', {
        body: {
          urls: urlList,
          importType,
          autoPublish,
          priceMultiplier: parseFloat(priceMultiplier) || 1.5,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Import réussi !',
          description: data.message,
        });
        setUrls('');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5" />
          Configuration Import en Un Clic
        </CardTitle>
        <CardDescription>
          Importez des produits ou des avis en copiant-collant simplement les URLs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
https://www.ebay.com/itm/789012`}
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Supporté: AliExpress, Amazon, eBay, et autres marketplaces
          </p>
        </div>

        {importType === 'products' && (
          <>
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

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-sm">Comment ça marche ?</h4>
          <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
            <li>Copiez les URLs des produits ou pages d'avis</li>
            <li>Collez-les dans le champ ci-dessus (une URL par ligne)</li>
            <li>Choisissez vos options (publication auto, marge...)</li>
            <li>Cliquez sur "Importer maintenant" - c'est tout !</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
