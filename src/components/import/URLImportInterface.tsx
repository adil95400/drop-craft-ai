import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Globe, Sparkles, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ScrapedProduct {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  brand?: string;
  category?: string;
  specifications: Record<string, string>;
  availability: string;
  rating?: number;
  reviewCount?: number;
  seller?: string;
  url: string;
  confidence: number;
}

interface URLImportInterfaceProps {
  onProductScraped: (product: ScrapedProduct) => void;
  onCancel: () => void;
}

const SUPPORTED_PLATFORMS = [
  {
    name: 'AliExpress',
    domain: 'aliexpress.com',
    icon: '🛒',
    features: ['Prix', 'Images', 'Variantes', 'Avis']
  },
  {
    name: 'Amazon',
    domain: 'amazon.fr',
    icon: '📦',
    features: ['Détails', 'Images', 'Spécifications', 'Avis']
  },
  {
    name: 'eBay',
    domain: 'ebay.fr',
    icon: '🏪',
    features: ['Prix', 'Images', 'Description', 'Vendeur']
  },
  {
    name: 'Cdiscount',
    domain: 'cdiscount.com',
    icon: '🛍️',
    features: ['Prix', 'Images', 'Caractéristiques']
  },
  {
    name: 'Generic',
    domain: 'any',
    icon: '🌐',
    features: ['Détection auto', 'Schema.org', 'OpenGraph']
  }
];

export const URLImportInterface: React.FC<URLImportInterfaceProps> = ({
  onProductScraped,
  onCancel
}) => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scrapedProduct, setScrapedProduct] = useState<ScrapedProduct | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detectPlatform = (url: string) => {
    const domain = new URL(url).hostname.toLowerCase();
    return SUPPORTED_PLATFORMS.find(platform => 
      platform.domain === 'any' ? false : domain.includes(platform.domain)
    ) || SUPPORTED_PLATFORMS.find(p => p.domain === 'any');
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const scrapeProduct = async (url: string): Promise<ScrapedProduct> => {
    // Simulate API call to scraping service
    setProgress(10);
    
    // Mock scraping logic for demo
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProgress(30);
    
    const platform = detectPlatform(url);
    const domain = new URL(url).hostname;
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setProgress(70);
    
    // Mock product data based on platform
    const mockProduct: ScrapedProduct = {
      title: `Produit scrapé depuis ${domain}`,
      description: `Description détaillée du produit récupérée automatiquement depuis ${domain}. Ce produit a été analysé par notre système d'IA pour extraire toutes les informations pertinentes.`,
      price: Math.floor(Math.random() * 100) + 10,
      originalPrice: Math.floor(Math.random() * 50) + 100,
      currency: 'EUR',
      images: [
        'https://via.placeholder.com/400x400/3B82F6/FFFFFF?text=Image+1',
        'https://via.placeholder.com/400x400/10B981/FFFFFF?text=Image+2',
        'https://via.placeholder.com/400x400/F59E0B/FFFFFF?text=Image+3'
      ],
      brand: 'Marque Example',
      category: 'Électronique',
      specifications: {
        'Couleur': 'Noir',
        'Matériau': 'Plastique',
        'Dimensions': '15 x 10 x 5 cm',
        'Poids': '200g',
        'Garantie': '2 ans'
      },
      availability: 'En stock',
      rating: 4.5,
      reviewCount: 128,
      seller: platform?.name || 'Vendeur inconnu',
      url,
      confidence: Math.floor(Math.random() * 20) + 80
    };
    
    setProgress(100);
    return mockProduct;
  };

  const handleScrape = async () => {
    if (!url.trim()) {
      toast({
        title: "URL manquante",
        description: "Veuillez saisir une URL de produit",
        variant: "destructive"
      });
      return;
    }

    if (!validateUrl(url)) {
      toast({
        title: "URL invalide",
        description: "Veuillez saisir une URL valide",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      const product = await scrapeProduct(url);
      setScrapedProduct(product);
      
      toast({
        title: "Scraping réussi",
        description: "Produit récupéré avec succès",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du scraping';
      setError(errorMessage);
      toast({
        title: "Erreur de scraping",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    if (scrapedProduct) {
      onProductScraped(scrapedProduct);
    }
  };

  const currentPlatform = url ? detectPlatform(url) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6" />
            Import par URL
          </h2>
          <p className="text-muted-foreground">
            Importez des produits directement depuis leur page web
          </p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>

      <Tabs defaultValue="scrape" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scrape">Scraper un produit</TabsTrigger>
          <TabsTrigger value="platforms">Plateformes supportées</TabsTrigger>
        </TabsList>

        <TabsContent value="scrape" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>URL du produit</CardTitle>
              <CardDescription>
                Collez l'URL de la page produit que vous souhaitez importer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-url">URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="product-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/product/..."
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleScrape} 
                    disabled={isLoading || !url.trim()}
                  >
                    {isLoading ? 'Scraping...' : 'Scraper'}
                  </Button>
                </div>
              </div>

              {currentPlatform && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Plateforme détectée: <strong>{currentPlatform.name}</strong> {currentPlatform.icon}
                    <br />
                    Fonctionnalités: {currentPlatform.features.join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              {isLoading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progression du scraping</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {scrapedProduct && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Produit récupéré
                  <Badge variant="secondary">
                    {scrapedProduct.confidence}% confiance
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Vérifiez les informations avant d'importer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Images */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Images ({scrapedProduct.images.length})</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {scrapedProduct.images.slice(0, 3).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Product ${idx + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Info produit */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">TITRE</Label>
                      <p className="font-medium">{scrapedProduct.title}</p>
                    </div>
                    
                    <div className="flex gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">PRIX</Label>
                        <p className="font-bold text-green-600">
                          {scrapedProduct.price} {scrapedProduct.currency}
                        </p>
                      </div>
                      {scrapedProduct.originalPrice && (
                        <div>
                          <Label className="text-xs text-muted-foreground">PRIX ORIGINAL</Label>
                          <p className="text-sm line-through text-muted-foreground">
                            {scrapedProduct.originalPrice} {scrapedProduct.currency}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      {scrapedProduct.brand && (
                        <div>
                          <Label className="text-xs text-muted-foreground">MARQUE</Label>
                          <p className="text-sm">{scrapedProduct.brand}</p>
                        </div>
                      )}
                      {scrapedProduct.category && (
                        <div>
                          <Label className="text-xs text-muted-foreground">CATÉGORIE</Label>
                          <p className="text-sm">{scrapedProduct.category}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">DESCRIPTION</Label>
                  <p className="text-sm mt-1 line-clamp-3">{scrapedProduct.description}</p>
                </div>

                {Object.keys(scrapedProduct.specifications).length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">SPÉCIFICATIONS</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {Object.entries(scrapedProduct.specifications).slice(0, 4).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <span className="text-muted-foreground">{key}:</span> {value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    <a 
                      href={scrapedProduct.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Voir la page originale
                    </a>
                  </div>
                  <Button onClick={handleImport}>
                    Importer ce produit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUPPORTED_PLATFORMS.map((platform) => (
              <Card key={platform.name}>
                <CardHeader className="text-center pb-2">
                  <div className="text-2xl mb-2">{platform.icon}</div>
                  <CardTitle className="text-lg">{platform.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {platform.domain === 'any' ? 'Toutes plateformes' : platform.domain}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">FONCTIONNALITÉS</Label>
                    <div className="flex flex-wrap gap-1">
                      {platform.features.map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};