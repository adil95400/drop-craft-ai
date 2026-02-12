/**
 * Page Gestion des Stocks - Style Channable
 * Inventaire temps réel, variantes et alertes automatiques
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  RefreshCw,
  DollarSign
} from 'lucide-react';
import { useStockStats, useStockAlerts, useWarehouses } from '@/hooks/useStockManagement';
import { WarehouseManager } from '@/components/stock/WarehouseManager';
import { StockLevelsTable } from '@/components/stock/StockLevelsTable';
import { StockMovementsLog } from '@/components/stock/StockMovementsLog';
import { StockAlertsPanel } from '@/components/stock/StockAlertsPanel';
import { VariantManager } from '@/components/stock/VariantManager';
import { StockMovementDialog } from '@/components/stock/StockMovementDialog';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import {
  ChannableStatsGrid,
  ChannableQuickActions
} from '@/components/channable';
import { ChannableStat, ChannableQuickAction } from '@/components/channable/types';
import { useToast } from '@/hooks/use-toast';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';

export default function StockManagementPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  
  const stats = useStockStats();
  const { data: alerts = [], refetch: refetchAlerts } = useStockAlerts();
  const { data: warehouses = [], refetch: refetchWarehouses } = useWarehouses();
  
  const unresolvedAlerts = alerts?.length || 0;
  
  const channableStats: ChannableStat[] = [
    {
      label: 'Produits en stock',
      value: (stats?.total_products || 0).toLocaleString(),
      icon: Package,
      color: 'primary',
      change: 5,
      trend: 'up',
      changeLabel: 'ce mois',
      onClick: () => navigate('/products')
    },
    {
      label: 'Entrepôts actifs',
      value: (stats?.total_warehouses || 0).toString(),
      icon: Warehouse,
      color: 'success',
      changeLabel: 'disponibles'
    },
    {
      label: 'Valeur du stock',
      value: `${(stats?.total_stock_value || 0).toLocaleString('fr-FR')} €`,
      icon: DollarSign,
      color: 'info',
      change: 12,
      trend: 'up',
      changeLabel: 'vs mois dernier',
      onClick: () => navigate('/analytics')
    },
    {
      label: 'Alertes actives',
      value: (stats?.active_alerts || 0).toString(),
      icon: AlertTriangle,
      color: unresolvedAlerts > 0 ? 'destructive' : 'success',
      changeLabel: unresolvedAlerts > 0 ? 'à traiter' : 'tout va bien',
      onClick: () => setActiveTab('alerts')
    }
  ];

  const quickActions: ChannableQuickAction[] = [
    {
      id: 'add-movement',
      label: 'Nouveau mouvement',
      icon: Plus,
      onClick: () => setMovementDialogOpen(true),
      variant: 'primary'
    },
    {
      id: 'configure-alerts',
      label: 'Configurer alertes',
      icon: Bell,
      onClick: () => setActiveTab('alerts'),
      description: 'Seuils'
    },
    {
      id: 'refresh',
      label: 'Actualiser',
      icon: RefreshCw,
      onClick: () => {
        refetchAlerts();
        refetchWarehouses();
        toast({ title: 'Données actualisées' });
      },
      description: 'Sync'
    },
    {
      id: 'add-warehouse',
      label: 'Nouvel entrepôt',
      icon: Warehouse,
      onClick: () => setActiveTab('warehouses'),
      description: 'Ajouter'
    }
  ];

  const handleRefresh = () => {
    refetchAlerts();
    refetchWarehouses();
    toast({ title: 'Stock actualisé' });
  };
  
  return (
    <ChannablePageWrapper
      title="Gestion des Stocks"
      subtitle="Inventaire temps réel"
      description="Gérez votre inventaire, suivez les niveaux de stock par entrepôt et recevez des alertes automatiques pour les réapprovisionnements."
      heroImage="suppliers"
      badge={{
        label: `${stats?.total_products || 0} produits`,
        icon: Package
      }}
      actions={
        <div className="flex gap-2">
          <Button onClick={() => setMovementDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau mouvement
          </Button>
          <Button variant="outline" onClick={handleRefresh} className="gap-2 bg-background/80 backdrop-blur">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      }
    >
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.stockManagement} />
      {/* Stock Movement Dialog */}
      <StockMovementDialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen} />
      {/* Stats Grid */}
      <ChannableStatsGrid stats={channableStats} columns={4} compact />

      {/* Quick Actions */}
      <ChannableQuickActions actions={quickActions} variant="compact" />
      
      {/* Low Stock Warning */}
      {(stats?.low_stock_items || 0) > 0 && (
        <Card className="border-orange-500/50 bg-gradient-to-r from-orange-50/50 to-yellow-50/50 dark:from-orange-950/20 dark:to-yellow-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-orange-700 dark:text-orange-400">
                {stats?.low_stock_items} produit(s) en stock bas
              </p>
              <p className="text-sm text-muted-foreground">
                {stats?.out_of_stock_items} en rupture de stock
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('alerts')} className="bg-background">
              Voir les alertes
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto bg-muted/50">
          <TabsTrigger value="overview" className="text-xs md:text-sm py-2 gap-1.5">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Vue d'ensemble</span>
            <span className="sm:hidden">Aperçu</span>
          </TabsTrigger>
          <TabsTrigger value="levels" className="text-xs md:text-sm py-2 gap-1.5">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Niveaux</span>
            <span className="sm:hidden">Stock</span>
          </TabsTrigger>
          <TabsTrigger value="variants" className="text-xs md:text-sm py-2 gap-1.5">
            <ArrowUpDown className="h-4 w-4" />
            Variantes
          </TabsTrigger>
          <TabsTrigger value="warehouses" className="text-xs md:text-sm py-2 gap-1.5">
            <Warehouse className="h-4 w-4" />
            Entrepôts
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs md:text-sm py-2 gap-1.5 relative">
            <AlertTriangle className="h-4 w-4" />
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
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Mouvements récents
                </CardTitle>
                <CardDescription>Dernières opérations de stock</CardDescription>
              </CardHeader>
              <CardContent>
                <StockMovementsLog limit={5} compact />
              </CardContent>
            </Card>
            
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Alertes en cours
                </CardTitle>
                <CardDescription>Problèmes nécessitant une action</CardDescription>
              </CardHeader>
              <CardContent>
                <StockAlertsPanel limit={5} compact />
              </CardContent>
            </Card>
          </div>
          
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-primary" />
                Entrepôts
              </CardTitle>
              <CardDescription>Répartition du stock par emplacement</CardDescription>
            </CardHeader>
            <CardContent>
              {warehouses && warehouses.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {warehouses.slice(0, 6).map((warehouse) => (
                    <div 
                      key={warehouse.id}
                      className="p-4 border rounded-xl bg-background/50 hover:bg-background/80 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{warehouse.name}</span>
                        <Badge variant={warehouse.is_active ? 'default' : 'secondary'}>
                          {warehouse.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{warehouse.location || 'Non défini'}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min(100, (warehouse.current_utilization / warehouse.capacity) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {warehouse.current_utilization}/{warehouse.capacity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Warehouse className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun entrepôt configuré</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setActiveTab('warehouses')}>
                    Ajouter un entrepôt
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="levels">
          <StockLevelsTable />
        </TabsContent>
        
        <TabsContent value="variants">
          <VariantManager />
        </TabsContent>
        
        <TabsContent value="warehouses">
          <WarehouseManager />
        </TabsContent>
        
        <TabsContent value="alerts">
          <StockAlertsPanel />
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
