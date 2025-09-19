import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useSyncStore } from '@/stores/syncStore';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Clock, 
  Zap, 
  Save,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

interface SyncConfigurationProps {
  onConfigChange?: (config: any) => void;
}

export const SyncConfiguration: React.FC<SyncConfigurationProps> = ({ onConfigChange }) => {
  const { enableAutoSync, setAutoSync } = useSyncStore();
  const { toast } = useToast();

  const [config, setConfig] = useState({
    autoSync: enableAutoSync,
    syncInterval: '15', // minutes
    batchSize: '100',
    retryAttempts: '3',
    timeoutDuration: '300', // seconds
    syncOnlyChanged: true,
    enableWebhooks: false,
    conflictResolution: 'source_wins', // source_wins, destination_wins, manual
    syncWindows: {
      enabled: false,
      start: '09:00',
      end: '18:00',
      timezone: 'Europe/Paris'
    },
    priorities: {
      products: 'high',
      stock: 'high',
      orders: 'critical',
      customers: 'medium'
    }
  });

  const handleConfigUpdate = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const handleNestedConfigUpdate = (parent: string, key: string, value: any) => {
    const newConfig = {
      ...config,
      [parent]: { 
        ...(config[parent as keyof typeof config] as Record<string, any>), 
        [key]: value 
      }
    };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const handleSaveConfiguration = () => {
    setAutoSync(config.autoSync);
    
    // Ici on pourrait sauvegarder la configuration dans Supabase
    localStorage.setItem('sync_configuration', JSON.stringify(config));
    
    toast({
      title: "Configuration sauvegardée",
      description: "Les paramètres de synchronisation ont été mis à jour.",
    });
  };

  const handleResetConfiguration = () => {
    const defaultConfig = {
      autoSync: true,
      syncInterval: '15',
      batchSize: '100',
      retryAttempts: '3',
      timeoutDuration: '300',
      syncOnlyChanged: true,
      enableWebhooks: false,
      conflictResolution: 'source_wins',
      syncWindows: {
        enabled: false,
        start: '09:00',
        end: '18:00',
        timezone: 'Europe/Paris'
      },
      priorities: {
        products: 'high',
        stock: 'high',
        orders: 'critical',
        customers: 'medium'
      }
    };
    
    setConfig(defaultConfig);
    onConfigChange?.(defaultConfig);
    
    toast({
      title: "Configuration réinitialisée",
      description: "Les paramètres ont été remis aux valeurs par défaut.",
    });
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      critical: { variant: 'destructive', label: 'Critique' },
      high: { variant: 'default', label: 'Haute' },
      medium: { variant: 'secondary', label: 'Moyenne' },
      low: { variant: 'outline', label: 'Basse' }
    } as const;

    const config = variants[priority as keyof typeof variants] || variants.medium;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration de Synchronisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Synchronisation automatique */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-sync" className="text-base font-medium">
                  Synchronisation automatique
                </Label>
                <p className="text-sm text-muted-foreground">
                  Active la synchronisation périodique automatique
                </p>
              </div>
              <Switch
                id="auto-sync"
                checked={config.autoSync}
                onCheckedChange={(value) => handleConfigUpdate('autoSync', value)}
              />
            </div>

            {config.autoSync && (
              <div className="ml-4 space-y-4">
                <div>
                  <Label htmlFor="sync-interval">Intervalle de synchronisation</Label>
                  <Select 
                    value={config.syncInterval} 
                    onValueChange={(value) => handleConfigUpdate('syncInterval', value)}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 heure</SelectItem>
                      <SelectItem value="120">2 heures</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Performance */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Performance</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="batch-size">Taille des lots</Label>
                <Select 
                  value={config.batchSize} 
                  onValueChange={(value) => handleConfigUpdate('batchSize', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 éléments</SelectItem>
                    <SelectItem value="100">100 éléments</SelectItem>
                    <SelectItem value="200">200 éléments</SelectItem>
                    <SelectItem value="500">500 éléments</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="retry-attempts">Tentatives de retry</Label>
                <Select 
                  value={config.retryAttempts} 
                  onValueChange={(value) => handleConfigUpdate('retryAttempts', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 tentative</SelectItem>
                    <SelectItem value="3">3 tentatives</SelectItem>
                    <SelectItem value="5">5 tentatives</SelectItem>
                    <SelectItem value="10">10 tentatives</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="timeout">Timeout (secondes)</Label>
              <Select 
                value={config.timeoutDuration} 
                onValueChange={(value) => handleConfigUpdate('timeoutDuration', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="120">2 minutes</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                  <SelectItem value="600">10 minutes</SelectItem>
                  <SelectItem value="1800">30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Options avancées */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Options avancées</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Synchroniser uniquement les modifications</Label>
                <p className="text-sm text-muted-foreground">
                  Améliore les performances en ne synchronisant que les données modifiées
                </p>
              </div>
              <Switch
                checked={config.syncOnlyChanged}
                onCheckedChange={(value) => handleConfigUpdate('syncOnlyChanged', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Activer les webhooks</Label>
                <p className="text-sm text-muted-foreground">
                  Permet la synchronisation en temps réel via webhooks
                </p>
              </div>
              <Switch
                checked={config.enableWebhooks}
                onCheckedChange={(value) => handleConfigUpdate('enableWebhooks', value)}
              />
            </div>

            <div>
              <Label htmlFor="conflict-resolution">Résolution de conflits</Label>
              <Select 
                value={config.conflictResolution} 
                onValueChange={(value) => handleConfigUpdate('conflictResolution', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="source_wins">Source gagne</SelectItem>
                  <SelectItem value="destination_wins">Destination gagne</SelectItem>
                  <SelectItem value="manual">Résolution manuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Priorités */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Priorités de synchronisation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(config.priorities).map(([entity, priority]) => (
                <div key={entity} className="flex items-center justify-between">
                  <Label className="capitalize">{entity}</Label>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(priority)}
                    <Select 
                      value={priority} 
                      onValueChange={(value) => handleNestedConfigUpdate('priorities', entity, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critique</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="low">Basse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Fenêtres de synchronisation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Fenêtres de synchronisation</Label>
                <p className="text-sm text-muted-foreground">
                  Limite la synchronisation à certaines heures
                </p>
              </div>
              <Switch
                checked={config.syncWindows.enabled}
                onCheckedChange={(value) => handleNestedConfigUpdate('syncWindows', 'enabled', value)}
              />
            </div>

            {config.syncWindows.enabled && (
              <div className="ml-4 grid grid-cols-2 gap-4">
                <div>
                  <Label>Heure de début</Label>
                  <input
                    type="time"
                    value={config.syncWindows.start}
                    onChange={(e) => handleNestedConfigUpdate('syncWindows', 'start', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <Label>Heure de fin</Label>
                  <input
                    type="time"
                    value={config.syncWindows.end}
                    onChange={(e) => handleNestedConfigUpdate('syncWindows', 'end', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Avertissement */}
          {!config.autoSync && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Synchronisation automatique désactivée</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Les données ne seront pas synchronisées automatiquement. 
                    Vous devrez lancer les synchronisations manuellement.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={handleSaveConfiguration} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Sauvegarder
        </Button>
        
        <Button variant="outline" onClick={handleResetConfiguration} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Réinitialiser
        </Button>
      </div>
    </div>
  );
};