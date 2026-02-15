import { useState, useEffect } from 'react';
import { productionLogger } from '@/utils/productionLogger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedQuotas } from '@/hooks/useUnifiedQuotas';
import { supabase } from '@/integrations/supabase/client';
import {
  Settings,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Edit,
  Plus,
  Minus,
  RefreshCw,
  BarChart3,
  Crown,
  Zap,
  Shield
} from 'lucide-react';

interface PlanLimit {
  id?: string;
  plan_name: string;
  plan_type?: string;
  limit_key: string;
  limit_value: number;
  display_name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

interface UserQuotaUsage {
  user_id: string;
  user_email: string;
  user_name: string;
  plan: string;
  quotas: {
    [key: string]: {
      current: number;
      limit: number;
      percentage: number;
    };
  };
}

import { QuotaDisplayNames } from '@/types/common'
import { LucideIcon } from 'lucide-react'

const QUOTA_DISPLAY_NAMES: QuotaDisplayNames = {
  products: {
    name: 'Produits',
    description: 'Nombre maximum de produits dans le catalogue',
    icon: Package
  },
  suppliers: {
    name: 'Fournisseurs',
    description: 'Nombre maximum de fournisseurs connectés',
    icon: Users
  },
  orders: {
    name: 'Commandes',
    description: 'Nombre maximum de commandes par mois',
    icon: TrendingUp
  },
  exports: {
    name: 'Exports',
    description: 'Nombre maximum d\'exports de données par mois',
    icon: BarChart3
  },
  ai_analysis: {
    name: 'Analyses IA',
    description: 'Nombre maximum d\'analyses IA par mois',
    icon: Zap
  },
  automations: {
    name: 'Automatisations',
    description: 'Nombre maximum d\'automatisations actives',
    icon: Settings
  },
  white_label: {
    name: 'White Label',
    description: 'Accès aux fonctionnalités de marque blanche',
    icon: Crown
  }
};

export const QuotaManager = () => {
  const [planLimits, setPlanLimits] = useState<PlanLimit[]>([]);
  const [userUsages, setUserUsages] = useState<UserQuotaUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLimit, setEditingLimit] = useState<PlanLimit | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadQuotaData();
  }, []);

  const loadQuotaData = async () => {
    try {
      setLoading(true);
      
      // Charger les limites par plan
      const { data: limits, error: limitsError } = await supabase
        .from('plan_limits')
        .select('*')
        .order('plan_type', { ascending: true })
        .order('limit_key', { ascending: true });
      
      if (limitsError) throw limitsError;
      
      const formattedLimits = limits?.map(limit => ({
        ...limit,
        display_name: QUOTA_DISPLAY_NAMES[limit.limit_key]?.name || limit.limit_key,
        description: QUOTA_DISPLAY_NAMES[limit.limit_key]?.description || 'Description non disponible'
      })) || [];
      
      setPlanLimits(formattedLimits);
      
      // Charger les usages utilisateurs (simulation)
      const userUsages = await loadUserQuotaUsages();
      setUserUsages(userUsages);
      
    } catch (error) {
      productionLogger.error('Failed to load quota data', error as Error, 'QuotaManager');
      toast({
        title: "Erreur",
        description: "Impossible de charger les données des quotas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserQuotaUsages = async (): Promise<UserQuotaUsage[]> => {
    // Simulation des usages utilisateurs
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        user_id: '1',
        user_email: 'john@example.com',
        user_name: 'John Doe',
        plan: 'pro',
        quotas: {
          products: { current: 7500, limit: 10000, percentage: 75 },
          suppliers: { current: 18, limit: 25, percentage: 72 },
          orders: { current: 650, limit: 1000, percentage: 65 },
          exports: { current: 35, limit: 50, percentage: 70 },
          ai_analysis: { current: 42, limit: 50, percentage: 84 },
          automations: { current: 8, limit: 10, percentage: 80 }
        }
      },
      {
        user_id: '2',
        user_email: 'marie@company.com',
        user_name: 'Marie Martin',
        plan: 'ultra_pro',
        quotas: {
          products: { current: 25000, limit: -1, percentage: 0 },
          suppliers: { current: 45, limit: -1, percentage: 0 },
          orders: { current: 2500, limit: -1, percentage: 0 },
          exports: { current: 120, limit: -1, percentage: 0 },
          ai_analysis: { current: 180, limit: -1, percentage: 0 },
          automations: { current: 25, limit: -1, percentage: 0 },
          white_label: { current: 1, limit: 1, percentage: 100 }
        }
      },
      {
        user_id: '3',
        user_email: 'test@startup.fr',
        user_name: 'Pierre Dupont',
        plan: 'standard',
        quotas: {
          products: { current: 850, limit: 1000, percentage: 85 },
          suppliers: { current: 4, limit: 5, percentage: 80 },
          orders: { current: 95, limit: 100, percentage: 95 },
          exports: { current: 9, limit: 10, percentage: 90 },
          ai_analysis: { current: 5, limit: 5, percentage: 100 }
        }
      }
    ];
  };

  const updatePlanLimit = async (planType: string, limitKey: string, newValue: number) => {
    try {
      const { error } = await supabase
        .from('plan_limits')
        .update({ limit_value: newValue })
        .eq('plan_name', planType)
        .eq('limit_key', limitKey);
      
      if (error) throw error;
      
      toast({
        title: "Limite mise à jour",
        description: `Nouvelle limite: ${newValue === -1 ? 'Illimitée' : newValue.toLocaleString()}`
      });
      
      await loadQuotaData();
      setShowEditDialog(false);
      setEditingLimit(null);
      
    } catch (error) {
      productionLogger.error('Failed to update plan limit', error as Error, 'QuotaManager');
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la limite",
        variant: "destructive"
      });
    }
  };

  const adjustUserQuota = async (userId: string, quotaKey: string, adjustment: number) => {
    try {
      // Simuler l'ajustement des quotas utilisateur
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Quota ajusté",
        description: `Quota ${quotaKey} ${adjustment > 0 ? 'augmenté' : 'diminué'} de ${Math.abs(adjustment)}`
      });
      
      // Recharger les données
      await loadQuotaData();
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajuster le quota",
        variant: "destructive"
      });
    }
  };

  const resetUserQuotas = async (userId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Quotas réinitialisés",
        description: "Tous les quotas de l'utilisateur ont été remis à zéro"
      });
      
      await loadQuotaData();
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de réinitialiser les quotas",
        variant: "destructive"
      });
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'ultra_pro': return 'default';
      case 'pro': return 'secondary';
      case 'standard': return 'outline';
      default: return 'outline';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const filteredUsers = userUsages.filter(user => {
    const matchesPlan = selectedPlan === 'all' || user.plan === selectedPlan;
    const matchesSearch = searchTerm === '' || 
      user.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPlan && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Gestionnaire de Quotas
          </h2>
          <p className="text-muted-foreground">
            Gestion des limites par plan et surveillance des usages
          </p>
        </div>
        <Button onClick={loadQuotaData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Configuration des limites par plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configuration des Plans
          </CardTitle>
          <CardDescription>
            Définir les limites pour chaque plan d'abonnement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {['standard', 'pro', 'ultra_pro'].map(plan => (
              <div key={plan} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={getPlanBadgeVariant(plan)} className="text-sm">
                    {plan.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Limites et quotas pour ce plan
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {planLimits
                    .filter(limit => limit.plan_type === plan)
                    .map(limit => {
                      const QuotaIcon = QUOTA_DISPLAY_NAMES[limit.limit_key]?.icon || Package;
                      return (
                        <Card key={`${limit.plan_type}-${limit.limit_key}`} className="border-dashed">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <QuotaIcon className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">{limit.display_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {limit.limit_value === -1 ? 'Illimité' : limit.limit_value.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingLimit(limit);
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {limit.description}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Surveillance des usages utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage des Quotas par Utilisateur
          </CardTitle>
          <CardDescription>
            Surveiller et ajuster les quotas individuels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les plans</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="ultra_pro">Ultra Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des utilisateurs */}
          <div className="space-y-6">
            {filteredUsers.map(user => (
              <Card key={user.user_id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{user.user_name}</CardTitle>
                      <CardDescription>{user.user_email}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPlanBadgeVariant(user.plan)}>
                        {user.plan.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetUserQuotas(user.user_id)}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(user.quotas).map(([key, quota]) => {
                      const QuotaIcon = QUOTA_DISPLAY_NAMES[key]?.icon || Package;
                      const isUnlimited = quota.limit === -1;
                      
                      return (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <QuotaIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {QUOTA_DISPLAY_NAMES[key]?.name || key}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => adjustUserQuota(user.user_id, key, -10)}
                                disabled={quota.current === 0}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => adjustUserQuota(user.user_id, key, 10)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>
                                {quota.current.toLocaleString()} / {isUnlimited ? '∞' : quota.limit.toLocaleString()}
                              </span>
                              {!isUnlimited && (
                                <span className={getUsageColor(quota.percentage)}>
                                  {quota.percentage.toFixed(0)}%
                                </span>
                              )}
                            </div>
                            {!isUnlimited && (
                              <div className="relative">
                                <Progress value={quota.percentage} className="h-2" />
                                <div 
                                  className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(quota.percentage)}`}
                                  style={{ width: `${Math.min(quota.percentage, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                          
                          {!isUnlimited && quota.percentage >= 90 && (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Limite presque atteinte</span>
                            </div>
                          )}
                          
                          {!isUnlimited && quota.percentage >= 100 && (
                            <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Limite dépassée</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog d'édition des limites */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la Limite</DialogTitle>
            <DialogDescription>
              Ajuster la limite pour {editingLimit?.display_name} dans le plan {editingLimit?.plan_type}
            </DialogDescription>
          </DialogHeader>
          
          {editingLimit && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="limit-value">Nouvelle Limite</Label>
                <Input
                  id="limit-value"
                  type="number"
                  defaultValue={editingLimit.limit_value === -1 ? '' : editingLimit.limit_value}
                  placeholder="Entrez -1 pour illimité"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {editingLimit.description}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button onClick={() => {
              const input = document.getElementById('limit-value') as HTMLInputElement;
              const newValue = input.value === '' ? -1 : parseInt(input.value);
              if (editingLimit) {
                updatePlanLimit(editingLimit.plan_type, editingLimit.limit_key, newValue);
              }
            }}>
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};