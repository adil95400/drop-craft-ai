import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, 
  Plus, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  ExternalLink,
  Warehouse,
  Package,
  Globe,
  Zap
} from 'lucide-react';
import { AVAILABLE_3PL_PROVIDERS, ThirdPartyLogisticsProvider } from '@/types/logistics';

interface Connected3PL {
  id: string;
  provider_id: string;
  provider_name: string;
  status: 'connected' | 'error' | 'syncing';
  last_sync?: string;
  products_count: number;
  orders_synced: number;
}

export function ThirdPartyLogisticsManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('connected');
  const [selectedProvider, setSelectedProvider] = useState<ThirdPartyLogisticsProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  
  // Mock connected 3PLs - in production this would come from database
  const [connected3PLs, setConnected3PLs] = useState<Connected3PL[]>([
    {
      id: '1',
      provider_id: 'bigblue',
      provider_name: 'Bigblue',
      status: 'connected',
      last_sync: new Date().toISOString(),
      products_count: 156,
      orders_synced: 423
    }
  ]);

  const handleConnect = async () => {
    if (!selectedProvider) return;
    
    setIsConnecting(true);
    
    // Simulate API connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const new3PL: Connected3PL = {
      id: Date.now().toString(),
      provider_id: selectedProvider.id,
      provider_name: selectedProvider.name,
      status: 'connected',
      last_sync: new Date().toISOString(),
      products_count: 0,
      orders_synced: 0
    };
    
    setConnected3PLs(prev => [...prev, new3PL]);
    setIsConnecting(false);
    setSelectedProvider(null);
    setCredentials({});
    
    toast({
      title: "3PL connecté",
      description: `${selectedProvider.name} a été connecté avec succès. La synchronisation initiale va commencer.`
    });
  };

  const handleSync = async (id: string) => {
    setConnected3PLs(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'syncing' as const } : p
    ));
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setConnected3PLs(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'connected' as const, last_sync: new Date().toISOString() } : p
    ));
    
    toast({
      title: "Synchronisation terminée",
      description: "Les données ont été mises à jour."
    });
  };

  const handleDisconnect = (id: string) => {
    setConnected3PLs(prev => prev.filter(p => p.id !== id));
    toast({
      title: "3PL déconnecté",
      description: "La connexion a été supprimée."
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Connecté</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      case 'syncing':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Synchronisation...</Badge>;
      default:
        return <Badge variant="secondary">En attente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Intégrations 3PL
          </h2>
          <p className="text-sm text-muted-foreground">
            Connectez vos partenaires logistiques pour synchroniser automatiquement les stocks
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="connected">
            Connectés ({connected3PLs.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            Disponibles ({AVAILABLE_3PL_PROVIDERS.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connected" className="space-y-4">
          {connected3PLs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">Aucun 3PL connecté</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Connectez un partenaire logistique pour synchroniser automatiquement vos niveaux de stock et gérer vos expéditions.
                </p>
                <Button onClick={() => setActiveTab('available')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un 3PL
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {connected3PLs.map((provider) => {
                const providerInfo = AVAILABLE_3PL_PROVIDERS.find(p => p.id === provider.provider_id);
                
                return (
                  <Card key={provider.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <Warehouse className="h-6 w-6 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{provider.provider_name}</h3>
                              {getStatusBadge(provider.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {providerInfo?.description || 'Partenaire logistique'}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {provider.products_count} produits
                              </span>
                              <span className="flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                {provider.orders_synced} commandes
                              </span>
                              {provider.last_sync && (
                                <span className="text-muted-foreground">
                                  Sync: {new Date(provider.last_sync).toLocaleString('fr-FR')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(provider.id)}
                            disabled={provider.status === 'syncing'}
                          >
                            <RefreshCw className={`h-4 w-4 mr-1 ${provider.status === 'syncing' ? 'animate-spin' : ''}`} />
                            Sync
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDisconnect(provider.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          {/* Popular Providers */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Populaires
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_3PL_PROVIDERS.filter(p => p.is_popular).map((provider) => (
                <ProviderCard 
                  key={provider.id} 
                  provider={provider}
                  isConnected={connected3PLs.some(c => c.provider_id === provider.id)}
                  onConnect={() => setSelectedProvider(provider)}
                />
              ))}
            </div>
          </div>

          {/* All Providers */}
          <div>
            <h3 className="font-medium mb-3">Tous les partenaires</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_3PL_PROVIDERS.filter(p => !p.is_popular).map((provider) => (
                <ProviderCard 
                  key={provider.id} 
                  provider={provider}
                  isConnected={connected3PLs.some(c => c.provider_id === provider.id)}
                  onConnect={() => setSelectedProvider(provider)}
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Connection Dialog */}
      <Dialog open={!!selectedProvider} onOpenChange={(open) => !open && setSelectedProvider(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Connecter {selectedProvider?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedProvider?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProvider && (
            <div className="space-y-4">
              {/* Provider info */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex flex-wrap gap-2">
                  {selectedProvider.features.map((feature, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  {selectedProvider.supported_countries.join(', ')}
                </div>
              </div>

              {/* Credentials form */}
              <div className="space-y-3">
                <h4 className="font-medium">Identifiants de connexion</h4>
                {selectedProvider.setup_requirements.map((req, i) => (
                  <div key={i} className="space-y-1">
                    <Label htmlFor={`cred-${i}`}>{req}</Label>
                    <Input
                      id={`cred-${i}`}
                      type={req.toLowerCase().includes('secret') || req.toLowerCase().includes('key') ? 'password' : 'text'}
                      value={credentials[req] || ''}
                      onChange={(e) => setCredentials(prev => ({ ...prev, [req]: e.target.value }))}
                      placeholder={`Entrez votre ${req}`}
                    />
                  </div>
                ))}
              </div>

              {/* Pricing info */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Tarification indicative</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Stockage/unité</p>
                    <p className="font-medium">{selectedProvider.pricing_info.storage_per_unit}€/mois</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pick & Pack</p>
                    <p className="font-medium">{selectedProvider.pricing_info.pick_and_pack}€/colis</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium">{selectedProvider.integration_type.toUpperCase()}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedProvider(null)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleConnect} 
                  disabled={isConnecting || selectedProvider.setup_requirements.some(req => !credentials[req])}
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Connecter
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Provider Card Component
function ProviderCard({ 
  provider, 
  isConnected,
  onConnect 
}: { 
  provider: ThirdPartyLogisticsProvider;
  isConnected: boolean;
  onConnect: () => void;
}) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${isConnected ? 'border-green-500/50 bg-green-500/5' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Warehouse className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{provider.name}</CardTitle>
              <Badge variant="outline" className="text-xs mt-1">
                {provider.provider_type === '3pl' ? '3PL' : 
                 provider.provider_type === 'fulfillment_center' ? 'Fulfillment' : 'Dropship'}
              </Badge>
            </div>
          </div>
          {isConnected && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connecté
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {provider.description}
        </p>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Globe className="h-3 w-3" />
          {provider.supported_countries.slice(0, 3).join(', ')}
          {provider.supported_countries.length > 3 && ` +${provider.supported_countries.length - 3}`}
        </div>
        
        <div className="flex flex-wrap gap-1">
          {provider.features.slice(0, 2).map((feature, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
        
        <Button 
          className="w-full" 
          variant={isConnected ? "outline" : "default"}
          size="sm"
          onClick={onConnect}
          disabled={isConnected}
        >
          {isConnected ? 'Déjà connecté' : 'Connecter'}
        </Button>
      </CardContent>
    </Card>
  );
}
