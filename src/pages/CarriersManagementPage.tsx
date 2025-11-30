import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Truck, CheckCircle, XCircle, Settings, Trash2 } from 'lucide-react';
import { useFulfillmentCarriers } from '@/hooks/useFulfillmentCarriers';
import { CarrierConnectionModal } from '@/components/fulfillment/CarrierConnectionModal';

export default function CarriersManagementPage() {
  const { carriers, isLoading, deleteCarrier, updateCarrier } = useFulfillmentCarriers();
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);

  const activeCarriers = carriers.filter(c => c.is_active);
  const inactiveCarriers = carriers.filter(c => !c.is_active);

  return (
    <>
      <Helmet>
        <title>Gestion des Transporteurs - Drop Craft AI</title>
        <meta name="description" content="Gérez vos transporteurs et expéditions avec intégration multi-transporteurs" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <Truck className="w-10 h-10" />
              Transporteurs
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              Gérez vos connexions aux transporteurs pour automatiser vos expéditions
            </p>
          </div>
          <Button onClick={() => setConnectionModalOpen(true)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Connecter un transporteur
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Transporteurs Actifs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeCarriers.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Configurés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{carriers.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pays Couverts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {[...new Set(carriers.flatMap(c => c.supported_countries))].length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Par Défaut</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {carriers.find(c => c.is_default)?.carrier_name || 'Aucun'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Carriers */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Transporteurs Actifs</h2>
              {activeCarriers.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Aucun transporteur connecté</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setConnectionModalOpen(true)}
                    >
                      Connecter votre premier transporteur
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeCarriers.map(carrier => (
                    <Card key={carrier.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Truck className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{carrier.carrier_name}</CardTitle>
                              <div className="flex gap-2 mt-1">
                                <Badge variant={carrier.connection_status === 'connected' ? 'default' : 'destructive'}>
                                  {carrier.connection_status === 'connected' ? (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                  ) : (
                                    <XCircle className="w-3 h-3 mr-1" />
                                  )}
                                  {carrier.connection_status}
                                </Badge>
                                {carrier.is_default && (
                                  <Badge variant="outline">Par défaut</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pays couverts</span>
                            <span className="font-medium">
                              {carrier.supported_countries.includes('*') 
                                ? 'Monde entier' 
                                : carrier.supported_countries.length
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dernière synchro</span>
                            <span className="font-medium">
                              {carrier.last_sync_at 
                                ? new Date(carrier.last_sync_at).toLocaleDateString()
                                : 'Jamais'
                              }
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Settings className="w-4 h-4 mr-2" />
                            Configurer
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteCarrier(carrier.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Inactive Carriers */}
            {inactiveCarriers.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Transporteurs Inactifs</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {inactiveCarriers.map(carrier => (
                    <Card key={carrier.id} className="opacity-60">
                      <CardHeader>
                        <CardTitle className="text-lg">{carrier.carrier_name}</CardTitle>
                        <Badge variant="secondary">Inactif</Badge>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => updateCarrier({ id: carrier.id, updates: { is_active: true } })}
                        >
                          Réactiver
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CarrierConnectionModal
        open={connectionModalOpen}
        onOpenChange={setConnectionModalOpen}
      />
    </>
  );
}