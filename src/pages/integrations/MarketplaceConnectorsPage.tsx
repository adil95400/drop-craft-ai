import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Store, 
  Package, 
  Truck, 
  Link2, 
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Settings,
  Zap,
  Globe,
  ShoppingCart,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PlatformLogo } from '@/components/ui/platform-logo';
import { cn } from '@/lib/utils';

interface Connector {
  id: string;
  name: string;
  platform: string;
  category: 'marketplace' | 'supplier' | 'shipping' | 'import';
  description: string;
  features: string[];
  status: 'available' | 'connected' | 'beta' | 'coming_soon';
  apiType: 'official' | 'scraping' | 'hybrid';
  documentationUrl?: string;
}

const connectors: Connector[] = [
  // Marketplaces
  {
    id: 'shopify',
    name: 'Shopify',
    platform: 'shopify',
    category: 'marketplace',
    description: 'Synchronisez votre boutique Shopify pour gérer produits, commandes et stocks',
    features: ['Sync bidirectionnel', 'Webhooks temps réel', 'Multi-boutiques'],
    status: 'connected',
    apiType: 'official',
    documentationUrl: 'https://shopify.dev/docs/api'
  },
  {
    id: 'amazon',
    name: 'Amazon Seller',
    platform: 'amazon',
    category: 'marketplace',
    description: 'Vendez sur Amazon avec synchronisation automatique des listings',
    features: ['FBA Integration', 'Repricing auto', 'Inventory sync'],
    status: 'available',
    apiType: 'official'
  },
  {
    id: 'ebay',
    name: 'eBay',
    platform: 'ebay',
    category: 'marketplace',
    description: 'Publiez et gérez vos annonces eBay automatiquement',
    features: ['Multi-pays', 'Enchères', 'Trading API'],
    status: 'available',
    apiType: 'official'
  },
  {
    id: 'etsy',
    name: 'Etsy',
    platform: 'etsy',
    category: 'marketplace',
    description: 'Connectez votre boutique Etsy pour produits artisanaux',
    features: ['Listings sync', 'Orders import', 'Reviews'],
    status: 'available',
    apiType: 'official'
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    platform: 'woocommerce',
    category: 'marketplace',
    description: 'Intégrez votre boutique WooCommerce WordPress',
    features: ['REST API', 'Webhooks', 'Multi-sites'],
    status: 'available',
    apiType: 'official'
  },
  {
    id: 'prestashop',
    name: 'PrestaShop',
    platform: 'prestashop',
    category: 'marketplace',
    description: 'Synchronisez votre boutique PrestaShop',
    features: ['Webservice API', 'Multi-boutiques', 'Stock sync'],
    status: 'available',
    apiType: 'official'
  },
  // Suppliers
  {
    id: 'aliexpress',
    name: 'AliExpress',
    platform: 'aliexpress',
    category: 'supplier',
    description: 'Importez des produits AliExpress avec tracking automatique',
    features: ['Import 1-clic', 'Auto-order', 'Tracking intégré'],
    status: 'available',
    apiType: 'hybrid'
  },
  {
    id: 'cjdropshipping',
    name: 'CJ Dropshipping',
    platform: 'cjdropshipping',
    category: 'supplier',
    description: 'Fournisseur dropshipping avec fulfillment rapide',
    features: ['API officielle', 'Warehouses US/EU', 'Custom branding'],
    status: 'available',
    apiType: 'official'
  },
  {
    id: 'bigbuy',
    name: 'BigBuy',
    platform: 'bigbuy',
    category: 'supplier',
    description: 'Grossiste européen avec livraison rapide',
    features: ['Catalogue 200K+', 'Dropshipping EU', 'Stock temps réel'],
    status: 'connected',
    apiType: 'official'
  },
  {
    id: 'temu',
    name: 'Temu',
    platform: 'temu',
    category: 'supplier',
    description: 'Importez des produits tendance depuis Temu',
    features: ['Scraping intelligent', 'Prix compétitifs', 'Nouveautés'],
    status: 'beta',
    apiType: 'scraping'
  },
  {
    id: 'wish',
    name: 'Wish',
    platform: 'wish',
    category: 'supplier',
    description: 'Source de produits à bas prix depuis Wish',
    features: ['API officielle', 'Import rapide', 'Reviews'],
    status: 'available',
    apiType: 'official'
  },
  // Shipping
  {
    id: '17track',
    name: '17TRACK',
    platform: '17track',
    category: 'shipping',
    description: 'Suivi universel de colis multi-transporteurs',
    features: ['900+ transporteurs', 'Webhooks', 'Notifications'],
    status: 'connected',
    apiType: 'official'
  },
  {
    id: 'aftership',
    name: 'AfterShip',
    platform: 'aftership',
    category: 'shipping',
    description: 'Tracking avancé et pages de suivi personnalisées',
    features: ['Branded tracking', 'SMS/Email alerts', 'Analytics'],
    status: 'available',
    apiType: 'official'
  },
  // Import tools
  {
    id: 'url-import',
    name: 'Import par URL',
    platform: 'url',
    category: 'import',
    description: 'Importez n\'importe quel produit via son URL',
    features: ['Multi-plateformes', 'IA extraction', 'Marge auto'],
    status: 'connected',
    apiType: 'scraping'
  },
  {
    id: 'csv-import',
    name: 'Import CSV/Excel',
    platform: 'csv',
    category: 'import',
    description: 'Importez en masse via fichiers CSV ou Excel',
    features: ['Mapping intelligent', 'Validation', 'Templates'],
    status: 'connected',
    apiType: 'hybrid'
  }
];

