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

      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium">Stock Total</CardTitle>
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold">1,247</div>
              <p className="text-[9px] sm:text-xs text-muted-foreground">
                +12% vs mois dernier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium">En Rupture</CardTitle>
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-red-600">23</div>
              <p className="text-[9px] sm:text-xs text-muted-foreground">
                Action requise
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium">Valeur Stock</CardTitle>
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold">€89,432</div>
              <p className="text-[9px] sm:text-xs text-muted-foreground">
                +8.2% ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium">Rotation</CardTitle>
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold">4.2x</div>
              <p className="text-[9px] sm:text-xs text-muted-foreground">
                Rotation annuelle
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
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