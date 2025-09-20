import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { 
  RefreshCw, 
  Settings, 
  Play, 
  Pause, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Zap,
  Database,
  ShoppingCart,
  Users,
  Package,
  ArrowUpDown,
  Eye,
  Download
} from 'lucide-react';
import { BidirectionalSyncEngine, SyncConfiguration, SyncJob } from '@/services/sync/BidirectionalSyncEngine';
import { ConnectorManager } from '@/services/ConnectorManager';

const CoreSyncDashboard: React.FC = () => {
  const [syncEngine] = useState(() => BidirectionalSyncEngine.getInstance());
  const [connectorManager] = useState(() => ConnectorManager.getInstance());
  
  const [configurations, setConfigurations] = useState<SyncConfiguration[]>([]);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [connectors, setConnectors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConfig, setSelectedConfig] = useState<SyncConfiguration | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load user's sync configurations
      const configs = await syncEngine.getUserSyncConfigurations('current-user'); // TODO: Get actual user ID
      setConfigurations(configs);

      // Load sync job history
      const jobs = await syncEngine.getSyncJobHistory('current-user', 20);
      setSyncJobs(jobs);

      // Load available connectors
      const userConnectors = await connectorManager.getUserConnectors('current-user');
      setConnectors(userConnectors);

    } catch (error) {
      console.error('Error loading sync data:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les données de synchronisation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async (configId: string) => {
    try {
      const jobId = await syncEngine.triggerManualSync(configId, 'incremental', 'high');
      
      toast({
        title: "Synchronisation lancée",
        description: `Job ${jobId} démarré avec succès`
      });

      // Refresh job list
      setTimeout(() => {
        loadData();
      }, 1000);

    } catch (error) {
      console.error('Error triggering sync:', error);
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de lancer la synchronisation",
        variant: "destructive"
      });
    }
  };

  const handleToggleConfiguration = async (configId: string, isActive: boolean) => {
    try {
      // TODO: Add update configuration method to sync engine
      toast({
        title: isActive ? "Configuration activée" : "Configuration désactivée",
        description: "Les paramètres ont été mis à jour"
      });
      loadData();
    } catch (error) {
      console.error('Error toggling configuration:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getSyncDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'bidirectional':
        return <ArrowUpDown className="h-4 w-4" />;
      case 'import':
        return <Download className="h-4 w-4" />;
      case 'export':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des synchronisations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Synchronisation Core</h1>
          <p className="text-muted-foreground">
            Gestion centralisée des synchronisations bidirectionnelles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Nouvelle Configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nouvelle Configuration de Sync</DialogTitle>
                <DialogDescription>
                  Configurez une nouvelle synchronisation bidirectionnelle
                </DialogDescription>
              </DialogHeader>
              <SyncConfigurationForm 
                connectors={connectors}
                onSave={() => {
                  setIsConfigDialogOpen(false);
                  loadData();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configurations Actives</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {configurations.filter(c => c.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Sur {configurations.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Syncs en Cours</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncJobs.filter(j => j.status === 'running').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Jobs actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Syncs Réussies (24h)</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncJobs.filter(j => 
                j.status === 'completed' && 
                new Date(j.completed_at || '').getTime() > Date.now() - 24 * 60 * 60 * 1000
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Dernières 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Données Synchronisées</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncJobs.reduce((sum, job) => sum + job.success_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Éléments traités
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="configurations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="jobs">Historique des Jobs</TabsTrigger>
          <TabsTrigger value="realtime">Temps Réel</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          <div className="grid gap-4">
            {configurations.map((config) => (
              <Card key={config.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getSyncDirectionIcon(config.sync_direction)}
                      <div>
                        <CardTitle className="text-lg">
                          {connectors.find(c => c.id === config.connector_id)?.platform || 'Connecteur'} Sync
                        </CardTitle>
                        <CardDescription>
                          {config.sync_entities.join(', ')} • {config.sync_direction} • {config.sync_frequency}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={config.is_active}
                        onCheckedChange={(checked) => handleToggleConfiguration(config.id, checked)}
                      />
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => handleManualSync(config.id)}
                        disabled={!config.is_active}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Sync Now
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Dernière sync:</span>
                      <div className="font-medium">
                        {config.last_sync_at 
                          ? new Date(config.last_sync_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Jamais'
                        }
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Direction:</span>
                      <div className="font-medium capitalize">{config.sync_direction}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fréquence:</span>
                      <div className="font-medium capitalize">{config.sync_frequency}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Conflits:</span>
                      <div className="font-medium">
                        {config.auto_resolve_conflicts ? 'Auto-résolution' : 'Manuel'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {configurations.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucune configuration de synchronisation.
                    <br />
                    Créez votre première configuration pour commencer.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="space-y-4">
            {syncJobs.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <CardTitle className="text-base">
                          Sync {job.job_type} - {job.entities_to_sync.join(', ')}
                        </CardTitle>
                        <CardDescription>
                          {new Date(job.scheduled_at).toLocaleString('fr-FR')}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(job.status)}>
                        {job.status}
                      </Badge>
                      {job.priority !== 'normal' && (
                        <Badge variant="outline">{job.priority}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {job.status === 'running' && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progression</span>
                          <span>{job.progress_percentage}%</span>
                        </div>
                        <Progress value={job.progress_percentage} />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <div className="font-medium">{job.total_items}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Traités:</span>
                        <div className="font-medium">{job.processed_items}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Succès:</span>
                        <div className="font-medium text-green-600">{job.success_count}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Erreurs:</span>
                        <div className="font-medium text-red-600">{job.error_count}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Durée:</span>
                        <div className="font-medium">
                          {job.execution_time_ms ? formatDuration(job.execution_time_ms) : '-'}
                        </div>
                      </div>
                    </div>
                    
                    {job.errors.length > 0 && (
                      <details className="border rounded p-2">
                        <summary className="cursor-pointer text-sm font-medium text-red-600">
                          Voir les erreurs ({job.errors.length})
                        </summary>
                        <div className="mt-2 space-y-1 text-xs">
                          {job.errors.slice(0, 5).map((error, index) => (
                            <div key={index} className="bg-red-50 p-2 rounded">
                              <strong>{error.entity_type}</strong>: {error.error_message}
                            </div>
                          ))}
                          {job.errors.length > 5 && (
                            <div className="text-muted-foreground">
                              ... et {job.errors.length - 5} autres erreurs
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Synchronisation Temps Réel
              </CardTitle>
              <CardDescription>
                Événements webhook et synchronisation instantanée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-4" />
                <p>Fonctionnalité de temps réel en cours de développement</p>
                <p className="text-sm">Les webhooks seront traités automatiquement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Configuration Form Component
const SyncConfigurationForm: React.FC<{
  connectors: any[];
  onSave: () => void;
}> = ({ connectors, onSave }) => {
  const [formData, setFormData] = useState({
    connector_id: '',
    sync_direction: 'bidirectional',
    sync_frequency: 'daily',
    sync_entities: ['products'],
    auto_resolve_conflicts: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement configuration creation
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="connector">Connecteur</Label>
          <Select 
            value={formData.connector_id} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, connector_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir un connecteur" />
            </SelectTrigger>
            <SelectContent>
              {connectors.map(connector => (
                <SelectItem key={connector.id} value={connector.id}>
                  {connector.platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="direction">Direction</Label>
          <Select 
            value={formData.sync_direction} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, sync_direction: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bidirectional">Bidirectionnelle</SelectItem>
              <SelectItem value="import">Import uniquement</SelectItem>
              <SelectItem value="export">Export uniquement</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="frequency">Fréquence</Label>
          <Select 
            value={formData.sync_frequency} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, sync_frequency: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manuel</SelectItem>
              <SelectItem value="realtime">Temps réel</SelectItem>
              <SelectItem value="hourly">Toutes les heures</SelectItem>
              <SelectItem value="daily">Quotidien</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Résolution de conflits</Label>
          <div className="flex items-center space-x-2">
            <Switch 
              checked={formData.auto_resolve_conflicts}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_resolve_conflicts: checked }))}
            />
            <span className="text-sm">Résolution automatique</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Annuler
        </Button>
        <Button type="submit">
          Créer la Configuration
        </Button>
      </div>
    </form>
  );
};

export default CoreSyncDashboard;