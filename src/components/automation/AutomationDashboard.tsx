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
import { useAutomation } from '@/hooks/useAutomation';
import { Skeleton } from '@/components/ui/skeleton';

export function AutomationDashboard() {
  const { triggers, stats, isLoading, updateTrigger } = useAutomation();

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'order_status': return <Activity className="h-4 w-4" />;
      case 'customer_behavior': return <Mail className="h-4 w-4" />;
      case 'inventory_level': return <Package className="h-4 w-4" />;
      case 'price_change': return <TrendingUp className="h-4 w-4" />;
      case 'scheduled': return <Bot className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case 'order_status': return 'Statut Commande';
      case 'customer_behavior': return 'Comportement Client';
      case 'inventory_level': return 'Niveau Stock';
      case 'price_change': return 'Prix Dynamique';
      case 'scheduled': return 'Programmé';
      default: return type;
    }
  };

  const getSeverityColor = (activeCount: number, totalCount: number) => {
    if (totalCount === 0) return 'text-gray-500';
    const rate = (activeCount / totalCount) * 100;
    if (rate >= 80) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
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

  const activeTriggers = triggers?.filter(trigger => trigger.is_active) || [];
  const inactiveTriggers = triggers?.filter(trigger => !trigger.is_active) || [];

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
                <p className="text-2xl font-bold">{stats.activeTriggers}</p>
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
                <p className="text-2xl font-bold">{stats.totalExecutions}</p>
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
                  {stats.totalExecutions > 0 ? 
                    Math.round((stats.successfulExecutions / stats.totalExecutions) * 100) 
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
          {!triggers || triggers.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun déclencheur configuré</h3>
              <p className="text-muted-foreground mb-4">
                Créez des déclencheurs d'automatisation pour optimiser votre business
              </p>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Créer un déclencheur
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {triggers.map((trigger) => (
                <div key={trigger.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getRuleIcon(trigger.trigger_type)}
                    </div>
                    <div>
                      <h4 className="font-semibold">{trigger.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {trigger.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getRuleTypeLabel(trigger.trigger_type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Créé le {new Date(trigger.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {trigger.is_active ? 'Actif' : 'Inactif'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Modifié: {new Date(trigger.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <Switch
                      checked={trigger.is_active}
                      onCheckedChange={(checked) => {
                        updateTrigger({ 
                          id: trigger.id, 
                          updates: { is_active: checked }
                        });
                      }}
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