import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

export default function StockManagement() {
  const stockAlerts = [
    { product: "iPhone 14 Pro", stock: 2, status: "critical", supplier: "TechDist" },
    { product: "Samsung Galaxy S23", stock: 8, status: "low", supplier: "MobilePlus" },
    { product: "MacBook Air M2", stock: 15, status: "normal", supplier: "AppleDist" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <PageHeader
        title="Gestion des Stocks"
        description="Surveillez et gérez vos niveaux de stock en temps réel"
        badge="Smart Inventory"
      />

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">
                +12% par rapport au mois dernier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits en Rupture</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">23</div>
              <p className="text-xs text-muted-foreground">
                Nécessite une action immédiate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valeur du Stock</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€89,432</div>
              <p className="text-xs text-muted-foreground">
                +8.2% ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rotation du Stock</CardTitle>
              <RefreshCw className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.2x</div>
              <p className="text-xs text-muted-foreground">
                Rotation annuelle moyenne
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Alertes de Stock</CardTitle>
              <CardDescription>
                Produits nécessitant une attention immédiate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockAlerts.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{alert.product}</p>
                        <p className="text-sm text-muted-foreground">{alert.supplier}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{alert.stock}</span>
                      <Badge 
                        variant={
                          alert.status === 'critical' ? 'destructive' : 
                          alert.status === 'low' ? 'secondary' : 'default'
                        }
                      >
                        {alert.status === 'critical' ? 'Critique' : 
                         alert.status === 'low' ? 'Faible' : 'Normal'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions Automatisées</CardTitle>
              <CardDescription>
                Règles de réapprovisionnement intelligent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Réapprovisionnement Auto</p>
                    <p className="text-sm text-muted-foreground">Actif pour 156 produits</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Configurer
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Alertes par Email</p>
                    <p className="text-sm text-muted-foreground">Seuil critique atteint</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Modifier
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Prédiction IA</p>
                    <p className="text-sm text-muted-foreground">Analyse des tendances</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Voir Détails
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}