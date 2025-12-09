import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Key, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink,
  Shield,
  Sparkles,
  Image,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EnrichmentConfigStatus, EnrichmentDashboardWidget } from '@/components/enrichment';

interface APIConfig {
  name: string;
  key: string;
  envVar: string;
  description: string;
  docUrl: string;
  isConfigured: boolean;
  features: string[];
}

const API_CONFIGS: APIConfig[] = [
  {
    name: 'Amazon (RapidAPI)',
    key: 'amazon',
    envVar: 'RAPIDAPI_KEY',
    description: 'Enrichissement via Amazon Product Data API',
    docUrl: 'https://rapidapi.com/letscrape-6bRBa3QguO5/api/amazon-product-data6',
    isConfigured: false,
    features: ['Titre optimisé', 'Bullet points', 'Images HD', 'Prix compétitifs', 'Avis clients']
  },
  {
    name: 'AliExpress',
    key: 'aliexpress',
    envVar: 'ALIEXPRESS_API_KEY',
    description: 'Enrichissement via AliExpress Affiliate API',
    docUrl: 'https://portals.aliexpress.com/affiapi/doc',
    isConfigured: false,
    features: ['Prix fournisseur', 'Variantes', 'Images produit', 'Délais livraison']
  },
  {
    name: 'eBay',
    key: 'ebay',
    envVar: 'EBAY_CLIENT_ID',
    description: 'Enrichissement via eBay Browse API',
    docUrl: 'https://developer.ebay.com/api-docs/buy/browse/static/overview.html',
    isConfigured: false,
    features: ['Prix marché', 'Attributs produit', 'Options livraison']
  },
  {
    name: 'Cdiscount',
    key: 'cdiscount',
    envVar: 'CDISCOUNT_API_KEY',
    description: 'Enrichissement via Cdiscount Marketplace API',
    docUrl: 'https://dev.cdiscount.com/',
    isConfigured: false,
    features: ['Prix FR', 'Catégories', 'Attributs locaux']
  },
  {
    name: 'Temu',
    key: 'temu',
    envVar: 'TEMU_API_KEY',
    description: 'Enrichissement via Temu (API non officielle)',
    docUrl: '#',
    isConfigured: false,
    features: ['Prix ultra-compétitifs', 'Tendances', 'Images']
  }
];

export default function EnrichmentSettingsPage() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<APIConfig[]>(API_CONFIGS);
  const [isLoading, setIsLoading] = useState(true);
  const [autoEnrich, setAutoEnrich] = useState(false);
  const [imageMatching, setImageMatching] = useState(true);
  const [selectedSources, setSelectedSources] = useState<string[]>(['amazon', 'aliexpress']);

  useEffect(() => {
    checkConfigurations();
  }, []);

  const checkConfigurations = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Call edge function to check which APIs are configured
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-product`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ product_ids: [], sources: [] }),
        }
      );

      const result = await response.json();
      
      if (result.configured_sources) {
        setConfigs(prev => prev.map(config => ({
          ...config,
          isConfigured: result.configured_sources.includes(config.key)
        })));
      }
    } catch (error) {
      console.error('Error checking configurations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const configuredCount = configs.filter(c => c.isConfigured).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            Configuration Enrichissement
          </h1>
          <p className="text-muted-foreground mt-1">
            Configurez les APIs pour enrichir automatiquement vos produits
          </p>
        </div>
        <Badge variant={configuredCount > 0 ? 'default' : 'secondary'} className="text-sm">
          {configuredCount}/{configs.length} APIs configurées
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="apis" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="apis">
                <Key className="h-4 w-4 mr-2" />
                APIs
              </TabsTrigger>
              <TabsTrigger value="options">
                <Settings className="h-4 w-4 mr-2" />
                Options
              </TabsTrigger>
              <TabsTrigger value="automation">
                <Zap className="h-4 w-4 mr-2" />
                Automation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="apis" className="space-y-4 mt-4">
              {configs.map((config) => (
                <Card key={config.key} className={config.isConfigured ? 'border-green-500/30' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{config.name}</CardTitle>
                        {config.isConfigured ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Configuré
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Non configuré
                          </Badge>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(config.docUrl, '_blank')}
                        disabled={config.docUrl === '#'}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Documentation
                      </Button>
                    </div>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {config.features.map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    
                    {!config.isConfigured && (
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Pour configurer cette API, ajoutez la clé <code className="font-mono bg-muted px-1 rounded">{config.envVar}</code> dans les secrets Supabase (Cloud → Secrets)
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="options" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Correspondance par Image
                  </CardTitle>
                  <CardDescription>
                    Utiliser l'image du produit pour trouver des correspondances sur les marketplaces
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Activer la recherche par image</Label>
                      <p className="text-xs text-muted-foreground">
                        Recherche inversée d'image sur les marketplaces
                      </p>
                    </div>
                    <Switch 
                      checked={imageMatching} 
                      onCheckedChange={setImageMatching} 
                    />
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Label>Sources prioritaires</Label>
                    <div className="flex flex-wrap gap-2">
                      {configs.map((config) => (
                        <Badge
                          key={config.key}
                          variant={selectedSources.includes(config.key) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedSources(prev => 
                              prev.includes(config.key)
                                ? prev.filter(s => s !== config.key)
                                : [...prev, config.key]
                            );
                          }}
                        >
                          {config.name}
                          {config.isConfigured && <CheckCircle className="h-3 w-3 ml-1" />}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Paramètres d'enrichissement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Priorité de correspondance</Label>
                      <select className="w-full p-2 border rounded-md bg-background">
                        <option value="ean">EAN/GTIN d'abord</option>
                        <option value="title">Titre d'abord</option>
                        <option value="image">Image d'abord</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Langue cible</Label>
                      <select className="w-full p-2 border rounded-md bg-background">
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="de">Deutsch</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="automation" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Enrichissement Automatique
                  </CardTitle>
                  <CardDescription>
                    Enrichir automatiquement les nouveaux produits importés
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Activer l'enrichissement automatique</Label>
                      <p className="text-xs text-muted-foreground">
                        Chaque nouveau produit sera enrichi automatiquement
                      </p>
                    </div>
                    <Switch 
                      checked={autoEnrich} 
                      onCheckedChange={setAutoEnrich} 
                    />
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Label>Actions automatiques</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Switch defaultChecked />
                        <span className="text-sm">Récupérer les données marketplace</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch defaultChecked />
                        <span className="text-sm">Optimiser avec l'IA</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch />
                        <span className="text-sm">Appliquer automatiquement les optimisations</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  L'enrichissement automatique utilise l'API Lovable AI pour optimiser le contenu. 
                  Des crédits seront consommés pour chaque produit enrichi.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <EnrichmentConfigStatus />
          <EnrichmentDashboardWidget />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Guide rapide</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>1. Obtenez une clé API RapidAPI (gratuite)</p>
              <p>2. Ajoutez-la dans Cloud → Secrets → RAPIDAPI_KEY</p>
              <p>3. Enrichissez vos produits depuis le catalogue</p>
              <p>4. Appliquez les optimisations en un clic</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
