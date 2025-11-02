import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Package, AlertTriangle, TrendingDown, Search, Plus, Filter } from 'lucide-react';

const InventoryManagementPage: React.FC = () => {
  const inventoryItems = [
    {
      id: 1,
      name: 'Product A',
      sku: 'PRD-001',
      stock: 45,
      reserved: 5,
      available: 40,
      reorderPoint: 20,
      status: 'in_stock',
    },
    {
      id: 2,
      name: 'Product B',
      sku: 'PRD-002',
      stock: 12,
      reserved: 2,
      available: 10,
      reorderPoint: 15,
      status: 'low_stock',
    },
    {
      id: 3,
      name: 'Product C',
      sku: 'PRD-003',
      stock: 0,
      reserved: 3,
      available: 0,
      reorderPoint: 10,
      status: 'out_of_stock',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="default">En stock</Badge>;
      case 'low_stock':
        return <Badge variant="secondary">Stock faible</Badge>;
      case 'out_of_stock':
        return <Badge variant="destructive">Rupture</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion d'inventaire</h1>
          <p className="text-muted-foreground">
            Suivez et optimisez vos niveaux de stock
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajuster le stock
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur totale</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€45,890</div>
            <p className="text-xs text-muted-foreground">1,234 unités</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits en stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">Sur 120 produits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">23</div>
            <p className="text-xs text-muted-foreground">Action requise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rupture de stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">8</div>
            <p className="text-xs text-muted-foreground">Réapprovisionnement urgent</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventaire produits</CardTitle>
              <CardDescription>État des stocks en temps réel</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." className="pl-8 w-64" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventoryItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm font-semibold">{item.stock}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold">{item.reserved}</div>
                    <div className="text-xs text-muted-foreground">Réservé</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold">{item.available}</div>
                    <div className="text-xs text-muted-foreground">Disponible</div>
                  </div>
                  <div className="text-center min-w-[80px]">
                    {getStatusBadge(item.status)}
                  </div>
                  <Button variant="outline" size="sm">
                    Ajuster
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryManagementPage;
