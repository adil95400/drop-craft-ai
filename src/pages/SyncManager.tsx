import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ConnectorSetupForm } from '@/components/connectors/ConnectorSetupForm';
import { ConnectorManager, ConnectorConfig, PlatformInfo } from '@/services/ConnectorManager';
import { SyncJobMonitor } from '@/components/sync/SyncJobMonitor';
import { SyncConfiguration } from '@/components/sync/SyncConfiguration';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Settings, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap,
  ExternalLink,
  TrendingUp,
  Users,
  Package,
  ShoppingBag,
  Monitor,
  Cog
} from 'lucide-react';

const SyncManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connectors, setConnectors] = useState<ConnectorConfig[]>([]);
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformInfo | null>(null);
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [syncingConnectors, setSyncingConnectors] = useState<Set<string>>(new Set());

  const connectorManager = ConnectorManager.getInstance();

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [userConnectors, supportedPlatforms] = await Promise.all([
        connectorManager.getUserConnectors(user.id),
        Promise.resolve(connectorManager.getSupportedPlatforms())
      ]);

      setConnectors(userConnectors);
      setPlatforms(supportedPlatforms);
    } catch (error) {
      console.error('Error loading connector data:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les données des connecteurs.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupConnector = (platform: PlatformInfo) => {
    setSelectedPlatform(platform);
    setShowSetupForm(true);
  };

  const handleConnectorSetupSuccess = (connectorId: string) => {
    setShowSetupForm(false);
    setSelectedPlatform(null);
    loadData();
    toast({
      title: "Connecteur configuré",
      description: "Le connecteur a été configuré avec succès.",
    });
  };

  const handleTestConnection = async (connectorId: string) => {
    try {
      const isValid = await connectorManager.testConnection(connectorId);
      
      if (isValid) {
        toast({
          title: "Connexion réussie",
          description: "La connexion au connecteur est fonctionnelle.",
        });
      } else {
        toast({
          title: "Connexion échouée",
          description: "Impossible de se connecter. Vérifiez vos identifiants.",
          variant: "destructive",
        });
      }
      
      loadData(); // Recharger pour mettre à jour le statut
    } catch (error) {
      toast({
        title: "Erreur de test",
        description: "Une erreur est survenue lors du test de connexion.",
        variant: "destructive",
      });
    }
  };

  const handleSyncConnector = async (connectorId: string, entities: string[] = ['products']) => {
    setSyncingConnectors(prev => new Set(prev).add(connectorId));
    
    try {
      const results = await connectorManager.syncConnector(connectorId, entities as any);
      
      toast({
        title: "Synchronisation terminée",
        description: `Synchronisation réussie pour ${entities.join(', ')}.`,
      });
      
      loadData(); // Recharger pour mettre à jour les stats
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: "La synchronisation a échoué. Vérifiez la connexion.",
        variant: "destructive",
      });
    } finally {
      setSyncingConnectors(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectorId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (isActive: boolean, errorCount: number) => {
    if (!isActive) return <XCircle className="w-4 h-4 text-red-500" />;
    if (errorCount > 0) return <Clock className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusBadge = (isActive: boolean, errorCount: number) => {
    if (!isActive) return <Badge variant="destructive">Déconnecté</Badge>;
    if (errorCount > 0) return <Badge variant="secondary">Avertissement</Badge>;
    return <Badge variant="default" className="bg-green-500">Connecté</Badge>;
  };

  const stats = user ? connectorManager.getConnectorStats(user.id) : {
    total: 0,
    active: 0,
    inactive: 0,
    platforms: [],
    lastSync: null
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestionnaire de Synchronisation</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos connecteurs e-commerce et synchronisez vos données automatiquement
          </p>
        </div>
        
        <Dialog open={showSetupForm} onOpenChange={setShowSetupForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un connecteur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau connecteur</DialogTitle>
              <DialogDescription>
                Choisissez une plateforme e-commerce à connecter
              </DialogDescription>
            </DialogHeader>
            
            {!selectedPlatform ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {platforms.map((platform) => (
                  <Card 
                    key={platform.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSetupConnector(platform)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        {platform.logo_url && (
                          <img src={platform.logo_url} alt={platform.display_name} className="w-8 h-8" />
                        )}
                        <div>
                          <CardTitle className="text-lg">{platform.display_name}</CardTitle>
                          <CardDescription>{platform.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{platform.category}</Badge>
                        <div className="flex gap-2">
                          {platform.features.products && <Package className="w-4 h-4 text-muted-foreground" />}
                          {platform.features.orders && <ShoppingBag className="w-4 h-4 text-muted-foreground" />}
                          {platform.features.customers && <Users className="w-4 h-4 text-muted-foreground" />}
                          {platform.features.webhooks && <Zap className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <ConnectorSetupForm
                platform={selectedPlatform}
                onSuccess={handleConnectorSetupSuccess}
                onCancel={() => {
                  setSelectedPlatform(null);
                  setShowSetupForm(false);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connecteurs</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.platforms.length} plateforme{stats.platforms.length > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connectés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Fonctionnels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Déconnectés</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernière Sync</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.lastSync ? new Date(stats.lastSync).toLocaleDateString() : 'Jamais'}
            </div>
            <p className="text-xs text-muted-foreground">
              Synchronisation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="connectors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connectors" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Connecteurs
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Cog className="h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* Onglet Connecteurs */}
        <TabsContent value="connectors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Connecteurs configurés
              </CardTitle>
              <CardDescription>
                Gérez vos connecteurs e-commerce et lancez des synchronisations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : connectors.length === 0 ? (
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Aucun connecteur configuré. Cliquez sur "Ajouter un connecteur" pour commencer.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {connectors.map((connector) => {
                    const platform = platforms.find(p => p.id === connector.platform);
                    const isSyncing = syncingConnectors.has(connector.id);
                    
                    return (
                      <Card key={connector.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {platform?.logo_url && (
                                <img src={platform.logo_url} alt={platform.display_name} className="w-8 h-8" />
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{platform?.display_name || connector.platform}</h3>
                                  {getStatusIcon(connector.is_active, connector.error_count)}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  {getStatusBadge(connector.is_active, connector.error_count)}
                                  <Badge variant="outline" className="text-xs">
                                    {connector.sync_frequency}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {connector.sync_entities.join(', ')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTestConnection(connector.id)}
                              >
                                Tester
                              </Button>
                              
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleSyncConnector(connector.id, connector.sync_entities)}
                                disabled={isSyncing || !connector.is_active}
                              >
                                {isSyncing ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                    Synchronisation...
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className="w-3 h-3 mr-2" />
                                    Synchroniser
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          {connector.last_sync_at && (
                            <div className="mt-3 text-sm text-muted-foreground">
                              Dernière synchronisation : {new Date(connector.last_sync_at).toLocaleString()}
                            </div>
                          )}

                          {connector.last_error && (
                            <Alert variant="destructive" className="mt-3">
                              <AlertDescription>
                                Dernière erreur : {connector.last_error}
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Monitoring */}
        <TabsContent value="monitor">
          <SyncJobMonitor />
        </TabsContent>

        {/* Onglet Configuration */}
        <TabsContent value="config">
          <SyncConfiguration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SyncManager;