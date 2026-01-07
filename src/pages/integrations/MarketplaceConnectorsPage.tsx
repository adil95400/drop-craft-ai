import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search,
  CheckCircle2,
  Zap,
  Globe,
  ArrowRight,
  Loader2,
  Store,
  Package,
  Truck,
  ShoppingBag,
  Link2,
  FileSpreadsheet,
  Star,
  TrendingUp,
  Filter,
  LayoutGrid,
  List,
  ChevronRight,
  ExternalLink,
  Settings,
  Plus,
  Sparkles,
  Building2,
  Boxes,
  Tags
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PlatformLogo } from '@/components/ui/platform-logo';
import { cn } from '@/lib/utils';

interface Connector {
  id: string;
  name: string;
  platform: string;
  category: string;
  region?: string[];
  description: string;
  features?: string[];
  status: 'available' | 'connected' | 'beta' | 'coming_soon' | 'popular';
  isNew?: boolean;
  isPremium?: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  count?: number;
}

const allConnectors: Connector[] = [
  // E-commerce Platforms
  { id: 'shopify', name: 'Shopify', platform: 'shopify', category: 'ecommerce', region: ['Global'], description: 'La plateforme e-commerce leader mondial', status: 'connected', features: ['Multi-boutiques', 'Sync temps réel', 'Webhooks'] },
  { id: 'woocommerce', name: 'WooCommerce', platform: 'woocommerce', category: 'ecommerce', region: ['Global'], description: 'Extension e-commerce pour WordPress', status: 'available', features: ['REST API', 'Open source'] },
  { id: 'prestashop', name: 'PrestaShop', platform: 'prestashop', category: 'ecommerce', region: ['Europe'], description: 'Solution e-commerce française', status: 'available', features: ['Multi-boutiques', 'Addons'] },
  { id: 'magento', name: 'Magento / Adobe Commerce', platform: 'magento', category: 'ecommerce', region: ['Global'], description: 'Solution enterprise e-commerce', status: 'available', features: ['GraphQL API', 'Enterprise'] },
  { id: 'bigcommerce', name: 'BigCommerce', platform: 'bigcommerce', category: 'ecommerce', region: ['Global'], description: 'Plateforme SaaS e-commerce', status: 'available', features: ['Headless', 'B2B'] },
  { id: 'opencart', name: 'OpenCart', platform: 'opencart', category: 'ecommerce', region: ['Global'], description: 'Solution e-commerce open source', status: 'available' },
  { id: 'squarespace', name: 'Squarespace', platform: 'squarespace', category: 'ecommerce', region: ['Global'], description: 'Website builder avec commerce', status: 'beta', isNew: true },
  { id: 'wix', name: 'Wix eCommerce', platform: 'wix', category: 'ecommerce', region: ['Global'], description: 'Boutique en ligne Wix', status: 'available' },
  { id: 'ecwid', name: 'Ecwid', platform: 'ecwid', category: 'ecommerce', region: ['Global'], description: 'E-commerce widget intégrable', status: 'available' },
  { id: 'lightspeed', name: 'Lightspeed', platform: 'lightspeed', category: 'ecommerce', region: ['Europe', 'North America'], description: 'POS & e-commerce combiné', status: 'available' },
  
  // Marketplaces
  { id: 'amazon', name: 'Amazon Seller Central', platform: 'amazon', category: 'marketplace', region: ['Global'], description: 'La plus grande marketplace mondiale', status: 'available', features: ['FBA', 'Advertising API', 'SP-API'] },
  { id: 'amazon-vendor', name: 'Amazon Vendor Central', platform: 'amazon', category: 'marketplace', region: ['Global'], description: 'Programme vendeur Amazon', status: 'available', isPremium: true },
  { id: 'ebay', name: 'eBay', platform: 'ebay', category: 'marketplace', region: ['Global'], description: 'Marketplace enchères et achat immédiat', status: 'available', features: ['Trading API', 'Multi-sites'] },
  { id: 'etsy', name: 'Etsy', platform: 'etsy', category: 'marketplace', region: ['Global'], description: 'Marketplace produits artisanaux', status: 'available' },
  { id: 'cdiscount', name: 'Cdiscount', platform: 'cdiscount', category: 'marketplace', region: ['France'], description: 'Leader français du e-commerce', status: 'available' },
  { id: 'fnac', name: 'Fnac Marketplace', platform: 'fnac', category: 'marketplace', region: ['France'], description: 'Marketplace Fnac Darty', status: 'available' },
  { id: 'rakuten', name: 'Rakuten France', platform: 'rakuten', category: 'marketplace', region: ['France'], description: 'Ex-PriceMinister', status: 'available' },
  { id: 'manomano', name: 'ManoMano', platform: 'manomano', category: 'marketplace', region: ['Europe'], description: 'Marketplace bricolage & jardin', status: 'available' },
  { id: 'zalando', name: 'Zalando Partner', platform: 'zalando', category: 'marketplace', region: ['Europe'], description: 'Leader mode en Europe', status: 'available', isPremium: true },
  { id: 'otto', name: 'Otto Market', platform: 'otto', category: 'marketplace', region: ['Germany'], description: 'Marketplace allemande majeure', status: 'available' },
  { id: 'kaufland', name: 'Kaufland.de', platform: 'kaufland', category: 'marketplace', region: ['Germany'], description: 'Ex-Real.de marketplace', status: 'available' },
  { id: 'bol', name: 'Bol.com', platform: 'bol', category: 'marketplace', region: ['Netherlands', 'Belgium'], description: 'Leader Benelux', status: 'available' },
  { id: 'allegro', name: 'Allegro', platform: 'allegro', category: 'marketplace', region: ['Poland'], description: 'Leader e-commerce Pologne', status: 'available' },
  { id: 'mirakl', name: 'Mirakl Connect', platform: 'mirakl', category: 'marketplace', region: ['Global'], description: 'Connecteur marketplaces Mirakl', status: 'available', features: ['100+ marketplaces'] },
  { id: 'mercadolibre', name: 'Mercado Libre', platform: 'mercadolibre', category: 'marketplace', region: ['Latin America'], description: 'Leader e-commerce LATAM', status: 'beta' },
  { id: 'wish', name: 'Wish', platform: 'wish', category: 'marketplace', region: ['Global'], description: 'Marketplace mobile-first', status: 'available' },
  { id: 'tiktokshop', name: 'TikTok Shop', platform: 'tiktok', category: 'marketplace', region: ['Global'], description: 'Social commerce TikTok', status: 'connected', isNew: true, features: ['Live shopping', 'Affiliate'] },
  
  // Dropshipping Suppliers
  { id: 'aliexpress', name: 'AliExpress', platform: 'aliexpress', category: 'supplier', region: ['Global'], description: 'Plus grand fournisseur dropshipping', status: 'connected', features: ['Import 1-clic', 'Tracking'] },
  { id: 'cjdropshipping', name: 'CJ Dropshipping', platform: 'cjdropshipping', category: 'supplier', region: ['Global'], description: 'Fulfillment & sourcing', status: 'available', features: ['API officielle', 'Warehouses'] },
  { id: 'bigbuy', name: 'BigBuy', platform: 'bigbuy', category: 'supplier', region: ['Europe'], description: 'Grossiste européen dropshipping', status: 'connected', features: ['200K+ produits', 'Stock temps réel'] },
  { id: 'dropshipping-europe', name: 'Dropshipping Europe', platform: 'dropshipping-europe', category: 'supplier', region: ['Europe'], description: 'Fournisseur européen spécialisé', status: 'available' },
  { id: 'bts-wholesaler', name: 'BTS Wholesaler', platform: 'bts', category: 'supplier', region: ['Europe'], description: 'Grossiste électronique', status: 'available' },
  { id: 'matterhorn', name: 'Matterhorn', platform: 'matterhorn', category: 'supplier', region: ['Europe'], description: 'Mode et accessoires', status: 'available' },
  { id: 'b2b-sports', name: 'B2B Sports Wholesale', platform: 'b2b-sports', category: 'supplier', region: ['Europe'], description: 'Articles de sport', status: 'available' },
  { id: 'watch-import', name: 'Watch Import', platform: 'watch-import', category: 'supplier', region: ['Global'], description: 'Montres et bijoux', status: 'available' },
  { id: 'spocket', name: 'Spocket', platform: 'spocket', category: 'supplier', region: ['US', 'Europe'], description: 'Fournisseurs US/EU vérifiés', status: 'available', isNew: true },
  { id: 'zendrop', name: 'Zendrop', platform: 'zendrop', category: 'supplier', region: ['Global'], description: 'Automatisation dropshipping', status: 'beta' },
  { id: 'printful', name: 'Printful', platform: 'printful', category: 'supplier', region: ['Global'], description: 'Print-on-demand', status: 'available', features: ['POD', 'Mockups'] },
  { id: 'printify', name: 'Printify', platform: 'printify', category: 'supplier', region: ['Global'], description: 'Print-on-demand multi-fournisseurs', status: 'available' },
  { id: 'modalyst', name: 'Modalyst', platform: 'modalyst', category: 'supplier', region: ['Global'], description: 'Dropshipping premium', status: 'available' },
  { id: 'syncee', name: 'Syncee', platform: 'syncee', category: 'supplier', region: ['Global'], description: 'Marketplace B2B dropshipping', status: 'available' },
  
  // Comparateurs & Shopping
  { id: 'google-shopping', name: 'Google Shopping', platform: 'google', category: 'comparison', region: ['Global'], description: 'Google Merchant Center', status: 'connected', features: ['Product listings', 'Performance Max'] },
  { id: 'facebook-catalog', name: 'Meta Catalog', platform: 'facebook', category: 'comparison', region: ['Global'], description: 'Facebook & Instagram Shopping', status: 'available', features: ['Shops', 'Checkout'] },
  { id: 'pinterest', name: 'Pinterest Shopping', platform: 'pinterest', category: 'comparison', region: ['Global'], description: 'Catalogue Pinterest', status: 'available' },
  { id: 'idealo', name: 'Idealo', platform: 'idealo', category: 'comparison', region: ['Europe'], description: 'Comparateur prix européen', status: 'available' },
  { id: 'kelkoo', name: 'Kelkoo', platform: 'kelkoo', category: 'comparison', region: ['Europe'], description: 'Comparateur de prix', status: 'available' },
  { id: 'leguide', name: 'LeGuide', platform: 'leguide', category: 'comparison', region: ['France'], description: 'Comparateur français', status: 'available' },
  { id: 'shopping-com', name: 'Shopping.com', platform: 'shopping', category: 'comparison', region: ['Global'], description: 'Comparateur eBay', status: 'available' },
  { id: 'pricerunner', name: 'PriceRunner', platform: 'pricerunner', category: 'comparison', region: ['Europe'], description: 'Comparateur nordique', status: 'available' },
  { id: 'shopzilla', name: 'Shopzilla', platform: 'shopzilla', category: 'comparison', region: ['Global'], description: 'Shopping comparison', status: 'available' },
  { id: 'beslist', name: 'Beslist.nl', platform: 'beslist', category: 'comparison', region: ['Netherlands'], description: 'Comparateur Pays-Bas', status: 'available' },
  { id: 'billiger', name: 'Billiger.de', platform: 'billiger', category: 'comparison', region: ['Germany'], description: 'Comparateur allemand', status: 'available' },
  { id: 'geizhals', name: 'Geizhals', platform: 'geizhals', category: 'comparison', region: ['Germany', 'Austria'], description: 'Comparateur DACH', status: 'available' },
  { id: 'trovaprezzi', name: 'TrovaPrezzi', platform: 'trovaprezzi', category: 'comparison', region: ['Italy'], description: 'Comparateur italien', status: 'available' },
  
  // Affiliates
  { id: 'awin', name: 'Awin', platform: 'awin', category: 'affiliate', region: ['Global'], description: 'Réseau affiliation global', status: 'available' },
  { id: 'tradedoubler', name: 'Tradedoubler', platform: 'tradedoubler', category: 'affiliate', region: ['Europe'], description: 'Réseau affiliation européen', status: 'available' },
  { id: 'cj-affiliate', name: 'CJ Affiliate', platform: 'cj', category: 'affiliate', region: ['Global'], description: 'Commission Junction', status: 'available' },
  { id: 'rakuten-advertising', name: 'Rakuten Advertising', platform: 'rakuten-ads', category: 'affiliate', region: ['Global'], description: 'Ex-LinkShare', status: 'available' },
  { id: 'shareasale', name: 'ShareASale', platform: 'shareasale', category: 'affiliate', region: ['US'], description: 'Réseau affiliation US', status: 'available' },
  { id: 'effiliation', name: 'Effiliation', platform: 'effiliation', category: 'affiliate', region: ['France'], description: 'Affiliation française', status: 'available' },
  { id: 'webgains', name: 'Webgains', platform: 'webgains', category: 'affiliate', region: ['Europe'], description: 'Réseau affiliation EU', status: 'available' },
  
  // Shipping & Logistics
  { id: '17track', name: '17TRACK', platform: '17track', category: 'shipping', region: ['Global'], description: 'Suivi colis universel', status: 'connected', features: ['900+ transporteurs'] },
  { id: 'aftership', name: 'AfterShip', platform: 'aftership', category: 'shipping', region: ['Global'], description: 'Tracking & notifications', status: 'available' },
  { id: 'shipstation', name: 'ShipStation', platform: 'shipstation', category: 'shipping', region: ['Global'], description: 'Gestion expéditions', status: 'available' },
  { id: 'easyship', name: 'Easyship', platform: 'easyship', category: 'shipping', region: ['Global'], description: 'Shipping international', status: 'available' },
  { id: 'sendcloud', name: 'Sendcloud', platform: 'sendcloud', category: 'shipping', region: ['Europe'], description: 'Shipping européen', status: 'available', isNew: true },
  { id: 'colissimo', name: 'Colissimo', platform: 'colissimo', category: 'shipping', region: ['France'], description: 'La Poste France', status: 'available' },
  { id: 'chronopost', name: 'Chronopost', platform: 'chronopost', category: 'shipping', region: ['France'], description: 'Express France', status: 'available' },
  { id: 'mondial-relay', name: 'Mondial Relay', platform: 'mondial-relay', category: 'shipping', region: ['Europe'], description: 'Points relais', status: 'available' },
  { id: 'dhl', name: 'DHL', platform: 'dhl', category: 'shipping', region: ['Global'], description: 'Express & eCommerce', status: 'available' },
  { id: 'ups', name: 'UPS', platform: 'ups', category: 'shipping', region: ['Global'], description: 'United Parcel Service', status: 'available' },
  { id: 'fedex', name: 'FedEx', platform: 'fedex', category: 'shipping', region: ['Global'], description: 'Express shipping', status: 'available' },
  { id: 'dpd', name: 'DPD', platform: 'dpd', category: 'shipping', region: ['Europe'], description: 'Dynamic Parcel Distribution', status: 'available' },
  { id: 'gls', name: 'GLS', platform: 'gls', category: 'shipping', region: ['Europe'], description: 'General Logistics Systems', status: 'available' },
  
  // Import Tools
  { id: 'url-import', name: 'Import par URL', platform: 'url', category: 'import', region: ['Global'], description: 'Importez depuis n\'importe quelle URL', status: 'connected', features: ['IA extraction', 'Multi-plateformes'] },
  { id: 'csv-import', name: 'Import CSV/Excel', platform: 'csv', category: 'import', region: ['Global'], description: 'Import en masse par fichier', status: 'connected', features: ['Mapping intelligent', 'Validation'] },
  { id: 'xml-feed', name: 'Flux XML', platform: 'xml', category: 'import', region: ['Global'], description: 'Import flux XML fournisseur', status: 'available' },
  { id: 'api-custom', name: 'API Personnalisée', platform: 'api', category: 'import', region: ['Global'], description: 'Connecteur API sur-mesure', status: 'available', isPremium: true },
  { id: 'ftp-sftp', name: 'FTP/SFTP', platform: 'ftp', category: 'import', region: ['Global'], description: 'Synchronisation par FTP', status: 'available' },
  { id: 'google-sheets', name: 'Google Sheets', platform: 'google-sheets', category: 'import', region: ['Global'], description: 'Sync avec Google Sheets', status: 'beta', isNew: true },
  
  // ERP & Inventory
  { id: 'odoo', name: 'Odoo', platform: 'odoo', category: 'erp', region: ['Global'], description: 'ERP open source', status: 'available' },
  { id: 'sage', name: 'Sage', platform: 'sage', category: 'erp', region: ['Global'], description: 'Comptabilité & gestion', status: 'available', isPremium: true },
  { id: 'quickbooks', name: 'QuickBooks', platform: 'quickbooks', category: 'erp', region: ['Global'], description: 'Comptabilité Intuit', status: 'available' },
  { id: 'xero', name: 'Xero', platform: 'xero', category: 'erp', region: ['Global'], description: 'Comptabilité cloud', status: 'available' },
  { id: 'inventory-planner', name: 'Inventory Planner', platform: 'inventory-planner', category: 'erp', region: ['Global'], description: 'Gestion stocks avancée', status: 'available' },
  { id: 'tradegecko', name: 'TradeGecko/QuickBooks Commerce', platform: 'tradegecko', category: 'erp', region: ['Global'], description: 'Inventory management', status: 'available' },
];

