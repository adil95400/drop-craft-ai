/**
 * Supplier Connector Hub
 * Unified interface for managing all supplier connections
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Plug, 
  Plus, 
  RefreshCw, 
  Settings, 
  Trash2, 
  Check, 
  AlertCircle,
  Package,
  Globe,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';

interface SupplierConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  logo: string;
  category: 'dropshipping' | 'wholesale' | 'marketplace' | 'pod';
  region: string[];
  features: string[];
  authType: 'api_key' | 'oauth' | 'credentials';
  authFields: { name: string; label: string; type: string; required: boolean; placeholder?: string }[];
  apiDocsUrl?: string;
  pricing?: string;
}

const SUPPLIER_CONFIGS: SupplierConfig[] = [
  {
    id: 'aliexpress',
    name: 'AliExpress',
    displayName: 'AliExpress Dropshipping',
    description: 'Accès à des millions de produits avec livraison mondiale. Programme Affiliate pour les prix compétitifs.',
    logo: '🛒',
    category: 'dropshipping',
    region: ['Global', 'China'],
    features: ['Millions de produits', 'Livraison mondiale', 'Prix compétitifs', 'Programme Affiliate'],
    authType: 'api_key',
    authFields: [
      { name: 'app_key', label: 'App Key', type: 'text', required: true, placeholder: 'Votre App Key AliExpress' },
      { name: 'app_secret', label: 'App Secret', type: 'password', required: true, placeholder: 'Votre App Secret' },
      { name: 'tracking_id', label: 'Tracking ID (Affiliate)', type: 'text', required: false, placeholder: 'ID de tracking affiliate' }
    ],
    apiDocsUrl: 'https://developers.aliexpress.com/',
    pricing: 'Gratuit (Commission sur ventes)'
  },
  {
    id: 'cjdropshipping',
    name: 'CJ Dropshipping',
    displayName: 'CJ Dropshipping',
    description: 'Solution complète avec fulfillment, warehousing et services POD. Délais de livraison optimisés.',
    logo: '📦',
    category: 'dropshipping',
    region: ['Global', 'China', 'USA', 'EU'],
    features: ['Fulfillment intégré', 'POD', 'Entrepôts mondiaux', 'API robuste'],
    authType: 'credentials',
    authFields: [
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'votre@email.com' },
      { name: 'password', label: 'Mot de passe', type: 'password', required: true, placeholder: 'Votre mot de passe CJ' }
    ],
    apiDocsUrl: 'https://developers.cjdropshipping.com/',
    pricing: 'Gratuit'
  },
  {
    id: 'bigbuy',
    name: 'BigBuy',
    displayName: 'BigBuy',
    description: 'Grossiste européen premium avec +200,000 produits. Livraison rapide EU, support multilingue.',
    logo: '🏪',
    category: 'wholesale',
    region: ['Europe', 'Spain'],
    features: ['200K+ produits', 'Livraison EU rapide', 'Dropshipping automatisé', 'Support FR'],
    authType: 'api_key',
    authFields: [
      { name: 'api_key', label: 'Clé API', type: 'password', required: true, placeholder: 'Votre clé API BigBuy' }
    ],
    apiDocsUrl: 'https://api.bigbuy.eu/doc/',
    pricing: 'Abonnement mensuel'
  },
  {
    id: 'printful',
    name: 'Printful',
    displayName: 'Printful',
    description: 'Print-on-demand leader avec qualité premium. Intégration automatique avec Shopify, WooCommerce.',
    logo: '🎨',
    category: 'pod',
    region: ['Global', 'USA', 'EU'],
    features: ['POD premium', 'Mockup gratuits', 'Branding personnalisé', 'Intégrations natives'],
    authType: 'api_key',
    authFields: [
      { name: 'api_key', label: 'Clé API', type: 'password', required: true, placeholder: 'Votre clé API Printful' }
    ],
    apiDocsUrl: 'https://developers.printful.com/',
    pricing: 'Paiement à la commande'
  },
  {
    id: 'vidaxl',
    name: 'VidaXL',
    displayName: 'VidaXL',
    description: 'Spécialiste européen du mobilier et jardin. Plus de 90,000 produits avec livraison rapide.',
    logo: '🏠',
    category: 'wholesale',
    region: ['Europe', 'Netherlands'],
    features: ['Mobilier & Jardin', '90K+ produits', 'Livraison EU', 'Prix B2B'],
    authType: 'api_key',
    authFields: [
      { name: 'api_key', label: 'Clé API', type: 'password', required: true, placeholder: 'Votre clé API VidaXL' },
      { name: 'partner_id', label: 'Partner ID', type: 'text', required: true, placeholder: 'Votre ID partenaire' }
    ],
    apiDocsUrl: 'https://www.vidaxl.com/dropshipping',
    pricing: 'Abonnement mensuel'
  },
  {
    id: 'matterhorn',
    name: 'Matterhorn',
    displayName: 'Matterhorn Wholesale',
    description: 'Grossiste mode européen avec marques tendance. Spécialiste vêtements et accessoires.',
    logo: '👗',
    category: 'wholesale',
    region: ['Europe', 'Poland'],
    features: ['Mode & Accessoires', 'Marques tendance', 'Prix grossiste', 'Livraison EU'],
    authType: 'api_key',
    authFields: [
      { name: 'api_key', label: 'Clé API', type: 'password', required: true, placeholder: 'Votre clé API Matterhorn' },
      { name: 'customer_id', label: 'Customer ID', type: 'text', required: true, placeholder: 'Votre ID client' }
    ],
    apiDocsUrl: 'https://b2b.mfrocks.com/',
    pricing: 'Minimum de commande'
  },
  {
    id: 'spocket',
    name: 'Spocket',
    displayName: 'Spocket',
    description: 'Fournisseurs US/EU vérifiés avec livraison rapide. Idéal pour marchés occidentaux.',
    logo: '🚀',
    category: 'dropshipping',
    region: ['USA', 'Europe'],
    features: ['Fournisseurs vérifiés', 'Livraison 2-7 jours', 'Produits US/EU', 'Import 1-click'],
    authType: 'api_key',
    authFields: [
      { name: 'api_key', label: 'Clé API', type: 'password', required: true, placeholder: 'Votre clé API Spocket' }
    ],
    apiDocsUrl: 'https://www.spocket.co/',
    pricing: 'Abonnement mensuel'
  },
  {
    id: 'syncee',
    name: 'Syncee',
    displayName: 'Syncee',
    description: 'Marketplace B2B avec fournisseurs mondiaux. Synchronisation automatique des stocks.',
    logo: '🔄',
    category: 'marketplace',
    region: ['Global'],
    features: ['Marketplace B2B', 'Sync automatique', 'Filtres avancés', 'Intégrations multiples'],
    authType: 'api_key',
    authFields: [
      { name: 'api_key', label: 'Clé API', type: 'password', required: true, placeholder: 'Votre clé API Syncee' }
    ],
    apiDocsUrl: 'https://syncee.com/',
    pricing: 'Freemium'
  }
];

export function SupplierConnectorHub() {
  const queryClient = useQueryClient();
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierConfig | null>(null);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [authFormData, setAuthFormData] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  // Fetch connected suppliers
  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['supplier-connections'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('premium_supplier_connections')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data || []).map(conn => ({
        ...conn,
        supplier_id: conn.premium_supplier_id
      }));
    }
  });

  // Connect supplier mutation
  const connectMutation = useMutation({
    mutationFn: async ({ supplierId, credentials }: { supplierId: string; credentials: Record<string, string> }) => {
      const { data, error } = await supabase.functions.invoke('supplier-connect', {
        body: {
          supplier_id: supplierId,
          settings: credentials
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-connections'] });
      toast.success('Fournisseur connecté avec succès!');
      setConnectDialogOpen(false);
      setSelectedSupplier(null);
      setAuthFormData({});
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Disconnect supplier mutation
  const disconnectMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('premium_supplier_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-connections'] });
      toast.success('Fournisseur déconnecté');
    }
  });

  // Sync supplier mutation
  const syncMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const { data, error } = await supabase.functions.invoke('supplier-sync-products', {
        body: { supplierId, limit: 100 }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sync terminée: ${data?.syncStats?.imported || 0} produits importés`);
    }
  });

  const filteredSuppliers = SUPPLIER_CONFIGS.filter(supplier => {
    const matchesSearch = supplier.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          supplier.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || supplier.category === categoryFilter;
    const matchesRegion = regionFilter === 'all' || supplier.region.includes(regionFilter);
    return matchesSearch && matchesCategory && matchesRegion;
  });

  const getConnectionStatus = (supplierId: string) => {
    return connections.find((c: any) => c.supplier_id === supplierId);
  };

  const handleConnect = (supplier: SupplierConfig) => {
    setSelectedSupplier(supplier);
    setAuthFormData({});
    setConnectDialogOpen(true);
  };

  const handleSubmitConnection = () => {
    if (!selectedSupplier) return;
    
    // Validate required fields
    const missingFields = selectedSupplier.authFields
      .filter(f => f.required && !authFormData[f.name])
      .map(f => f.label);

    if (missingFields.length > 0) {
      toast.error(`Champs requis manquants: ${missingFields.join(', ')}`);
      return;
    }

    connectMutation.mutate({
      supplierId: selectedSupplier.id,
      credentials: authFormData
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dropshipping': return <Package className="h-4 w-4" />;
      case 'wholesale': return <Globe className="h-4 w-4" />;
      case 'marketplace': return <TrendingUp className="h-4 w-4" />;
      case 'pod': return <Zap className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'dropshipping': return 'Dropshipping';
      case 'wholesale': return 'Grossiste';
      case 'marketplace': return 'Marketplace';
      case 'pod': return 'Print-on-Demand';
      default: return category;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Plug className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{connections.length}</p>
                <p className="text-xs text-muted-foreground">Connectés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{SUPPLIER_CONFIGS.length}</p>
                <p className="text-xs text-muted-foreground">Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">50+</p>
                <p className="text-xs text-muted-foreground">Pays couverts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-xs text-muted-foreground">Sécurisé</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un fournisseur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="dropshipping">Dropshipping</SelectItem>
                <SelectItem value="wholesale">Grossiste</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
                <SelectItem value="pod">Print-on-Demand</SelectItem>
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes régions</SelectItem>
                <SelectItem value="Global">Global</SelectItem>
                <SelectItem value="Europe">Europe</SelectItem>
                <SelectItem value="USA">États-Unis</SelectItem>
                <SelectItem value="China">Chine</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((supplier) => {
          const connection = getConnectionStatus(supplier.id);
          const isConnected = !!connection;

          return (
            <Card key={supplier.id} className={`relative ${isConnected ? 'border-green-500/50' : ''}`}>
              {isConnected && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-green-500">
                    <Check className="h-3 w-3 mr-1" />
                    Connecté
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{supplier.logo}</div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{supplier.displayName}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryIcon(supplier.category)}
                        <span className="ml-1">{getCategoryLabel(supplier.category)}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="line-clamp-2">
                  {supplier.description}
                </CardDescription>

                <div className="flex flex-wrap gap-1">
                  {supplier.region.slice(0, 3).map((region) => (
                    <Badge key={region} variant="secondary" className="text-xs">
                      {region}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1">
                  {supplier.features.slice(0, 3).map((feature) => (
                    <span key={feature} className="text-xs text-muted-foreground">
                      • {feature}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  {isConnected ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => syncMutation.mutate(connection.id)}
                        disabled={syncMutation.isPending}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => disconnectMutation.mutate(connection.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleConnect(supplier)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Connecter
                    </Button>
                  )}
                  {supplier.apiDocsUrl && (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={supplier.apiDocsUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connection Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedSupplier?.logo}</span>
              Connecter {selectedSupplier?.displayName}
            </DialogTitle>
            <DialogDescription>
              {selectedSupplier?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedSupplier && (
            <div className="space-y-4">
              {selectedSupplier.authFields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={authFormData[field.name] || ''}
                    onChange={(e) => setAuthFormData(prev => ({
                      ...prev,
                      [field.name]: e.target.value
                    }))}
                  />
                </div>
              ))}

              {selectedSupplier.pricing && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm">
                    <strong>Tarification:</strong> {selectedSupplier.pricing}
                  </p>
                </div>
              )}

              {selectedSupplier.apiDocsUrl && (
                <a
                  href={selectedSupplier.apiDocsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Documentation API
                </a>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmitConnection}
              disabled={connectMutation.isPending}
            >
              {connectMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Plug className="h-4 w-4 mr-2" />
                  Connecter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
