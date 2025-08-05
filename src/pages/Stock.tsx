import { useState } from "react";
import { Package, AlertTriangle, TrendingUp, TrendingDown, RefreshCw, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

export default function Stock() {
  const products = [
    {
      name: "iPhone 15 Pro",
      supplier: "BigBuy",
      stock: 156,
      threshold: 50,
      price: "€899.99",
      lastSync: "Il y a 2h",
      status: "ok",
      trend: "up"
    },
    {
      name: "Casque Sony WH-1000XM5",
      supplier: "AliExpress", 
      stock: 23,
      threshold: 30,
      price: "€299.99",
      lastSync: "Il y a 1h",
      status: "low",
      trend: "down"
    },
    {
      name: "Samsung Galaxy S24",
      supplier: "Spocket",
      stock: 0,
      threshold: 20,
      price: "€799.99", 
      lastSync: "Il y a 30m",
      status: "out",
      trend: "down"
    },
    {
      name: "MacBook Air M3",
      supplier: "BigBuy",
      stock: 89,
      threshold: 25,
      price: "€1299.99",
      lastSync: "Il y a 15m",
      status: "ok",
      trend: "up"
    }
  ];

  const getStatusBadge = (status: string, stock: number) => {
    if (status === "out") {
      return <Badge variant="destructive">Rupture</Badge>;
    }
    if (status === "low") {
      return <Badge variant="secondary" className="text-orange-600">Stock Faible</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">En Stock</Badge>;
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const getStockProgress = (current: number, threshold: number) => {
    const max = threshold * 3; // Assume max stock is 3x threshold
    return (current / max) * 100;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion Stock</h1>
          <p className="text-muted-foreground">Synchronisation temps réel des stocks fournisseurs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Tout
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertes Stock</p>
                <p className="text-2xl font-bold">23</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ruptures</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <Package className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fournisseurs</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Alertes Critiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <div>
                  <p className="font-semibold text-red-800">Samsung Galaxy S24</p>
                  <p className="text-sm text-red-600">Rupture de stock depuis 2h</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Changer Fournisseur
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                <div>
                  <p className="font-semibold text-orange-800">Casque Sony WH-1000XM5</p>
                  <p className="text-sm text-orange-600">Stock faible: 23 unités restantes</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Réapprovisionner
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventaire Produits</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Seuil</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Tendance</TableHead>
                <TableHead>Dernière Sync</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.supplier}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{product.stock}</span>
                        <span className="text-sm text-muted-foreground">unités</span>
                      </div>
                      <Progress 
                        value={getStockProgress(product.stock, product.threshold)} 
                        className="w-20 h-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell>{product.threshold}</TableCell>
                  <TableCell className="font-semibold">{product.price}</TableCell>
                  <TableCell>{getStatusBadge(product.status, product.stock)}</TableCell>
                  <TableCell>{getTrendIcon(product.trend)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{product.lastSync}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}