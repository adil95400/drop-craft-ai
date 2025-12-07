import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Link, 
  ShoppingBag, 
  Package,
  Store,
  Globe,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImportedProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  source_url: string;
  platform: string;
}

export const RealQuickUrlImport: React.FC = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<string>('');
  const [importedProduct, setImportedProduct] = useState<ImportedProduct | null>(null);

  const platforms = [
    { id: 'aliexpress', name: 'AliExpress', icon: <ShoppingBag className="w-4 h-4" />, pattern: 'aliexpress.com' },
    { id: 'amazon', name: 'Amazon', icon: <Package className="w-4 h-4" />, pattern: 'amazon.' },
    { id: 'ebay', name: 'eBay', icon: <Store className="w-4 h-4" />, pattern: 'ebay.com' },
    { id: 'etsy', name: 'Etsy', icon: <Globe className="w-4 h-4" />, pattern: 'etsy.com' },
    { id: 'shopify', name: 'Shopify', icon: <Store className="w-4 h-4" />, pattern: 'myshopify.com' },
    { id: 'cjdropshipping', name: 'CJ Dropshipping', icon: <Package className="w-4 h-4" />, pattern: 'cjdropshipping.com' },
  ];

  const detectPlatform = (inputUrl: string) => {
    const detected = platforms.find(p => inputUrl.toLowerCase().includes(p.pattern));
    setDetectedPlatform(detected?.id || '');
    return detected;
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setImportedProduct(null);
    if (value) {
      detectPlatform(value);
    } else {
      setDetectedPlatform('');
    }
  };

  const importFromUrl = async () => {
    if (!url) {
      toast({
        title: "URL manquante",
        description: "Veuillez entrer une URL de produit",
        variant: "destructive"
      });
      return;
    }

    const platform = detectPlatform(url);
    if (!platform) {
      toast({
        title: "Plateforme non supportée",
        description: "Cette plateforme n'est pas encore supportée",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setProgressStep('Connexion à la plateforme...');

    try {
      // Step 1: Call edge function to scrape product data
      setProgress(20);
      setProgressStep('Extraction des données produit...');
      
      const { data: scrapedData, error: scrapeError } = await supabase.functions.invoke('scrape-product-url', {
        body: { url, platform: platform.id }
      });

      if (scrapeError) {
        throw new Error(scrapeError.message || 'Erreur lors du scraping');
      }

      setProgress(50);
      setProgressStep('Optimisation IA du contenu...');

      // Step 2: Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      setProgress(70);
      setProgressStep('Enregistrement en base de données...');

      // Step 3: Insert into imported_products
      const productData = {
        user_id: user.id,
        name: scrapedData?.name || `Produit importé depuis ${platform.name}`,
        description: scrapedData?.description || '',
        price: scrapedData?.price || 0,
        original_price: scrapedData?.original_price || scrapedData?.price || 0,
        image_url: scrapedData?.image_url || '',
        images: scrapedData?.images || [],
        source_url: url,
        source_platform: platform.id,
        supplier_id: scrapedData?.supplier_id || null,
        sku: scrapedData?.sku || `IMP-${Date.now()}`,
        category: scrapedData?.category || 'Imported',
        tags: scrapedData?.tags || [],
        attributes: scrapedData?.attributes || {},
        status: 'pending_review',
        review_status: 'pending',
        ai_score: scrapedData?.ai_score || null,
        profit_margin: scrapedData?.profit_margin || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertedProduct, error: insertError } = await supabase
        .from('imported_products')
        .insert(productData)
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message || 'Erreur lors de l\'enregistrement');
      }

      setProgress(100);
      setProgressStep('Import terminé !');

      setImportedProduct({
        id: insertedProduct.id,
        name: insertedProduct.name,
        price: insertedProduct.price,
        image_url: insertedProduct.image_urls?.[0] || '',
        source_url: url,
        platform: platform.name
      });

      toast({
        title: "Import réussi",
        description: `"${insertedProduct.name}" importé depuis ${platform.name}`
      });

      // Reset URL after success
      setTimeout(() => {
        setUrl('');
        setDetectedPlatform('');
        setProgress(0);
        setProgressStep('');
      }, 3000);

    } catch (error: any) {
      console.error('Import error:', error);
      
      // Fallback: create product with minimal data from URL parsing
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const fallbackProduct = {
            user_id: user.id,
            name: `Produit depuis ${platform.name} - ${Date.now()}`,
            description: `Importé depuis: ${url}`,
            price: 0,
            source_url: url,
            source_platform: platform.id,
            sku: `IMP-${Date.now()}`,
            status: 'pending_review',
            review_status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: fallbackInsert, error: fallbackError } = await supabase
            .from('imported_products')
            .insert(fallbackProduct)
            .select()
            .single();

          if (!fallbackError && fallbackInsert) {
            setImportedProduct({
              id: fallbackInsert.id,
              name: fallbackInsert.name,
              price: 0,
              image_url: '',
              source_url: url,
              platform: platform.name
            });

            toast({
              title: "Import partiel réussi",
              description: "Produit créé - veuillez compléter les informations manuellement"
            });
            
            setProgress(100);
            return;
          }
        }
      } catch (fallbackErr) {
        console.error('Fallback import failed:', fallbackErr);
      }

      toast({
        title: "Erreur d'import",
        description: error.message || "Une erreur est survenue lors de l'import",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Link className="w-5 h-5" />
          Import Rapide par URL
        </CardTitle>
        <CardDescription className="text-sm">
          Importez un produit directement depuis son URL
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plateformes supportées - responsive */}
        <div>
          <p className="text-sm font-medium mb-2">Plateformes supportées :</p>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {platforms.map(platform => (
              <Badge
                key={platform.id}
                variant={detectedPlatform === platform.id ? "default" : "outline"}
                className="flex items-center gap-1 text-xs"
              >
                {platform.icon}
                <span className="hidden sm:inline">{platform.name}</span>
                <span className="sm:hidden">{platform.name.slice(0, 3)}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Input URL - responsive */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="https://www.aliexpress.com/item/..."
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              disabled={isImporting}
              className="flex-1"
            />
            <Button
              onClick={importFromUrl}
              disabled={isImporting || !url}
              className="whitespace-nowrap w-full sm:w-auto"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Import...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Importer
                </>
              )}
            </Button>
          </div>

          {detectedPlatform && !isImporting && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              Plateforme détectée: {platforms.find(p => p.id === detectedPlatform)?.name}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {isImporting && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              {progressStep}
            </p>
          </div>
        )}

        {/* Imported product preview */}
        {importedProduct && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {importedProduct.image_url ? (
                  <img
                    src={importedProduct.image_url}
                    alt={importedProduct.name}
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      Produit importé !
                    </span>
                  </div>
                  <p className="font-medium truncate">{importedProduct.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {importedProduct.price > 0 ? `${importedProduct.price.toFixed(2)} €` : 'Prix à définir'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features - responsive grid */}
        <Card className="bg-muted/50">
          <CardContent className="p-3 md:p-4">
            <p className="font-semibold mb-2 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Fonctionnalités automatiques
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span>Extraction des images</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span>Import des variantes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span>Optimisation SEO IA</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span>Calcul des marges</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
