/**
 * Dashboard style Channable avec hexagones et design moderne
 * Version complète avec tous les composants Channable avancés
 */

import { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChannablePageLayout,
  ChannableHeroSection,
  ChannableStatsGrid,
  ChannableQuickActions,
  ChannableCard,
  ChannableActivityFeed,
  ChannableChannelHealth,
  ChannableSyncTimeline,
  DEMO_ACTIVITY_EVENTS,
  DEFAULT_CHANNEL_HEALTH_METRICS,
  type SyncEvent
} from '@/components/channable';
import { Settings2, RefreshCw, Plus, LayoutGrid, RotateCcw, Loader2, TrendingUp, ShoppingCart, Users, DollarSign, Package, AlertTriangle, BarChart3, Zap, Target, Activity, Clock, Sparkles } from 'lucide-react';
import { useDashboardConfig, getTimeRangeLabel } from '@/hooks/useDashboardConfig';
import { DashboardWidgetWrapper } from './DashboardWidgetWrapper';
import { TimeRangeSelector } from './TimeRangeSelector';
import { WidgetLibrary } from './WidgetLibrary';
import { SmartAlertsChannable } from './SmartAlertsChannable';
import { RevenueWidgetChannable } from './widgets/RevenueWidgetChannable';
import { OrdersWidgetChannable } from './widgets/OrdersWidgetChannable';
import { CustomersWidgetChannable } from './widgets/CustomersWidgetChannable';
import { ConversionWidget } from './widgets/ConversionWidget';
import { TopProductsWidget } from './widgets/TopProductsWidget';
import { InventoryWidgetAdvanced } from './widgets/InventoryWidgetAdvanced';
import { AlertsWidgetAdvanced } from './widgets/AlertsWidgetAdvanced';
import { TrafficWidget } from './widgets/TrafficWidget';
import { ProfitWidget } from './widgets/ProfitWidget';
import { RecentActivityWidget } from './widgets/RecentActivityWidget';
import { GoalsWidget } from './widgets/GoalsWidget';
import { MarketingWidget } from './widgets/MarketingWidget';
import { ShippingWidget } from './widgets/ShippingWidget';
import { ComparisonWidget } from './widgets/ComparisonWidget';
import { ConnectedStoresWidget } from './widgets/ConnectedStoresWidget';
import { MarketplacesWidget } from './widgets/MarketplacesWidget';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ChannableStat, ChannableQuickAction } from '@/components/channable/types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Demo sync events
const DEMO_SYNC_EVENTS: SyncEvent[] = [
  { id: '1', type: 'full', status: 'success', platform: 'Shopify', message: 'Synchronisation terminée', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), productsAffected: 1234 },
  { id: '2', type: 'products', status: 'in_progress', platform: 'Amazon', message: 'Synchronisation en cours', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), productsAffected: 567 },
  { id: '3', type: 'prices', status: 'success', platform: 'WooCommerce', message: 'Prix mis à jour', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), productsAffected: 89 },
  { id: '4', type: 'inventory', status: 'error', platform: 'eBay', message: 'Erreur de connexion API', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), productsAffected: 0 },
];

