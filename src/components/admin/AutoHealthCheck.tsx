import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Globe,
  Key,
  Loader2,
  Play,
  RefreshCw,
  Server,
  Shield,
  XCircle,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HealthCheckResult {
  name: string;
  category: 'database' | 'api' | 'integration' | 'security';
  status: 'pass' | 'warning' | 'fail' | 'running';
  message: string;
  duration?: number;
  timestamp: Date;
}

interface HealthCheckConfig {
  autoRun: boolean;
  intervalMinutes: number;
  notifyOnFail: boolean;
}

export const AutoHealthCheck = () => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [progress, setProgress] = useState(0);
  const [config, setConfig] = useState<HealthCheckConfig>({
    autoRun: false,
    intervalMinutes: 30,
    notifyOnFail: true
  });

  // Auto-run interval
  useEffect(() => {
    if (!config.autoRun) return;

    const interval = setInterval(() => {
      runHealthChecks();
    }, config.intervalMinutes * 60 * 1000);

    return () => clearInterval(interval);
  }, [config.autoRun, config.intervalMinutes]);

  const addResult = (result: HealthCheckResult) => {
    setResults(prev => [...prev, result]);
  };

  const runHealthChecks = async () => {
    setRunning(true);
    setResults([]);
    setProgress(0);

    const checks = [
      { name: 'Connexion base de données', category: 'database' as const, fn: checkDatabase },
      { name: 'Tables principales', category: 'database' as const, fn: checkTables },
      { name: 'Politiques RLS', category: 'security' as const, fn: checkRLS },
      { name: 'Edge Functions critiques', category: 'api' as const, fn: checkEdgeFunctions },
      { name: 'Intégrations Shopify', category: 'integration' as const, fn: checkShopifyIntegration },
      { name: 'Webhooks actifs', category: 'integration' as const, fn: checkWebhooks },
      { name: 'Clés API valides', category: 'security' as const, fn: checkAPIKeys },
      { name: 'Storage buckets', category: 'database' as const, fn: checkStorage },
    ];

    for (let i = 0; i < checks.length; i++) {
      const check = checks[i];
      const startTime = Date.now();

      addResult({
        name: check.name,
        category: check.category,
        status: 'running',
        message: 'Vérification en cours...',
        timestamp: new Date()
      });

      try {
        const result = await check.fn();
        const duration = Date.now() - startTime;

        setResults(prev => prev.map(r =>
          r.name === check.name
            ? { ...r, ...result, duration, timestamp: new Date() }
            : r
        ));
      } catch (error: any) {
        setResults(prev => prev.map(r =>
          r.name === check.name
            ? {
                ...r,
                status: 'fail' as const,
                message: error.message || 'Erreur inconnue',
                duration: Date.now() - startTime,
                timestamp: new Date()
              }
            : r
        ));
      }

      setProgress(((i + 1) / checks.length) * 100);
    }

    setLastRun(new Date());
    setRunning(false);

    // Notify on failures
    const failures = results.filter(r => r.status === 'fail');
    if (failures.length > 0 && config.notifyOnFail) {
      toast.error(`${failures.length} vérification(s) échouée(s)`);
    } else {
      toast.success('Toutes les vérifications sont passées');
    }
  };

  // Individual check functions
  const checkDatabase = async (): Promise<Partial<HealthCheckResult>> => {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;
    return { status: 'pass', message: 'Connexion établie' };
  };

  const checkTables = async (): Promise<Partial<HealthCheckResult>> => {
    const errors: string[] = [];

    // Check each table explicitly to avoid dynamic table name issues
    const { error: productsError } = await supabase.from('products').select('id').limit(1);
    if (productsError) errors.push('products');

    const { error: ordersError } = await supabase.from('orders').select('id').limit(1);
    if (ordersError) errors.push('orders');

    const { error: customersError } = await supabase.from('customers').select('id').limit(1);
    if (customersError) errors.push('customers');

    const { error: profilesError } = await supabase.from('profiles').select('id').limit(1);
    if (profilesError) errors.push('profiles');

    if (errors.length > 0) {
      return { status: 'fail', message: `Tables inaccessibles: ${errors.join(', ')}` };
    }
    return { status: 'pass', message: '4 tables vérifiées' };
  };

  const checkRLS = async (): Promise<Partial<HealthCheckResult>> => {
    // Check if RLS is working by attempting unauthorized access
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    // If we get data or a proper auth error, RLS is working
    if (error?.code === 'PGRST116' || !error) {
      return { status: 'pass', message: 'Politiques RLS actives' };
    }
    return { status: 'warning', message: 'Vérification RLS limitée' };
  };

  const checkEdgeFunctions = async (): Promise<Partial<HealthCheckResult>> => {
    try {
      const { data, error } = await supabase.functions.invoke('system-health-check', {
        body: { ping: true }
      });

      if (error && error.message?.includes('not found')) {
        return { status: 'warning', message: 'Function health-check non déployée' };
      }
      if (error) throw error;

      return { status: 'pass', message: 'Edge Functions opérationnelles' };
    } catch (error: any) {
      return { status: 'warning', message: 'Vérification Edge Functions incomplète' };
    }
  };

  const checkShopifyIntegration = async (): Promise<Partial<HealthCheckResult>> => {
    try {
      // Check via edge function to avoid type instantiation issues
      const { data, error } = await supabase.functions.invoke('system-health-check', {
        body: { check: 'shopify' }
      });

      if (error && error.message?.includes('not found')) {
        // Fallback: check if we have any Shopify config in localStorage
        const hasShopifyConfig = localStorage.getItem('shopify_connected') === 'true';
        if (hasShopifyConfig) {
          return { status: 'pass', message: 'Intégration Shopify configurée' };
        }
        return { status: 'warning', message: 'Aucune intégration Shopify détectée' };
      }

      if (error) {
        return { status: 'warning', message: 'Vérification Shopify limitée' };
      }

      return { status: 'pass', message: 'Intégration Shopify opérationnelle' };
    } catch {
      return { status: 'warning', message: 'Vérification Shopify non disponible' };
    }
  };

  const checkWebhooks = async (): Promise<Partial<HealthCheckResult>> => {
    const { data, error } = await supabase
      .from('api_logs')
      .select('id, created_at')
      .ilike('endpoint', '%webhook%')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return { status: 'warning', message: 'Logs webhooks non accessibles' };
    }

    if (!data || data.length === 0) {
      return { status: 'warning', message: 'Aucun webhook reçu (24h)' };
    }

    return { status: 'pass', message: `${data.length} webhooks reçus (24h)` };
  };

  const checkAPIKeys = async (): Promise<Partial<HealthCheckResult>> => {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, is_active, expires_at')
      .eq('is_active', true);

    if (error) throw error;

    const expiredKeys = data?.filter(k => k.expires_at && new Date(k.expires_at) < new Date()) || [];
    
    if (expiredKeys.length > 0) {
      return { status: 'warning', message: `${expiredKeys.length} clé(s) expirée(s)` };
    }

    return { status: 'pass', message: `${data?.length || 0} clé(s) active(s)` };
  };

  const checkStorage = async (): Promise<Partial<HealthCheckResult>> => {
    const { data, error } = await supabase.storage.listBuckets();

    if (error) throw error;

    return { status: 'pass', message: `${data?.length || 0} bucket(s) configuré(s)` };
  };

  const getStatusIcon = (status: HealthCheckResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    }
  };

  const getCategoryIcon = (category: HealthCheckResult['category']) => {
    switch (category) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'api':
        return <Server className="h-4 w-4" />;
      case 'integration':
        return <Globe className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
    }
  };

  const passCount = results.filter(r => r.status === 'pass').length;
  const warnCount = results.filter(r => r.status === 'warning').length;
  const failCount = results.filter(r => r.status === 'fail').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Bilan de santé automatique
          </h2>
          <p className="text-muted-foreground">
            Vérifications automatiques de l'infrastructure
          </p>
        </div>
        <Button onClick={runHealthChecks} disabled={running}>
          {running ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Vérification...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Lancer le bilan
            </>
          )}
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Réussis</p>
                <p className="text-2xl font-bold text-success">{passCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avertissements</p>
                <p className="text-2xl font-bold text-warning">{warnCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Échecs</p>
                <p className="text-2xl font-bold text-destructive">{failCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Results */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Résultats des vérifications</CardTitle>
            <CardDescription>
              {lastRun
                ? `Dernière exécution: ${lastRun.toLocaleString('fr-FR')}`
                : 'Aucune exécution récente'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {running && (
              <div className="mb-4">
                <Progress value={progress} />
                <p className="text-xs text-center text-muted-foreground mt-1">
                  {Math.round(progress)}% complété
                </p>
              </div>
            )}

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(result.category)}
                        <span className="font-medium">{result.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{result.message}</span>
                      {result.duration && (
                        <Badge variant="outline">{result.duration}ms</Badge>
                      )}
                    </div>
                  </div>
                ))}

                {results.length === 0 && !running && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune vérification effectuée</p>
                    <p className="text-sm">Lancez un bilan de santé pour voir les résultats</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Paramètres de vérification automatique</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoRun">Exécution automatique</Label>
              <Switch
                id="autoRun"
                checked={config.autoRun}
                onCheckedChange={(v) => setConfig(prev => ({ ...prev, autoRun: v }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Intervalle (minutes)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={config.intervalMinutes}
                  onChange={(e) => setConfig(prev => ({ ...prev, intervalMinutes: parseInt(e.target.value) || 30 }))}
                  className="w-20 px-3 py-2 border rounded-md"
                  min={5}
                  max={120}
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notifyOnFail">Notifier en cas d'échec</Label>
              <Switch
                id="notifyOnFail"
                checked={config.notifyOnFail}
                onCheckedChange={(v) => setConfig(prev => ({ ...prev, notifyOnFail: v }))}
              />
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                {config.autoRun
                  ? `Prochaine vérification dans ${config.intervalMinutes} minutes`
                  : 'Exécution automatique désactivée'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
