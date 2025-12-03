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

      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Gestion des Expéditions
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Multi-transporteurs et tracking
            </p>
          </div>
          <Button size="sm" className="self-start sm:self-auto sm:size-default">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="sm:hidden">Ajouter</span>
            <span className="hidden sm:inline">Nouveau Transporteur</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-1 sm:mb-2" />
              <div className="text-xl sm:text-2xl font-bold">124</div>
              <div className="text-[10px] sm:text-sm text-muted-foreground">En transit</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mx-auto mb-1 sm:mb-2" />
              <div className="text-xl sm:text-2xl font-bold">89</div>
              <div className="text-[10px] sm:text-sm text-muted-foreground">Livrés</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 mx-auto mb-1 sm:mb-2" />
              <div className="text-xl sm:text-2xl font-bold">3.2 j</div>
              <div className="text-[10px] sm:text-sm text-muted-foreground">Délai moyen</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mx-auto mb-1 sm:mb-2" />
              <div className="text-xl sm:text-2xl font-bold">6.50€</div>
              <div className="text-[10px] sm:text-sm text-muted-foreground">Coût moyen</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="carriers" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="w-max sm:w-auto">
              <TabsTrigger value="carriers" className="text-xs sm:text-sm px-2 sm:px-3">Transporteurs</TabsTrigger>
              <TabsTrigger value="rules" className="text-xs sm:text-sm px-2 sm:px-3">Règles</TabsTrigger>
              <TabsTrigger value="tracking" className="text-xs sm:text-sm px-2 sm:px-3">Suivi</TabsTrigger>
              <TabsTrigger value="zones" className="text-xs sm:text-sm px-2 sm:px-3">Zones</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="carriers" className="space-y-3 sm:space-y-4">
            {carriers.map((carrier) => (
              <Card key={carrier.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-primary/10 rounded-lg shrink-0">
                        <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm sm:text-lg">{carrier.name}</h3>
                          <Badge variant={carrier.isActive ? 'default' : 'secondary'} className="text-xs">
                            {carrier.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">{carrier.carrier}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 ml-11 sm:ml-0">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] sm:text-sm text-muted-foreground">Délai</div>
                        <div className="text-xs sm:text-base font-medium">{carrier.deliveryTime}</div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] sm:text-sm text-muted-foreground">Tarif</div>
                        <div className="text-sm sm:text-base font-bold text-primary">{carrier.cost}€</div>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0">
                        <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Règles d'Expédition</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Automatisez le choix du transporteur
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-3 sm:space-y-4">
                <div className="p-3 sm:p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm sm:text-base font-medium">Commandes Express</h4>
                    <Badge className="text-xs">Actif</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Si montant &gt; 50€ → Express offerte
                  </p>
                </div>

                <div className="p-3 sm:p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm sm:text-base font-medium">International Premium</h4>
                    <Badge variant="secondary" className="text-xs">Inactif</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Si pays hors UE → DHL Express auto
                  </p>
                </div>

                <Button className="w-full" size="sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Créer une Règle
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-3 sm:space-y-4">
            {trackingOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold">{order.id}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">{order.customer}</p>
                      </div>
                      <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="text-xs">
                        {order.status === 'delivered' ? 'Livré' : 'En transit'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-muted-foreground">Transporteur</p>
                        <p className="font-medium">{order.carrier}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">N° de suivi</p>
                        <p className="font-medium font-mono text-[10px] sm:text-sm truncate">{order.trackingNumber}</p>
                      </div>
                    </div>

                    <div className="bg-muted p-2 sm:p-3 rounded-lg">
                      <p className="text-xs sm:text-sm font-medium mb-1">Dernière mise à jour</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{order.lastUpdate}</p>
                    </div>

                    <Button variant="outline" className="w-full" size="sm">
                      Voir le Suivi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="zones" className="space-y-4">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Zones de Livraison</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Tarifs par zone géographique
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-3 sm:space-y-4">
                {[
                  { name: 'France Métro', countries: 1, cost: '4.99€' },
                  { name: 'Union Européenne', countries: 27, cost: '7.99€' },
                  { name: 'Amérique du Nord', countries: 3, cost: '15.99€' },
                  { name: 'Reste du Monde', countries: 150, cost: '24.99€' }
                ].map((zone) => (
                  <div key={zone.name} className="flex items-center justify-between p-3 sm:p-4 border rounded-lg gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-medium truncate">{zone.name}</p>
                        <p className="text-[10px] sm:text-sm text-muted-foreground">{zone.countries} pays</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                      <span className="text-sm sm:text-base font-bold text-primary">{zone.cost}</span>
                      <Button variant="outline" size="sm" className="hidden sm:inline-flex">
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
