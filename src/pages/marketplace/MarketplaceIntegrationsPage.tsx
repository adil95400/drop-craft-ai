/**
 * MarketplaceIntegrationsPage — Design aligné sur /integrations (ChannableStyle)
 * Hero stats, search + category filters, card grid with hover effects
 */
import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Store,
  Code,
  Plug,
  Star,
  Sparkles,
  ShoppingCart,
  BarChart3,
  Truck,
  Shield,
  Palette,
  MessageSquare,
  Zap,
  ExternalLink,
  CheckCircle2,
  Clock,
  Activity,
  ChevronRight,
  PlugZap,
  Globe,
  Download,
  Terminal,
  Copy,
  Check,
  Settings,
  RefreshCw,
  AlertCircle,
  ToggleLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

// ─── Services Data ────────────────────────────────────────────
interface MarketplaceService {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  rating: number;
  installs: string;
  pricing: string;
  status: 'available' | 'installed' | 'coming_soon';
  tags: string[];
  features?: string[];
  popular?: boolean;
}

const SERVICES: MarketplaceService[] = [
  { id: '1', name: 'Stripe Payments', description: 'Acceptez les paiements par carte et gérez les abonnements', category: 'Paiements', icon: <ShoppingCart className="h-6 w-6" />, rating: 4.9, installs: '12K+', pricing: 'Gratuit', status: 'installed', tags: ['paiement', 'stripe'], features: ['Paiements', 'Abonnements', 'Factures'], popular: true },
  { id: '2', name: 'Google Analytics 4', description: 'Suivi avancé du trafic et des conversions e-commerce', category: 'Analytics', icon: <BarChart3 className="h-6 w-6" />, rating: 4.7, installs: '28K+', pricing: 'Gratuit', status: 'available', tags: ['analytics', 'google'], features: ['Trafic', 'Conversions', 'Reports'], popular: true },
  { id: '3', name: 'ShipStation', description: 'Automatisation des expéditions multi-transporteurs', category: 'Logistique', icon: <Truck className="h-6 w-6" />, rating: 4.5, installs: '8K+', pricing: '9.99€/mois', status: 'available', tags: ['shipping', 'logistique'], features: ['Expéditions', 'Suivi'] },
  { id: '4', name: 'Trustpilot Reviews', description: 'Collecte et affichage automatique des avis clients', category: 'Marketing', icon: <Star className="h-6 w-6" />, rating: 4.6, installs: '15K+', pricing: 'Freemium', status: 'available', tags: ['avis', 'reviews'], features: ['Avis', 'Widgets'], popular: true },
  { id: '5', name: 'Mailchimp', description: 'Email marketing automation et segmentation avancée', category: 'Marketing', icon: <MessageSquare className="h-6 w-6" />, rating: 4.4, installs: '20K+', pricing: 'Freemium', status: 'available', tags: ['email', 'marketing'], features: ['Email', 'Automation', 'Segments'] },
  { id: '6', name: 'Canva Design', description: 'Créez des visuels produits professionnels en quelques clics', category: 'Design', icon: <Palette className="h-6 w-6" />, rating: 4.8, installs: '10K+', pricing: 'Gratuit', status: 'coming_soon', tags: ['design', 'images'], features: ['Visuels', 'Templates'] },
  { id: '7', name: 'Fraud Shield AI', description: 'Détection de fraude en temps réel propulsée par IA', category: 'Sécurité', icon: <Shield className="h-6 w-6" />, rating: 4.3, installs: '5K+', pricing: '19.99€/mois', status: 'available', tags: ['sécurité', 'fraude'], features: ['Détection', 'Alertes'] },
  { id: '8', name: 'Zapier Connector', description: 'Connectez 5000+ apps sans code avec des workflows automatisés', category: 'Automatisation', icon: <Zap className="h-6 w-6" />, rating: 4.7, installs: '18K+', pricing: 'Freemium', status: 'installed', tags: ['automation', 'zapier'], features: ['Workflows', 'Triggers'], popular: true },
];

