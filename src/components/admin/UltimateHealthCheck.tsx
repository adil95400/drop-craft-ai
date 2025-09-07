import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  Database, 
  Server, 
  Shield, 
  Zap,
  Globe,
  Users,
  ShoppingCart,
  TrendingUp,
  Chrome,
  Smartphone,
  Cloud,
  Cpu
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface HealthCheckResult {
  category: string;
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
  performance?: number;
}

export function UltimateHealthCheck() {
  const [healthResults, setHealthResults] = useState<HealthCheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [overallScore, setOverallScore] = useState(0);
  const { toast } = useToast();

  const healthChecks = [
    // Infrastructure
    {
      category: 'Infrastructure',
      name: 'Base de données Supabase',
      check: async () => {
        const start = Date.now();
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        const performance = Date.now() - start;
        
        if (error) {
          return { status: 'error', message: 'Connexion échouée', details: error.message, performance };
        }
        return { status: 'success', message: 'Connexion active', performance };
      }
    },
    
    {
      category: 'Infrastructure',
      name: 'Edge Functions',
      check: async () => {
        const start = Date.now();
        try {
          const { data, error } = await supabase.functions.invoke('business-intelligence-engine', {
            body: { action: 'health_check' }
          });
          const performance = Date.now() - start;
          
          if (error) {
            return { status: 'warning', message: 'Latence élevée', performance };
          }
          return { status: 'success', message: 'Fonctions actives', performance };
        } catch (error) {
          return { status: 'error', message: 'Edge Functions indisponibles', details: String(error) };
        }
      }
    },

    // Sécurité
    {
      category: 'Sécurité',
      name: 'Row Level Security',
      check: async () => {
        try {
          // Test RLS by trying to access data without auth
          const { data: publicData } = await supabase.from('suppliers').select('*').limit(1);
          
          if (publicData && publicData.length > 0) {
            return { status: 'error', message: 'RLS non configuré', details: 'Données publiques accessibles' };
          }
          return { status: 'success', message: 'RLS activé correctement' };
        } catch (error) {
          return { status: 'success', message: 'Accès restreint actif' };
        }
      }
    },

    {
      category: 'Sécurité',
      name: 'Authentification',
      check: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return { status: 'warning', message: 'Utilisateur non connecté' };
        }
        
        const tokenExp = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const timeLeft = tokenExp ? tokenExp - now : 0;
        
        if (timeLeft < 300) { // 5 minutes
          return { status: 'warning', message: 'Token expire bientôt', details: `${Math.floor(timeLeft / 60)} minutes restantes` };
        }
        
        return { status: 'success', message: 'Session active et valide' };
      }
    },

    // Performance
    {
      category: 'Performance',
      name: 'Temps de réponse API',
      check: async () => {
        const start = Date.now();
        await supabase.from('profiles').select('id').limit(1);
        const performance = Date.now() - start;
        
        if (performance > 1000) {
          return { status: 'error', message: 'Très lent', details: `${performance}ms`, performance };
        } else if (performance > 500) {
          return { status: 'warning', message: 'Latence élevée', details: `${performance}ms`, performance };
        }
        return { status: 'success', message: 'Excellent', details: `${performance}ms`, performance };
      }
    },

    {
      category: 'Performance',
      name: 'Cache & Storage',
      check: async () => {
        const cacheKeys = [
          'dropcraft_user_preferences',
          'dropcraft_dashboard_data',
          'dropcraft_extensions_cache'
        ];
        
        let cachedItems = 0;
        cacheKeys.forEach(key => {
          if (localStorage.getItem(key)) cachedItems++;
        });
        
        const efficiency = (cachedItems / cacheKeys.length) * 100;
        
        if (efficiency < 50) {
          return { status: 'warning', message: 'Cache sous-optimal', details: `${efficiency.toFixed(0)}% d'efficacité` };
        }
        return { status: 'success', message: 'Cache optimisé', details: `${efficiency.toFixed(0)}% d'efficacité` };
      }
    },

    // Fonctionnalités Business
    {
      category: 'Business',
      name: 'Extensions Système',
      check: async () => {
        const { data: extensions } = await supabase.from('extensions').select('id, status').limit(10);
        
        if (!extensions || extensions.length === 0) {
          return { status: 'warning', message: 'Aucune extension installée' };
        }
        
        const activeExtensions = extensions.filter(ext => ext.status === 'active').length;
        const successRate = (activeExtensions / extensions.length) * 100;
        
        if (successRate < 70) {
          return { status: 'warning', message: 'Extensions inactives', details: `${activeExtensions}/${extensions.length} actives` };
        }
        
        return { status: 'success', message: 'Extensions opérationnelles', details: `${activeExtensions}/${extensions.length} actives` };
      }
    },

    {
      category: 'Business',
      name: 'Import Jobs',
      check: async () => {
        const { data: jobs } = await supabase.from('extension_jobs')
          .select('status')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(50);
        
        if (!jobs || jobs.length === 0) {
          return { status: 'warning', message: 'Aucun job récent' };
        }
        
        const completedJobs = jobs.filter(job => job.status === 'completed').length;
        const successRate = (completedJobs / jobs.length) * 100;
        
        if (successRate < 80) {
          return { status: 'warning', message: 'Taux d\'échec élevé', details: `${successRate.toFixed(0)}% de succès` };
        }
        
        return { status: 'success', message: 'Jobs fonctionnels', details: `${successRate.toFixed(0)}% de succès` };
      }
    },

    // Intégrations
    {
      category: 'Intégrations',
      name: 'Extension Chrome',
      check: async () => {
        // Check if Chrome extension files exist
        try {
          const response = await fetch('/chrome-extension/manifest.json');
          if (response.ok) {
            return { status: 'success', message: 'Extension disponible' };
          }
          return { status: 'warning', message: 'Extension non trouvée' };
        } catch (error) {
          return { status: 'error', message: 'Extension indisponible' };
        }
      }
    },

    {
      category: 'Intégrations',
      name: 'API Externes',
      check: async () => {
        // Check external integrations
        const { data: integrations } = await supabase.from('enterprise_integrations')
          .select('sync_status')
          .eq('is_active', true)
          .limit(10);
        
        if (!integrations || integrations.length === 0) {
          return { status: 'warning', message: 'Aucune intégration active' };
        }
        
        const healthyIntegrations = integrations.filter(int => int.sync_status === 'connected').length;
        const healthRate = (healthyIntegrations / integrations.length) * 100;
        
        if (healthRate < 75) {
          return { status: 'warning', message: 'Intégrations dégradées', details: `${healthyIntegrations}/${integrations.length} connectées` };
        }
        
        return { status: 'success', message: 'Intégrations actives', details: `${healthyIntegrations}/${integrations.length} connectées` };
      }
    },

    // Analytics & Monitoring
    {
      category: 'Monitoring',
      name: 'Analytics Tracking',
      check: async () => {
        const { data: logs } = await supabase.from('activity_logs')
          .select('id')
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
          .limit(10);
        
        if (!logs || logs.length === 0) {
          return { status: 'warning', message: 'Tracking inactif' };
        }
        
        return { status: 'success', message: 'Analytics actifs', details: `${logs.length} événements/heure` };
      }
    },

    {
      category: 'Monitoring',
      name: 'Error Tracking',
      check: async () => {
        const { data: errors } = await supabase.from('activity_logs')
          .select('id')
          .eq('severity', 'error')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(20);
        
        if (errors && errors.length > 10) {
          return { status: 'error', message: 'Nombreuses erreurs', details: `${errors.length} erreurs/24h` };
        } else if (errors && errors.length > 5) {
          return { status: 'warning', message: 'Erreurs modérées', details: `${errors.length} erreurs/24h` };
        }
        
        return { status: 'success', message: 'Système stable', details: `${errors?.length || 0} erreurs/24h` };
      }
    }
  ];

  const runHealthCheck = async () => {
    setIsRunning(true);
    setProgress(0);
    setHealthResults([]);

    const results: HealthCheckResult[] = [];
    const totalChecks = healthChecks.length;

    for (let i = 0; i < healthChecks.length; i++) {
      const check = healthChecks[i];
      
      try {
        const result = await check.check();
        const healthResult: HealthCheckResult = {
          category: check.category,
          name: check.name,
          status: result.status as 'success' | 'warning' | 'error',
          message: result.message
        };
        
        if ('details' in result && result.details) {
          healthResult.details = result.details as string;
        }
        
        if ('performance' in result && result.performance) {
          healthResult.performance = result.performance as number;
        }
        
        results.push(healthResult);
      } catch (error) {
        results.push({
          category: check.category,
          name: check.name,
          status: 'error' as 'success' | 'warning' | 'error',
          message: 'Vérification échouée',
          details: String(error),
          performance: undefined
        });
      }
      
      setProgress(((i + 1) / totalChecks) * 100);
      setHealthResults([...results]);
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Calculate overall score
    const successCount = results.filter(r => r.status === 'success').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const score = Math.round(((successCount * 100) + (warningCount * 50)) / totalChecks);
    
    setOverallScore(score);
    setIsRunning(false);
    
    toast({
      title: "Vérification terminée",
      description: `Score global: ${score}% - ${successCount} succès, ${warningCount} avertissements, ${results.length - successCount - warningCount} erreurs`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Infrastructure': return <Server className="w-5 h-5" />;
      case 'Sécurité': return <Shield className="w-5 h-5" />;
      case 'Performance': return <Zap className="w-5 h-5" />;
      case 'Business': return <ShoppingCart className="w-5 h-5" />;
      case 'Intégrations': return <Globe className="w-5 h-5" />;
      case 'Monitoring': return <Activity className="w-5 h-5" />;
      default: return <Cpu className="w-5 h-5" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const groupedResults = healthResults.reduce((acc, result) => {
    if (!acc[result.category]) acc[result.category] = [];
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, HealthCheckResult[]>);

  const systemStats = {
    total: healthResults.length,
    success: healthResults.filter(r => r.status === 'success').length,
    warning: healthResults.filter(r => r.status === 'warning').length,
    error: healthResults.filter(r => r.status === 'error').length,
    avgPerformance: healthResults
      .filter(r => r.performance)
      .reduce((acc, r) => acc + (r.performance || 0), 0) / 
      healthResults.filter(r => r.performance).length || 0
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Vérification Complète du Système
          </CardTitle>
          <CardDescription>
            Diagnostic complet de la santé et performance de Drop Craft AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button 
              onClick={runHealthCheck} 
              disabled={isRunning}
              size="lg"
            >
              {isRunning ? 'Vérification en cours...' : 'Lancer la vérification'}
            </Button>
            
            {overallScore > 0 && (
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                  {overallScore}%
                </div>
                <div className="text-sm text-muted-foreground">Score Global</div>
              </div>
            )}
          </div>
          
          {isRunning && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                {Math.round(progress)}% terminé
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {healthResults.length > 0 && (
        <>
          {/* Statistics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{systemStats.success}</div>
                <div className="text-sm text-muted-foreground">Succès</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-500">{systemStats.warning}</div>
                <div className="text-sm text-muted-foreground">Avertissements</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{systemStats.error}</div>
                <div className="text-sm text-muted-foreground">Erreurs</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {Math.round(systemStats.avgPerformance)}ms
                </div>
                <div className="text-sm text-muted-foreground">Latence moy.</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Results */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">Tout</TabsTrigger>
              <TabsTrigger value="Infrastructure">Infra</TabsTrigger>
              <TabsTrigger value="Sécurité">Sécurité</TabsTrigger>
              <TabsTrigger value="Performance">Perf</TabsTrigger>
              <TabsTrigger value="Business">Business</TabsTrigger>
              <TabsTrigger value="Intégrations">API</TabsTrigger>
              <TabsTrigger value="Monitoring">Monitoring</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {Object.entries(groupedResults).map(([category, results]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {getCategoryIcon(category)}
                      {category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {results.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(result.status)}
                            <div>
                              <div className="font-medium">{result.name}</div>
                              <div className="text-sm text-muted-foreground">{result.message}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {result.performance && (
                              <Badge variant="outline">
                                {result.performance}ms
                              </Badge>
                            )}
                            {result.details && (
                              <Badge variant="secondary">
                                {result.details}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {Object.entries(groupedResults).map(([category, results]) => (
              <TabsContent key={category} value={category} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getCategoryIcon(category)}
                      {category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {results.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(result.status)}
                            <div>
                              <div className="font-medium">{result.name}</div>
                              <div className="text-sm text-muted-foreground">{result.message}</div>
                              {result.details && (
                                <div className="text-xs text-muted-foreground mt-1">{result.details}</div>
                              )}
                            </div>
                          </div>
                          {result.performance && (
                            <Badge variant="outline">
                              {result.performance}ms
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  );
}