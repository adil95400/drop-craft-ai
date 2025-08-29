import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, AlertTriangle, CheckCircle, Clock, Database, 
  Zap, TrendingUp, TrendingDown, RefreshCw, Server,
  BarChart3, Users, ShoppingCart, Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function MonitoringDashboard() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadMetrics = async (metricType = 'all', timeframe = '24h') => {
    try {
      const { data, error } = await supabase.functions.invoke('monitoring', {
        body: {
          action: 'get_metrics',
          metric_type: metricType,
          timeframe
        }
      });

      if (error) throw error;
      setMetrics(data.data);
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les métriques",
        variant: "destructive"
      });
    }
  };

  const loadSystemHealth = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('monitoring', {
        body: {
          action: 'get_system_health'
        }
      });

      if (error) throw error;
      setSystemHealth(data.health);
    } catch (error) {
      console.error('Error loading system health:', error);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([
      loadMetrics(),
      loadSystemHealth()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();

    // Auto-refresh every 30 seconds
    const interval = autoRefresh ? setInterval(refreshAll, 30000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Chargement des métriques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitoring & Performance</h2>
          <p className="text-muted-foreground">
            Surveillez les performances et la santé de votre système
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="w-5 h-5 mr-2" />
              État du Système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <HealthIndicator 
                label="Global"
                status={systemHealth.overall}
                icon={<Server className="w-4 h-4" />}
              />
              <HealthIndicator 
                label="Base de données"
                status={systemHealth.database}
                icon={<Database className="w-4 h-4" />}
              />
              <HealthIndicator 
                label="API"
                status={systemHealth.api}
                icon={<Zap className="w-4 h-4" />}
              />
              <HealthIndicator 
                label="Intégrations"
                status={systemHealth.integrations}
                icon={<Activity className="w-4 h-4" />}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="imports">Imports</TabsTrigger>
          <TabsTrigger value="sync">Synchronisation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Erreurs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard 
              title="Imports totaux"
              value={metrics?.imports?.total_imports || 0}
              change="+12%"
              icon={<Package className="h-4 w-4" />}
            />
            <MetricCard 
              title="Commandes"
              value={metrics?.orders?.total_orders || 0}
              change="+8%"
              icon={<ShoppingCart className="h-4 w-4" />}
            />
            <MetricCard 
              title="Produits"
              value={metrics?.products?.total_products || 0}
              change="+15%"
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <MetricCard 
              title="Revenus"
              value={`€${metrics?.orders?.total_revenue || '0.00'}`}
              change="+22%"
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>
        </TabsContent>

        <TabsContent value="imports" className="space-y-4">
          {metrics?.imports && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques d'Import</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Taux de succès</span>
                    <Badge variant="default">{metrics.imports.success_rate}%</Badge>
                  </div>
                  <Progress value={parseFloat(metrics.imports.success_rate)} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Réussis</p>
                      <p className="text-2xl font-bold text-green-600">
                        {metrics.imports.successful_imports}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Échoués</p>
                      <p className="text-2xl font-bold text-red-600">
                        {metrics.imports.failed_imports}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Produits Traités</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Taux de succès produits</span>
                    <Badge variant="default">{metrics.imports.product_success_rate}%</Badge>
                  </div>
                  <Progress value={parseFloat(metrics.imports.product_success_rate)} className="h-2" />
                  
                  <div className="text-sm">
                    <p className="text-muted-foreground">Total traités</p>
                    <p className="text-2xl font-bold">
                      {metrics.imports.total_products_processed}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          {metrics?.sync && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Synchronisations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.sync.total_syncs}</div>
                    <p className="text-sm text-muted-foreground">
                      Taux de succès: {metrics.sync.success_rate}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Réussies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {metrics.sync.successful_syncs}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Échouées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {metrics.sync.failed_syncs}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Performance par Plateforme</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(metrics.sync.platform_stats || {}).map(([platform, stats]) => (
                      <div key={platform} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="capitalize font-medium">{platform}</div>
                          <Badge variant="outline">{stats.total} syncs</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 text-sm">{stats.successful} ✓</span>
                          <span className="text-red-600 text-sm">{stats.failed} ✗</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Temps de réponse API</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">125ms</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingDown className="inline h-3 w-3 mr-1" />
                  -15ms depuis hier
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisation CPU</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23%</div>
                <Progress value={23} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mémoire</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">67%</div>
                <Progress value={67} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  +2.1% depuis hier
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Surveillez les erreurs système pour identifier les problèmes rapidement.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Erreurs Récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { type: 'Import Error', message: 'Timeout lors de l\'import AliExpress', time: '2 min ago' },
                  { type: 'Sync Failed', message: 'Échec de synchronisation Shopify', time: '15 min ago' },
                  { type: 'API Error', message: 'Limite de taux dépassée pour eBay', time: '1 hour ago' }
                ].map((error, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{error.type}</div>
                      <div className="text-sm text-muted-foreground">{error.message}</div>
                    </div>
                    <Badge variant="outline">{error.time}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HealthIndicator({ label, status, icon }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`p-2 rounded-lg ${getStatusColor(status)}`}>
        {icon}
      </div>
      <div>
        <div className="font-medium">{label}</div>
        <div className="flex items-center text-sm">
          {getStatusIcon(status)}
          <span className="ml-1 capitalize">{status}</span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          <TrendingUp className="inline h-3 w-3 mr-1" />
          {change} depuis le mois dernier
        </p>
      </CardContent>
    </Card>
  );
}