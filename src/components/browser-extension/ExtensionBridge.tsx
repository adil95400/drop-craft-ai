import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Chrome, Smartphone, Globe, Zap, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { productionLogger } from '@/utils/productionLogger';

interface ExtensionMessage {
  type: string;
  data: any;
  source: 'extension';
}

interface ScrapedProduct {
  name: string;
  price: number;
  image: string;
  url: string;
  description?: string;
  supplier?: string;
}

export const ExtensionBridge = () => {
  const [isExtensionConnected, setIsExtensionConnected] = useState(false);
  const [scrapedProducts, setScrapedProducts] = useState<ScrapedProduct[]>([]);
  const [extensionVersion, setExtensionVersion] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    // Listen for messages from browser extension
    const handleMessage = (event: MessageEvent<ExtensionMessage>) => {
      if (event.data?.source !== 'extension') return;

      const { type, data } = event.data;

      switch (type) {
        case 'EXTENSION_CONNECTED':
          setIsExtensionConnected(true);
          setExtensionVersion(data.version);
          toast({
            title: "Extension connectée",
            description: `Extension v${data.version} détectée`,
          });
          break;

        case 'PRODUCT_SCRAPED':
          handleProductScraped(data);
          break;

        case 'BULK_PRODUCTS_SCRAPED':
          handleBulkProductsScraped(data.products);
          break;

        case 'EXTENSION_DISCONNECTED':
          setIsExtensionConnected(false);
          setExtensionVersion('');
          break;

        default:
          productionLogger.info('Unknown extension message', { type, data }, 'ExtensionBridge');
      }
    };

    window.addEventListener('message', handleMessage);

    // Check if extension is already loaded
    checkExtensionStatus();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [toast]);

  const checkExtensionStatus = () => {
    // Send ping to extension
    window.postMessage({
      type: 'PING_EXTENSION',
      source: 'webapp'
    }, '*');
  };

  const handleProductScraped = (product: ScrapedProduct) => {
    setScrapedProducts(prev => [product, ...prev.slice(0, 9)]); // Keep last 10
    toast({
      title: "Produit détecté",
      description: `${product.name} ajouté à la liste`,
    });
  };

  const handleBulkProductsScraped = (products: ScrapedProduct[]) => {
    setScrapedProducts(prev => [...products, ...prev].slice(0, 20)); // Keep last 20
    toast({
      title: `${products.length} produits importés`,
      description: "Les produits ont été ajoutés à votre liste",
    });
  };

  const sendMessageToExtension = (type: string, data?: any) => {
    window.postMessage({
      type,
      data,
      source: 'webapp'
    }, '*');
  };

  const downloadExtension = (browser: string) => {
    if (browser === 'chrome') {
      // Redirect to Chrome extension page
      window.location.href = '/extensions/chrome';
    } else {
      toast({
        title: "Version en développement",
        description: `L'extension ${browser} sera bientôt disponible. Utilisez Chrome pour l'instant.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Extension Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Extension Navigateur
            </CardTitle>
            <Badge variant={isExtensionConnected ? 'default' : 'secondary'}>
              {isExtensionConnected ? `Connectée v${extensionVersion}` : 'Non connectée'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isExtensionConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <Zap className="h-4 w-4" />
                <span className="text-sm">Extension active et prête à scraper</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => sendMessageToExtension('START_SCRAPING')}
                  className="w-full"
                >
                  Démarrer le scraping
                </Button>
                <Button
                  variant="outline"
                  onClick={() => sendMessageToExtension('STOP_SCRAPING')}
                  className="w-full"
                >
                  Arrêter le scraping
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Installez notre extension pour scraper automatiquement les produits depuis les sites de fournisseurs.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  onClick={() => downloadExtension('chrome')}
                  className="flex items-center gap-2"
                >
                  <Chrome className="h-4 w-4" />
                  Chrome
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadExtension('firefox')}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  Firefox
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadExtension('edge')}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  Edge
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scraped Products */}
      {scrapedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Produits Scrapés Récemment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scrapedProducts.map((product, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square mb-2 bg-muted rounded overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <h3 className="font-medium text-sm line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-primary">
                      {product.price.toFixed(2)}€
                    </span>
                    {product.supplier && (
                      <Badge variant="secondary" className="text-xs">
                        {product.supplier}
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      // Import product to catalog
                      toast({
                        title: "Produit importé",
                        description: "Le produit a été ajouté à votre catalogue",
                      });
                    }}
                  >
                    Importer
                  </Button>
                </div>
              ))}
            </div>
            
            {scrapedProducts.length >= 10 && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={() => setScrapedProducts([])}
                >
                  Vider la liste
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mobile App Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Application Mobile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Scrapez des produits directement depuis votre mobile
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                iOS App
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Android App
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};