import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Users, 
  ShoppingCart, 
  Mail, 
  Target,
  Clock,
  TrendingUp,
  Database,
  Bot,
  Workflow,
  Bell,
  Settings
} from 'lucide-react';
import { useMarketing } from '@/hooks/useMarketing';
import { useSyncStore } from '@/stores/syncStore';

interface SyncModule {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'active' | 'inactive' | 'syncing' | 'error';
  lastSync: string;
  frequency: 'realtime' | '5min' | '15min' | '1hour';
  dataCount: number;
  enabled: boolean;
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: 'active' | 'inactive';
  executionCount: number;
  successRate: number;
}

export const AutomatedMarketingSync: React.FC = () => {
  const { stats } = useMarketing();
  const syncStore = useSyncStore();
  
  const [syncModules, setSyncModules] = useState<SyncModule[]>([
    {
      id: 'customers',
      name: 'Base Clients',
      description: 'Synchronisation des profils et comportements clients',
      icon: Users,
      status: 'active',
      lastSync: '2 min ago',
      frequency: 'realtime',
      dataCount: 12456,
      enabled: true
    },
    {
      id: 'products',
      name: 'Catalogue Produits',
      description: 'Mise à jour automatique des prix et stocks',
      icon: ShoppingCart,
      status: 'active',
      lastSync: '5 min ago',
      frequency: '5min',
      dataCount: 3847,
      enabled: true
    },
    {
      id: 'campaigns',
      name: 'Campagnes Marketing',
      description: 'Synchronisation des performances et métriques',
      icon: Mail,
      status: 'syncing',
      lastSync: '1 min ago',
      frequency: '15min',
      dataCount: 28,
      enabled: true
    },
    {
      id: 'analytics',
      name: 'Analytics & KPI',
      description: 'Données de performance et conversion',
      icon: TrendingUp,
      status: 'active',
      lastSync: '3 min ago',
      frequency: '5min',
      dataCount: 156789,
      enabled: true
    },
    {
      id: 'segments',
      name: 'Segments Audience',
      description: 'Segmentation automatique et mise à jour',
      icon: Target,
      status: 'active',
      lastSync: '7 min ago',
      frequency: '1hour',
      dataCount: 45,
      enabled: true
    }
  ]);

  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: 'cart_abandon',
      name: 'Panier Abandonné',
      trigger: 'Panier abandonné > 1h',
      action: 'Envoyer email de relance',
      status: 'active',
      executionCount: 234,
      successRate: 18.5
    },
    {
      id: 'welcome_series',
      name: 'Série de Bienvenue',
      trigger: 'Nouveau client inscrit',
      action: 'Séquence email 5 jours',
      status: 'active',
      executionCount: 89,
      successRate: 34.2
    },
    {
      id: 'product_restock',
      name: 'Retour en Stock',
      trigger: 'Produit de nouveau disponible',
      action: 'Notifier clients intéressés',
      status: 'active',
      executionCount: 156,
      successRate: 42.8
    },
    {
      id: 'vip_upgrade',
      name: 'Upgrade VIP Auto',
      trigger: 'Dépense > 1000€ en 3 mois',
      action: 'Passer en statut VIP',
      status: 'active',
      executionCount: 23,
      successRate: 100
    }
  ]);

  const [globalSyncEnabled, setGlobalSyncEnabled] = useState(true);

  const handleModuleToggle = (moduleId: string) => {
    setSyncModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, enabled: !module.enabled }
        : module
    ));
    toast.success(`Module ${moduleId} ${syncModules.find(m => m.id === moduleId)?.enabled ? 'désactivé' : 'activé'}`);
  };

  const handleManualSync = async (moduleId?: string) => {
    if (moduleId) {
      setSyncModules(prev => prev.map(module => 
        module.id === moduleId 
          ? { ...module, status: 'syncing' }
          : module
      ));
      
      setTimeout(() => {
        setSyncModules(prev => prev.map(module => 
          module.id === moduleId 
            ? { ...module, status: 'active', lastSync: 'À l\'instant' }
            : module
        ));
        toast.success(`${moduleId} synchronisé avec succès`);
      }, 2000);
    } else {
      toast.success('Synchronisation globale démarrée');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'syncing': return 'text-blue-600';
      case 'error': return 'text-red-600';
      case 'inactive': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle2;
      case 'syncing': return RefreshCw;
      case 'error': return AlertCircle;
      case 'inactive': return Clock;
      default: return Clock;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'realtime': return 'Temps réel';
      case '5min': return 'Toutes les 5min';
      case '15min': return 'Toutes les 15min';
      case '1hour': return 'Toutes les heures';
      default: return frequency;
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Sync Control */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Synchronisation Automatique
                  <Badge variant="secondary">
                    <Bot className="h-3 w-3 mr-1" />
                    IA
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Synchronisation intelligente entre tous vos modules marketing
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Dernière sync</p>
                <p className="font-medium">2 min ago</p>
              </div>
              <Switch 
                checked={globalSyncEnabled} 
                onCheckedChange={setGlobalSyncEnabled}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => handleManualSync()} 
              disabled={!globalSyncEnabled}
              variant="outline"
            >
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Synchroniser Tout
            </>
            </Button>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>Progression globale</span>
                <span>89%</span>
              </div>
              <Progress value={89} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Modules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Modules de Synchronisation
          </CardTitle>
          <CardDescription>
            Gérez la synchronisation de chaque module individuellement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {syncModules.map((module) => {
              const StatusIcon = getStatusIcon(module.status);
              const ModuleIcon = module.icon;
              
              return (
                <div key={module.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <ModuleIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{module.name}</h4>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {module.dataCount.toLocaleString()} éléments
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {getFrequencyLabel(module.frequency)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Dernière sync: {module.lastSync}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <StatusIcon 
                        className={`h-4 w-4 ${getStatusColor(module.status)} ${module.status === 'syncing' ? 'animate-spin' : ''}`} 
                      />
                      <span className={`text-xs ${getStatusColor(module.status)}`}>
                        {module.status}
                      </span>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleManualSync(module.id)}
                      disabled={module.status === 'syncing' || !module.enabled}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                    
                    <Switch 
                      checked={module.enabled} 
                      onCheckedChange={() => handleModuleToggle(module.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Automation Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Règles d'Automatisation
          </CardTitle>
          <CardDescription>
            Automatisations intelligentes basées sur les événements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {automationRules.map((rule) => (
              <div key={rule.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{rule.name}</h4>
                  <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                    {rule.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Déclencheur: </span>
                    <span>{rule.trigger}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Action: </span>
                    <span>{rule.action}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    {rule.executionCount} exécutions
                  </div>
                  <div className="text-xs font-medium text-green-600">
                    {rule.successRate}% succès
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sync Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Statistiques de Synchronisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-green-600">99.8%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">1.2s</div>
              <div className="text-sm text-muted-foreground">Temps moyen</div>
            </div>
            <div className="text-center p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">2.3M</div>
              <div className="text-sm text-muted-foreground">Données sync</div>
            </div>
            <div className="text-center p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">0</div>
              <div className="text-sm text-muted-foreground">Erreurs 24h</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};