const SERVICE_CATEGORIES = [
  { id: 'all', label: 'Tous', icon: Globe },
  { id: 'Paiements', label: 'Paiements', icon: ShoppingCart },
  { id: 'Analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'Logistique', label: 'Logistique', icon: Truck },
  { id: 'Marketing', label: 'Marketing', icon: MessageSquare },
  { id: 'Design', label: 'Design', icon: Palette },
  { id: 'Sécurité', label: 'Sécurité', icon: Shield },
  { id: 'Automatisation', label: 'Automatisation', icon: Zap },
];

// ─── Connectors Data ──────────────────────────────────────────
interface Connector {
  id: string;
  name: string;
  description: string;
  logo: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync?: string;
  syncProgress?: number;
  dataPoints: number;
  enabled: boolean;
  category: string;
}

const CONNECTORS: Connector[] = [
  { id: '1', name: 'Shopify', description: 'Synchronisation catalogue, commandes et inventaire', logo: '🛍️', status: 'connected', lastSync: 'il y a 5 min', dataPoints: 1250, enabled: true, category: 'E-commerce' },
  { id: '2', name: 'WooCommerce', description: 'Intégration WordPress e-commerce bidirectionnelle', logo: '🔮', status: 'connected', lastSync: 'il y a 12 min', dataPoints: 830, enabled: true, category: 'E-commerce' },
  { id: '3', name: 'Amazon Seller', description: 'Gestion listings, prix et stock Amazon', logo: '📦', status: 'syncing', syncProgress: 67, dataPoints: 450, enabled: true, category: 'Marketplace' },
  { id: '4', name: 'eBay', description: 'Publication et synchronisation multi-formats eBay', logo: '🏷️', status: 'disconnected', dataPoints: 0, enabled: false, category: 'Marketplace' },
  { id: '5', name: 'Google Merchant', description: 'Flux Shopping et campagnes Performance Max', logo: '🔍', status: 'connected', lastSync: 'il y a 1h', dataPoints: 2100, enabled: true, category: 'Publicité' },
  { id: '6', name: 'Meta Ads', description: 'Catalogue Facebook & Instagram Shops', logo: '📱', status: 'error', lastSync: 'Échec', dataPoints: 0, enabled: true, category: 'Publicité' },
  { id: '7', name: 'Slack', description: 'Notifications temps réel commandes et alertes stock', logo: '💬', status: 'connected', lastSync: 'il y a 2 min', dataPoints: 500, enabled: true, category: 'Communication' },
  { id: '8', name: 'HubSpot CRM', description: 'Sync contacts, deals et activités commerciales', logo: '🧡', status: 'disconnected', dataPoints: 0, enabled: false, category: 'CRM' },
];

// ─── SDK Data ─────────────────────────────────────────────────
const SDK_SNIPPETS: Record<string, Record<string, string>> = {
  'Produits': {
    javascript: `import ShopOpti from 'shopopti-sdk';\n\nconst client = new ShopOpti({ apiKey: 'YOUR_API_KEY' });\nconst products = await client.products.list({ limit: 50 });`,
    python: `from shopopti import ShopOpti\n\nclient = ShopOpti(api_key="YOUR_API_KEY")\nproducts = client.products.list(limit=50)`,
    curl: `curl -X GET "https://api.shopopti.com/v1/products?limit=50" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
  'Commandes': {
    javascript: `const orders = await client.orders.list({ status: 'pending' });\nawait client.orders.update('ord_456', { status: 'shipped' });`,
    python: `orders = client.orders.list(status="pending")\nclient.orders.update("ord_456", status="shipped")`,
    curl: `curl -X GET "https://api.shopopti.com/v1/orders?status=pending" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
  'Inventaire': {
    javascript: `const stock = await client.inventory.get('SKU-001');\nawait client.inventory.update('SKU-001', { quantity: 150 });`,
    python: `stock = client.inventory.get("SKU-001")\nclient.inventory.update("SKU-001", quantity=150)`,
    curl: `curl -X GET "https://api.shopopti.com/v1/stock/SKU-001" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
};

const LANGUAGES = [
  { key: 'javascript', label: 'JavaScript', icon: '🟨' },
  { key: 'python', label: 'Python', icon: '🐍' },
  { key: 'curl', label: 'cURL', icon: '🔗' },
];

// ─── Hero Stats Component ─────────────────────────────────────
function HeroStats() {
  const installed = SERVICES.filter(s => s.status === 'installed').length;
  const connectedCount = CONNECTORS.filter(c => c.status === 'connected' || c.status === 'syncing').length;
  const errors = CONNECTORS.filter(c => c.status === 'error').length;

  return (
    <div className="flex flex-wrap gap-6 mt-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
          <PlugZap className="w-5 h-5 text-success" />
        </div>
        <div>
          <p className="text-2xl font-bold">{connectedCount}</p>
          <p className="text-xs text-muted-foreground">Connectés</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{installed}</p>
          <p className="text-xs text-muted-foreground">Installés</p>
        </div>
      </div>
      {errors > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold">{errors}</p>
            <p className="text-xs text-muted-foreground">Erreurs</p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <Globe className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-2xl font-bold">{SERVICES.length + CONNECTORS.length}</p>
          <p className="text-xs text-muted-foreground">Disponibles</p>
        </div>
      </div>
    </div>
  );
}

// ─── Service Card (same pattern as IntegrationCard) ───────────
function ServiceCard({ service }: { service: MarketplaceService }) {
  const isInstalled = service.status === 'installed';
  const isComingSoon = service.status === 'coming_soon';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative bg-card rounded-xl border hover:shadow-lg transition-all duration-300 p-5 cursor-pointer",
        isInstalled
          ? "border-success/30 hover:border-success/50"
          : "border-border hover:border-primary/30",
        isComingSoon && "opacity-70"
      )}
    >
      {/* Status Badge */}
      <div className="absolute top-3 right-3">
        {isInstalled ? (
          <Badge className="bg-success/10 text-success border-success/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Installé
          </Badge>
        ) : isComingSoon ? (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Bientôt
          </Badge>
        ) : service.popular ? (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <Sparkles className="h-3 w-3 mr-1" />
            Populaire
          </Badge>
        ) : null}
      </div>

      {/* Icon */}
      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4 overflow-hidden group-hover:scale-105 transition-transform text-primary">
        {service.icon}
      </div>

      {/* Name */}
      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
        {service.name}
      </h3>

      {/* Description */}
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
        {service.description}
      </p>

      {/* Features */}
      {service.features && service.features.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {service.features.slice(0, 2).map(f => (
            <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {f}
            </span>
          ))}
          {service.features.length > 2 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              +{service.features.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Rating & Pricing */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-2 border-t border-dashed">
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3 text-primary fill-primary" />
          {service.rating}
        </span>
        <span>{service.installs}</span>
        <span className="font-medium text-foreground">{service.pricing}</span>
      </div>

      {/* Arrow */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4 text-primary" />
      </div>
    </motion.div>
  );
}

// ─── Connector Card (same pattern) ────────────────────────────
const statusConfig = {
  connected: { icon: <CheckCircle2 className="h-3 w-3" />, label: 'Connecté', badgeClass: 'bg-success/10 text-success border-success/30' },
  disconnected: { icon: <Clock className="h-3 w-3" />, label: 'Déconnecté', badgeClass: '' },
  error: { icon: <AlertCircle className="h-3 w-3" />, label: 'Erreur', badgeClass: '' },
  syncing: { icon: <RefreshCw className="h-3 w-3 animate-spin" />, label: 'Sync...', badgeClass: 'bg-primary/10 text-primary border-primary/30' },
};

function ConnectorCard({ connector }: { connector: Connector }) {
  const config = statusConfig[connector.status];
  const isActive = connector.status === 'connected' || connector.status === 'syncing';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative bg-card rounded-xl border hover:shadow-lg transition-all duration-300 p-5 cursor-pointer",
        isActive
          ? "border-success/30 hover:border-success/50"
          : connector.status === 'error'
          ? "border-destructive/30 hover:border-destructive/50"
          : "border-border hover:border-primary/30"
      )}
    >
      {/* Status Badge */}
      <div className="absolute top-3 right-3">
        <Badge variant={connector.status === 'error' ? 'destructive' : connector.status === 'disconnected' ? 'secondary' : 'outline'} className={config.badgeClass}>
          {config.icon}
          <span className="ml-1">{config.label}</span>
        </Badge>
      </div>

      {/* Logo */}
      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
        <span className="text-3xl">{connector.logo}</span>
      </div>

      {/* Name */}
      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
        {connector.name}
      </h3>

      {/* Description */}
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
        {connector.description}
      </p>

      {/* Category tag */}
      <div className="flex flex-wrap gap-1 mt-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {connector.category}
        </span>
      </div>

      {/* Bottom info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-2 border-t border-dashed">
        {connector.lastSync && connector.status !== 'syncing' ? (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {connector.lastSync}
          </span>
        ) : connector.status === 'syncing' ? (
          <span className="flex items-center gap-1 text-primary">
            <RefreshCw className="w-3 h-3 animate-spin" />
            {connector.syncProgress}%
          </span>
        ) : (
          <span>—</span>
        )}
        {connector.dataPoints > 0 && (
          <span>{connector.dataPoints.toLocaleString()} pts</span>
        )}
      </div>

      {/* Arrow */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4 text-primary" />
      </div>
    </motion.div>
  );
}

// ─── SDK Section ──────────────────────────────────────────────
function SDKSection() {
  const [copied, setCopied] = useState<string | null>(null);
  const [lang, setLang] = useState('javascript');

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopied(key);
    toast.success('Code copié !');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Language pills */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {LANGUAGES.map(l => (
            <Button
              key={l.key}
              variant={lang === l.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLang(l.key)}
              className="gap-2 whitespace-nowrap"
            >
              <span>{l.icon}</span> {l.label}
            </Button>
          ))}
          <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap">
            <Download className="h-4 w-4" /> SDK Package
          </Button>
          <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap">
            <Terminal className="h-4 w-4" /> npm install shopopti-sdk
          </Button>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Code cards in grid like integration cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(SDK_SNIPPETS).map(([domain, snippets]) => (
          <motion.div
            key={domain}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="group relative bg-card rounded-xl border hover:shadow-lg transition-all duration-300 p-5 cursor-pointer border-border hover:border-primary/30"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Code className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{domain}</h3>
                  <p className="text-xs text-muted-foreground">{LANGUAGES.find(l => l.key === lang)?.label}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); copyCode(snippets[lang], `${domain}-${lang}`); }}
                className="gap-1 h-8"
              >
                {copied === `${domain}-${lang}` ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                <span className="text-xs">{copied === `${domain}-${lang}` ? 'Copié' : 'Copier'}</span>
              </Button>
            </div>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto font-mono leading-relaxed max-h-32">
              <code>{snippets[lang]}</code>
            </pre>
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-dashed">
              <Badge variant="outline" className="text-[10px]">REST API</Badge>
              <Badge variant="outline" className="text-[10px]">v1</Badge>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick reference */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: 'Base URL', value: 'https://api.shopopti.com/v1' },
          { label: 'Auth', value: 'Bearer Token (Header)' },
          { label: 'Rate Limit', value: '1000 req/min (Pro)' },
        ].map(item => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <Badge variant="outline" className="mb-2">{item.label}</Badge>
              <p className="font-mono text-xs text-muted-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function MarketplaceIntegrationsPage() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Filtered services
  const filteredServices = useMemo(() => {
    return SERVICES.filter(s => {
      const matchSearch = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.tags.some(t => t.includes(searchTerm.toLowerCase()));
      const matchCat = activeCategory === 'all' || s.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [searchTerm, activeCategory]);

  // Filtered connectors
  const filteredConnectors = useMemo(() => {
    return CONNECTORS.filter(c => {
      const matchSearch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [searchTerm]);

  return (
    <>
      <Helmet>
        <title>Marketplace & Services - Hub d'Intégrations</title>
        <meta name="description" content="Explorez les services, connecteurs tiers et SDK pour étendre votre plateforme e-commerce." />
      </Helmet>

      <ChannablePageWrapper
        title="Marketplace"
        subtitle="Services & Intégrations"
        description={`Explorez ${SERVICES.length + CONNECTORS.length}+ services, connecteurs et SDK pour étendre votre plateforme`}
        heroImage="marketing"
        badge={{ label: 'Pro', icon: Star }}
      >
        {/* Hero Stats */}
        <HeroStats />

        {/* Tabs as section switcher */}
        <section className="mt-8">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchTerm(''); setActiveCategory('all'); }}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <TabsList className="w-auto inline-flex">
                <TabsTrigger value="marketplace" className="gap-2">
                  <Store className="h-4 w-4" />
                  Services
                </TabsTrigger>
                <TabsTrigger value="connectors" className="gap-2">
                  <Plug className="h-4 w-4" />
                  Connecteurs
                </TabsTrigger>
                <TabsTrigger value="sdk" className="gap-2">
                  <Code className="h-4 w-4" />
                  SDK
                </TabsTrigger>
              </TabsList>

              {/* Search bar */}
              {activeTab !== 'sdk' && (
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={activeTab === 'marketplace' ? 'Rechercher un service...' : 'Rechercher un connecteur...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-11 bg-background/80 backdrop-blur-sm border-muted"
                  />
                </div>
              )}
            </div>

            {/* Category filters for services tab */}
            <TabsContent value="marketplace" className="space-y-6 mt-0">
              {/* Category pills - scrollable like /integrations */}
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                  {SERVICE_CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;
                    return (
                      <Button
                        key={cat.id}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                          "gap-2 whitespace-nowrap transition-all",
                          isActive && "shadow-md"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {cat.label}
                      </Button>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {/* Service cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredServices.map(service => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </AnimatePresence>
              </div>

              {filteredServices.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Aucun service trouvé</p>
                  <p className="text-sm">Essayez de modifier vos filtres</p>
                </div>
              )}
            </TabsContent>

            {/* Connectors tab */}
            <TabsContent value="connectors" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredConnectors.map(connector => (
                    <ConnectorCard key={connector.id} connector={connector} />
                  ))}
                </AnimatePresence>
              </div>

              {filteredConnectors.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Plug className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Aucun connecteur trouvé</p>
                  <p className="text-sm">Essayez de modifier votre recherche</p>
                </div>
              )}
            </TabsContent>

            {/* SDK tab */}
            <TabsContent value="sdk" className="mt-0">
              <SDKSection />
            </TabsContent>
          </Tabs>
        </section>
      </ChannablePageWrapper>
    </>
  );
}
