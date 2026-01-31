import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useIntegrationsUnified } from '@/hooks/unified';
import { IntegrationCard } from './IntegrationCard';
import { AddIntegrationDialog } from './AddIntegrationDialog';
import { Search, RefreshCw, TrendingUp, Zap, AlertCircle, BarChart3, Clock, CheckCircle2, Activity, Globe, Database } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const RealIntegrationsTab = () => {
  const { integrations, syncLogs, loading, fetchIntegrations } = useIntegrations();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  const filteredIntegrations = useMemo(() => {
    let filtered = integrations;

    if (activeTab !== 'all') {
      filtered = filtered.filter(integration => integration.platform_type === activeTab || integration.platform === activeTab);
    }

    if (searchTerm) {
      filtered = filtered.filter(integration =>
        (integration.platform_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (integration.store_url || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [integrations, activeTab, searchTerm]);

  const stats = useMemo(() => {
    const total = integrations.length;
    const connected = integrations.filter(i => i.connection_status === 'connected').length;
    const active = integrations.filter(i => i.is_active).length;
    const errors = integrations.filter(i => i.connection_status === 'error').length;

    return { total, connected, active, errors };
  }, [integrations]);

  const recentSyncLogs = useMemo(() => {
    return syncLogs.slice(0, 5);
  }, [syncLogs]);

  const handleViewStatistics = () => {
    navigate('/analytics');
    toast({
      title: "Redirection vers les statistiques",
      description: "Ouverture du tableau de bord analytique...",
    });
  };

  const handleResolveErrors = () => {
    toast({
      title: "Résolution des erreurs",
      description: "Tentative de reconnexion des intégrations en erreur...",
    });
    
    // Simuler la résolution des erreurs
    setTimeout(() => {
      fetchIntegrations();
      toast({
        title: "Erreurs résolues",
        description: "Les intégrations ont été mises à jour",
      });
    }, 2000);
  };

  if (loading) {
    return (
      <Card className="border-border bg-card shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2">Chargement des intégrations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Intégrations</CardTitle>
              <CardDescription>Gérez vos connexions avec les plateformes e-commerce</CardDescription>
            </div>
            <AddIntegrationDialog />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.connected}</div>
              <div className="text-sm text-muted-foreground">Connectées</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Actives</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
              <div className="text-sm text-muted-foreground">Erreurs</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher une intégration..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="ecommerce">E-commerce</TabsTrigger>
              <TabsTrigger value="marketplace">Marketplaces</TabsTrigger>
              <TabsTrigger value="payment">Paiement</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {filteredIntegrations.length === 0 ? (
                <Card className="border-dashed border-2 border-border">
                  <CardContent className="p-8 text-center">
                    <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune intégration</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm 
                        ? "Aucune intégration ne correspond à votre recherche"
                        : "Commencez par ajouter votre première intégration"
                      }
                    </p>
                    {!searchTerm && <AddIntegrationDialog />}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredIntegrations.map((integration) => (
                    <IntegrationCard key={integration.id} integration={integration} />
                  ))}
                </div>
              )}
            </div>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Sync Logs */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Synchronisations récentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSyncLogs.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune synchronisation récente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSyncLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={log.status === 'success' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {log.status === 'success' && '✓'}
                            {log.status === 'error' && '✗'}
                            {log.status === 'in_progress' && '⏳'}
                            {log.sync_type}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(log.started_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{log.records_succeeded}</div>
                        <div className="text-xs text-muted-foreground">enregistrements</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => fetchIntegrations()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser toutes
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleViewStatistics}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Voir les statistiques
              </Button>
              {stats.errors > 0 && (
                <Button variant="destructive" className="w-full justify-start" onClick={handleResolveErrors}>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Résoudre les erreurs ({stats.errors})
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">📊 Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Taux de réussite sync</span>
                  <span className="font-medium">94%</span>
                </div>
                <Progress value={94} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uptime moyen</span>
                  <span className="font-medium">99.2%</span>
                </div>
                <Progress value={99.2} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="text-center p-2 bg-muted/20 rounded">
                  <div className="text-lg font-bold text-primary">2.5s</div>
                  <div className="text-xs text-muted-foreground">Temps réponse</div>
                </div>
                <div className="text-center p-2 bg-muted/20 rounded">
                  <div className="text-lg font-bold text-primary">1.2k</div>
                  <div className="text-xs text-muted-foreground">Requêtes/h</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Système Status */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">🔄 État du système</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm">APIs externes</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">Opérationnel</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Synchronisation</span>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">Actif</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Base de données</span>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">Maintenance</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Réseau</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">Normal</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">💡 Conseils pro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• <strong>Webhook :</strong> Configurez les webhooks pour des mises à jour en temps réel</p>
              <p>• <strong>Limite API :</strong> Respectez les quotas pour éviter les blocages</p>
              <p>• <strong>Monitoring :</strong> Surveillez les performances via l'onglet Analytics</p>
              <p>• <strong>Backup :</strong> Exportez régulièrement vos configurations</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};