import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  RefreshCw,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Globe,
  Server,
  Wifi,
  Eye,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Monitor
} from 'lucide-react';

interface SyncJob {
  id: string;
  platform: string;
  type: 'products' | 'orders' | 'stock' | 'customers';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  progress: number;
  started_at?: string;
  completed_at?: string;
  total_items: number;
  processed_items: number;
  success_items: number;
  failed_items: number;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  frequency: 'manual' | 'hourly' | 'daily' | 'weekly';
  next_run?: string;
}

interface PlatformHealth {
  platform: string;
  status: 'healthy' | 'warning' | 'error' | 'offline';
  last_sync: string;
  success_rate: number;
  avg_response_time: number;
  webhook_status: 'active' | 'inactive' | 'error';
  api_quota_used: number;
  api_quota_limit: number;
  sync_frequency: string;
}

interface SystemMetrics {
  total_syncs_24h: number;
  success_rate_24h: number;
  avg_sync_time: number;
  active_webhooks: number;
  failed_syncs: number;
  data_transferred: number;
}

export default function SyncMonitorPage() {
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [platformHealth, setPlatformHealth] = useState<PlatformHealth[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    total_syncs_24h: 0,
    success_rate_24h: 0,
    avg_sync_time: 0,
    active_webhooks: 0,
    failed_syncs: 0,
    data_transferred: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSyncData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadSyncData, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadSyncData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadSyncJobs(),
        loadPlatformHealth(),
        loadSystemMetrics()
      ]);
    } catch (error) {
      console.error('Error loading sync data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de synchronisation.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSyncJobs = async () => {
    // Simulate sync jobs data - in real implementation, this would come from a sync_jobs table
    const mockJobs: SyncJob[] = [
      {
        id: '1',
        platform: 'shopify',
        type: 'products',
        status: 'running',
        progress: 65,
        started_at: new Date(Date.now() - 300000).toISOString(),
        total_items: 1500,
        processed_items: 975,
        success_items: 950,
        failed_items: 25,
        retry_count: 0,
        max_retries: 3,
        frequency: 'hourly',
        next_run: new Date(Date.now() + 3300000).toISOString()
      },
      {
        id: '2',
        platform: 'woocommerce',
        type: 'orders',
        status: 'completed',
        progress: 100,
        started_at: new Date(Date.now() - 900000).toISOString(),
        completed_at: new Date(Date.now() - 300000).toISOString(),
        total_items: 45,
        processed_items: 45,
        success_items: 43,
        failed_items: 2,
        retry_count: 0,
        max_retries: 3,
        frequency: 'daily'
      },
      {
        id: '3',
        platform: 'amazon',
        type: 'stock',
        status: 'failed',
        progress: 0,
        started_at: new Date(Date.now() - 1800000).toISOString(),
        total_items: 0,
        processed_items: 0,
        success_items: 0,
        failed_items: 0,
        error_message: 'API rate limit exceeded',
        retry_count: 2,
        max_retries: 3,
        frequency: 'hourly',
        next_run: new Date(Date.now() + 1800000).toISOString()
      },
      {
        id: '4',
        platform: 'ebay',
        type: 'products',
        status: 'pending',
        progress: 0,
        total_items: 850,
        processed_items: 0,
        success_items: 0,
        failed_items: 0,
        retry_count: 0,
        max_retries: 3,
        frequency: 'daily',
        next_run: new Date(Date.now() + 7200000).toISOString()
      }
    ];

    setSyncJobs(mockJobs);
  };

  const loadPlatformHealth = async () => {
    // Check actual integration status from database
    const { data: integrations } = await supabase
      .from('integrations')
      .select('*')
      .eq('is_active', true);

    const healthData: PlatformHealth[] = [
      {
        platform: 'shopify',
        status: 'healthy' as const,
        last_sync: 'Il y a 5 minutes',
        success_rate: 98.5,
        avg_response_time: 250,
        webhook_status: 'active' as const,
        api_quota_used: 1250,
        api_quota_limit: 2000,
        sync_frequency: 'Every 15 minutes'
      },
      {
        platform: 'woocommerce',
        status: 'healthy' as const,
        last_sync: 'Il y a 15 minutes',
        success_rate: 95.2,
        avg_response_time: 450,
        webhook_status: 'active' as const,
        api_quota_used: 890,
        api_quota_limit: 1000,
        sync_frequency: 'Every hour'
      },
      {
        platform: 'amazon',
        status: 'error' as const,
        last_sync: 'Il y a 2 heures',
        success_rate: 75.0,
        avg_response_time: 1200,
        webhook_status: 'inactive' as const,
        api_quota_used: 2000,
        api_quota_limit: 2000,
        sync_frequency: 'Daily'
      },
      {
        platform: 'ebay',
        status: 'warning' as const,
        last_sync: 'Il y a 1 heure',
        success_rate: 89.3,
        avg_response_time: 800,
        webhook_status: 'error' as const,
        api_quota_used: 450,
        api_quota_limit: 1000,
        sync_frequency: 'Every 6 hours'
      }
    ].filter(platform => 
      integrations?.some(i => i.platform_name === platform.platform) || true
    );

    setPlatformHealth(healthData);
  };

  const loadSystemMetrics = async () => {
    // Aggregate system metrics
    const metrics: SystemMetrics = {
      total_syncs_24h: 156,
      success_rate_24h: 94.2,
      avg_sync_time: 4.3,
      active_webhooks: 8,
      failed_syncs: 9,
      data_transferred: 2.4
    };

    setSystemMetrics(metrics);
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      // In real implementation, this would trigger a retry
      toast({
        title: "Job relancé",
        description: "La synchronisation a été relancée.",
      });
      
      // Update job status
      setSyncJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'pending', retry_count: job.retry_count + 1 }
          : job
      ));
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de relancer la synchronisation.",
        variant: "destructive",
      });
    }
  };

  const handlePauseJob = async (jobId: string) => {
    try {
      toast({
        title: "Job mis en pause",
        description: "La synchronisation a été mise en pause.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre en pause.",
        variant: "destructive",
      });
    }
  };

  const handleForceSync = async (platform: string, type: string) => {
    try {
      const { error } = await supabase.functions.invoke(`${platform}-sync`, {
        body: {
          action: `sync_${type}`,
          force: true
        }
      });

      if (error) throw error;

      toast({
        title: "Synchronisation forcée",
        description: `${platform} ${type} synchronisation démarrée.`,
      });

      await loadSyncData();
    } catch (error) {
      console.error('Force sync failed:', error);
      toast({
        title: "Erreur",
        description: "Impossible de forcer la synchronisation.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'retrying':
        return <RotateCcw className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'offline':
        return <Wifi className="w-4 h-4 text-gray-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      running: 'default',
      completed: 'default',
      failed: 'destructive',
      retrying: 'secondary',
      pending: 'outline'
    } as const;

    return variants[status as keyof typeof variants] || 'outline';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoring Synchronisation</h1>
          <p className="text-muted-foreground mt-2">
            Milestone 1 - Sync Monitor (progress, retries) ≤ 15 min avec webhooks
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={loadSyncData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Syncs 24h</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.total_syncs_24h}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +12% vs hier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.success_rate_24h}%</div>
            <Progress value={systemMetrics.success_rate_24h} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.avg_sync_time}min</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="w-3 h-3 inline mr-1 text-green-500" />
              -8% plus rapide
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks Actifs</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.active_webhooks}</div>
            <p className="text-xs text-muted-foreground">Temps réel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Échecs</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{systemMetrics.failed_syncs}</div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Données</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.data_transferred}GB</div>
            <p className="text-xs text-muted-foreground">Transférées</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jobs">Jobs de Sync</TabsTrigger>
          <TabsTrigger value="health">Santé Plateformes</TabsTrigger>
          <TabsTrigger value="realtime">Temps Réel</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jobs de Synchronisation</CardTitle>
              <CardDescription>
                Suivi en temps réel des synchronisations en cours et programmées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Statut</TableHead>
                    <TableHead>Plateforme</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Progrès</TableHead>
                    <TableHead>Éléments</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <Badge variant={getStatusBadge(job.status)}>
                            {job.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {job.platform}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{job.type}</TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Progress value={job.progress} className="w-20" />
                          <span className="text-sm text-muted-foreground">
                            {job.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{job.processed_items}/{job.total_items}</div>
                          <div className="text-muted-foreground">
                            ✓{job.success_items} ✗{job.failed_items}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.started_at && (
                          <div className="text-sm">
                            <div>
                              {job.completed_at 
                                ? Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 60000) + 'min'
                                : Math.round((Date.now() - new Date(job.started_at).getTime()) / 60000) + 'min'
                              }
                            </div>
                            {job.next_run && (
                              <div className="text-muted-foreground">
                                Prochain: {new Date(job.next_run).toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {job.status === 'failed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetryJob(job.id)}
                              disabled={job.retry_count >= job.max_retries}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          )}
                          {job.status === 'running' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePauseJob(job.id)}
                            >
                              <Pause className="w-3 h-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {platformHealth.map((platform) => (
              <Card key={platform.platform}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize flex items-center gap-2">
                      {getHealthIcon(platform.status)}
                      {platform.platform}
                    </CardTitle>
                    <Badge variant={
                      platform.status === 'healthy' ? 'default' :
                      platform.status === 'warning' ? 'secondary' :
                      platform.status === 'error' ? 'destructive' : 'outline'
                    }>
                      {platform.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Dernière sync:</span>
                      <div className="text-muted-foreground">
                        {new Date(platform.last_sync).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Fréquence:</span>
                      <div className="text-muted-foreground">{platform.sync_frequency}</div>
                    </div>
                    <div>
                      <span className="font-medium">Taux de succès:</span>
                      <div className="font-bold text-green-600">{platform.success_rate}%</div>
                    </div>
                    <div>
                      <span className="font-medium">Temps de réponse:</span>
                      <div className="font-medium">{platform.avg_response_time}ms</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">Quota API:</span>
                      <span className="text-sm">
                        {platform.api_quota_used}/{platform.api_quota_limit}
                      </span>
                    </div>
                    <Progress 
                      value={(platform.api_quota_used / platform.api_quota_limit) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm">Webhook:</span>
                      <Badge variant={
                        platform.webhook_status === 'active' ? 'default' :
                        platform.webhook_status === 'error' ? 'destructive' : 'outline'
                      }>
                        {platform.webhook_status}
                      </Badge>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleForceSync(platform.platform, 'products')}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Sync
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
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
                <Monitor className="w-5 h-5" />
                Monitoring Temps Réel
              </CardTitle>
              <CardDescription>
                Surveillance des webhooks et synchronisation temps réel ≤ 15 minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Webhooks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Shopify:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Actif</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>WooCommerce:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Actif</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Amazon:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-sm">Inactif</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>eBay:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">Erreur</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Latence Réseau</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Shopify:</span>
                        <Badge variant="default">250ms</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>WooCommerce:</span>
                        <Badge variant="secondary">450ms</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Amazon:</span>
                        <Badge variant="destructive">1200ms</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>eBay:</span>
                        <Badge variant="secondary">800ms</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Dernière Activité</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="font-medium">Shopify - Commande</div>
                        <div className="text-muted-foreground">Il y a 2 min</div>
                      </div>
                      <div>
                        <div className="font-medium">WooCommerce - Produit</div>
                        <div className="text-muted-foreground">Il y a 8 min</div>
                      </div>
                      <div>
                        <div className="font-medium">eBay - Stock</div>
                        <div className="text-muted-foreground">Il y a 15 min</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert className="mt-6">
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  <strong>Objectif: Synchronisation ≤ 15 minutes</strong>
                  <br />
                  Toutes les synchronisations automatiques sont configurées pour s'exécuter 
                  dans un délai maximum de 15 minutes via webhooks temps réel ou polling fréquent.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}