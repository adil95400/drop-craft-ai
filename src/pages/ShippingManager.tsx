import { Helmet } from 'react-helmet-async'
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Truck, Package, Clock, DollarSign, Plus, Settings, Globe } from 'lucide-react'
import { useShippingManager } from '@/hooks/useShippingManager'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

export default function ShippingManager() {
  const { carriers, isLoadingCarriers, shipments, isLoadingShipments, rules, isLoadingRules, stats, toggleCarrier } = useShippingManager()

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'delivered': return <Badge>Livré</Badge>
      case 'in_transit':
      case 'shipped': return <Badge variant="secondary">En transit</Badge>
      case 'pending': return <Badge variant="outline">En attente</Badge>
      default: return <Badge variant="outline">{status || 'Inconnu'}</Badge>
    }
  }

  return (
    <>
      <Helmet>
        <title>Gestion des Expéditions - Drop Craft AI</title>
        <meta name="description" content="Gérez vos transporteurs, tarifs et suivez vos expéditions en temps réel" />
      </Helmet>

      <ChannablePageWrapper
        title="Gestion des Expéditions"
        description="Multi-transporteurs et tracking en temps réel"
        heroImage="orders"
        badge={{ label: 'Shipping', icon: Truck }}
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Transporteur
          </Button>
        }
      >
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.shipping} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-1 sm:mb-2" />
              <div className="text-xl sm:text-2xl font-bold">{stats.inTransit}</div>
              <div className="text-[10px] sm:text-sm text-muted-foreground">En transit</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mx-auto mb-1 sm:mb-2" />
              <div className="text-xl sm:text-2xl font-bold">{stats.delivered}</div>
              <div className="text-[10px] sm:text-sm text-muted-foreground">Livrés</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 mx-auto mb-1 sm:mb-2" />
              <div className="text-xl sm:text-2xl font-bold">{stats.avgDeliveryTime} j</div>
              <div className="text-[10px] sm:text-sm text-muted-foreground">Délai moyen</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mx-auto mb-1 sm:mb-2" />
              <div className="text-xl sm:text-2xl font-bold">{stats.avgCost}€</div>
              <div className="text-[10px] sm:text-sm text-muted-foreground">Coût moyen</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="carriers" className="space-y-4 sm:space-y-6">
          <TabsList>
            <TabsTrigger value="carriers">Transporteurs</TabsTrigger>
            <TabsTrigger value="rules">Règles</TabsTrigger>
            <TabsTrigger value="tracking">Suivi</TabsTrigger>
            <TabsTrigger value="zones">Zones</TabsTrigger>
          </TabsList>

          <TabsContent value="carriers" className="space-y-3 sm:space-y-4">
            {isLoadingCarriers ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4 sm:p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
              ))
            ) : carriers && carriers.length > 0 ? (
              carriers.map((carrier) => (
                <Card key={carrier.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-primary/10 rounded-lg shrink-0">
                          <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm sm:text-lg">{carrier.carrier_name}</h3>
                            <Badge variant={carrier.is_active ? 'default' : 'secondary'} className="text-xs">
                              {carrier.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">{carrier.carrier_code}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 ml-11 sm:ml-0">
                        <div className="text-left sm:text-right">
                          <div className="text-[10px] sm:text-sm text-muted-foreground">Service</div>
                          <div className="text-xs sm:text-base font-medium">{carrier.default_service || 'Standard'}</div>
                        </div>
                        <Button variant="outline" size="sm" className="shrink-0" onClick={() => toggleCarrier(carrier.id, !carrier.is_active)}>
                          <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun transporteur configuré</h3>
                  <p className="text-muted-foreground mb-4">Ajoutez vos transporteurs pour commencer</p>
                  <Button><Plus className="h-4 w-4 mr-2" />Ajouter un transporteur</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Règles d'Expédition</CardTitle><CardDescription>Automatisez le choix du transporteur</CardDescription></CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {isLoadingRules ? <Skeleton className="h-24 w-full" /> : rules && rules.length > 0 ? (
                  rules.map((rule) => (
                    <div key={rule.id} className="p-3 sm:p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm sm:text-base font-medium">{rule.name}</h4>
                        <Badge className="text-xs" variant={rule.is_active ? 'default' : 'secondary'}>{rule.is_active ? 'Actif' : 'Inactif'}</Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">{rule.description || 'Aucune description'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">Aucune règle configurée</p>
                )}
                <Button className="w-full" size="sm"><Plus className="h-4 w-4 mr-2" />Créer une Règle</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-3 sm:space-y-4">
            {isLoadingShipments ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4 sm:p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
              ))
            ) : shipments && shipments.length > 0 ? (
              shipments.map((shipment) => (
                <Card key={shipment.id}>
                  <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold">{shipment.tracking_number || 'N/A'}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">{shipment.carrier_code || 'Transporteur inconnu'}</p>
                      </div>
                      {getStatusBadge(shipment.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-muted-foreground">Expédié le</p>
                        <p className="font-medium">{shipment.shipped_at ? format(new Date(shipment.shipped_at), 'dd/MM/yyyy', { locale: getDateFnsLocale() }) : 'Non expédié'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Coût</p>
                        <p className="font-medium">{shipment.shipping_cost?.toFixed(2) || '0.00'}€</p>
                      </div>
                    </div>
                    {shipment.estimated_delivery && (
                      <div className="bg-muted p-2 sm:p-3 rounded-lg">
                        <p className="text-xs sm:text-sm font-medium mb-1">Livraison estimée</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{format(new Date(shipment.estimated_delivery), 'dd MMMM yyyy', { locale: getDateFnsLocale() })}</p>
                      </div>
                    )}
                    <Button variant="outline" className="w-full" size="sm">Voir le Suivi</Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune expédition</h3>
                  <p className="text-muted-foreground">Les expéditions apparaîtront ici une fois créées</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="zones" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Zones de Livraison</CardTitle><CardDescription>Tarifs par zone géographique</CardDescription></CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
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
                      <Button variant="outline" size="sm" className="hidden sm:inline-flex">Modifier</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  )
}
