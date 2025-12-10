// QUICK URL IMPORT - Import direct par URL façon AutoDS
import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Link, 
  Search, 
  Loader2, 
  Package,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DetectedProduct {
  title: string;
  price: number;
  currency: string;
  image: string;
  description?: string;
  sku?: string;
  source: string;
}

interface QuickURLImportProps {
  onProductImported?: (product: DetectedProduct) => void;
}

// Patterns de détection des plateformes
const PLATFORM_PATTERNS = [
  { name: 'AliExpress', pattern: /aliexpress\.com/i, logo: '🛒' },
  { name: 'Amazon', pattern: /amazon\.(com|fr|de|co\.uk)/i, logo: '📦' },
  { name: 'BigBuy', pattern: /bigbuy\.eu/i, logo: '🏪' },
  { name: 'CJ Dropshipping', pattern: /cjdropshipping\.com/i, logo: '🚚' },
  { name: 'Temu', pattern: /temu\.com/i, logo: '🎁' },
  { name: 'Wish', pattern: /wish\.com/i, logo: '⭐' },
  { name: 'eBay', pattern: /ebay\.(com|fr|de|co\.uk)/i, logo: '🏷️' },
  { name: 'Etsy', pattern: /etsy\.com/i, logo: '🎨' },
];

const QuickURLImport = memo(({ onProductImported }: QuickURLImportProps) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detectedProduct, setDetectedProduct] = useState<DetectedProduct | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detectPlatform = (inputUrl: string) => {
    return PLATFORM_PATTERNS.find(p => p.pattern.test(inputUrl));
  };

  const platform = url ? detectPlatform(url) : null;

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error('Veuillez entrer une URL');
      return;
    }

    if (!platform) {
      toast.error('Plateforme non reconnue. Essayez AliExpress, Amazon, BigBuy...');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDetectedProduct(null);

    try {
      // Appel à l'edge function pour scraper le produit
      const { data, error: fnError } = await supabase.functions.invoke('scrape-product-url', {
        body: { url: url.trim(), platform: platform.name }
      });

      if (fnError) throw fnError;

      if (data?.product) {
        setDetectedProduct({
          ...data.product,
          source: platform.name
        });
        toast.success('Produit détecté avec succès !');
      } else {
        throw new Error('Aucun produit détecté');
      }
    } catch (err) {
      console.error('Error analyzing URL:', err);
      setError('Impossible d\'analyser cette URL. Vérifiez qu\'elle pointe vers un produit valide.');
      toast.error('Erreur lors de l\'analyse');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!detectedProduct) return;

    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non connecté');

      const { error: insertError } = await supabase
        .from('imported_products')
        .insert({
          name: detectedProduct.title,
          description: detectedProduct.description || '',
          price: detectedProduct.price * 1.5,
          images: detectedProduct.image ? [detectedProduct.image] : [],
          sku: detectedProduct.sku || `IMPORT-${Date.now()}`,
          user_id: userData.user.id
        });

      if (insertError) throw insertError;

      toast.success('Produit importé avec succès !');
      onProductImported?.(detectedProduct);
      
      // Reset
      setUrl('');
      setDetectedProduct(null);
    } catch (err) {
      console.error('Error importing product:', err);
      toast.error('Erreur lors de l\'import');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Link className="h-5 w-5 text-primary" />
          Import rapide par URL
          <Badge variant="secondary" className="ml-2">
            <Sparkles className="h-3 w-3 mr-1" />
            IA
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Collez l'URL d'un produit depuis AliExpress, Amazon, BigBuy, Temu...
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input URL */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="url"
              placeholder="https://aliexpress.com/item/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pr-10"
              disabled={isLoading}
            />
            {platform && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="text-lg">{platform.logo}</span>
              </div>
            )}
          </div>
          <Button 
            onClick={handleAnalyze}
            disabled={isLoading || !url.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Analyser
              </>
            )}
          </Button>
        </div>

        {/* Plateformes supportées */}
        <div className="flex flex-wrap gap-2">
          {PLATFORM_PATTERNS.map((p) => (
            <Badge 
              key={p.name}
              variant={platform?.name === p.name ? 'default' : 'outline'}
              className="text-xs"
            >
              {p.logo} {p.name}
            </Badge>
          ))}
        </div>

        {/* Erreur */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-600">{error}</span>
          </motion.div>
        )}

        {/* Produit détecté */}
        {detectedProduct && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-500/5 border border-green-500/30 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-600">Produit détecté</span>
              <Badge variant="outline" className="ml-auto">
                {detectedProduct.source}
              </Badge>
            </div>

            <div className="flex gap-4">
              {detectedProduct.image && (
                <img 
                  src={detectedProduct.image} 
                  alt={detectedProduct.title}
                  className="w-24 h-24 object-cover rounded-lg border"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2">
                  {detectedProduct.title}
                </h4>
                <div className="flex items-center gap-4 mt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Prix fournisseur</p>
                    <p className="font-semibold">
                      {detectedProduct.price.toFixed(2)} {detectedProduct.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prix suggéré (+50%)</p>
                    <p className="font-semibold text-green-600">
                      {(detectedProduct.price * 1.5).toFixed(2)} {detectedProduct.currency}
                    </p>
                  </div>
                </div>
                {detectedProduct.sku && (
                  <p className="text-xs text-muted-foreground mt-1">
                    SKU: {detectedProduct.sku}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Voir original
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={isLoading}
                className="ml-auto"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Importer ce produit
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
});

QuickURLImport.displayName = 'QuickURLImport';

export default QuickURLImport;
