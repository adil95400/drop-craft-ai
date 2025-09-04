import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Bot, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  type: 'pricing' | 'inventory' | 'marketing' | 'competitive';
  status: 'active' | 'paused' | 'inactive';
  success_rate: number;
  last_execution: string;
  revenue_impact: number;
  config: {
    conditions: any[];
    actions: any[];
    frequency: string;
  };
}

interface AutomationStats {
  total_rules: number;
  active_rules: number;
  total_executions: number;
  success_rate: number;
  revenue_generated: number;
  time_saved_hours: number;
}

export function AutomationCenter() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchAutomationData();
    }
  }, [user]);

  const fetchAutomationData = async () => {
    try {
      setLoading(true);

      // Simuler des données d'automatisation
      const mockRules: AutomationRule[] = [
        {
          id: '1',
          name: 'Optimisation Prix Dynamique',
          description: 'Ajuste automatiquement les prix selon la concurrence',
          type: 'pricing',
          status: 'active',
          success_rate: 94,
          last_execution: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          revenue_impact: 1250,
          config: {
            conditions: ['competitor_price_change', 'demand_increase'],
            actions: ['adjust_price', 'send_notification'],
            frequency: 'hourly'
          }
        },
        {
          id: '2',
          name: 'Réappro Intelligent',
          description: 'Commande automatique selon les prévisions de vente',
          type: 'inventory',
          status: 'active',
          success_rate: 87,
          last_execution: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          revenue_impact: 850,
          config: {
            conditions: ['low_stock', 'sales_velocity_high'],
            actions: ['create_purchase_order', 'notify_supplier'],
            frequency: 'daily'
          }
        },
        {
          id: '3',
          name: 'Campagnes Marketing Auto',
          description: 'Lance des campagnes publicitaires selon les tendances',
          type: 'marketing',
          status: 'paused',
          success_rate: 76,
          last_execution: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          revenue_impact: 2100,
          config: {
            conditions: ['trending_product', 'high_conversion_rate'],
            actions: ['create_ad_campaign', 'boost_social_post'],
            frequency: 'weekly'
          }
        },
        {
          id: '4',
          name: 'Veille Concurrentielle',
          description: 'Surveille et analyse les mouvements concurrents',
          type: 'competitive',
          status: 'active',
          success_rate: 92,
          last_execution: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          revenue_impact: 750,
          config: {
            conditions: ['competitor_new_product', 'price_war_detected'],
            actions: ['generate_insight', 'alert_management'],
            frequency: 'real-time'
          }
        }
      ];

      const mockStats: AutomationStats = {
        total_rules: 4,
        active_rules: 3,
        total_executions: 1847,
        success_rate: 89.2,
        revenue_generated: 15450,
        time_saved_hours: 124
      };

      setRules(mockRules);
      setStats(mockStats);

    } catch (error) {
      console.error('Error fetching automation data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données d'automatisation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRuleStatus = async (ruleId: string, newStatus: 'active' | 'paused') => {
    try {
      setRules(prev => prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, status: newStatus }
          : rule
      ));

      toast({
        title: newStatus === 'active' ? "Règle activée" : "Règle mise en pause",
        description: `La règle a été ${newStatus === 'active' ? 'activée' : 'mise en pause'} avec succès`,
      });
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de la règle",
        variant: "destructive"
      });
    }
  };

  const executeRule = async (ruleId: string) => {
    setIsExecuting(ruleId);
    try {
      // Simuler l'exécution
      await new Promise(resolve => setTimeout(resolve, 2000));

      setRules(prev => prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, last_execution: new Date().toISOString() }
          : rule
      ));

      toast({
        title: "Exécution réussie",
        description: "La règle d'automatisation a été exécutée avec succès",
      });
    } catch (error) {
      console.error('Error executing rule:', error);
      toast({
        title: "Erreur d'exécution",
        description: "Impossible d'exécuter la règle d'automatisation",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return 'Il y a moins d\'1h';
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `Il y a ${diffDays}j`;
    }
  };

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'pricing': return Target;
      case 'inventory': return Bot;
      case 'marketing': return TrendingUp;
      case 'competitive': return Zap;
      default: return Settings;
    }
  };

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'pricing': return 'text-blue-600';
      case 'inventory': return 'text-green-600';
      case 'marketing': return 'text-purple-600';
      case 'competitive': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Règles Actives</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.active_rules}/{stats?.total_rules}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Réussite</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.success_rate}%</div>
            <Progress value={stats?.success_rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Générés</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.revenue_generated || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Économisé</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.time_saved_hours}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exécutions</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_executions?.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 lg:col-span-1">
          <CardContent className="flex items-center justify-center p-6">
            <Button className="w-full" size="sm">
              <Bot className="mr-2 h-4 w-4" />
              Nouvelle Règle
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Règles d'Automatisation</CardTitle>
          <CardDescription>
            Gérez vos règles d'automatisation intelligentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map((rule) => {
              const TypeIcon = getRuleTypeIcon(rule.type);
              return (
                <div key={rule.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg bg-muted ${getRuleTypeColor(rule.type)}`}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium">{rule.name}</h4>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Dernière exécution: {formatTimeAgo(rule.last_execution)}</span>
                          <span>Fréquence: {rule.config.frequency}</span>
                          <span className="text-green-600">+{formatCurrency(rule.revenue_impact)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        rule.status === 'active' ? 'default' : 
                        rule.status === 'paused' ? 'secondary' : 'outline'
                      }>
                        {rule.status}
                      </Badge>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {rule.success_rate}%
                        </span>
                        <Progress value={rule.success_rate} className="w-16 h-2" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={rule.status === 'active'}
                        onCheckedChange={(checked) => 
                          toggleRuleStatus(rule.id, checked ? 'active' : 'paused')
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        {rule.status === 'active' ? 'Actif' : 'En pause'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => executeRule(rule.id)}
                        disabled={isExecuting === rule.id}
                      >
                        {isExecuting === rule.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                            Exécution...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-3 w-3" />
                            Exécuter
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}