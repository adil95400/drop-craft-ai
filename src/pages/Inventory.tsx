import { useState } from "react"
import { AppLayout } from "@/layouts/AppLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Search, AlertTriangle, Package, Users, TrendingDown, TrendingUp, Plus, Download, Filter } from "lucide-react"

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("")

  const inventory = [
    {
      id: 1,
      name: "Montre Sport Pro",
      sku: "MSP-001",
      currentStock: 45,
      minStock: 10,
      maxStock: 100,
      supplier: "Tech Supplies",
      lastRestocked: "2024-01-15",
      status: "in_stock",
      price: 89.99
    },
    {
      id: 2,
      name: "Écouteurs Bluetooth",
      sku: "EB-002",
      currentStock: 5,
      minStock: 15,
      maxStock: 80,
      supplier: "AudioTech",
      lastRestocked: "2024-01-10",
      status: "low_stock",
      price: 45.99
    },
    {
      id: 3,
      name: "Câble USB-C",
      sku: "USC-003",
      currentStock: 0,
      minStock: 20,
      maxStock: 200,
      supplier: "Cable Co",
      lastRestocked: "2024-01-05",
      status: "out_of_stock",
      price: 12.99
    }
  ]

  const suppliers = [
    {
      id: 1,
      name: "Tech Supplies",
      products: 156,
      avgDelivery: "5-7 jours",
      reliability: 98,
      status: "active"
    },
    {
      id: 2,
      name: "AudioTech",
      products: 89,
      avgDelivery: "3-5 jours",
      reliability: 95,
      status: "active"
    },
    {
      id: 3,
      name: "Cable Co",
      products: 234,
      avgDelivery: "7-10 jours",
      reliability: 87,
      status: "warning"
    }
  ]

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-500'
      case 'low_stock': return 'bg-yellow-500'
      case 'out_of_stock': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'in_stock': return 'En stock'
      case 'low_stock': return 'Stock faible'
      case 'out_of_stock': return 'Rupture'
      default: return 'Inconnu'
    }
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Stock & Fournisseurs</h1>
            <p className="text-muted-foreground mt-2">
              Gérez votre inventaire et vos relations fournisseurs
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter Produit
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Produits</p>
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-sm text-green-600">+23 cette semaine</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Alertes Stock</p>
                  <p className="text-2xl font-bold">15</p>
                  <p className="text-sm text-red-600">Attention requise</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Fournisseurs</p>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-green-600">10 actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Valeur Stock</p>
                  <p className="text-2xl font-bold">€125K</p>
                  <p className="text-sm text-green-600">+8.2% vs mois dernier</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList>
            <TabsTrigger value="inventory">Inventaire</TabsTrigger>
            <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
            <TabsTrigger value="alerts">Alertes</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Inventaire</CardTitle>
                    <CardDescription>
                      Gérez votre stock et surveillez les niveaux
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtres
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Inventory Table */}
                <div className="space-y-4">
                  {inventory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                          <p className="text-sm text-muted-foreground">Fournisseur: {item.supplier}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="font-semibold">{item.currentStock}</div>
                          <div className="text-sm text-muted-foreground">Stock actuel</div>
                          <Progress 
                            value={(item.currentStock / item.maxStock) * 100} 
                            className="w-16 mt-1"
                          />
                        </div>
                        
                        <div className="text-center">
                          <div className="font-semibold">€{item.price}</div>
                          <div className="text-sm text-muted-foreground">Prix unitaire</div>
                        </div>
                        
                        <div className="text-center">
                          <Badge className={getStockStatusColor(item.status)}>
                            {getStockStatusText(item.status)}
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Modifier</Button>
                          <Button variant="outline" size="sm">Réappro</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers">
            <Card>
              <CardHeader>
                <CardTitle>Fournisseurs</CardTitle>
                <CardDescription>
                  Gérez vos relations avec les fournisseurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {suppliers.map((supplier) => (
                    <Card key={supplier.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{supplier.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{supplier.products} produits</p>
                          </div>
                          <Badge 
                            variant={supplier.status === 'active' ? 'default' : 'destructive'}
                            className={supplier.status === 'active' ? 'bg-green-500' : ''}
                          >
                            {supplier.status === 'active' ? 'Actif' : 'Attention'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Délai livraison</span>
                            <span className="text-sm font-medium">{supplier.avgDelivery}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Fiabilité</span>
                            <span className="text-sm font-medium">{supplier.reliability}%</span>
                          </div>
                          <Progress value={supplier.reliability} className="mt-2" />
                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              Voir Détails
                            </Button>
                            <Button size="sm" className="flex-1">
                              Contacter
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                  Alertes Stock
                </CardTitle>
                <CardDescription>
                  Surveillez les produits nécessitant votre attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <div>
                        <h3 className="font-semibold">Câble USB-C - Rupture de stock</h3>
                        <p className="text-sm text-muted-foreground">Stock: 0 / Min: 20</p>
                      </div>
                    </div>
                    <Button size="sm" variant="destructive">Action requise</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingDown className="w-5 h-5 text-yellow-600" />
                      <div>
                        <h3 className="font-semibold">Écouteurs Bluetooth - Stock faible</h3>
                        <p className="text-sm text-muted-foreground">Stock: 5 / Min: 15</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Réapprovisionner</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Historique des Mouvements</CardTitle>
                <CardDescription>
                  Suivez l'historique des entrées et sorties de stock
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Historique des Mouvements</h3>
                  <p className="text-muted-foreground">Consultez l'historique détaillé de vos stocks</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}