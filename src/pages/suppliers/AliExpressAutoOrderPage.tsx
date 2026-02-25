import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Zap, Package, Truck, RefreshCw, CheckCircle2, XCircle, Clock,
  AlertTriangle, Settings, Plus, Trash2, Shield, Search, ExternalLink,
  MapPin, Timer, DollarSign, Activity, Globe
} from 'lucide-react';
import { useAutoOrderComplete, useAutoOrderSettings, useAutoOrderRules } from '@/hooks/useAutoOrderComplete';
import { useAutoOrderQueue } from '@/hooks/useAutoOrderQueue';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

const SHIPPING_METHODS = [
  { value: 'aliexpress_standard', label: 'AliExpress Standard', days: '15-30j', cost: 'Gratuit' },
  { value: 'aliexpress_premium', label: 'AliExpress Premium', days: '10-20j', cost: '~3-5€' },
  { value: 'epacket', label: 'ePacket', days: '10-20j', cost: '~2-4€' },
  { value: 'cainiao', label: 'Cainiao Super Economy', days: '20-40j', cost: 'Gratuit' },
  { value: 'yanwen', label: 'Yanwen Special Line', days: '15-25j', cost: '~1-3€' },
];

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pending': return <Clock className="h-4 w-4 text-warning" />;
    case 'processing': return <RefreshCw className="h-4 w-4 text-primary animate-spin" />;
    case 'completed': return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
    case 'retry': return <AlertTriangle className="h-4 w-4 text-warning" />;
    default: return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  processing: 'En cours',
  completed: 'Expédié',
  failed: 'Échoué',
  retry: 'Retry',
};

