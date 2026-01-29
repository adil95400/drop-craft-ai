import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Package,
  Euro,
  Clock,
  Users
} from 'lucide-react';

// Données réelles simulées pour différents fournisseurs
const realSupplierData = {
  'cdiscount-pro': {
    name: 'Cdiscount Pro',
    status: 'connected',
    products: 156780,
    revenue: 247850.30,
    orders: 1567,
    growth: 12.5,
    lastSync: 'Il y a 2 min',
    categories: [
      { name: 'Téléphones', count: 45620, revenue: 89450.20 },
      { name: 'Informatique', count: 38900, revenue: 76230.50 },
      { name: 'Électroménager', count: 29400, revenue: 45680.80 },
      { name: 'TV & Audio', count: 24560, revenue: 36489.00 }
    ],
    performance: {
      syncSuccess: 98.7,
      errorRate: 1.3,
      avgResponseTime: 450,
      uptime: 99.9
    }
  },
  'syncee': {
    name: 'Syncee',
    status: 'connected', 
    products: 89234,
    revenue: 134567.80,
    orders: 892,
    growth: 18.3,
    lastSync: 'Il y a 5 min',
    categories: [
      { name: 'Mode Femme', count: 28900, revenue: 45670.90 },
      { name: 'Beauté', count: 22100, revenue: 38920.40 },
      { name: 'Accessoires', count: 19800, revenue: 28450.60 },
      { name: 'Sport', count: 18434, revenue: 21525.90 }
    ],
    performance: {
      syncSuccess: 97.8,
      errorRate: 2.2,
      avgResponseTime: 680,
      uptime: 99.5
    }
  },
  'eprolo': {
    name: 'Eprolo',
    status: 'syncing',
    products: 234567,
    revenue: 89234.60,
    orders: 456,
    growth: 24.7,
    lastSync: 'En cours...',
    categories: [
      { name: 'Dropshipping Tech', count: 89200, revenue: 34560.80 },
      { name: 'Mode Unisex', count: 67800, revenue: 28970.20 },
      { name: 'Maison & Jardin', count: 45670, revenue: 15680.40 },
      { name: 'Sports & Loisirs', count: 31897, revenue: 10023.20 }
    ],
    performance: {
      syncSuccess: 94.5,
      errorRate: 5.5,
      avgResponseTime: 1200,
      uptime: 98.8
    }
  },
  'printful': {
    name: 'Printful',
    status: 'connected',
    products: 1247,
    revenue: 15680.40,
    orders: 189,
    growth: 31.2,
    lastSync: 'Il y a 1h',
    categories: [
      { name: 'T-shirts', count: 456, revenue: 8920.30 },
      { name: 'Hoodies', count: 298, revenue: 4560.80 },
      { name: 'Accessoires', count: 234, revenue: 1680.20 },
      { name: 'Affiches', count: 259, revenue: 519.10 }
    ],
    performance: {
      syncSuccess: 99.2,
      errorRate: 0.8,
      avgResponseTime: 320,
      uptime: 99.8
    }
  },
  'bigbuy': {
    name: 'BigBuy', 
    status: 'error',
    products: 187456,
    revenue: 78920.50,
    orders: 234,
    growth: -5.2,
    lastSync: 'Erreur - Il y a 3h',
    categories: [
      { name: 'Électronique', count: 67800, revenue: 34560.20 },
      { name: 'Maison', count: 45600, revenue: 23480.30 },
      { name: 'Jouets', count: 38900, revenue: 12890.80 },
      { name: 'Auto-Moto', count: 35156, revenue: 7989.20 }
    ],
    performance: {
      syncSuccess: 89.1,
      errorRate: 10.9,
      avgResponseTime: 2100,
      uptime: 97.2
    }
  }
};

interface SupplierStatsProps {
  connectorIds: string[];
}

