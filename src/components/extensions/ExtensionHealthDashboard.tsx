/**
 * Extension Health Dashboard
 * 
 * Displays real-time monitoring data for extension operations:
 * - Success rate by action
 * - Error distribution
 * - Platform usage
 * - Response time metrics
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Zap,
  Globe,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface ExtensionEvent {
  id: string;
  action: string;
  platform: string | null;
  status: string;
  error_code: string | null;
  duration_ms: number | null;
  created_at: string;
  extension_version: string | null;
}

interface HealthMetrics {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  errorsByCode: Record<string, number>;
  requestsByAction: Record<string, number>;
  requestsByPlatform: Record<string, number>;
  recentErrors: ExtensionEvent[];
}

export function ExtensionHealthDashboard() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

  const getTimeFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const { data: metrics, isLoading, refetch } = useQuery<HealthMetrics>({
    queryKey: ['extension-health', timeRange],
    queryFn: async () => {
      const timeFilter = getTimeFilter();
      
      const { data: events, error } = await supabase
        .from('extension_events')
        .select('*')
        .gte('created_at', timeFilter)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const eventsData = (events || []) as ExtensionEvent[];
      
      // Calculate metrics
      const totalRequests = eventsData.length;
      const successCount = eventsData.filter(e => e.status === 'success').length;
      const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 100;
      
      const durations = eventsData
        .filter(e => e.duration_ms != null)
        .map(e => e.duration_ms!);
      const avgResponseTime = durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0;

      // Group by error code
      const errorsByCode: Record<string, number> = {};
      eventsData
        .filter(e => e.error_code)
        .forEach(e => {
          errorsByCode[e.error_code!] = (errorsByCode[e.error_code!] || 0) + 1;
        });

      // Group by action
      const requestsByAction: Record<string, number> = {};
      eventsData.forEach(e => {
        requestsByAction[e.action] = (requestsByAction[e.action] || 0) + 1;
      });

      // Group by platform
      const requestsByPlatform: Record<string, number> = {};
      eventsData
        .filter(e => e.platform)
        .forEach(e => {
          requestsByPlatform[e.platform!] = (requestsByPlatform[e.platform!] || 0) + 1;
        });

      // Recent errors
      const recentErrors = eventsData
        .filter(e => e.status === 'error')
        .slice(0, 10);

      return {
        totalRequests,
        successRate,
        avgResponseTime,
        errorsByCode,
        requestsByAction,
        requestsByPlatform,
        recentErrors,
      };
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  const getStatusColor = (rate: number) => {
    if (rate >= 98) return 'text-green-500';
    if (rate >= 95) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBadge = (rate: number) => {
    if (rate >= 98) return <Badge className="bg-green-500/10 text-green-500">Excellent</Badge>;
    if (rate >= 95) return <Badge className="bg-yellow-500/10 text-yellow-500">Bon</Badge>;
    return <Badge className="bg-red-500/10 text-red-500">Attention</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Extension Health</h2>
          <p className="text-muted-foreground">
            Monitoring des performances de l'extension en temps réel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <TabsList>
              <TabsTrigger value="1h">1h</TabsTrigger>
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7j</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Requêtes totales</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              sur les dernières {timeRange === '1h' ? 'heure' : timeRange === '24h' ? '24 heures' : '7 jours'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
            <CheckCircle2 className={`h-4 w-4 ${getStatusColor(metrics?.successRate || 0)}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getStatusColor(metrics?.successRate || 0)}`}>
                {metrics?.successRate.toFixed(1)}%
              </span>
              {getStatusBadge(metrics?.successRate || 0)}
            </div>
            <Progress 
              value={metrics?.successRate || 0} 
              className="mt-2 h-1.5" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Temps de réponse</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.avgResponseTime.toFixed(0)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              temps moyen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Erreurs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {Object.values(metrics?.errorsByCode || {}).reduce((a, b) => a + b, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(metrics?.errorsByCode || {}).length} types d'erreurs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Répartition par action
            </CardTitle>
            <CardDescription>Volume de requêtes par type d'action</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {Object.entries(metrics?.requestsByAction || {})
                  .sort(([, a], [, b]) => b - a)
                  .map(([action, count]) => {
                    const percentage = ((count / (metrics?.totalRequests || 1)) * 100);
                    return (
                      <div key={action} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{action}</span>
                          <span className="text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Répartition par plateforme
            </CardTitle>
            <CardDescription>Utilisation par marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {Object.entries(metrics?.requestsByPlatform || {})
                  .sort(([, a], [, b]) => b - a)
                  .map(([platform, count]) => {
                    const percentage = ((count / (metrics?.totalRequests || 1)) * 100);
                    return (
                      <div key={platform} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{platform}</Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{count}</div>
                          <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    );
                  })}
                {Object.keys(metrics?.requestsByPlatform || {}).length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune donnée de plateforme
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Error Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Distribution des erreurs
            </CardTitle>
            <CardDescription>Codes d'erreur les plus fréquents</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {Object.entries(metrics?.errorsByCode || {})
                  .sort(([, a], [, b]) => b - a)
                  .map(([code, count]) => (
                    <div key={code} className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                      <Badge variant="destructive" className="font-mono">{code}</Badge>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                {Object.keys(metrics?.errorsByCode || {}).length === 0 && (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                    Aucune erreur
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Erreurs récentes
            </CardTitle>
            <CardDescription>Dernières erreurs détectées</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {metrics?.recentErrors.map((error) => (
                  <div key={error.id} className="p-2 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{error.action}</span>
                      <Badge variant="destructive" className="text-xs">{error.error_code}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span>{error.platform || 'N/A'}</span>
                      <span>
                        {formatDistanceToNow(new Date(error.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                      </span>
                    </div>
                  </div>
                ))}
                {metrics?.recentErrors.length === 0 && (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                    Aucune erreur récente
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