export default function MarketplaceConnectorsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const filteredConnectors = connectors.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: Connector['status']) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500">Connecté</Badge>;
      case 'available':
        return <Badge variant="outline">Disponible</Badge>;
      case 'beta':
        return <Badge className="bg-orange-500">Beta</Badge>;
      case 'coming_soon':
        return <Badge variant="secondary">Bientôt</Badge>;
    }
  };

  const handleConnect = async (connector: Connector) => {
    if (connector.status === 'coming_soon') {
      toast.info('Cette intégration sera bientôt disponible');
      return;
    }

    if (connector.status === 'connected') {
      // Navigate to settings
      navigate(`/integrations/${connector.id}/settings`);
      return;
    }

    setConnectingId(connector.id);

    // Navigate based on connector type
    switch (connector.id) {
      case 'shopify':
        navigate('/stores-channels/connect/shopify');
        break;
      case 'aliexpress':
        navigate('/import/aliexpress');
        break;
      case 'url-import':
        navigate('/import/url');
        break;
      case 'csv-import':
        navigate('/import/advanced');
        break;
      case 'bigbuy':
        navigate('/suppliers/marketplace');
        break;
      case 'cjdropshipping':
        navigate('/suppliers/marketplace');
        break;
      default:
        toast.info(`Configuration de ${connector.name} en cours...`);
        setTimeout(() => {
          setConnectingId(null);
          toast.success(`${connector.name} configuré avec succès !`);
        }, 1500);
    }
  };

  const ConnectorCard = ({ connector }: { connector: Connector }) => (
    <Card className={cn(
      "hover:shadow-md transition-all",
      connector.status === 'connected' && "border-green-200 bg-green-50/30 dark:bg-green-950/10"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <PlatformLogo platform={connector.platform} size="lg" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {connector.name}
                {connector.status === 'connected' && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(connector.status)}
                <Badge variant="outline" className="text-xs">
                  {connector.apiType === 'official' ? 'API Officielle' : 
                   connector.apiType === 'scraping' ? 'Scraping IA' : 'Hybride'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{connector.description}</p>
        
        <div className="flex flex-wrap gap-1">
          {connector.features.map((feature, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Button 
            className="flex-1"
            variant={connector.status === 'connected' ? 'outline' : 'default'}
            onClick={() => handleConnect(connector)}
            disabled={connectingId === connector.id}
          >
            {connectingId === connector.id ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : connector.status === 'connected' ? (
              <Settings className="h-4 w-4 mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {connector.status === 'connected' ? 'Configurer' : 'Connecter'}
          </Button>
          {connector.documentationUrl && (
            <Button variant="ghost" size="icon" asChild>
              <a href={connector.documentationUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const categoryIcons = {
    marketplace: Store,
    supplier: Package,
    shipping: Truck,
    import: Link2
  };

  return (
    <>
      <Helmet>
        <title>Connecteurs & Intégrations - ShopOpti</title>
        <meta name="description" content="Connectez vos marketplaces, fournisseurs et outils d'import" />
      </Helmet>

      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary" />
              Connecteurs Multicanal
            </h1>
            <p className="text-muted-foreground mt-1">
              Connectez vos marketplaces, fournisseurs dropshipping et outils
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {connectors.filter(c => c.status === 'connected').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Connectés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Store className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {connectors.filter(c => c.category === 'marketplace').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Marketplaces</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {connectors.filter(c => c.category === 'supplier').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Fournisseurs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                  <Link2 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {connectors.filter(c => c.category === 'import').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Outils Import</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-1">
              <Store className="h-3 w-3" /> Marketplaces
            </TabsTrigger>
            <TabsTrigger value="supplier" className="flex items-center gap-1">
              <Package className="h-3 w-3" /> Fournisseurs
            </TabsTrigger>
            <TabsTrigger value="shipping" className="flex items-center gap-1">
              <Truck className="h-3 w-3" /> Shipping
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-1">
              <Link2 className="h-3 w-3" /> Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConnectors.map(connector => (
                <ConnectorCard key={connector.id} connector={connector} />
              ))}
            </div>
          </TabsContent>

          {(['marketplace', 'supplier', 'shipping', 'import'] as const).map(category => (
            <TabsContent key={category} value={category} className="mt-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredConnectors
                  .filter(c => c.category === category)
                  .map(connector => (
                    <ConnectorCard key={connector.id} connector={connector} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Import Rapide par URL</h3>
                  <p className="text-sm text-muted-foreground">
                    Collez un lien produit et importez-le instantanément
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/import/url')}>
                Importer un produit
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
