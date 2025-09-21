import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Eye, Activity, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

export default function ObservabilityPage() {
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
                    <div key={index} className="p-2 bg-muted/50 rounded border-l-4 border-primary">
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
                <CardTitle>Configuration des Alertes</CardTitle>
                <CardDescription>Gérer les seuils et notifications d'alerte</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button>Créer Nouvelle Alerte</Button>
                  <div className="space-y-3">
                    {[
                      { name: 'CPU > 80%', enabled: true, channels: ['Email', 'Slack'] },
                      { name: 'Mémoire > 90%', enabled: true, channels: ['Email'] },
                      { name: 'Erreur Rate > 1%', enabled: false, channels: ['Email', 'SMS'] },
                    ].map((rule, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Canaux: {rule.channels.join(', ')}
                          </p>
                        </div>
                        <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                          {rule.enabled ? 'Activé' : 'Désactivé'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}