export default function AliExpressAutoOrderPage() {
  const { user } = useUnifiedAuth();
  const { queueItems, stats, isLoading, refetch } = useAutoOrderQueue(user?.id);
  const { batchSyncTracking, isBatchSyncing } = useAutoOrderComplete();
  const { settings, updateSettings, isUpdating } = useAutoOrderSettings();
  const { rules, createRule, deleteRule, isCreating } = useAutoOrderRules();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newRuleStock, setNewRuleStock] = useState(5);
  const [newRuleQty, setNewRuleQty] = useState(10);
  const [newRuleShipping, setNewRuleShipping] = useState('aliexpress_standard');

  const aliExpressItems = queueItems.filter(i => i.supplier_type === 'aliexpress');
  const totalProcessed = stats.completed + stats.failed;
  const successRate = totalProcessed > 0 ? Math.round((stats.completed / totalProcessed) * 100) : 0;

  return (
    <>
      <Helmet>
        <title>AliExpress Auto-Order — Commandes automatiques</title>
        <meta name="description" content="Automatisez vos commandes AliExpress : passage de commande en 1 clic, tracking temps réel et règles de réapprovisionnement." />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-destructive flex items-center justify-center">
              <Globe className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AliExpress Auto-Order</h1>
              <p className="text-muted-foreground">
                Commandes automatiques & suivi tracking fournisseur
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button size="sm" onClick={() => batchSyncTracking()} disabled={isBatchSyncing}>
              <Truck className="h-4 w-4 mr-2" />
              Sync Trackings
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-xs text-muted-foreground">En attente</p>
                  <p className="text-xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">En cours</p>
                  <p className="text-xl font-bold">{stats.processing}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div>
                  <p className="text-xs text-muted-foreground">Réussies</p>
                  <p className="text-xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-xs text-muted-foreground">Échouées</p>
                  <p className="text-xl font-bold">{stats.failed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Taux succès</p>
                  <p className="text-xl font-bold">{successRate}%</p>
                </div>
              </div>
              <Progress value={successRate} className="mt-2 h-1" />
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">
              <Package className="h-4 w-4 mr-2" />
              File d'attente
            </TabsTrigger>
            <TabsTrigger value="tracking">
              <Truck className="h-4 w-4 mr-2" />
              Tracking
            </TabsTrigger>
            <TabsTrigger value="rules">
              <Shield className="h-4 w-4 mr-2" />
              Règles auto
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
          </TabsList>

          {/* Queue Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Commandes AliExpress en traitement
                </CardTitle>
                <CardDescription>
                  {aliExpressItems.length > 0
                    ? `${aliExpressItems.length} commandes dans la file AliExpress`
                    : 'Toutes les commandes AliExpress sont affichées ici'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {queueItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Aucune commande en attente</p>
                    <p className="text-sm mt-1">
                      Les nouvelles commandes seront automatiquement envoyées à AliExpress
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {queueItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <StatusIcon status={item.status} />
                          <div>
                            <p className="font-medium text-sm">
                              #{item.order_id.substring(0, 8)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.supplier_type.toUpperCase()} • {new Date(item.created_at).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={item.status === 'completed' ? 'default' : item.status === 'failed' ? 'destructive' : 'secondary'}>
                            {STATUS_LABELS[item.status] || item.status}
                          </Badge>
                          {item.retry_count > 0 && (
                            <Badge variant="outline" className="text-xs">
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

          {/* Tracking Tab */}
          <TabsContent value="tracking" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Suivi des expéditions
                    </CardTitle>
                    <CardDescription>
                      Tracking automatique des colis AliExpress
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => batchSyncTracking()} disabled={isBatchSyncing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isBatchSyncing ? 'animate-spin' : ''}`} />
                    Synchroniser tout
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {queueItems.filter(i => i.status === 'completed').length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Truck className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Aucun colis à suivre</p>
                    <p className="text-sm mt-1">
                      Les numéros de tracking apparaîtront ici après le passage de commande
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queueItems.filter(i => i.status === 'completed').map((item) => (
                      <div key={item.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                              <Package className="h-5 w-5 text-success" />
                            </div>
                            <div>
                              <p className="font-medium">Commande #{item.order_id.substring(0, 8)}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>{item.result?.tracking_number || 'En attente de tracking'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.result?.carrier && (
                              <Badge variant="outline">{item.result.carrier}</Badge>
                            )}
                            {item.result?.estimated_delivery && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Timer className="h-3 w-3" />
                                {new Date(item.result.estimated_delivery).toLocaleDateString('fr-FR')}
                              </div>
                            )}
                            <Button variant="ghost" size="icon" asChild>
                              <a
                                href={`https://track.aftership.com/${item.result?.tracking_number || ''}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
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
                      Règles de réapprovisionnement AliExpress
                    </CardTitle>
                    <CardDescription>
                      Commande automatique quand le stock atteint un seuil
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* New rule form */}
                <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                  <p className="font-medium text-sm">Nouvelle règle</p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs">Seuil de stock</Label>
                      <Input
                        type="number"
                        min={1}
                        value={newRuleStock}
                        onChange={(e) => setNewRuleStock(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Quantité à commander</Label>
                      <Input
                        type="number"
                        min={1}
                        value={newRuleQty}
                        onChange={(e) => setNewRuleQty(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Méthode d'expédition</Label>
                      <Select value={newRuleShipping} onValueChange={setNewRuleShipping}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SHIPPING_METHODS.map(m => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label} ({m.days})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        className="w-full"
                        onClick={() => createRule({
                          supplier_type: 'aliexpress',
                          min_stock_trigger: newRuleStock,
                          reorder_quantity: newRuleQty,
                          preferred_shipping: newRuleShipping,
                          is_active: true,
                        })}
                        disabled={isCreating}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Existing rules */}
                {rules.filter(r => r.supplier_type === 'aliexpress').length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Aucune règle AliExpress configurée</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rules.filter(r => r.supplier_type === 'aliexpress').map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                            {rule.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                          <div>
                            <p className="font-medium text-sm">
                              Stock ≤ {rule.min_stock_trigger} → Commander {rule.reorder_quantity} unités
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Expédition: {rule.preferred_shipping}
                              {rule.max_price && ` • Max ${rule.max_price}€`}
                              {rule.trigger_count > 0 && ` • Déclenché ${rule.trigger_count}×`}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration AliExpress Auto-Order
                </CardTitle>
                <CardDescription>
                  Paramètres de commande automatique et notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Order activé</Label>
                    <p className="text-sm text-muted-foreground">
                      Passer automatiquement les commandes sur AliExpress
                    </p>
                  </div>
                  <Switch
                    checked={settings?.enabled || false}
                    onCheckedChange={(checked) => updateSettings({ ...settings, enabled: checked })}
                    disabled={isUpdating}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Confirmation automatique</Label>
                    <p className="text-sm text-muted-foreground">
                      Confirmer automatiquement le paiement sur AliExpress
                    </p>
                  </div>
                  <Switch
                    checked={settings?.auto_confirm || false}
                    onCheckedChange={(checked) => updateSettings({ ...settings, auto_confirm: checked })}
                    disabled={isUpdating}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notification commande</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir une alerte à chaque commande passée
                    </p>
                  </div>
                  <Switch
                    checked={settings?.notify_on_order || false}
                    onCheckedChange={(checked) => updateSettings({ ...settings, notify_on_order: checked })}
                    disabled={isUpdating}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notification tracking</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir une alerte quand le numéro de suivi est disponible
                    </p>
                  </div>
                  <Switch
                    checked={settings?.notify_on_tracking || false}
                    onCheckedChange={(checked) => updateSettings({ ...settings, notify_on_tracking: checked })}
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
                    onCheckedChange={(checked) => updateSettings({ ...settings, retry_failed: checked })}
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
                    onChange={(e) => updateSettings({ ...settings, max_retries: parseInt(e.target.value) })}
                    className="w-24"
                    disabled={isUpdating}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Méthode d'expédition par défaut</Label>
                  <Select
                    value={settings?.default_shipping || 'aliexpress_standard'}
                    onValueChange={(val) => updateSettings({ ...settings, default_shipping: val })}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIPPING_METHODS.map(m => (
                        <SelectItem key={m.value} value={m.value}>
                          <div className="flex items-center gap-2">
                            <span>{m.label}</span>
                            <span className="text-xs text-muted-foreground">({m.days} • {m.cost})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