export function ChannableDashboard() {
  const {
    widgets,
    timeRange,
    isCustomizing,
    autoRefresh,
    refreshInterval,
    setIsCustomizing,
    reorderWidgets,
    resetToDefaults,
  } = useDashboardConfig();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showHealthPanel, setShowHealthPanel] = useState(true);
  const [showActivityPanel, setShowActivityPanel] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const enabledWidgets = widgets.filter(w => w.enabled).sort((a, b) => a.position - b.position);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderWidgets(active.id as string, over.id as string);
    }
  }, [reorderWidgets]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setLastRefresh(new Date());
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRefreshing(false);
    toast.success('Dashboard actualisé');
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Stats Channable avec couleurs vibrantes
  const dashboardStats: ChannableStat[] = [
    {
      label: 'Revenus du jour',
      value: '12 450 €',
      icon: DollarSign,
      color: 'success',
      change: 12.5,
      trend: 'up',
      changeLabel: 'vs hier'
    },
    {
      label: 'Commandes',
      value: '147',
      icon: ShoppingCart,
      color: 'primary',
      change: 8.3,
      trend: 'up',
      changeLabel: 'vs hier'
    },
    {
      label: 'Clients actifs',
      value: '2,847',
      icon: Users,
      color: 'info',
      change: 3.2,
      trend: 'up',
      changeLabel: 'ce mois'
    },
    {
      label: 'Taux conversion',
      value: '4.2%',
      icon: Target,
      color: 'warning',
      change: -0.5,
      trend: 'down',
      changeLabel: 'vs hier'
    },
    {
      label: 'Produits actifs',
      value: '1,234',
      icon: Package,
      color: 'primary',
      change: 15,
      trend: 'up',
      changeLabel: 'nouveaux'
    },
    {
      label: 'Alertes',
      value: '3',
      icon: AlertTriangle,
      color: 'destructive',
      change: -2,
      trend: 'down',
      changeLabel: 'résolues'
    }
  ];

  // Quick Actions Channable
  const quickActions: ChannableQuickAction[] = [
    {
      id: 'add-product',
      label: 'Ajouter un produit',
      icon: Plus,
      onClick: () => toast.info('Ouverture du formulaire produit'),
      variant: 'primary'
    },
    {
      id: 'view-analytics',
      label: 'Analytiques',
      icon: BarChart3,
      onClick: () => toast.info('Redirection vers analytiques'),
      description: 'Vue détaillée'
    },
    {
      id: 'optimize',
      label: 'Optimiser',
      icon: Zap,
      onClick: () => toast.info('Lancement de l\'optimisation'),
      description: 'IA automatique'
    },
    {
      id: 'reports',
      label: 'Rapports',
      icon: TrendingUp,
      onClick: () => toast.info('Génération des rapports'),
      description: 'Export PDF'
    }
  ];

  const renderWidget = (widget: typeof widgets[0]) => {
    const commonProps = {
      key: widget.id,
      timeRange,
      settings: widget.settings,
      lastRefresh,
    };

    switch (widget.type) {
      case 'revenue':
        return <RevenueWidgetChannable {...commonProps} />;
      case 'orders':
        return <OrdersWidgetChannable {...commonProps} />;
      case 'customers':
        return <CustomersWidgetChannable {...commonProps} />;
      case 'conversion':
        return <ConversionWidget {...commonProps} />;
      case 'topProducts':
        return <TopProductsWidget {...commonProps} />;
      case 'inventory':
        return <InventoryWidgetAdvanced {...commonProps} />;
      case 'alerts':
        return <AlertsWidgetAdvanced {...commonProps} />;
      case 'traffic':
        return <TrafficWidget {...commonProps} />;
      case 'profit':
        return <ProfitWidget {...commonProps} />;
      case 'recentActivity':
        return <RecentActivityWidget {...commonProps} />;
      case 'goals':
        return <GoalsWidget {...commonProps} />;
      case 'marketing':
        return <MarketingWidget {...commonProps} />;
      case 'shipping':
        return <ShippingWidget {...commonProps} />;
      case 'comparison':
        return <ComparisonWidget {...commonProps} />;
      case 'connectedStores':
        return <ConnectedStoresWidget {...commonProps} />;
      case 'marketplaces':
        return <MarketplacesWidget {...commonProps} />;
      default:
        return null;
    }
  };

  const getWidgetColSpan = (size: string) => {
    switch (size) {
      case 'sm': return 'col-span-1';
      case 'md': return 'col-span-1 md:col-span-2';
      case 'lg': return 'col-span-1 md:col-span-2 lg:col-span-3';
      case 'xl': return 'col-span-1 md:col-span-2 lg:col-span-4';
      default: return 'col-span-1';
    }
  };

  return (
    <ChannablePageLayout
      title="Tableau de bord"
      metaTitle="Dashboard"
      metaDescription="Vue d'ensemble de votre activité e-commerce"
    >
      {/* Hero Section Channable avec hexagones */}
      <ChannableHeroSection
        title="Tableau de bord"
        subtitle="Vue d'ensemble en temps réel"
        description="Pilotez votre activité e-commerce avec des insights en temps réel et des outils d'optimisation intelligents."
        showHexagons={true}
        badge={{
          label: autoRefresh ? `Auto-refresh ${refreshInterval}s` : 'Temps réel',
          icon: RefreshCw
        }}
        stats={[
          { label: 'Widgets actifs', value: enabledWidgets.length, icon: LayoutGrid },
          { label: 'Période', value: getTimeRangeLabel(timeRange), icon: BarChart3 },
          { label: 'Dernière MAJ', value: lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), icon: Clock }
        ]}
        variant="default"
        primaryAction={{
          label: 'Personnaliser',
          onClick: () => setIsCustomizing(!isCustomizing),
          icon: LayoutGrid
        }}
        secondaryAction={{
          label: 'Actualiser',
          onClick: handleRefresh
        }}
      >
        <div className="flex flex-wrap gap-2 mt-6">
          <TimeRangeSelector />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-background/50 backdrop-blur-sm border-white/20 hover:bg-white/10"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant={isCustomizing ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={cn(!isCustomizing && "bg-background/50 backdrop-blur-sm border-white/20 hover:bg-white/10")}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            {isCustomizing ? 'Terminer' : 'Personnaliser'}
          </Button>
        </div>
      </ChannableHeroSection>

      {/* Customization Bar */}
      {isCustomizing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-2 p-4 bg-primary/5 rounded-xl border-2 border-dashed border-primary/30"
        >
          <Settings2 className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground flex-1">
            Glissez les widgets pour les réorganiser
          </span>
          <Button variant="outline" size="sm" onClick={() => setShowWidgetLibrary(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter widget
          </Button>
          <Button variant="ghost" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
        </motion.div>
      )}

      {/* Stats Grid Channable */}
      <ChannableStatsGrid stats={dashboardStats} columns={3} />

      {/* Quick Actions Channable */}
      <ChannableQuickActions 
        actions={quickActions} 
        variant="compact" 
      />

      {/* Main Content Grid avec Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content - 3 colonnes */}
        <div className="lg:col-span-3 space-y-6">
          {/* Smart Alerts Channable */}
          <SmartAlertsChannable />

          {/* Sync Timeline */}
          <ChannableSyncTimeline events={DEMO_SYNC_EVENTS} />

          {/* Time Range Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-background/50">
              {getTimeRangeLabel(timeRange)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Dernière mise à jour : {lastRefresh.toLocaleTimeString()}
            </span>
          </div>

          {/* Widgets Grid */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={enabledWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enabledWidgets.map((widget, index) => (
                  <motion.div 
                    key={widget.id} 
                    className={cn(getWidgetColSpan(widget.size))}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <DashboardWidgetWrapper
                      widget={widget}
                      isCustomizing={isCustomizing}
                    >
                      {renderWidget(widget)}
                    </DashboardWidgetWrapper>
                  </motion.div>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {enabledWidgets.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 border-2 border-dashed rounded-2xl bg-muted/30"
            >
              <LayoutGrid className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun widget actif</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Personnalisez votre tableau de bord en ajoutant des widgets pour suivre vos KPIs les plus importants.
              </p>
              <Button onClick={() => setShowWidgetLibrary(true)} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter des widgets
              </Button>
            </motion.div>
          )}
        </div>

        {/* Sidebar - 1 colonne */}
        <div className="space-y-4">
          {/* Channel Health Panel */}
          <Collapsible open={showHealthPanel} onOpenChange={setShowHealthPanel}>
            <CollapsibleTrigger asChild>
              <motion.div 
                className="flex items-center justify-between p-3 bg-card rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Santé des canaux</span>
                </div>
                {showHealthPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </motion.div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2"
              >
                <ChannableChannelHealth metrics={DEFAULT_CHANNEL_HEALTH_METRICS} />
              </motion.div>
            </CollapsibleContent>
          </Collapsible>

          {/* Activity Feed Panel */}
          <Collapsible open={showActivityPanel} onOpenChange={setShowActivityPanel}>
            <CollapsibleTrigger asChild>
              <motion.div 
                className="flex items-center justify-between p-3 bg-card rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Activité récente</span>
                  <Badge variant="secondary" className="text-xs">Live</Badge>
                </div>
                {showActivityPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </motion.div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2"
              >
                <ChannableActivityFeed events={DEMO_ACTIVITY_EVENTS} />
              </motion.div>
            </CollapsibleContent>
          </Collapsible>

          {/* Quick Stats Cards */}
          <div className="space-y-3">
            <ChannableCard
              title="Performance IA"
              description="Optimisations automatiques"
              icon={Sparkles}
              stats={[
                { label: 'Économies', value: '+2,450€' },
                { label: 'Optimisations', value: '147' }
              ]}
              delay={0.1}
            />
            
            <ChannableCard
              title="Synchronisation"
              description="État des connexions"
              icon={RefreshCw}
              status="connected"
              stats={[
                { label: 'Canaux actifs', value: '5' },
                { label: 'Dernière sync', value: '2min' }
              ]}
              delay={0.2}
            />
          </div>
        </div>
      </div>

      {/* Widget Library Dialog */}
      <WidgetLibrary open={showWidgetLibrary} onOpenChange={setShowWidgetLibrary} />
    </ChannablePageLayout>
  );
}
