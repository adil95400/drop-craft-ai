import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  DollarSign,
  Plus,
  Settings,
  Globe,
  Zap
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ShippingManager() {
  const { toast } = useToast()
  const [carriers] = useState([
    {
      id: '1',
      name: 'Standard Shipping',
      carrier: 'La Poste',
      deliveryTime: '5-7 jours',
      cost: 4.99,
      regions: ['France', 'Europe'],
      isActive: true
    },
    {
      id: '2',
      name: 'Express Shipping',
      carrier: 'Chronopost',
      deliveryTime: '24-48h',
      cost: 12.99,
      regions: ['France'],
      isActive: true
    },
    {
      id: '3',
      name: 'International',
      carrier: 'DHL Express',
      deliveryTime: '7-14 jours',
      cost: 19.99,
      regions: ['Mondial'],
      isActive: false
    }
  ])

  const [trackingOrders] = useState([
    {
      id: 'ORD-2024-001',
      customer: 'Jean Dupont',
      carrier: 'La Poste',
      trackingNumber: 'FR123456789',
      status: 'in_transit',
      lastUpdate: 'Colis en transit - Paris',
      estimatedDelivery: '2024-02-15'
    },
    {
      id: 'ORD-2024-002',
      customer: 'Marie Martin',
      carrier: 'Chronopost',
      trackingNumber: 'CH987654321',
      status: 'delivered',
      lastUpdate: 'Colis livré',
      estimatedDelivery: '2024-02-12'
    }
  ])

  return (
    <>
      <Helmet>
        <title>Gestion des Expéditions - Drop Craft AI</title>
        <meta name="description" content="Gérez vos transporteurs, tarifs et suivez vos expéditions en temps réel" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Gestion des Expéditions
            </h1>
            <p className="text-muted-foreground mt-1">
              Multi-transporteurs et tracking en temps réel
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Transporteur
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">124</div>
              <div className="text-sm text-muted-foreground">Colis en transit</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Truck className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">89</div>
              <div className="text-sm text-muted-foreground">Livrés cette semaine</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">3.2 j</div>
              <div className="text-sm text-muted-foreground">Délai moyen</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">6.50€</div>
              <div className="text-sm text-muted-foreground">Coût moyen</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="carriers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="carriers">Transporteurs</TabsTrigger>
            <TabsTrigger value="rules">Règles d'Expédition</TabsTrigger>
            <TabsTrigger value="tracking">Suivi Colis</TabsTrigger>
            <TabsTrigger value="zones">Zones de Livraison</TabsTrigger>
          </TabsList>

          <TabsContent value="carriers" className="space-y-4">
            {carriers.map((carrier) => (
              <Card key={carrier.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Truck className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{carrier.name}</h3>
                          <Badge variant={carrier.isActive ? 'default' : 'secondary'}>
                            {carrier.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{carrier.carrier}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Délai</div>
                        <div className="font-medium">{carrier.deliveryTime}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Tarif</div>
                        <div className="font-bold text-primary">{carrier.cost}€</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Zones</div>
                        <div className="font-medium">{carrier.regions.join(', ')}</div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Règles d'Expédition Automatiques</CardTitle>
                <CardDescription>
                  Définissez des règles pour automatiser le choix du transporteur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Commandes Express</h4>
                    <Badge>Actif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Si montant &gt; 50€ → Livraison express offerte
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">International Premium</h4>
                    <Badge variant="secondary">Inactif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Si pays hors UE → DHL Express automatique
                  </p>
                </div>

                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une Règle
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            {trackingOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{order.id}</h3>
                        <p className="text-sm text-muted-foreground">{order.customer}</p>
                      </div>
                      <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                        {order.status === 'delivered' ? 'Livré' : 'En transit'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Transporteur</p>
                        <p className="font-medium">{order.carrier}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">N° de suivi</p>
                        <p className="font-medium font-mono">{order.trackingNumber}</p>
                      </div>
                    </div>

                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm font-medium mb-1">Dernière mise à jour</p>
                      <p className="text-sm text-muted-foreground">{order.lastUpdate}</p>
                    </div>

                    <Button variant="outline" className="w-full" size="sm">
                      Voir le Suivi Complet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="zones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Zones de Livraison</CardTitle>
                <CardDescription>
                  Configurez les tarifs par zone géographique
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'France Métropolitaine', countries: 1, cost: '4.99€' },
                  { name: 'Union Européenne', countries: 27, cost: '7.99€' },
                  { name: 'Amérique du Nord', countries: 3, cost: '15.99€' },
                  { name: 'Reste du Monde', countries: 150, cost: '24.99€' }
                ].map((zone) => (
                  <div key={zone.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{zone.name}</p>
                        <p className="text-sm text-muted-foreground">{zone.countries} pays</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-primary">{zone.cost}</span>
                      <Button variant="outline" size="sm">
                        Modifier
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
