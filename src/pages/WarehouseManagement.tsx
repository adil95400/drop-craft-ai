import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Warehouse, Package, TrendingUp, AlertTriangle, MapPin, Users, Truck } from 'lucide-react'
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

export default function WarehouseManagement() {
  const warehouses = [
    {
      id: 1,
      name: "Entrepôt Principal - Paris",
      location: "Paris, France",
      capacity: "95%",
      products: 1250,
      orders: 45,
      staff: 12,
      status: "active"
    },
    {
      id: 2,
      name: "Entrepôt Secondaire - Lyon",
      location: "Lyon, France",
      capacity: "67%",
      products: 830,
      orders: 28,
      staff: 8,
      status: "active"
    },
    {
      id: 3,
      name: "Entrepôt CJ - Chine",
      location: "Guangzhou, Chine",
      capacity: "42%",
      products: 2500,
      orders: 12,
      staff: 25,
      status: "active"
    }
  ]

  const stats = [
    {
      icon: Warehouse,
      label: "Entrepôts actifs",
      value: "3",
      color: "text-primary"
    },
    {
      icon: Package,
      label: "Produits stockés",
      value: "4,580",
      color: "text-success"
    },
    {
      icon: Truck,
      label: "Expéditions en cours",
      value: "85",
      color: "text-warning"
    },
    {
      icon: AlertTriangle,
      label: "Alertes stock",
      value: "23",
      color: "text-destructive"
    }
  ]

  const inventoryAlerts = [
    { product: "Smart LED Light Strip", warehouse: "Paris", stock: 5, alert: "Stock faible" },
    { product: "Portable Blender", warehouse: "Lyon", stock: 0, alert: "Rupture de stock" },
    { product: "Wireless Car Charger", warehouse: "Paris", stock: 3, alert: "Stock critique" }
  ]

  return (
    <ChannablePageWrapper
      title="Gestion des Entrepôts"
      description="Gérez vos entrepôts et stocks multi-localisations"
      heroImage="stock"
      badge={{ label: 'Entrepôts', icon: Warehouse }}
    >
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.warehouse} />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouses List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mes entrepôts</CardTitle>
              <Button>
                <Warehouse className="h-4 w-4 mr-2" />
                Ajouter un entrepôt
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {warehouses.map((warehouse) => (
              <Card key={warehouse.id}>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{warehouse.name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {warehouse.location}
                        </div>
                      </div>
                      <Badge variant="default">Actif</Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Capacité</p>
                        <p className="text-lg font-bold">{warehouse.capacity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Produits</p>
                        <p className="text-lg font-bold">{warehouse.products}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Commandes</p>
                        <p className="text-lg font-bold">{warehouse.orders}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Personnel</p>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <p className="text-lg font-bold">{warehouse.staff}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Package className="h-4 w-4 mr-2" />
                        Inventaire
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Statistiques
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Alerts */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertes de stock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {inventoryAlerts.map((alert, index) => (
                <div key={index} className="p-3 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-sm">{alert.product}</p>
                    <Badge variant="destructive" className="text-xs">
                      {alert.alert}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.warehouse}</p>
                  <p className="text-sm mt-1">
                    Stock restant: <span className="font-bold text-destructive">{alert.stock}</span>
                  </p>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                Voir toutes les alertes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Réapprovisionnement
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Truck className="h-4 w-4 mr-2" />
                Transfert inter-entrepôts
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Rapport d'inventaire
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ChannablePageWrapper>
  )
}
