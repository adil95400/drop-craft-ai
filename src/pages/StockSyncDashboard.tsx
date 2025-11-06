import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Package, AlertTriangle, TrendingDown, RefreshCw, 
  CheckCircle, XCircle, Clock, ArrowUpDown 
} from 'lucide-react';

export default function StockSyncDashboard() {
  const stockStats = [
    { label: 'Produits Surveillés', value: '1,247', icon: Package, color: 'text-blue-500' },
    { label: 'Alertes Stock Bas', value: '23', icon: AlertTriangle, color: 'text-orange-500' },
    { label: 'Ruptures Évitées', value: '47', icon: CheckCircle, color: 'text-green-500' },
    { label: 'Sync en Temps Réel', value: '100%', icon: RefreshCw, color: 'text-purple-500' }
  ];

  const lowStockProducts = [
    {
      name: 'Wireless Earbuds Pro',
      sku: 'WEP-001',
      currentStock: 5,
      threshold: 10,
      suppliers: ['AliExpress', 'CJ Drop'],
      status: 'low',
      trend: -3
    },
    {
      name: 'Smart Watch Band',
      sku: 'SWB-045',
      currentStock: 0,
      threshold: 10,
      suppliers: ['Alibaba'],
      status: 'out',
      trend: -8
    },
    {
      name: 'Phone Case Premium',
      sku: 'PCP-123',
      currentStock: 8,
      threshold: 15,
      suppliers: ['AliExpress', 'Alibaba'],
      status: 'low',
      trend: -2
    }
  ];

  const syncStatus = [
    { supplier: 'AliExpress', products: 458, status: 'synced', lastSync: '2 min ago', errors: 0 },
    { supplier: 'CJ Dropshipping', products: 342, status: 'syncing', lastSync: 'En cours...', errors: 0 },
    { supplier: 'Alibaba', products: 289, status: 'synced', lastSync: '5 min ago', errors: 2 },
    { supplier: 'Spocket', products: 158, status: 'error', lastSync: '2 hours ago', errors: 12 }
  ];

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-orange-500';
      case 'out': return 'bg-red-500';
      case 'ok': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSyncIcon = (status: string) => {
    switch (status) {
      case 'synced': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'syncing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Stock Synchronization Dashboard - DropCraft AI</title>
        <meta name="description" content="Synchronisation en temps réel des stocks multi-fournisseurs avec alertes et prédictions" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stock Synchronization Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Surveillance en temps réel des stocks multi-fournisseurs
            </p>
          </div>
          
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Maintenant
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stockStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alertes Stock Bas
            </CardTitle>
            <CardDescription>
              Produits nécessitant votre attention immédiate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-3 h-3 rounded-full ${getStockStatusColor(product.status)}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{product.name}</span>
                        <Badge variant="outline">{product.sku}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Stock: {product.currentStock}/{product.threshold}</span>
                        <span className="flex items-center gap-1">
                          <TrendingDown className="h-3 w-3 text-red-500" />
                          {Math.abs(product.trend)} cette semaine
                        </span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {product.suppliers.map((supplier, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {supplier}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline">
                      Réapprovisionner
                    </Button>
                    {product.status === 'out' && (
                      <Button size="sm" variant="destructive">
                        Masquer Listing
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sync Status by Supplier */}
        <Card>
          <CardHeader>
            <CardTitle>État de Synchronisation par Fournisseur</CardTitle>
            <CardDescription>
              Dernière synchronisation des stocks avec vos fournisseurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {syncStatus.map((supplier, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    {getSyncIcon(supplier.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{supplier.supplier}</span>
                        <Badge variant={supplier.status === 'error' ? 'destructive' : 'secondary'}>
                          {supplier.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{supplier.products} produits</span>
                        <span>Dernière sync: {supplier.lastSync}</span>
                        {supplier.errors > 0 && (
                          <span className="text-red-500">{supplier.errors} erreurs</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {supplier.status === 'synced' && (
                      <Progress value={100} className="w-32 h-2" />
                    )}
                    {supplier.status === 'syncing' && (
                      <Progress value={65} className="w-32 h-2" />
                    )}
                    <Button size="sm" variant="outline">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stock Prediction */}
        <Card>
          <CardHeader>
            <CardTitle>Prédictions de Stock</CardTitle>
            <CardDescription>
              IA prédictive pour anticiper les ruptures de stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <ArrowUpDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Prédictions IA et analytics disponibles prochainement</p>
              <Button variant="outline" className="mt-4">
                Activer les Prédictions IA
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
