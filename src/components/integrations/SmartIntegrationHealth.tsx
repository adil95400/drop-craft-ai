import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Settings,
  RefreshCw,
  Bot,
  Heart,
  Wifi,
  Database,
  Globe
} from 'lucide-react';

interface IntegrationHealthMetric {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'offline';
  uptime: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  lastSync: string;
  predictions: {
    nextFailure?: string;
    performanceTrend: 'improving' | 'stable' | 'degrading';
    recommendedActions: string[];
  };
  healthScore: number;
  autoHealing: {
    enabled: boolean;
    lastAction?: string;
    successRate: number;
  };
}

export function SmartIntegrationHealth() {
  const [metrics, setMetrics] = useState<IntegrationHealthMetric[]>([
    {
      id: '1',
      name: 'Shopify Store',
      status: 'healthy',
      uptime: 99.8,
      responseTime: 145,
      errorRate: 0.2,
      throughput: 1250,
      lastSync: '2024-01-15T10:30:00Z',
      predictions: {
        performanceTrend: 'stable',
        recommendedActions: ['Optimiser cache API', 'Monitorer pic de trafic prévu']
      },
      healthScore: 95,
      autoHealing: {
        enabled: true,
        lastAction: 'Cache refresh automatique',
        successRate: 94
      }
    },
    {
      id: '2',
      name: 'WooCommerce',
      status: 'warning',
      uptime: 97.5,
      responseTime: 890,
      errorRate: 2.1,
      throughput: 850,
      lastSync: '2024-01-15T10:25:00Z',
      predictions: {
        nextFailure: '2024-01-15T14:00:00Z',
        performanceTrend: 'degrading',
        recommendedActions: ['Redémarrer service', 'Vérifier quotas API', 'Mettre à jour credentials']
      },
      healthScore: 72,
      autoHealing: {
        enabled: true,
        lastAction: 'Retry automatique des requêtes échouées',
        successRate: 87
      }
    },
    {
      id: '3',
      name: 'Stripe Payments',
      status: 'healthy',
      uptime: 99.9,
      responseTime: 89,
      errorRate: 0.1,
      throughput: 2100,
      lastSync: '2024-01-15T10:32:00Z',
      predictions: {
        performanceTrend: 'improving',
        recommendedActions: ['Configuration optimale maintenue']
      },
      healthScore: 98,
      autoHealing: {
        enabled: true,
        lastAction: 'Aucune intervention requise',
        successRate: 99
      }
    },
    {
      id: '4',
      name: 'MailChimp API',
      status: 'error',
      uptime: 85.2,
      responseTime: 2400,
      errorRate: 8.5,
      throughput: 320,
      lastSync: '2024-01-15T09:45:00Z',
      predictions: {
        nextFailure: 'En cours',
        performanceTrend: 'degrading',
        recommendedActions: ['Reconnexion d\'urgence requise', 'Vérifier credentials expirés', 'Basculer vers backup']
      },
      healthScore: 45,
      autoHealing: {
        enabled: true,
        lastAction: 'Tentative de reconnexion échouée',
        successRate: 23
      }
    }
  ]);

  const [isAutoHealingActive, setIsAutoHealingActive] = useState(false);

  useEffect(() => {
    // Simulation mise à jour temps réel
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        responseTime: metric.responseTime + (Math.random() - 0.5) * 50,
        throughput: Math.max(0, metric.throughput + (Math.random() - 0.5) * 100),
        errorRate: Math.max(0, metric.errorRate + (Math.random() - 0.5) * 0.5)
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'offline': return <Wifi className="w-5 h-5 text-gray-400" />;
      default: return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-700 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
      case 'offline': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'degrading': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const handleAutoHeal = async (metricId: string) => {
    setIsAutoHealingActive(true);
    
    // Simulation auto-healing
    setTimeout(() => {
      setMetrics(prev => prev.map(metric => 
        metric.id === metricId 
          ? { 
              ...metric, 
              status: metric.status === 'error' ? 'warning' : 'healthy',
              healthScore: Math.min(100, metric.healthScore + 20),
              autoHealing: {
                ...metric.autoHealing,
                lastAction: 'Auto-healing exécuté avec succès'
              }
            }
          : metric
      ));
      setIsAutoHealingActive(false);
    }, 3000);
  };

  const overallHealth = Math.round(metrics.reduce((sum, m) => sum + m.healthScore, 0) / metrics.length);
  const criticalIssues = metrics.filter(m => m.status === 'error').length;
  const warningIssues = metrics.filter(m => m.status === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header avec métriques globales */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            Santé des Intégrations IA
          </CardTitle>
          <CardDescription>
            Monitoring intelligent et auto-healing de vos intégrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{overallHealth}%</div>
              <p className="text-sm text-muted-foreground">Santé Globale</p>
              <Progress value={overallHealth} className="mt-2 h-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{criticalIssues}</div>
              <p className="text-sm text-muted-foreground">Erreurs Critiques</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{warningIssues}</div>
              <p className="text-sm text-muted-foreground">Avertissements</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {metrics.filter(m => m.autoHealing.enabled).length}
              </div>
              <p className="text-sm text-muted-foreground">Auto-Healing Actif</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertes critiques */}
      {criticalIssues > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {criticalIssues} intégration(s) en erreur critique. Intervention recommandée.
          </AlertDescription>
        </Alert>
      )}

      {/* Liste des intégrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(metric.status)}
                  <div>
                    <CardTitle className="text-lg">{metric.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={getStatusColor(metric.status)}>
                        {metric.status.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(metric.predictions.performanceTrend)}
                        <span className="text-xs text-muted-foreground">
                          {metric.predictions.performanceTrend}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{metric.healthScore}%</div>
                  <div className="text-xs text-muted-foreground">Score santé</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Métriques techniques */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Uptime:</span>
                    <span className="font-medium">{metric.uptime}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Temps réponse:</span>
                    <span className="font-medium">{Math.round(metric.responseTime)}ms</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taux erreur:</span>
                    <span className="font-medium">{metric.errorRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Débit:</span>
                    <span className="font-medium">{Math.round(metric.throughput)}/h</span>
                  </div>
                </div>
              </div>

              {/* Auto-Healing Status */}
              <div className="bg-muted/30 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-500" />
                    Auto-Healing
                  </span>
                  <Badge variant={metric.autoHealing.enabled ? 'default' : 'secondary'}>
                    {metric.autoHealing.enabled ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  Taux de réussite: {metric.autoHealing.successRate}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Dernière action: {metric.autoHealing.lastAction}
                </div>
              </div>

              {/* Prédictions IA */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-500" />
                  Prédictions IA
                </h4>
                {metric.predictions.nextFailure && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    ⚠️ Panne prédite: {new Date(metric.predictions.nextFailure).toLocaleString()}
                  </div>
                )}
                <div className="space-y-1">
                  {metric.predictions.recommendedActions.map((action, index) => (
                    <div key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                      {action}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleAutoHeal(metric.id)}
                  disabled={isAutoHealingActive || metric.status === 'healthy'}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isAutoHealingActive ? 'animate-spin' : ''}`} />
                  Auto-Heal
                </Button>
                <Button size="sm" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurer
                </Button>
                <Button size="sm" variant="outline">
                  <Activity className="w-4 h-4 mr-2" />
                  Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}