const categories: Category[] = [
  { id: 'all', name: 'Tous les connecteurs', icon: <LayoutGrid className="h-4 w-4" /> },
  { id: 'ecommerce', name: 'Plateformes E-commerce', icon: <Store className="h-4 w-4" /> },
  { id: 'marketplace', name: 'Marketplaces', icon: <ShoppingBag className="h-4 w-4" /> },
  { id: 'supplier', name: 'Fournisseurs Dropshipping', icon: <Package className="h-4 w-4" /> },
  { id: 'comparison', name: 'Comparateurs & Shopping', icon: <Tags className="h-4 w-4" /> },
  { id: 'affiliate', name: 'Affiliation', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'shipping', name: 'Shipping & Logistique', icon: <Truck className="h-4 w-4" /> },
  { id: 'import', name: 'Outils d\'Import', icon: <Link2 className="h-4 w-4" /> },
  { id: 'erp', name: 'ERP & Comptabilité', icon: <Building2 className="h-4 w-4" /> },
];

const regions = [
  'Global',
  'Europe',
  'France',
  'Germany',
  'Netherlands',
  'Belgium',
  'Poland',
  'Italy',
  'US',
  'North America',
  'Latin America',
  'Asia',
];

export default function MarketplaceConnectorsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showConnectedOnly, setShowConnectedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const filteredConnectors = useMemo(() => {
    return allConnectors.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           c.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
      const matchesRegion = !selectedRegion || c.region?.includes(selectedRegion);
      const matchesConnected = !showConnectedOnly || c.status === 'connected';
      return matchesSearch && matchesCategory && matchesRegion && matchesConnected;
    });
  }, [searchQuery, selectedCategory, selectedRegion, showConnectedOnly]);

  const categoriesWithCounts = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      count: cat.id === 'all' 
        ? allConnectors.length 
        : allConnectors.filter(c => c.category === cat.id).length
    }));
  }, []);

  const connectedCount = allConnectors.filter(c => c.status === 'connected').length;

  const handleConnect = async (connector: Connector) => {
    if (connector.status === 'coming_soon') {
      toast.info('Cette intégration sera bientôt disponible');
      return;
    }

    if (connector.status === 'connected') {
      navigate(`/integrations/${connector.id}/settings`);
      return;
    }

    setConnectingId(connector.id);

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
      case 'google-shopping':
        navigate('/marketing/google-ads');
        break;
      case 'tiktokshop':
        navigate('/integrations/tiktok-shop');
        break;
      default:
        toast.info(`Configuration de ${connector.name}...`);
        setTimeout(() => {
          setConnectingId(null);
          toast.success(`${connector.name} prêt à être configuré`);
        }, 1000);
    }
  };

  const getStatusBadge = (connector: Connector) => {
    if (connector.isNew) {
      return <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[10px] px-1.5">NEW</Badge>;
    }
    if (connector.isPremium) {
      return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-1.5">PRO</Badge>;
    }
    switch (connector.status) {
      case 'connected':
        return <Badge className="bg-green-500 text-white text-[10px] px-1.5">Connecté</Badge>;
      case 'beta':
        return <Badge className="bg-blue-500 text-white text-[10px] px-1.5">BETA</Badge>;
      case 'coming_soon':
        return <Badge variant="secondary" className="text-[10px] px-1.5">Bientôt</Badge>;
      default:
        return null;
    }
  };

  const ConnectorGridCard = ({ connector }: { connector: Connector }) => (
    <Card 
      className={cn(
        "group relative overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer border",
        connector.status === 'connected' && "ring-1 ring-green-500/20 bg-green-50/30 dark:bg-green-950/10"
      )}
      onClick={() => handleConnect(connector)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <PlatformLogo platform={connector.platform} size="lg" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate">{connector.name}</h3>
              {getStatusBadge(connector)}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {connector.description}
            </p>
            {connector.region && connector.region.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {connector.region.slice(0, 2).join(', ')}
                  {connector.region.length > 2 && ` +${connector.region.length - 2}`}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        {/* Action indicator */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {connector.status === 'connected' ? (
            <Settings className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Plus className="h-4 w-4 text-primary" />
          )}
        </div>
      </CardContent>
    </Card>
  );

  const ConnectorListCard = ({ connector }: { connector: Connector }) => (
    <div 
      className={cn(
        "group flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer",
        connector.status === 'connected' && "bg-green-50/30 dark:bg-green-950/10 border-green-200 dark:border-green-900"
      )}
      onClick={() => handleConnect(connector)}
    >
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <PlatformLogo platform={connector.platform} size="md" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{connector.name}</h3>
          {getStatusBadge(connector)}
          {connector.status === 'connected' && (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{connector.description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {connector.region && (
          <span className="text-xs text-muted-foreground hidden sm:block">
            {connector.region[0]}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Connecteurs Marketplace - Channable-style | ShopOpti</title>
        <meta name="description" content="Connectez toutes vos marketplaces, fournisseurs et canaux de vente" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="border-b bg-gradient-to-br from-primary/5 via-background to-purple-500/5">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Boxes className="h-5 w-5 text-primary" />
                  </div>
                  Connecteurs Marketplace
                </h1>
                <p className="text-muted-foreground mt-2">
                  Connectez vos boutiques, marketplaces et fournisseurs en quelques clics
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">{connectedCount} connectés</span>
                </div>
                <Badge variant="outline" className="px-3 py-1.5">
                  {allConnectors.length} intégrations
                </Badge>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un connecteur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <div className="flex items-center gap-2">
                <select 
                  className="h-11 px-3 rounded-md border bg-background text-sm"
                  value={selectedRegion || ''}
                  onChange={(e) => setSelectedRegion(e.target.value || null)}
                >
                  <option value="">Toutes régions</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
                <Button
                  variant={showConnectedOnly ? "default" : "outline"}
                  size="sm"
                  className="h-11"
                  onClick={() => setShowConnectedOnly(!showConnectedOnly)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Connectés
                </Button>
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-9 px-2.5"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-9 px-2.5"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Sidebar Categories */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Catégories
                </h3>
                <nav className="space-y-1">
                  {categoriesWithCounts.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedCategory === category.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {category.icon}
                        {category.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {category.count}
                      </Badge>
                    </button>
                  ))}
                </nav>

                {/* Quick Stats */}
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Statistiques</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connecteurs</span>
                      <span className="font-medium">{allConnectors.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connectés</span>
                      <span className="font-medium text-green-600">{connectedCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Disponibles</span>
                      <span className="font-medium">{allConnectors.length - connectedCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Connectors Grid/List */}
            <div className="flex-1">
              {/* Mobile Category Select */}
              <div className="lg:hidden mb-4">
                <select 
                  className="w-full h-10 px-3 rounded-md border bg-background"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categoriesWithCounts.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {filteredConnectors.length} connecteur{filteredConnectors.length > 1 ? 's' : ''} trouvé{filteredConnectors.length > 1 ? 's' : ''}
                </p>
              </div>

              {/* Connectors */}
              {viewMode === 'grid' ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredConnectors.map(connector => (
                    <ConnectorGridCard key={connector.id} connector={connector} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredConnectors.map(connector => (
                    <ConnectorListCard key={connector.id} connector={connector} />
                  ))}
                </div>
              )}

              {filteredConnectors.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <h3 className="mt-4 font-medium">Aucun connecteur trouvé</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Essayez de modifier vos filtres de recherche
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Link2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Connecteur personnalisé</h3>
                  <p className="text-sm text-muted-foreground">
                    Besoin d'une intégration spécifique ? Contactez-nous
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/support')}>
                Demander une intégration
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
