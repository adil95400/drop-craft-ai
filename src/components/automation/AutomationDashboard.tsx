import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, 
  TrendingUp, 
  Package, 
  Mail, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Settings
} from 'lucide-react';
import { useAutomationRules, useToggleRuleStatus } from '@/hooks/useAutomation';
import { Skeleton } from '@/components/ui/skeleton';

export function AutomationDashboard() {
  const { data: rules, isLoading, error } = useAutomationRules();
  const toggleStatus = useToggleRuleStatus();

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'pricing': return <TrendingUp className="h-4 w-4" />;
      case 'inventory': return <Package className="h-4 w-4" />;
      case 'marketing': return <Mail className="h-4 w-4" />;
      case 'order_processing': return <Activity className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case 'pricing': return 'Prix Dynamiques';
      case 'inventory': return 'Gestion Stock';
      case 'marketing': return 'Marketing Auto';
      case 'order_processing': return 'Commandes';
      default: return type;
    }
  };

  const getSeverityColor = (successRate: number) => {
    if (successRate >= 95) return 'text-green-600';
    if (successRate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-muted-foreground">
            Impossible de charger les règles d'automatisation
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeRules = rules?.filter(rule => rule.is_active) || [];
  const inactiveRules = rules?.filter(rule => !rule.is_active) || [];

  return (
    <div className="space-y-6">
      {/* Résumé des règles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Règles Actives</p>
                <p className="text-2xl font-bold">{activeRules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exécutions Total</p>
                <p className="text-2xl font-bold">
                  {rules?.reduce((sum, rule) => sum + rule.execution_count, 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de Succès</p>
                <p className="text-2xl font-bold">
                  {rules?.length ? 
                    Math.round(rules.reduce((sum, rule) => sum + rule.success_rate, 0) / rules.length) 
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bot className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IA Active</p>
                <p className="text-2xl font-bold text-green-600">ON</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des règles actives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Règles d'Automatisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!rules || rules.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune règle configurée</h3>
              <p className="text-muted-foreground mb-4">
                Créez des règles d'automatisation IA pour optimiser votre business
              </p>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Créer une règle
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getRuleIcon(rule.rule_type)}
                    </div>
                    <div>
                      <h4 className="font-semibold">{rule.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {rule.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getRuleTypeLabel(rule.rule_type)}
                        </Badge>
                        <span className={`text-xs font-medium ${getSeverityColor(rule.success_rate)}`}>
                          {rule.success_rate.toFixed(1)}% succès
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {rule.execution_count} exécutions
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Priorité {rule.priority}
                      </p>
                      {rule.last_executed_at && (
                        <p className="text-xs text-muted-foreground">
                          Dernière exécution: {new Date(rule.last_executed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => {
                        toggleStatus.mutate({ 
                          id: rule.id, 
                          isActive: checked 
                        });
                      }}
                      disabled={toggleStatus.isPending}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}