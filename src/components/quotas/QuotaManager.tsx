import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, CheckCircle, Clock, Zap, Package, 
  Database, Upload, TrendingUp, RefreshCw 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedPlan } from '@/components/plan/UnifiedPlanProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const QUOTA_DEFINITIONS = {
  monthly_imports: {
    name: 'Imports mensuels',
    description: 'Nombre d\'imports de produits par mois',
    icon: <Upload className="w-4 h-4" />,
    resetPeriod: 'monthly'
  },
  products_catalog: {
    name: 'Produits au catalogue',
    description: 'Nombre maximum de produits dans votre catalogue',
    icon: <Package className="w-4 h-4" />,
    resetPeriod: 'never'
  },
  integrations: {
    name: 'Intégrations',
    description: 'Nombre de plateformes connectées',
    icon: <Zap className="w-4 h-4" />,
    resetPeriod: 'never'
  },
  api_calls_daily: {
    name: 'Appels API quotidiens',
    description: 'Nombre d\'appels API par jour',
    icon: <Database className="w-4 h-4" />,
    resetPeriod: 'daily'
  },
  storage_mb: {
    name: 'Stockage (MB)',
    description: 'Espace de stockage utilisé',
    icon: <Database className="w-4 h-4" />,
    resetPeriod: 'never'
  },
  ai_operations_monthly: {
    name: 'Opérations IA mensuelles',
    description: 'Optimisations et analyses IA par mois',
    icon: <TrendingUp className="w-4 h-4" />,
    resetPeriod: 'monthly'
  },
  bulk_operations_monthly: {
    name: 'Opérations en lot mensuelles',
    description: 'Modifications en masse par mois',
    icon: <RefreshCw className="w-4 h-4" />,
    resetPeriod: 'monthly'
  }
};

