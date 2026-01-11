import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Eye, Activity, AlertTriangle, CheckCircle, XCircle, Clock, Plus, Loader2, Bell } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';

interface AlertRule {
  id: number;
  name: string;
  enabled: boolean;
  channels: string[];
}

export default function ObservabilityPage() {
  const { toast } = useToast();
  const [showCreateAlertModal, setShowCreateAlertModal] = useState(false);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    { id: 1, name: 'CPU > 80%', enabled: true, channels: ['Email', 'Slack'] },
    { id: 2, name: 'Mémoire > 90%', enabled: true, channels: ['Email'] },
    { id: 3, name: 'Erreur Rate > 1%', enabled: false, channels: ['Email', 'SMS'] },
  ]);

  const [newAlert, setNewAlert] = useState({
    name: '',
    metric: 'cpu',
    threshold: '',
    operator: 'greater',
    channels: ['Email']
  });

  const handleToggleAlert = (alertId: number) => {
    setAlertRules(rules => rules.map(rule => 
      rule.id === alertId ? { ...rule, enabled: !rule.enabled } : rule
    ));
    const rule = alertRules.find(r => r.id === alertId);
    toast({
      title: rule?.enabled ? 'Alerte désactivée' : 'Alerte activée',
      description: `"${rule?.name}" a été ${rule?.enabled ? 'désactivée' : 'activée'}`,
    });
  };

  const handleCreateAlert = async () => {
    if (!newAlert.name || !newAlert.threshold) {
      toast({
        title: "Erreur",
        description: "Le nom et le seuil sont requis",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingAlert(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const alert: AlertRule = {
      id: Date.now(),
      name: newAlert.name,
      enabled: true,
      channels: newAlert.channels
    };

    setAlertRules([...alertRules, alert]);
    setShowCreateAlertModal(false);
    setNewAlert({ name: '', metric: 'cpu', threshold: '', operator: 'greater', channels: ['Email'] });
    setIsCreatingAlert(false);

    toast({
      title: "Alerte créée",
      description: `L'alerte "${alert.name}" a été créée avec succès`,
    });
  };

  return (
    <>
      <Helmet>
        <title>Observabilité - Monitoring et Surveillance Système</title>
        <meta name="description" content="Surveillance complète de l'infrastructure avec métriques temps réel, alertes et diagnostics avancés." />
      </Helmet>

      <div className="space-y-6">
        <PageHeader 
          title="Observabilité"
          description="Surveillance et monitoring de l'infrastructure en temps réel"
        />

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="metrics">Métriques</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="alerts">Alertes</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Système</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xl font-bold text-green-700">Opérationnel</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">99.9% uptime</p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">CPU</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-xl font-bold text-blue-700">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">Mémoire</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-4 w-4 text-purple-500" />
                    <span className="text-xl font-bold text-purple-700">8.2GB</span>
                  </div>
                  <Progress value={82} className="h-2" />
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700">Requêtes/min</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-xl font-bold text-orange-700">1,234</span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">+12% vs hier</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Services Status</CardTitle>
                  <CardDescription>État des services critiques</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: 'API Gateway', status: 'operational', uptime: '99.99%' },
                    { name: 'Database', status: 'operational', uptime: '99.98%' },
                    { name: 'Cache Redis', status: 'operational', uptime: '100%' },
                    { name: 'File Storage', status: 'degraded', uptime: '98.5%' },
                  ].map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {service.status === 'operational' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="text-right">
                        <Badge variant={service.status === 'operational' ? 'default' : 'secondary'}>
                          {service.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{service.uptime}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alertes Récentes</CardTitle>
                  <CardDescription>Incidents et alertes des dernières 24h</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { type: 'warning', message: 'Utilisation CPU élevée', time: '2 min ago' },
                    { type: 'info', message: 'Déploiement réussi v2.1.0', time: '1h ago' },
                    { type: 'error', message: 'Timeout base de données', time: '3h ago', resolved: true },
                    { type: 'info', message: 'Backup automatique terminé', time: '6h ago' },
                  ].map((alert, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      {alert.type === 'error' ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : alert.type === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">{alert.time}</p>
                      </div>
                      {alert.resolved && (
                        <Badge variant="outline" className="text-xs">Résolu</Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Métriques Système</CardTitle>
                <CardDescription>Performance et utilisation des ressources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {[
                    { label: 'Latence API', value: '45ms', trend: 'down', color: 'green' },
                    { label: 'Throughput', value: '2.5k req/s', trend: 'up', color: 'blue' },
                    { label: 'Taux d\'erreur', value: '0.02%', trend: 'down', color: 'green' },
                  ].map((metric, index) => (
                    <div key={index} className="text-center p-4 border rounded-lg">
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">{metric.label}</h4>
                      <div className={`text-2xl font-bold text-${metric.color}-500`}>{metric.value}</div>
                      <Badge variant="outline" className="mt-2">
                        {metric.trend === 'up' ? '↗' : '↘'} Tendance
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Logs Système</CardTitle>
                <CardDescription>Logs en temps réel avec filtrage avancé</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 font-mono text-sm">
                  {[
                    '[INFO] 2024-01-15 10:30:45 - API request processed successfully',
                    '[WARN] 2024-01-15 10:29:12 - High memory usage detected: 85%',
                    '[INFO] 2024-01-15 10:28:33 - User authentication successful',
                    '[ERROR] 2024-01-15 10:27:18 - Database connection timeout',
                    '[INFO] 2024-01-15 10:26:42 - Cache invalidation completed',
                  ].map((log, index) => (
                    <div key={index} className={`p-2 rounded border-l-4 ${
                      log.includes('[ERROR]') ? 'bg-red-50 border-red-500' :
                      log.includes('[WARN]') ? 'bg-orange-50 border-orange-500' :
                      'bg-muted/50 border-primary'
                    }`}>
                      {log}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Configuration des Alertes</CardTitle>
                    <CardDescription>Gérer les seuils et notifications d'alerte</CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateAlertModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer Nouvelle Alerte
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertRules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bell className={`h-4 w-4 ${rule.enabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Canaux: {rule.channels.join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                          {rule.enabled ? 'Activé' : 'Désactivé'}
                        </Badge>
                        <Switch 
                          checked={rule.enabled} 
                          onCheckedChange={() => handleToggleAlert(rule.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Alert Modal */}
      <Dialog open={showCreateAlertModal} onOpenChange={setShowCreateAlertModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une Nouvelle Alerte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de l'alerte</Label>
              <Input 
                placeholder="Ex: CPU > 80%"
                value={newAlert.name}
                onChange={(e) => setNewAlert({...newAlert, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Métrique</Label>
                <Select 
                  value={newAlert.metric} 
                  onValueChange={(v) => setNewAlert({...newAlert, metric: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpu">CPU</SelectItem>
                    <SelectItem value="memory">Mémoire</SelectItem>
                    <SelectItem value="disk">Disque</SelectItem>
                    <SelectItem value="error_rate">Taux d'erreur</SelectItem>
                    <SelectItem value="latency">Latence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Opérateur</Label>
                <Select 
                  value={newAlert.operator} 
                  onValueChange={(v) => setNewAlert({...newAlert, operator: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="greater">Supérieur à</SelectItem>
                    <SelectItem value="less">Inférieur à</SelectItem>
                    <SelectItem value="equals">Égal à</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Seuil (%)</Label>
              <Input 
                type="number"
                placeholder="80"
                value={newAlert.threshold}
                onChange={(e) => setNewAlert({...newAlert, threshold: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Canaux de notification</Label>
              <div className="flex gap-2">
                {['Email', 'Slack', 'SMS'].map((channel) => (
                  <Badge 
                    key={channel}
                    variant={newAlert.channels.includes(channel) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setNewAlert({
                        ...newAlert,
                        channels: newAlert.channels.includes(channel)
                          ? newAlert.channels.filter(c => c !== channel)
                          : [...newAlert.channels, channel]
                      });
                    }}
                  >
                    {channel}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateAlertModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateAlert} disabled={isCreatingAlert}>
              {isCreatingAlert ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Création...</>
              ) : (
                'Créer l\'alerte'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
