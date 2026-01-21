import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Server,
  TrendingUp,
  XCircle,
  Zap,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FunctionHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'error' | 'unknown';
  lastCall: string | null;
  avgResponseTime: number;
  successRate: number;
  errorCount: number;
  callCount: number;
}

interface HealthMetrics {
  totalFunctions: number;
  healthyCount: number;
  degradedCount: number;
  errorCount: number;
  avgResponseTime: number;
  totalCalls24h: number;
}

const CRITICAL_FUNCTIONS = [
  'shopify-webhook',
  'shopify-sync',
  'marketplace-connect',
  'channel-sync-bidirectional',
  'import-suppliers',
  'order-fulfillment-auto',
  'stripe-webhook',
  'ai-content-generator'
];

export const EdgeFunctionHealthDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [functions, setFunctions] = useState<FunctionHealth[]>([]);
  const [metrics, setMetrics] = useState<HealthMetrics>({
    totalFunctions: 0,
    healthyCount: 0,
    degradedCount: 0,
    errorCount: 0,
    avgResponseTime: 0,
    totalCalls24h: 0
  });

  const fetchHealthData = async () => {
    try {
      // Fetch API logs for the last 24 hours
      const { data: apiLogs, error } = await supabase
        .from('api_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by endpoint and calculate metrics
      const functionMap = new Map<string, {
        calls: number;
        errors: number;
        totalTime: number;
        lastCall: string | null;
      }>();

      apiLogs?.forEach(log => {
        const endpoint = log.endpoint?.replace('/functions/v1/', '') || 'unknown';
        const existing = functionMap.get(endpoint) || {
          calls: 0,
          errors: 0,
          totalTime: 0,
          lastCall: null
        };

        existing.calls++;
        if (log.status_code && log.status_code >= 400) {
          existing.errors++;
        }
        if (log.response_time_ms) {
          existing.totalTime += log.response_time_ms;
        }
        if (!existing.lastCall || log.created_at > existing.lastCall) {
          existing.lastCall = log.created_at;
        }

        functionMap.set(endpoint, existing);
      });

      // Build function health list
      const healthList: FunctionHealth[] = [];
      let totalHealthy = 0;
      let totalDegraded = 0;
      let totalErrors = 0;
      let totalResponseTime = 0;
      let totalCalls = 0;

      // Add critical functions first
      CRITICAL_FUNCTIONS.forEach(name => {
        const data = functionMap.get(name);
        const calls = data?.calls || 0;
        const errors = data?.errors || 0;
        const avgTime = data && data.calls > 0 ? data.totalTime / data.calls : 0;
        const successRate = calls > 0 ? ((calls - errors) / calls) * 100 : 100;

        let status: FunctionHealth['status'] = 'unknown';
        if (calls > 0) {
          if (successRate >= 95 && avgTime < 3000) {
            status = 'healthy';
            totalHealthy++;
          } else if (successRate >= 80 || avgTime < 5000) {
            status = 'degraded';
            totalDegraded++;
          } else {
            status = 'error';
            totalErrors++;
          }
        }

        healthList.push({
          name,
          status,
          lastCall: data?.lastCall || null,
          avgResponseTime: Math.round(avgTime),
          successRate: Math.round(successRate),
          errorCount: errors,
          callCount: calls
        });

        totalCalls += calls;
        if (avgTime > 0) totalResponseTime += avgTime;
      });

      // Add other functions from logs
      functionMap.forEach((data, name) => {
        if (!CRITICAL_FUNCTIONS.includes(name)) {
          const successRate = data.calls > 0 ? ((data.calls - data.errors) / data.calls) * 100 : 100;
          const avgTime = data.calls > 0 ? data.totalTime / data.calls : 0;

          let status: FunctionHealth['status'] = 'unknown';
          if (data.calls > 0) {
            if (successRate >= 95 && avgTime < 3000) {
              status = 'healthy';
              totalHealthy++;
            } else if (successRate >= 80 || avgTime < 5000) {
              status = 'degraded';
              totalDegraded++;
            } else {
              status = 'error';
              totalErrors++;
            }
          }

          healthList.push({
            name,
            status,
            lastCall: data.lastCall,
            avgResponseTime: Math.round(avgTime),
            successRate: Math.round(successRate),
            errorCount: data.errors,
            callCount: data.calls
          });

          totalCalls += data.calls;
          if (avgTime > 0) totalResponseTime += avgTime;
        }
      });

      setFunctions(healthList.sort((a, b) => {
        // Sort by status priority then by name
        const statusPriority = { error: 0, degraded: 1, healthy: 2, unknown: 3 };
        return statusPriority[a.status] - statusPriority[b.status] || a.name.localeCompare(b.name);
      }));

      setMetrics({
        totalFunctions: healthList.length,
        healthyCount: totalHealthy,
        degradedCount: totalDegraded,
        errorCount: totalErrors,
        avgResponseTime: healthList.length > 0 ? Math.round(totalResponseTime / healthList.length) : 0,
        totalCalls24h: totalCalls
      });

    } catch (error: any) {
      console.error('Error fetching health data:', error);
      toast.error('Erreur lors du chargement des données de santé');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchHealthData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHealthData();
  };

  const getStatusIcon = (status: FunctionHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: FunctionHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-success">Sain</Badge>;
      case 'degraded':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Dégradé</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const overallHealth = metrics.totalFunctions > 0
    ? ((metrics.healthyCount / metrics.totalFunctions) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Santé des Edge Functions</h2>
          <p className="text-muted-foreground">Monitoring en temps réel des fonctions backend</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Santé globale</p>
                <p className="text-2xl font-bold">{Math.round(overallHealth)}%</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <Progress value={overallHealth} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fonctions saines</p>
                <p className="text-2xl font-bold text-success">{metrics.healthyCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avec erreurs</p>
                <p className="text-2xl font-bold text-destructive">{metrics.errorCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Appels (24h)</p>
                <p className="text-2xl font-bold">{metrics.totalCalls24h.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Functions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Fonctions critiques
          </CardTitle>
          <CardDescription>
            État des fonctions essentielles au fonctionnement de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="critical">
            <TabsList>
              <TabsTrigger value="critical">Critiques</TabsTrigger>
              <TabsTrigger value="all">Toutes</TabsTrigger>
            </TabsList>

            <TabsContent value="critical">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {functions
                    .filter(f => CRITICAL_FUNCTIONS.includes(f.name))
                    .map(func => (
                      <div
                        key={func.name}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(func.status)}
                          <div>
                            <p className="font-medium">{func.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {func.lastCall
                                ? `Dernier appel: ${new Date(func.lastCall).toLocaleString('fr-FR')}`
                                : 'Aucun appel récent'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{func.avgResponseTime}ms</p>
                            <p className="text-xs text-muted-foreground">Temps moyen</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{func.successRate}%</p>
                            <p className="text-xs text-muted-foreground">Succès</p>
                          </div>
                          {getStatusBadge(func.status)}
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="all">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {functions.map(func => (
                    <div
                      key={func.name}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(func.status)}
                        <div>
                          <p className="font-medium">{func.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {func.callCount} appels | {func.errorCount} erreurs
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{func.avgResponseTime}ms</p>
                          <p className="text-xs text-muted-foreground">Temps moyen</p>
                        </div>
                        {getStatusBadge(func.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
