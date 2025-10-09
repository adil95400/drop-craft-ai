import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useShippingManagement } from '@/hooks/useShippingManagement';
import { MapPin, Package, DollarSign, Truck, Plus, Calculator, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const ShippingManagementHub = () => {
  const {
    shippingZones,
    warehouses,
    shippingRates,
    shipments,
    analytics,
    createZone,
    createWarehouse,
    createRate,
    generateTracking,
    calculateShipping,
    isCalculating
  } = useShippingManagement();

  const [newZone, setNewZone] = useState({ zone_name: '', countries: '' });
  const [newWarehouse, setNewWarehouse] = useState({ warehouse_name: '', warehouse_code: '', country: '' });
  const [calcParams, setCalcParams] = useState({ destination_country: '', weight: '', order_value: '' });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion Avancée de l'Expédition</h1>
        <p className="text-muted-foreground mt-2">
          Zones automatiques, multi-entrepôts, calcul de tarifs et suivi automatisé
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expéditions Totales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_shipments || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.in_transit || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Coût Moyen</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.average_shipping_cost?.toFixed(2) || 0}€</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux de Livraison</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.delivery_rate?.toFixed(1) || 0}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="zones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="zones">Zones d'Expédition</TabsTrigger>
          <TabsTrigger value="warehouses">Entrepôts</TabsTrigger>
          <TabsTrigger value="rates">Tarifs</TabsTrigger>
          <TabsTrigger value="calculator">Calculateur</TabsTrigger>
          <TabsTrigger value="tracking">Suivi</TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Zones d'Expédition</CardTitle>
                  <CardDescription>Gérez vos zones d'expédition automatiques</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" />Nouvelle Zone</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer une Zone d'Expédition</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nom de la Zone</Label>
                        <Input
                          value={newZone.zone_name}
                          onChange={(e) => setNewZone({ ...newZone, zone_name: e.target.value })}
                          placeholder="Ex: Europe de l'Ouest"
                        />
                      </div>
                      <div>
                        <Label>Pays (séparés par des virgules)</Label>
                        <Input
                          value={newZone.countries}
                          onChange={(e) => setNewZone({ ...newZone, countries: e.target.value })}
                          placeholder="FR,DE,BE,CH"
                        />
                      </div>
                      <Button
                        onClick={() => {
                          createZone.mutate({
                            zone_name: newZone.zone_name,
                            countries: newZone.countries.split(',').map(c => c.trim())
                          });
                        }}
                        disabled={createZone.isPending}
                      >
                        Créer la Zone
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shippingZones?.map((zone: any) => (
                  <div key={zone.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {zone.zone_name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {zone.countries?.join(', ')}
                      </p>
                    </div>
                    <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                      {zone.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Entrepôts</CardTitle>
                  <CardDescription>Gérez vos entrepôts multi-localisations</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" />Nouvel Entrepôt</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer un Entrepôt</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nom de l'Entrepôt</Label>
                        <Input
                          value={newWarehouse.warehouse_name}
                          onChange={(e) => setNewWarehouse({ ...newWarehouse, warehouse_name: e.target.value })}
                          placeholder="Ex: Entrepôt Paris"
                        />
                      </div>
                      <div>
                        <Label>Code Entrepôt</Label>
                        <Input
                          value={newWarehouse.warehouse_code}
                          onChange={(e) => setNewWarehouse({ ...newWarehouse, warehouse_code: e.target.value })}
                          placeholder="Ex: WH-PAR-01"
                        />
                      </div>
                      <div>
                        <Label>Pays</Label>
                        <Input
                          value={newWarehouse.country}
                          onChange={(e) => setNewWarehouse({ ...newWarehouse, country: e.target.value })}
                          placeholder="FR"
                        />
                      </div>
                      <Button
                        onClick={() => createWarehouse.mutate({
                          ...newWarehouse,
                          location: newWarehouse.country,
                          capacity: 1000,
                          warehouse_type: 'standard'
                        })}
                        disabled={createWarehouse.isPending}
                      >
                        Créer l'Entrepôt
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {warehouses?.map((warehouse: any) => (
                  <div key={warehouse.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{warehouse.name}</h3>
                      <p className="text-sm text-muted-foreground">{warehouse.location}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={warehouse.is_active ? 'default' : 'secondary'}>
                        {warehouse.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculateur de Tarifs d'Expédition
              </CardTitle>
              <CardDescription>Calculez automatiquement les coûts d'expédition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Pays de Destination</Label>
                    <Input
                      value={calcParams.destination_country}
                      onChange={(e) => setCalcParams({ ...calcParams, destination_country: e.target.value })}
                      placeholder="FR"
                    />
                  </div>
                  <div>
                    <Label>Poids (kg)</Label>
                    <Input
                      type="number"
                      value={calcParams.weight}
                      onChange={(e) => setCalcParams({ ...calcParams, weight: e.target.value })}
                      placeholder="2.5"
                    />
                  </div>
                  <div>
                    <Label>Valeur Commande (€)</Label>
                    <Input
                      type="number"
                      value={calcParams.order_value}
                      onChange={(e) => setCalcParams({ ...calcParams, order_value: e.target.value })}
                      placeholder="150"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => calculateShipping.mutate({
                    destination_country: calcParams.destination_country,
                    weight: parseFloat(calcParams.weight),
                    order_value: parseFloat(calcParams.order_value)
                  })}
                  disabled={isCalculating}
                >
                  {isCalculating ? 'Calcul...' : 'Calculer les Tarifs'}
                </Button>

                {calculateShipping.data?.available_rates && (
                  <div className="mt-6 space-y-3">
                    <h3 className="font-semibold">Tarifs Disponibles:</h3>
                    {calculateShipping.data.available_rates.map((rate: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium">{rate.carrier} - {rate.service_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Livraison: {rate.delivery_estimate.min_days}-{rate.delivery_estimate.max_days} jours
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {rate.is_free ? 'GRATUIT' : `${rate.cost.toFixed(2)}€`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suivi des Expéditions</CardTitle>
              <CardDescription>Suivez toutes vos expéditions en temps réel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shipments?.map((shipment: any) => (
                  <div key={shipment.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{shipment.tracking_number}</p>
                        <p className="text-sm text-muted-foreground">{shipment.carrier}</p>
                      </div>
                      <Badge>{shipment.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
