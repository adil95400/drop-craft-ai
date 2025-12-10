import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Warehouse, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpDown,
  Plus,
  Bell,
  BarChart3,
  Truck,
  Upload,
  MapPin
} from 'lucide-react';
import { useStockStats, useStockAlerts, useWarehouses } from '@/hooks/useStockManagement';
import { WarehouseManager } from '@/components/stock/WarehouseManager';
import { StockLevelsTable } from '@/components/stock/StockLevelsTable';
import { StockMovementsLog } from '@/components/stock/StockMovementsLog';
import { StockAlertsPanel } from '@/components/stock/StockAlertsPanel';
import { VariantManager } from '@/components/stock/VariantManager';
import { ThirdPartyLogisticsManager } from '@/components/stock/ThirdPartyLogisticsManager';
import { MultiWarehouseInventory } from '@/components/stock/MultiWarehouseInventory';
import { StockImportAPI } from '@/components/stock/StockImportAPI';

export default function StockManagementPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  
  const stats = useStockStats();
  const { data: alerts = [] } = useStockAlerts();
  const { data: warehouses = [] } = useWarehouses();
  
  const unresolvedAlerts = alerts?.length || 0;
  
  const statCards = [
    {
      title: 'Produits en stock',
      value: stats?.total_products || 0,
      icon: Package,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Entrepôts actifs',
      value: stats?.total_warehouses || 0,
      icon: Warehouse,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      title: 'Valeur du stock',
      value: `${(stats?.total_stock_value || 0).toLocaleString('fr-FR')} €`,
      icon: TrendingUp,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      title: 'Alertes actives',
      value: stats?.active_alerts || 0,
      icon: AlertTriangle,
      color: unresolvedAlerts > 0 ? 'text-red-500' : 'text-muted-foreground',
      bg: unresolvedAlerts > 0 ? 'bg-red-500/10' : 'bg-muted/50'
    }
  ];
  
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Gestion des stocks</h1>
          <p className="text-muted-foreground">
            Inventaire temps réel, variantes et alertes automatiques
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Configurer alertes
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau mouvement
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xl md:text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 md:p-3 rounded-full ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Low Stock Warning */}
      {(stats?.low_stock_items || 0) > 0 && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-orange-700 dark:text-orange-400">
                {stats?.low_stock_items} produit(s) en stock bas
              </p>
              <p className="text-sm text-muted-foreground">
                {stats?.out_of_stock_items} en rupture de stock
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('alerts')}>
              Voir les alertes
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="text-xs md:text-sm py-2">
            <BarChart3 className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Vue d'ensemble</span>
            <span className="sm:hidden">Aperçu</span>
          </TabsTrigger>
          <TabsTrigger value="multi-warehouse" className="text-xs md:text-sm py-2">
            <MapPin className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Multi-entrepôts</span>
            <span className="sm:hidden">Multi</span>
          </TabsTrigger>
          <TabsTrigger value="3pl" className="text-xs md:text-sm py-2">
            <Truck className="h-4 w-4 mr-1 md:mr-2" />
            3PL
          </TabsTrigger>
          <TabsTrigger value="import" className="text-xs md:text-sm py-2">
            <Upload className="h-4 w-4 mr-1 md:mr-2" />
            Import API
          </TabsTrigger>
          <TabsTrigger value="warehouses" className="text-xs md:text-sm py-2">
            <Warehouse className="h-4 w-4 mr-1 md:mr-2" />
            Entrepôts
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs md:text-sm py-2 relative">
            <AlertTriangle className="h-4 w-4 mr-1 md:mr-2" />
            Alertes
            {unresolvedAlerts > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {unresolvedAlerts}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mouvements récents</CardTitle>
                <CardDescription>Dernières opérations de stock</CardDescription>
              </CardHeader>
              <CardContent>
                <StockMovementsLog limit={5} compact />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alertes en cours</CardTitle>
                <CardDescription>Problèmes nécessitant une action</CardDescription>
              </CardHeader>
              <CardContent>
                <StockAlertsPanel limit={5} compact />
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Entrepôts</CardTitle>
              <CardDescription>Répartition du stock par emplacement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {warehouses?.slice(0, 6).map((warehouse) => (
                  <div 
                    key={warehouse.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{warehouse.name}</span>
                      <Badge variant={warehouse.is_active ? 'default' : 'secondary'}>
                        {warehouse.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{warehouse.location || 'Non défini'}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(100, (warehouse.current_utilization / warehouse.capacity) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {warehouse.current_utilization}/{warehouse.capacity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="multi-warehouse">
          <MultiWarehouseInventory />
        </TabsContent>
        
        <TabsContent value="3pl">
          <ThirdPartyLogisticsManager />
        </TabsContent>
        
        <TabsContent value="import">
          <StockImportAPI />
        </TabsContent>
        
        <TabsContent value="warehouses">
          <WarehouseManager />
        </TabsContent>
        
        <TabsContent value="alerts">
          <StockAlertsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
