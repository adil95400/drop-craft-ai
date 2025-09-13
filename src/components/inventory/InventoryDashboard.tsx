import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Truck,
  ArrowUpDown,
  Search,
  Filter,
  Plus,
  Download,
  RefreshCw
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  category: string;
  location: string;
  cost: number;
  value: number;
  lastMovement: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
}

export function InventoryDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const inventoryData: InventoryItem[] = [
    {
      id: '1',
      name: 'Chaise de bureau ergonomique',
      sku: 'CHB-001',
      currentStock: 45,
      minStock: 20,
      maxStock: 100,
      category: 'Mobilier',
      location: 'Entrepôt A',
      cost: 89.99,
      value: 4049.55,
      lastMovement: '2024-01-20',
      status: 'in_stock'
    },
    {
      id: '2',
      name: 'Lampe LED design',
      sku: 'LAM-002',
      currentStock: 8,
      minStock: 15,
      maxStock: 50,
      category: 'Éclairage',
      location: 'Entrepôt B',
      cost: 24.99,
      value: 199.92,
      lastMovement: '2024-01-19',
      status: 'low_stock'
    },
    {
      id: '3',
      name: 'Table basse moderne',
      sku: 'TAB-003',
      currentStock: 0,
      minStock: 5,
      maxStock: 25,
      category: 'Mobilier',
      location: 'Entrepôt A',
      cost: 159.99,
      value: 0,
      lastMovement: '2024-01-15',
      status: 'out_of_stock'
    },
    {
      id: '4',
      name: 'Coussin décoratif',
      sku: 'COU-004',
      currentStock: 120,
      minStock: 30,
      maxStock: 80,
      category: 'Décoration',
      location: 'Entrepôt C',
      cost: 12.99,
      value: 1558.8,
      lastMovement: '2024-01-18',
      status: 'overstock'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      case 'overstock': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_stock': return 'En stock';
      case 'low_stock': return 'Stock faible';
      case 'out_of_stock': return 'Rupture';
      case 'overstock': return 'Surstock';
      default: return 'Inconnu';
    }
  };

  const totalValue = inventoryData.reduce((sum, item) => sum + item.value, 0);
  const lowStockItems = inventoryData.filter(item => item.status === 'low_stock').length;
  const outOfStockItems = inventoryData.filter(item => item.status === 'out_of_stock').length;
  const overstockItems = inventoryData.filter(item => item.status === 'overstock').length;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valeur Totale</p>
                <p className="text-2xl font-bold">{totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock Faible</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockItems}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ruptures</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockItems}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Surstock</p>
                <p className="text-2xl font-bold text-blue-600">{overstockItems}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion des Stocks</CardTitle>
              <CardDescription>
                Vue d'ensemble de votre inventaire et mouvements de stock
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouvel Article
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inventory" className="space-y-4">
            <TabsList>
              <TabsTrigger value="inventory">Inventaire</TabsTrigger>
              <TabsTrigger value="movements">Mouvements</TabsTrigger>
              <TabsTrigger value="alerts">Alertes</TabsTrigger>
              <TabsTrigger value="forecast">Prévisions</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory">
              {/* Filtres */}
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher par nom ou SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres
                </Button>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>

              {/* Tableau des stocks */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Produit</th>
                      <th className="px-4 py-3 text-left font-medium">SKU</th>
                      <th className="px-4 py-3 text-right font-medium">Stock</th>
                      <th className="px-4 py-3 text-left font-medium">Statut</th>
                      <th className="px-4 py-3 text-right font-medium">Valeur</th>
                      <th className="px-4 py-3 text-left font-medium">Emplacement</th>
                      <th className="px-4 py-3 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryData.map((item) => (
                      <tr key={item.id} className="border-t hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.category}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">{item.sku}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-medium">{item.currentStock}</div>
                          <div className="text-xs text-muted-foreground">
                            Min: {item.minStock} | Max: {item.maxStock}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusColor(item.status)}>
                            {getStatusText(item.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {item.value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </td>
                        <td className="px-4 py-3">{item.location}</td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="outline">
                            <ArrowUpDown className="w-3 h-3 mr-1" />
                            Ajuster
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="movements">
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center text-muted-foreground">
                      <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Historique des mouvements de stock</p>
                      <p className="text-sm">Entrées, sorties, transferts et ajustements</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="alerts">
              <div className="space-y-4">
                {/* Alertes stock faible */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      Alertes Stock Faible
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {inventoryData.filter(item => item.status === 'low_stock').map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Stock actuel: {item.currentStock} (Min: {item.minStock})
                            </div>
                          </div>
                          <Button size="sm">Réapprovisionner</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Alertes rupture */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      Ruptures de Stock
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {inventoryData.filter(item => item.status === 'out_of_stock').map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Dernière vente: {item.lastMovement}
                            </div>
                          </div>
                          <Button size="sm" variant="destructive">Commande Urgente</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="forecast">
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center text-muted-foreground">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Prévisions de stock intelligentes</p>
                      <p className="text-sm">Basées sur l'historique des ventes et les tendances</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}