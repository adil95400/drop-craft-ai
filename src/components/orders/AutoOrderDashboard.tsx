import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Package,
  Truck,
  AlertTriangle,
  Settings,
  Zap,
  Plus,
  Trash2,
  Shield
} from 'lucide-react';
import { useAutoOrderComplete, useAutoOrderSettings, useAutoOrderRules } from '@/hooks/useAutoOrderComplete';
import { useAutoOrderQueue } from '@/hooks/useAutoOrderQueue';
import { useAuth } from '@/contexts/AuthContext';

export function AutoOrderDashboard() {
  const { user } = useAuth();
  const { queueItems, stats, isLoading, refetch } = useAutoOrderQueue(user?.id);
  const { batchSyncTracking, isBatchSyncing } = useAutoOrderComplete();
  const { settings, updateSettings, isUpdating } = useAutoOrderSettings();
  const { rules, createRule, deleteRule, isCreating } = useAutoOrderRules();
  const [activeTab, setActiveTab] = useState('overview');

  const totalProcessed = stats.completed + stats.failed;
  const successRate = totalProcessed > 0 
    ? Math.round((stats.completed / totalProcessed) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Auto-Order 100%</h2>
          <p className="text-muted-foreground">
            Passage de commande automatique et synchronisation tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => batchSyncTracking()}
            disabled={isBatchSyncing}
          >
            <Truck className="h-4 w-4 mr-2" />
            Sync Trackings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.pending}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
              <span className="text-2xl font-bold">{stats.processing}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Réussis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.completed}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Échoués
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{stats.failed}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux de succès
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">{successRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">File d'attente</TabsTrigger>
          <TabsTrigger value="rules">Règles auto</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Queue Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Commandes en traitement
              </CardTitle>
              <CardDescription>
                {queueItems.length} commandes dans la file
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queueItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Aucune commande en attente</p>
                  <p className="text-sm">
                    Les nouvelles commandes seront automatiquement traitées
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {queueItems.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon status={item.status} />
                        <div>
                          <p className="font-medium">
                            Commande #{item.order_id.substring(0, 8)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.supplier_type.toUpperCase()} • 
                            {new Date(item.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.status} />
                        {item.retry_count > 0 && (
                          <Badge variant="outline">
                            Retry {item.retry_count}/{item.max_retries}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Règles de réapprovisionnement automatique
                  </CardTitle>
                  <CardDescription>
                    Déclenche une commande fournisseur quand le stock atteint un seuil
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => createRule({
                    supplier_type: 'cj',
                    min_stock_trigger: 5,
                    reorder_quantity: 10,
                    preferred_shipping: 'standard',
                    is_active: true
                  })}
                  disabled={isCreating}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une règle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Aucune règle d'auto-commande configurée</p>
                  <p className="text-sm mt-1">
                    Ajoutez une règle pour commander automatiquement quand le stock est bas
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                        <div>
                          <p className="font-medium">
                            Fournisseur: {rule.supplier_type.toUpperCase()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Seuil: ≤ {rule.min_stock_trigger} unités → Commander {rule.reorder_quantity} unités
                            {rule.max_price && ` (max ${rule.max_price}€)`}
                          </p>
                          {rule.trigger_count > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Déclenché {rule.trigger_count} fois
                              {rule.last_triggered_at && ` • Dernier: ${new Date(rule.last_triggered_at).toLocaleDateString('fr-FR')}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration Auto-Order
              </CardTitle>
              <CardDescription>
                Paramètres de commande automatique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Order activé</Label>
                  <p className="text-sm text-muted-foreground">
                    Passer automatiquement les commandes aux fournisseurs
                  </p>
                </div>
                <Switch
                  checked={settings?.enabled || false}
                  onCheckedChange={(checked) => 
                    updateSettings({ ...settings, enabled: checked })
                  }
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Confirmation automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    Confirmer automatiquement les commandes CJ
                  </p>
                </div>
                <Switch
                  checked={settings?.auto_confirm || false}
                  onCheckedChange={(checked) => 
                    updateSettings({ ...settings, auto_confirm: checked })
                  }
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notification commande</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir une notification à chaque commande
                  </p>
                </div>
                <Switch
                  checked={settings?.notify_on_order || false}
                  onCheckedChange={(checked) => 
                    updateSettings({ ...settings, notify_on_order: checked })
                  }
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notification tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir une notification quand le tracking est disponible
                  </p>
                </div>
                <Switch
                  checked={settings?.notify_on_tracking || false}
                  onCheckedChange={(checked) => 
                    updateSettings({ ...settings, notify_on_tracking: checked })
                  }
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Réessayer les échecs</Label>
                  <p className="text-sm text-muted-foreground">
                    Réessayer automatiquement les commandes échouées
                  </p>
                </div>
                <Switch
                  checked={settings?.retry_failed || false}
                  onCheckedChange={(checked) => 
                    updateSettings({ ...settings, retry_failed: checked })
                  }
                  disabled={isUpdating}
                />
              </div>

              <div className="space-y-2">
                <Label>Nombre max de réessais</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={settings?.max_retries || 3}
                  onChange={(e) => 
                    updateSettings({ ...settings, max_retries: parseInt(e.target.value) })
                  }
                  className="w-24"
                  disabled={isUpdating}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    case 'processing':
      return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'retry':
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    processing: 'default',
    completed: 'default',
    failed: 'destructive',
    retry: 'outline',
  };

  const labels: Record<string, string> = {
    pending: 'En attente',
    processing: 'En cours',
    completed: 'Réussi',
    failed: 'Échoué',
    retry: 'Retry',
  };

  return (
    <Badge variant={variants[status] || 'secondary'}>
      {labels[status] || status}
    </Badge>
  );
}