export function QuotaManager() {
  const { user } = useAuth();
  const { plan, isUltraPro, isPro } = useUnifiedPlan();
  const { toast } = useToast();
  const [quotas, setQuotas] = useState({});
  const [limits, setLimits] = useState({});
  const [loading, setLoading] = useState(true);

  const loadQuotas = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load current quotas
      const { data: quotaData, error: quotaError } = await supabase
        .from('user_quotas')
        .select('*')
        .eq('user_id', user.id);

      if (quotaError) throw quotaError;

      // Load plan limits
      const { data: limitsData, error: limitsError } = await supabase
        .from('plans_limits')
        .select('*')
        .eq('plan', plan);

      if (limitsError) throw limitsError;

      // Process quotas into object
      const quotaMap = {};
      quotaData?.forEach(quota => {
        quotaMap[quota.quota_key] = {
          current: quota.current_count,
          resetDate: quota.reset_date,
          updatedAt: quota.updated_at
        };
      });

      // Process limits into object
      const limitsMap = {};
      limitsData?.forEach(limit => {
        limitsMap[limit.limit_key] = limit.limit_value;
      });

      setQuotas(quotaMap);
      setLimits(limitsMap);

    } catch (error) {
      console.error('Error loading quotas:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les quotas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkQuota = async (quotaKey, increment = 0) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-quota', {
        body: {
          quota_key: quotaKey,
          increment
        }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error checking quota:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadQuotas();
  }, [user, plan]);

  const getUsagePercentage = (quotaKey) => {
    const current = quotas[quotaKey]?.current || 0;
    const limit = limits[quotaKey];
    
    if (!limit || limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageStatus = (quotaKey) => {
    const percentage = getUsagePercentage(quotaKey);
    
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    return 'normal';
  };

  const formatLimit = (limit) => {
    if (limit === -1) return 'Illimité';
    if (limit >= 1000000) return `${(limit / 1000000).toFixed(1)}M`;
    if (limit >= 1000) return `${(limit / 1000).toFixed(1)}K`;
    return limit.toString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getAvailableQuotas = () => {
    const baseQuotas = ['monthly_imports', 'products_catalog', 'integrations', 'api_calls_daily', 'storage_mb'];
    
    if (isPro || isUltraPro) {
      baseQuotas.push('ai_operations_monthly');
    }
    
    if (isUltraPro) {
      baseQuotas.push('bulk_operations_monthly');
    }
    
    return baseQuotas;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Chargement des quotas...</p>
        </div>
      </div>
    );
  }

  const availableQuotas = getAvailableQuotas();
  const criticalQuotas = availableQuotas.filter(key => getUsageStatus(key) === 'critical');
  const warningQuotas = availableQuotas.filter(key => getUsageStatus(key) === 'warning');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Quotas</h2>
          <p className="text-muted-foreground">
            Surveillez votre utilisation et les limites de votre plan {plan}
          </p>
        </div>
        <Button variant="outline" onClick={loadQuotas} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Alerts */}
      {criticalQuotas.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Attention :</strong> {criticalQuotas.length} quota(s) ont atteint plus de 90% d'utilisation.
            Considérez une mise à niveau de votre plan.
          </AlertDescription>
        </Alert>
      )}

      {warningQuotas.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Avertissement :</strong> {warningQuotas.length} quota(s) approchent de leur limite.
          </AlertDescription>
        </Alert>
      )}

      {/* Plan Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            Plan Actuel: {plan}
            <Badge variant="default" className="ml-2 capitalize">
              {isUltraPro ? 'Ultra Pro' : isPro ? 'Pro' : 'Standard'}
            </Badge>
          </CardTitle>
          <CardDescription>
            {isUltraPro && "Accès illimité à toutes les fonctionnalités"}
            {isPro && !isUltraPro && "Accès aux fonctionnalités avancées"}
            {!isPro && "Plan de base avec fonctionnalités essentielles"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quota Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {availableQuotas.map((quotaKey) => {
          const quota = QUOTA_DEFINITIONS[quotaKey];
          const current = quotas[quotaKey]?.current || 0;
          const limit = limits[quotaKey];
          const percentage = getUsagePercentage(quotaKey);
          const status = getUsageStatus(quotaKey);
          const resetDate = quotas[quotaKey]?.resetDate;

          return (
            <Card key={quotaKey}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {quota.icon}
                    <CardTitle className="text-lg">{quota.name}</CardTitle>
                  </div>
                  <Badge 
                    variant={status === 'critical' ? 'destructive' : status === 'warning' ? 'secondary' : 'default'}
                  >
                    {status === 'critical' ? <AlertTriangle className="w-3 h-3 mr-1" /> : 
                     status === 'warning' ? <AlertTriangle className="w-3 h-3 mr-1" /> : 
                     <CheckCircle className="w-3 h-3 mr-1" />}
                    {Math.round(percentage)}%
                  </Badge>
                </div>
                <CardDescription>{quota.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Utilisation</span>
                  <span className="text-sm font-medium">
                    {current} / {formatLimit(limit)}
                  </span>
                </div>
                
                <Progress 
                  value={percentage} 
                  className={`h-2 ${
                    status === 'critical' ? '[&>div]:bg-red-500' : 
                    status === 'warning' ? '[&>div]:bg-yellow-500' : 
                    '[&>div]:bg-green-500'
                  }`}
                />

                {resetDate && quota.resetPeriod !== 'never' && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    Remise à zéro: {new Date(resetDate).toLocaleDateString()}
                  </div>
                )}

                {limit === -1 && (
                  <Badge variant="outline" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Illimité
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upgrade Suggestion */}
      {(criticalQuotas.length > 0 || warningQuotas.length > 0) && !isUltraPro && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Besoin de plus de ressources ?
            </CardTitle>
            <CardDescription>
              Mettez à niveau votre plan pour obtenir des limites plus élevées ou illimitées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              {!isPro && (
                <Button>
                  Passer au Plan Pro
                </Button>
              )}
              {!isUltraPro && (
                <Button variant={isPro ? "default" : "outline"}>
                  Passer au Plan Ultra Pro
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}