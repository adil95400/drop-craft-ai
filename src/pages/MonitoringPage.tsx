import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Activity, Server, AlertTriangle, CheckCircle, TrendingUp, Users, ShoppingCart, DollarSign, Bug, RefreshCw, ExternalLink, Smartphone, Wifi } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import * as Sentry from '@sentry/react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

export default function MonitoringPage() {
  const { data: systemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('system-monitoring', {
        body: { action: 'get_health_status' }
      })
      return data
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  const { data: performanceMetrics } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('system-monitoring', {
        body: { action: 'get_performance_metrics' }
      })
      return data
    },
    refetchInterval: 60000 // Refresh every minute
  })

  const { data: businessMetrics } = useQuery({
    queryKey: ['business-metrics'],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('system-monitoring', {
        body: { action: 'get_business_metrics' }
      })
      return data
    },
    refetchInterval: 300000 // Refresh every 5 minutes
  })

  const mockPerformanceData = [
    { time: '00:00', responseTime: 120, throughput: 850, errors: 2 },
    { time: '04:00', responseTime: 110, throughput: 920, errors: 1 },
    { time: '08:00', responseTime: 180, throughput: 1200, errors: 5 },
    { time: '12:00', responseTime: 220, throughput: 1800, errors: 8 },
    { time: '16:00', responseTime: 200, throughput: 1600, errors: 4 },
    { time: '20:00', responseTime: 150, throughput: 1100, errors: 2 },
  ]

  const mockBusinessData = [
    { day: 'Lun', revenue: 12500, orders: 45, users: 120 },
    { day: 'Mar', revenue: 15800, orders: 52, users: 135 },
    { day: 'Mer', revenue: 18200, orders: 61, users: 142 },
    { day: 'Jeu', revenue: 16900, orders: 58, users: 138 },
    { day: 'Ven', revenue: 21300, orders: 72, users: 156 },
    { day: 'Sam', revenue: 19500, orders: 68, users: 149 },
    { day: 'Dim', revenue: 14200, orders: 48, users: 128 },
  ]

  return (
    <>
      <Helmet>
        <title>Monitoring & Analytics - Surveillance Système</title>
        <meta name="description" content="Surveillez les performances système, la santé des intégrations et les métriques business en temps réel." />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Monitoring & Analytics</h1>
            <p className="text-muted-foreground">Surveillance système et métriques business en temps réel</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Activity className="h-4 w-4" />
            Actualiser
          </Button>
        </div>

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Système</span>
                <Badge variant="default" className="ml-auto">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Opérationnel
                </Badge>
              </div>
              <div className="mt-2 text-2xl font-bold">99.9%</div>
              <div className="text-xs text-muted-foreground">Disponibilité 24h</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Performance</span>
                <Badge variant="secondary" className="ml-auto">Excellent</Badge>
              </div>
              <div className="mt-2 text-2xl font-bold">156ms</div>
              <div className="text-xs text-muted-foreground">Temps de réponse moyen</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Utilisateurs</span>
                <Badge variant="outline" className="ml-auto">+12%</Badge>
              </div>
              <div className="mt-2 text-2xl font-bold">1,247</div>
              <div className="text-xs text-muted-foreground">Actifs cette semaine</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Alertes</span>
                <Badge variant="destructive" className="ml-auto">3</Badge>
              </div>
              <div className="mt-2 text-2xl font-bold">2</div>
              <div className="text-xs text-muted-foreground">Critiques en cours</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/pwa-install">
              <Smartphone className="h-4 w-4 mr-2" />
              Installer PWA
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            Sentry.captureMessage('Test event from monitoring page', 'info');
            toast.success('Événement de test envoyé à Sentry');
          }}>
            <Bug className="h-4 w-4 mr-2" />
            Tester Sentry
          </Button>
        </div>

        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="integrations">Intégrations</TabsTrigger>
            <TabsTrigger value="alerts">Alertes</TabsTrigger>
            <TabsTrigger value="pwa">PWA</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Temps de Réponse (24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="responseTime" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Débit & Erreurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mockPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="throughput" 
                        stackId="1"
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="errors" 
                        stackId="2"
                        stroke="hsl(var(--destructive))" 
                        fill="hsl(var(--destructive))" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="business" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Revenus (7j)</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold">118,400€</div>
                  <div className="text-xs text-muted-foreground">+18.5% vs semaine précédente</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Commandes</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold">404</div>
                  <div className="text-xs text-muted-foreground">+12.3% vs semaine précédente</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Panier Moyen</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold">293€</div>
                  <div className="text-xs text-muted-foreground">+5.1% vs semaine précédente</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Métriques Business (7 derniers jours)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={mockBusinessData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                    <Bar dataKey="orders" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Shopify', status: 'connected', lastSync: '2 min', health: 'excellent' },
                { name: 'WooCommerce', status: 'connected', lastSync: '5 min', health: 'good' },
                { name: 'PrestaShop', status: 'connected', lastSync: '12 min', health: 'good' },
                { name: 'BigBuy', status: 'connected', lastSync: '8 min', health: 'excellent' },
                { name: 'AliExpress', status: 'warning', lastSync: '45 min', health: 'degraded' },
                { name: 'Amazon', status: 'disconnected', lastSync: '2h', health: 'critical' },
              ].map((integration) => (
                <Card key={integration.name}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{integration.name}</span>
                      <Badge 
                        variant={
                          integration.status === 'connected' ? 'default' : 
                          integration.status === 'warning' ? 'secondary' : 'destructive'
                        }
                      >
                        {integration.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Dernière sync: {integration.lastSync}
                    </div>
                    <div className="text-xs mt-1">
                      Santé: <span className={
                        integration.health === 'excellent' ? 'text-green-600' :
                        integration.health === 'good' ? 'text-blue-600' :
                        integration.health === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                      }>{integration.health}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <div className="space-y-3">
              {[
                {
                  id: 1,
                  level: 'critical',
                  title: 'Taux d\'erreur élevé sur l\'API AliExpress',
                  description: 'Le taux d\'erreur a dépassé le seuil de 5% sur les 10 dernières minutes',
                  time: '5 min',
                  status: 'active'
                },
                {
                  id: 2,
                  level: 'warning',
                  title: 'Latence élevée sur les requêtes de synchronisation',
                  description: 'Temps de réponse moyen de 2.5s détecté sur les synchronisations produits',
                  time: '12 min',
                  status: 'investigating'
                },
                {
                  id: 3,
                  level: 'info',
                  title: 'Pic de trafic détecté',
                  description: 'Augmentation de 300% du trafic par rapport à la moyenne habituelle',
                  time: '18 min',
                  status: 'resolved'
                }
              ].map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-destructive">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className={`h-4 w-4 ${
                            alert.level === 'critical' ? 'text-red-500' :
                            alert.level === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                          }`} />
                          <span className="font-medium">{alert.title}</span>
                          <Badge variant={
                            alert.status === 'active' ? 'destructive' :
                            alert.status === 'investigating' ? 'secondary' : 'default'
                          }>
                            {alert.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                        <div className="text-xs text-muted-foreground">Il y a {alert.time}</div>
                      </div>
                      <Button variant="outline" size="sm">
                        Voir détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pwa" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Progressive Web App
                  </CardTitle>
                  <CardDescription>
                    Installez ShopOpti sur votre appareil pour une expérience optimale
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Service Worker</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Actif
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mode hors-ligne</span>
                    <Badge variant="default">Activé</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notifications Push</span>
                    <Badge variant="secondary">
                      {Notification.permission === 'granted' ? 'Activées' : 'Désactivées'}
                    </Badge>
                  </div>
                  <Button asChild className="w-full">
                    <Link to="/pwa-install">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Page d'installation PWA
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="h-5 w-5" />
                    Sentry Monitoring
                  </CardTitle>
                  <CardDescription>
                    Surveillance des erreurs et performances en temps réel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Statut</span>
                    <Badge variant={import.meta.env.VITE_SENTRY_DSN ? 'default' : 'secondary'}>
                      {import.meta.env.VITE_SENTRY_DSN ? 'Configuré' : 'Non configuré'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Environnement</span>
                    <Badge variant="outline">{import.meta.env.MODE}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Session Replay</span>
                    <Badge variant="default">Activé</Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      Sentry.captureMessage('Manual test from monitoring dashboard', 'info');
                      toast.success('Événement envoyé à Sentry');
                    }}
                  >
                    <Bug className="h-4 w-4 mr-2" />
                    Envoyer un événement test
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}