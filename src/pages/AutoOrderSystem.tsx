import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Zap, 
  ShoppingCart, 
  CheckCircle, 
  Clock, 
  XCircle,
  Settings,
  AlertTriangle,
  TrendingUp,
  Package
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AutoOrderSystem() {
  const { toast } = useToast()
  const [autoOrderEnabled, setAutoOrderEnabled] = useState(true)

  const [pendingOrders] = useState([
    {
      id: 'ORD-2024-001',
      customer: 'Jean Dupont',
      product: 'Wireless Earbuds Pro',
      supplier: 'AliExpress',
      status: 'pending_payment',
      amount: 29.99,
      createdAt: '2024-02-12 14:30'
    },
    {
      id: 'ORD-2024-002',
      customer: 'Marie Martin',
      product: 'Smart Watch X',
      supplier: 'CJ Dropshipping',
      status: 'ready',
      amount: 89.99,
      createdAt: '2024-02-12 15:45'
    }
  ])

  const [automatedOrders] = useState([
    {
      id: 'ORD-2024-003',
      customer: 'Pierre Durant',
      product: 'Phone Case Premium',
      supplier: 'AliExpress',
      supplierOrderId: 'AE123456789',
      status: 'placed',
      amount: 14.99,
      placedAt: '2024-02-11 09:15'
    },
    {
      id: 'ORD-2024-004',
      customer: 'Sophie Bernard',
      product: 'Bluetooth Speaker',
      supplier: 'CJ Dropshipping',
      supplierOrderId: 'CJ987654321',
      status: 'confirmed',
      amount: 34.99,
      placedAt: '2024-02-11 10:30'
    }
  ])

  const handleToggleAutoOrder = () => {
    setAutoOrderEnabled(!autoOrderEnabled)
    toast({
      title: autoOrderEnabled ? 'Commandes automatiques désactivées' : 'Commandes automatiques activées',
      description: autoOrderEnabled 
        ? 'Les commandes ne seront plus passées automatiquement'
        : 'Les commandes seront passées automatiquement aux fournisseurs'
    })
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
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">247</div>
              <div className="text-sm text-muted-foreground">Auto ce mois</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">98.5%</div>
              <div className="text-sm text-muted-foreground">Taux de réussite</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">3 min</div>
              <div className="text-sm text-muted-foreground">Temps moyen</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">47h</div>
              <div className="text-sm text-muted-foreground">Temps économisé</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">En Attente ({pendingOrders.length})</TabsTrigger>
            <TabsTrigger value="automated">Automatisées ({automatedOrders.length})</TabsTrigger>
            <TabsTrigger value="failed">Échouées (0)</TabsTrigger>
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
                {pendingOrders.map((order) => (
                  <div key={order.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{order.id}</h4>
                        <p className="text-sm text-muted-foreground">{order.customer}</p>
                      </div>
                      <Badge variant={order.status === 'ready' ? 'default' : 'secondary'}>
                        {order.status === 'ready' ? 'Prêt' : 'En attente paiement'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Produit</p>
                        <p className="font-medium">{order.product}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fournisseur</p>
                        <p className="font-medium">{order.supplier}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Montant</p>
                        <p className="font-bold text-primary">{order.amount}€</p>
                      </div>
                    </div>

                    {order.status === 'ready' && autoOrderEnabled && (
                      <Button size="sm" className="w-full">
                        <Zap className="h-4 w-4 mr-2" />
                        Passer Commande Maintenant
                      </Button>
                    )}
                  </div>
                ))}
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
                {automatedOrders.map((order) => (
                  <div key={order.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{order.id}</h4>
                        <p className="text-sm text-muted-foreground">{order.customer}</p>
                      </div>
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {order.status === 'placed' ? 'Passée' : 'Confirmée'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Produit</p>
                        <p className="font-medium">{order.product}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fournisseur</p>
                        <p className="font-medium">{order.supplier}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">N° Fournisseur</p>
                        <p className="font-medium font-mono text-xs">{order.supplierOrderId}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Montant</p>
                        <p className="font-bold text-primary">{order.amount}€</p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Passée automatiquement le {order.placedAt}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="failed" className="space-y-4">
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune commande échouée</h3>
                <p className="text-muted-foreground">
                  Toutes vos commandes automatiques ont été passées avec succès
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
