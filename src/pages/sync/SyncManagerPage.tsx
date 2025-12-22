import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, RefreshCw, Settings, Play, Pause, Clock,
  CheckCircle2, AlertCircle, Database, Zap, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncConnection {
  id: string;
  platform: string;
  status: string;
  last_sync_at: string;
  sync_stats: any;
  error_message: string;
}

export default function SyncManagerPage() {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const { hasFeature } = useUnifiedPlan();
  const { toast } = useToast();
  const [connections, setConnections] = useState<SyncConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, [user]);

  const loadConnections = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Map integrations to SyncConnection format
      const mapped: SyncConnection[] = (data || []).map((d: any) => ({
        id: d.id,
        platform: d.platform_name || d.platform || 'unknown',
        status: d.connection_status || 'disconnected',
        last_sync_at: d.last_sync_at || '',
        sync_stats: d.config?.sync_stats || {},
        error_message: ''
      }));
      setConnections(mapped);
    } catch (error: any) {
      toast({
        title: "Erreur de chargement",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProductsSynced = (conn: SyncConnection) => {
    return conn.sync_stats?.products_synced || 0;
  };

  const getErrorsCount = (conn: SyncConnection) => {
    return conn.error_message ? 1 : 0;
  };

  const handleManualSync = async (connectionId: string) => {
    if (!hasFeature('manual_sync')) {
      toast({
        title: "Fonctionnalité Pro",
        description: "La synchronisation manuelle nécessite un plan Pro",
        variant: "destructive"
      });
      navigate('/pricing');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('marketplace-sync', {
        body: { connection_id: connectionId }
      });

      if (error) throw error;

      toast({
        title: "Synchronisation lancée",
        description: "Les produits sont en cours de synchronisation"
      });
      
      loadConnections();
    } catch (error: any) {
      toast({
        title: "Erreur de synchronisation",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutoSync = async (connectionId: string, enabled: boolean) => {
    try {
      const { error } = await (supabase
        .from('integrations') as any)
        .update({ 
          config: { auto_sync: enabled }
        })
        .eq('id', connectionId);

      if (error) throw error;

      toast({
        title: enabled ? "Auto-sync activé" : "Auto-sync désactivé",
        description: `La synchronisation automatique a été ${enabled ? 'activée' : 'désactivée'}`
      });
      
      loadConnections();
    } catch (error: any) {
      toast({
        title: "Erreur de configuration",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'syncing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform: string) => {
    return <Database className="h-5 w-5" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Gestionnaire de Synchronisation</h1>
          <p className="text-muted-foreground">
            Gérez la synchronisation de vos produits entre plateformes
          </p>
        </div>
        <Button className="ml-auto" onClick={loadConnections}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connexions actives</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connections.filter(c => c.status === 'connected').length}
            </div>
            <p className="text-xs text-muted-foreground">
              / {connections.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits synchronisés</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connections.reduce((sum, c) => sum + getProductsSynced(c), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connections.filter(c => c.status === 'syncing').length}
            </div>
            <p className="text-xs text-muted-foreground">Synchronisations actives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erreurs</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connections.reduce((sum, c) => sum + getErrorsCount(c), 0)}
            </div>
            <p className="text-xs text-muted-foreground">À résoudre</p>
          </CardContent>
        </Card>
      </div>

      {/* Connexions */}
      <Card>
        <CardHeader>
          <CardTitle>Connexions de synchronisation</CardTitle>
          <CardDescription>
            Gérez vos intégrations et leurs paramètres de synchronisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Toutes ({connections.length})</TabsTrigger>
              <TabsTrigger value="active">
                Actives ({connections.filter(c => c.status === 'connected').length})
              </TabsTrigger>
              <TabsTrigger value="errors">
                Erreurs ({connections.filter(c => c.status === 'error').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {connections.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Aucune connexion</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connectez une plateforme pour commencer la synchronisation
                  </p>
                  <Button onClick={() => navigate('/integrations')}>
                    <Zap className="w-4 h-4 mr-2" />
                    Ajouter une intégration
                  </Button>
                </div>
              ) : (
                connections.map((connection) => (
                  <Card key={connection.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getPlatformIcon(connection.platform)}
                          <div>
                            <h3 className="font-semibold">{connection.platform}</h3>
                            <p className="text-sm text-muted-foreground">
                              {getProductsSynced(connection)} produits synchronisés
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">Dernière sync</p>
                            <p className="text-sm text-muted-foreground">
                              {connection.last_sync_at ? new Date(connection.last_sync_at).toLocaleString() : 'Jamais'}
                            </p>
                          </div>

                          <Badge className={getStatusColor(connection.status)}>
                            {connection.status}
                          </Badge>

                          <Button
                            size="sm"
                            onClick={() => handleManualSync(connection.id)}
                            disabled={isLoading || connection.status === 'syncing'}
                          >
                            <RefreshCw className={`w-4 h-4 mr-2 ${connection.status === 'syncing' ? 'animate-spin' : ''}`} />
                            Synchroniser
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/integrations/${connection.id}/settings`)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {connection.error_message && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <p className="text-sm text-red-800">
                              Erreur: {connection.error_message}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4 mt-4">
              {connections.filter(c => c.status === 'connected').map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getPlatformIcon(connection.platform)}
                        <div>
                          <h3 className="font-semibold">{connection.platform}</h3>
                          <Badge variant="outline" className="bg-green-50">Actif</Badge>
                        </div>
                      </div>
                      <Button onClick={() => handleManualSync(connection.id)}>
                        Synchroniser maintenant
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="errors" className="space-y-4 mt-4">
              {connections.filter(c => c.status === 'error').map((connection) => (
                <Card key={connection.id} className="border-red-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getPlatformIcon(connection.platform)}
                        <div>
                          <h3 className="font-semibold">{connection.platform}</h3>
                          <Badge variant="destructive">Erreur</Badge>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => navigate(`/integrations/${connection.id}/settings`)}>
                        Résoudre
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
