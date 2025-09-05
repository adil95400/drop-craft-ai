import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet-async';
import { 
  Globe, ArrowLeft, Play, Settings, 
  Eye, Download, AlertCircle, CheckCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const WebScrapingPage: React.FC = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [step, setStep] = useState<'config' | 'preview' | 'scraping' | 'complete'>('config');
  const [scrapedData, setScrapedData] = useState<any[]>([]);

  const handleStartScraping = async () => {
    if (!url) {
      toast.error('Veuillez saisir une URL');
      return;
    }

    setScraping(true);
    setStep('scraping');
    
    // Simulation de scraping
    setTimeout(() => {
      const mockData = [
        {
          name: 'Smartphone Galaxy S24',
          price: 899.99,
          description: 'Dernier smartphone Samsung avec caméra 200MP',
          image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
          category: 'Électronique'
        },
        {
          name: 'MacBook Pro 16"',
          price: 2499.99,
          description: 'Ordinateur portable professionnel Apple',
          image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=400',
          category: 'Informatique'
        }
      ];
      
      setScrapedData(mockData);
      setScraping(false);
      setStep('preview');
      toast.success('Scraping terminé avec succès!');
    }, 3000);
  };

  const handleImportData = () => {
    setStep('complete');
    toast.success('Données importées avec succès!');
  };

  const supportedSites = [
    { name: 'Amazon', logo: '🛒', status: 'active' },
    { name: 'eBay', logo: '🏷️', status: 'active' },
    { name: 'AliExpress', logo: '🛍️', status: 'active' },
    { name: 'Shopify', logo: '🏪', status: 'active' },
    { name: 'WooCommerce', logo: '🛒', status: 'active' },
    { name: 'Magento', logo: '🔧', status: 'beta' }
  ];

  return (
    <>
      <Helmet>
        <title>Web Scraping - Drop Craft AI</title>
        <meta name="description" content="Scrapez et importez des produits depuis n'importe quel site e-commerce." />
      </Helmet>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/import')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Web Scraping</h1>
            <p className="text-muted-foreground">
              Importez des produits depuis n'importe quel site web
            </p>
          </div>
        </div>

        {/* Configuration Step */}
        {step === 'config' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Configuration du scraping
                </CardTitle>
                <CardDescription>
                  Saisissez l'URL du site à scraper
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">URL du site web</Label>
                  <Input
                    id="url"
                    placeholder="https://exemple.com/category/products"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Délai entre requêtes (ms)</Label>
                    <Input type="number" defaultValue="1000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Limite de pages</Label>
                    <Input type="number" defaultValue="10" />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleStartScraping} disabled={!url}>
                    <Play className="h-4 w-4 mr-2" />
                    Démarrer le scraping
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Supported Sites */}
            <Card>
              <CardHeader>
                <CardTitle>Sites supportés</CardTitle>
                <CardDescription>
                  Plateformes e-commerce compatibles avec notre scraper
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {supportedSites.map((site) => (
                    <div key={site.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{site.logo}</span>
                        <span className="font-medium">{site.name}</span>
                      </div>
                      <Badge variant={site.status === 'active' ? 'default' : 'secondary'}>
                        {site.status === 'active' ? 'Actif' : 'Beta'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Scraping in Progress */}
        {step === 'scraping' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 animate-spin" />
                Scraping en cours...
              </CardTitle>
              <CardDescription>
                Extraction des données depuis {url}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <div className="animate-pulse space-y-4">
                  <div className="bg-muted h-4 rounded w-3/4 mx-auto"></div>
                  <div className="bg-muted h-4 rounded w-1/2 mx-auto"></div>
                  <div className="bg-muted h-4 rounded w-2/3 mx-auto"></div>
                </div>
                <p className="text-muted-foreground mt-4">
                  Analyse des produits en cours...
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-blue-600">15</div>
                  <div className="text-sm text-muted-foreground">Pages analysées</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-green-600">234</div>
                  <div className="text-sm text-muted-foreground">Produits trouvés</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-orange-600">5</div>
                  <div className="text-sm text-muted-foreground">Erreurs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Aperçu des données scrapées
                </CardTitle>
                <CardDescription>
                  Vérifiez les données avant l'import final
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {scrapedData.length} produits détectés
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exporter CSV
                    </Button>
                    <Button onClick={handleImportData}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Importer les données
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {scrapedData.map((product, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex gap-4">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                          <div className="flex items-center gap-4">
                            <Badge>{product.category}</Badge>
                            <span className="font-semibold text-green-600">{product.price}€</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Import terminé avec succès
              </CardTitle>
              <CardDescription>
                Les données scrapées ont été importées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{scrapedData.length}</div>
                  <div className="text-sm text-green-700">Produits importés</div>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">100%</div>
                  <div className="text-sm text-blue-700">Taux de réussite</div>
                </div>
              </div>
              
              <div className="flex justify-center gap-3 pt-6">
                <Button variant="outline" onClick={() => navigate('/import')}>
                  Nouveau scraping
                </Button>
                <Button onClick={() => navigate('/products')}>
                  Voir les produits
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default WebScrapingPage;