import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Zap, 
  CheckCircle, 
  Clock, 
  XCircle,
  Settings,
  TrendingUp
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAutoFulfillment } from '@/hooks/useAutoFulfillment'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function AutoOrderSystem() {
  const { toast } = useToast()
  const { 
    stats, 
    isLoadingStats, 
    orders, 
    isLoadingOrders,
    connections,
    isLoadingConnections,
    toggleAutoOrder 
  } = useAutoFulfillment()
  
  const [autoOrderEnabled, setAutoOrderEnabled] = useState(true)

  const handleToggleAutoOrder = () => {
    setAutoOrderEnabled(!autoOrderEnabled)
    toast({
      title: autoOrderEnabled ? 'Commandes automatiques désactivées' : 'Commandes automatiques activées',
      description: autoOrderEnabled 
        ? 'Les commandes ne seront plus passées automatiquement'
        : 'Les commandes seront passées automatiquement aux fournisseurs'
    })
  }

  const pendingOrders = orders?.filter((o: any) => o.status === 'pending' || o.status === 'processing') || []
  const automatedOrders = orders?.filter((o: any) => o.status === 'confirmed' || o.status === 'shipped') || []
  const failedOrders = orders?.filter((o: any) => o.status === 'failed') || []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge><CheckCircle className="h-3 w-3 mr-1" />Confirmée</Badge>
      case 'shipped':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Expédiée</Badge>
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>
      case 'processing':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />En cours</Badge>
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Échouée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      <Helmet>
        <title>Système de Commande Automatique - Drop Craft AI</title>
        <meta name="description" content="Automatisez vos commandes fournisseurs et gagnez du temps" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Commandes Automatiques
            </h1>
            <p className="text-muted-foreground mt-1">
              Passez vos commandes fournisseurs automatiquement
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-order">Activation</Label>
              <Switch
                id="auto-order"
                checked={autoOrderEnabled}
                onCheckedChange={handleToggleAutoOrder}
              />
            </div>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </Button>
          </div>
        </div>

        {/* Alert */}
        {autoOrderEnabled && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Système de commandes automatiques activé
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Les commandes payées seront automatiquement transmises à vos fournisseurs dans les 5 minutes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isLoadingStats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardContent className="p-4 text-center">
                  <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats?.todayOrders || 0}</div>
                  <div className="text-sm text-muted-foreground">Auto aujourd'hui</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats?.successRate || 0}%</div>
                  <div className="text-sm text-muted-foreground">Taux de réussite</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats?.avgProcessingTime || 0} min</div>
                  <div className="text-sm text-muted-foreground">Temps moyen</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats?.pendingOrders || 0}</div>
                  <div className="text-sm text-muted-foreground">En attente</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">En Attente ({pendingOrders.length})</TabsTrigger>
            <TabsTrigger value="automated">Automatisées ({automatedOrders.length})</TabsTrigger>
            <TabsTrigger value="failed">Échouées ({failedOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commandes en Attente de Traitement</CardTitle>
                <CardDescription>
                  Ces commandes seront passées automatiquement une fois le paiement confirmé
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingOrders ? (
                  <Skeleton className="h-32 w-full" />
                ) : pendingOrders.length > 0 ? (
                  pendingOrders.map((order: any) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{order.shopify_order_id || order.id.slice(0, 8)}</h4>
                          <p className="text-sm text-muted-foreground">
                            {order.created_at 
                              ? format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                              : 'Date inconnue'}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Fournisseur</p>
                          <p className="font-medium">{order.supplier_name || 'Non défini'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Coût</p>
                          <p className="font-bold text-primary">{order.supplier_cost?.toFixed(2) || '0.00'}€</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Erreur</p>
                          <p className="font-medium text-red-600">{order.error_message || 'Aucune'}</p>
                        </div>
                      </div>

                      {order.status === 'pending' && autoOrderEnabled && (
                        <Button size="sm" className="w-full">
                          <Zap className="h-4 w-4 mr-2" />
                          Passer Commande Maintenant
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune commande en attente
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automated" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commandes Automatisées</CardTitle>
                <CardDescription>
                  Commandes passées automatiquement au fournisseur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingOrders ? (
                  <Skeleton className="h-32 w-full" />
                ) : automatedOrders.length > 0 ? (
                  automatedOrders.map((order: any) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{order.shopify_order_id || order.id.slice(0, 8)}</h4>
                          <p className="text-sm text-muted-foreground">
                            {order.created_at 
                              ? format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                              : 'Date inconnue'}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Fournisseur</p>
                          <p className="font-medium">{order.supplier_name || 'Non défini'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">N° Fournisseur</p>
                          <p className="font-medium font-mono text-xs">{order.supplier_order_id || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Coût</p>
                          <p className="font-bold text-primary">{order.supplier_cost?.toFixed(2) || '0.00'}€</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tracking</p>
                          <p className="font-medium font-mono text-xs">{order.tracking_number || 'En attente'}</p>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Passée automatiquement le {order.processed_at 
                          ? format(new Date(order.processed_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                          : format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune commande automatisée
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="failed" className="space-y-4">
            <Card>
              {failedOrders.length > 0 ? (
                <>
                  <CardHeader>
                    <CardTitle>Commandes Échouées</CardTitle>
                    <CardDescription>
                      Ces commandes ont rencontré une erreur lors du traitement
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {failedOrders.map((order: any) => (
                      <div key={order.id} className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{order.shopify_order_id || order.id.slice(0, 8)}</h4>
                            <p className="text-sm text-muted-foreground">
                              {order.created_at 
                                ? format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                                : 'Date inconnue'}
                            </p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="bg-red-100 dark:bg-red-900 p-2 rounded text-sm text-red-800 dark:text-red-200">
                          {order.error_message || 'Erreur inconnue'}
                        </div>
                        <Button size="sm" variant="outline" className="mt-3 w-full">
                          <Zap className="h-4 w-4 mr-2" />
                          Réessayer
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </>
              ) : (
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune commande échouée</h3>
                  <p className="text-muted-foreground">
                    Toutes vos commandes automatiques ont été passées avec succès
                  </p>
                </CardContent>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