const RealTimeSupplierStats: React.FC<SupplierStatsProps> = ({ connectorIds }) => {
  const [stats, setStats] = useState(realSupplierData);
  const [refreshing, setRefreshing] = useState(false);

  // Simulation des mises à jour en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => {
        const newStats = { ...prev };
        
        // Mettre à jour les données de manière réaliste
        Object.keys(newStats).forEach(key => {
          const supplier = newStats[key as keyof typeof newStats];
          
          // Fluctuations réalistes des métriques
          supplier.revenue += Math.random() * 50 - 25; // ±25€
          supplier.orders += Math.random() > 0.7 ? 1 : 0; // Nouvelle commande occasionnelle
          
          // Mise à jour du taux de succès
          if (supplier.status === 'connected') {
            supplier.performance.syncSuccess += (Math.random() - 0.5) * 0.1;
            supplier.performance.syncSuccess = Math.max(95, Math.min(100, supplier.performance.syncSuccess));
          }
          
          // Simulation de résolution d'erreur pour BigBuy
          if (key === 'bigbuy' && supplier.status === 'error' && Math.random() > 0.95) {
            supplier.status = 'connected';
            supplier.lastSync = 'Il y a quelques secondes';
            supplier.performance.uptime = 98.9;
          }
        });
        
        return newStats;
      });
    }, 5000); // Mise à jour toutes les 5 secondes

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Simulation d'une actualisation
    setTimeout(() => {
      setStats(prev => {
        const newStats = { ...prev };
        Object.keys(newStats).forEach(key => {
          const supplier = newStats[key as keyof typeof newStats];
          supplier.lastSync = key === 'bigbuy' && supplier.status === 'error' 
            ? supplier.lastSync 
            : 'Il y a quelques secondes';
        });
        return newStats;
      });
      setRefreshing(false);
    }, 1500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 
      ? <TrendingUp className="h-4 w-4 text-green-500" />
      : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const activeSuppliers = connectorIds
    .map(id => stats[id as keyof typeof stats])
    .filter(Boolean);

  if (activeSuppliers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Aucun fournisseur connecté. Connectez vos premiers fournisseurs pour voir les statistiques.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Statistiques Temps Réel</h2>
          <p className="text-muted-foreground">Performances de vos fournisseurs connectés</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenus Total</p>
                <p className="text-2xl font-bold">
                  {activeSuppliers.reduce((sum, s) => sum + s.revenue, 0).toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                  })}
                </p>
              </div>
              <Euro className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits Total</p>
                <p className="text-2xl font-bold">
                  {activeSuppliers.reduce((sum, s) => sum + s.products, 0).toLocaleString()}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commandes</p>
                <p className="text-2xl font-bold">
                  {activeSuppliers.reduce((sum, s) => sum + s.orders, 0).toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Croissance Moy.</p>
                <p className="text-2xl font-bold">
                  +{(activeSuppliers.reduce((sum, s) => sum + s.growth, 0) / activeSuppliers.length).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détail par fournisseur */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeSuppliers.map((supplier) => (
          <Card key={supplier.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {supplier.name}
                    {getStatusIcon(supplier.status)}
                  </CardTitle>
                  <CardDescription>{supplier.lastSync}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getGrowthIcon(supplier.growth)}
                  <span className={`font-medium ${supplier.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {supplier.growth >= 0 ? '+' : ''}{supplier.growth.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Métriques principales */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold">{supplier.products.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Produits</p>
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {supplier.revenue.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">Revenus</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{supplier.orders}</p>
                  <p className="text-xs text-muted-foreground">Commandes</p>
                </div>
              </div>

              {/* Performance */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Taux de succès sync</span>
                  <span className="font-medium">{supplier.performance.syncSuccess.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={supplier.performance.syncSuccess} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uptime</span>
                  <span className="font-medium">{supplier.performance.uptime.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={supplier.performance.uptime} 
                  className="h-2"
                />
              </div>

              {/* Top catégories */}
              <div>
                <p className="text-sm font-medium mb-2">Top Catégories</p>
                <div className="space-y-1">
                  {supplier.categories.slice(0, 3).map((cat, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span>{cat.name}</span>
                      <span className="font-medium">
                        {cat.revenue.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                          minimumFractionDigits: 0
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RealTimeSupplierStats;