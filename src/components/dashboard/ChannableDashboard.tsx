/**
 * Dashboard style Channable avec hero image et design premium
 * Version complète avec données RÉELLES depuis la base de données
 * 
 * Optimisations appliquées:
 * - Quick Stats dynamiques avec données réelles
 * - Support prefers-reduced-motion
 * - Accessibilité WCAG 2.1 AA
 * - Widget de bienvenue pour nouveaux utilisateurs
 * - Raccourcis clavier (R = refresh, E = edit)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { 
  ChannablePageLayout,
  ChannableStatsGrid,
  ChannableQuickActions,
  ChannableActivityFeed,
  ChannableChannelHealth,
  ChannableSyncTimeline,
} from '@/components/channable';
import { 
  Settings2, RefreshCw, Plus, LayoutGrid, RotateCcw, Loader2, 
  BarChart3, Zap, TrendingUp, Activity, Clock, Sparkles,
  ShoppingCart, Package, DollarSign, Users, ArrowUpRight,
  CheckCircle2, AlertTriangle, Eye, Download
} from 'lucide-react';
import { useDashboardConfig, getTimeRangeLabel } from '@/hooks/useDashboardConfig';
import { useRealDashboardData } from '@/hooks/useRealDashboardData';
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
import { ChannableQuickAction } from '@/components/channable/types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

// Import du WelcomeWidget
import { WelcomeWidget } from './WelcomeWidget';

// Composant de carte statistique premium avec support reduced-motion
interface QuickStatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  color: 'primary' | 'success' | 'warning' | 'info';
  onClick?: () => void;
  isLoading?: boolean;
  ariaLabel?: string;
}

function QuickStatCard({ 
  label, 
  value, 
  change, 
  changeType = 'positive', 
  icon: Icon, 
  color, 
  onClick,
  isLoading = false,
  ariaLabel,
}: QuickStatCardProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const colorClasses = {
    primary: 'from-primary/20 to-primary/5 border-primary/30 text-primary',
    success: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-500',
    warning: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-500',
    info: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-500',
  };

  const motionProps = prefersReducedMotion 
    ? {} 
    : { whileHover: { scale: 1.02, y: -2 }, whileTap: { scale: 0.98 } };

  return (
    <motion.div
      {...motionProps}
      onClick={onClick}
      className={cn(
        "cursor-pointer p-4 rounded-xl border bg-gradient-to-br backdrop-blur-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
        colorClasses[color]
      )}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel || `${label}: ${value}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn("p-2 rounded-lg", `bg-${color}/10`)} aria-hidden="true">
          <Icon className="h-4 w-4" />
        </div>
        {change && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] px-1.5 py-0.5",
              changeType === 'positive' && 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 dark:border-emerald-700',
              changeType === 'negative' && 'text-red-600 border-red-300 bg-red-50 dark:bg-red-950/50 dark:border-red-700',
              changeType === 'neutral' && 'text-gray-600 border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'
            )}
            aria-label={`Variation: ${change}`}
          >
            {change}
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        {isLoading ? (
          <div className="h-8 w-24 bg-muted/50 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-foreground">{value}</p>
        )}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  );
}

export function ChannableDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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

  // Utiliser les données RÉELLES
  const { stats: dashboardStats, rawStats, activityEvents, syncEvents, healthMetrics, isLoading: dataLoading } = useRealDashboardData();
  const prefersReducedMotion = useReducedMotion();

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
    // Invalider les queries pour rafraîchir les données réelles
    await queryClient.invalidateQueries({ queryKey: ['dashboard-real-stats'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard-activity'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard-sync-events'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard-health-metrics'] });
    setIsRefreshing(false);
    toast.success('Dashboard actualisé avec les données réelles');
  }, [queryClient]);

  // Keyboard shortcuts
  useKeyboardShortcut({ key: 'r', onTrigger: handleRefresh });
  useKeyboardShortcut({ key: 'e', onTrigger: () => setIsCustomizing(!isCustomizing) });

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      handleRefresh();
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, handleRefresh]);

  // Calculate Quick Stats from real data
  const quickStatsData = useMemo(() => {
    if (!rawStats) {
      return {
        revenue: { value: '€0', change: '0%', changeType: 'neutral' as const },
        orders: { value: '0', change: '0', changeType: 'neutral' as const },
        products: { value: '0', change: '+0', changeType: 'neutral' as const },
        customers: { value: '0', change: '+0', changeType: 'neutral' as const },
      };
    }

    return {
      revenue: {
        value: `€${rawStats.revenue.today.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        change: `${rawStats.revenue.change >= 0 ? '+' : ''}${rawStats.revenue.change.toFixed(1)}%`,
        changeType: rawStats.revenue.change >= 0 ? 'positive' as const : 'negative' as const,
      },
      orders: {
        value: rawStats.orders.today.toString(),
        change: `${rawStats.orders.change >= 0 ? '+' : ''}${Math.round(rawStats.orders.change)}`,
        changeType: rawStats.orders.change >= 0 ? 'positive' as const : 'negative' as const,
      },
      products: {
        value: rawStats.products.active.toLocaleString('fr-FR'),
        change: `+${rawStats.products.change}`,
        changeType: 'positive' as const,
      },
      customers: {
        value: rawStats.customers.active.toLocaleString('fr-FR'),
        change: `${rawStats.customers.change >= 0 ? '+' : ''}${Math.round(rawStats.customers.change)}`,
        changeType: rawStats.customers.change >= 0 ? 'positive' as const : 'negative' as const,
      },
    };
  }, [rawStats]);

  // Quick Actions Channable
  const quickActions: ChannableQuickAction[] = [
    {
      id: 'add-product',
      label: 'Ajouter un produit',
      icon: Plus,
      onClick: () => navigate('/products'),
      variant: 'primary'
    },
    {
      id: 'view-analytics',
      label: 'Analytiques',
      icon: BarChart3,
      onClick: () => navigate('/analytics'),
      description: 'Vue détaillée'
    },
    {
      id: 'optimize',
      label: 'Optimiser',
      icon: Zap,
      onClick: () => navigate('/automation'),
      description: 'IA automatique'
    },
    {
      id: 'reports',
      label: 'Rapports',
      icon: TrendingUp,
      onClick: () => navigate('/reports'),
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
    <ChannablePageWrapper
      title="Tableau de Bord"
      subtitle="Vue d'ensemble"
      description="Pilotez votre activité e-commerce avec des insights en temps réel et des outils d'optimisation intelligents."
      heroImage="dashboard"
      badge={{
        label: autoRefresh ? `Auto-refresh ${refreshInterval}s` : 'Temps réel',
        icon: RefreshCw
      }}
      actions={
        <>
          <TimeRangeSelector />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Actualiser</span>
          </Button>

          <Button
            variant={isCustomizing ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={cn(!isCustomizing && "bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80")}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            {isCustomizing ? 'Terminer' : 'Personnaliser'}
          </Button>

          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowWidgetLibrary(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter widget
          </Button>
        </>
      }
    >
      {/* Welcome Widget for new users */}
      <WelcomeWidget />

      {/* Quick Stats Grid Premium - DONNÉES DYNAMIQUES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="region" aria-label="Statistiques rapides">
        <QuickStatCard
          label="Chiffre d'affaires"
          value={quickStatsData.revenue.value}
          change={quickStatsData.revenue.change}
          changeType={quickStatsData.revenue.changeType}
          icon={DollarSign}
          color="primary"
          onClick={() => navigate('/analytics')}
          isLoading={dataLoading}
          ariaLabel={`Chiffre d'affaires: ${quickStatsData.revenue.value}, variation: ${quickStatsData.revenue.change}`}
        />
        <QuickStatCard
          label="Commandes"
          value={quickStatsData.orders.value}
          change={quickStatsData.orders.change}
          changeType={quickStatsData.orders.changeType}
          icon={ShoppingCart}
          color="success"
          onClick={() => navigate('/orders')}
          isLoading={dataLoading}
          ariaLabel={`Commandes: ${quickStatsData.orders.value}, variation: ${quickStatsData.orders.change}`}
        />
        <QuickStatCard
          label="Produits actifs"
          value={quickStatsData.products.value}
          change={quickStatsData.products.change}
          changeType={quickStatsData.products.changeType}
          icon={Package}
          color="info"
          onClick={() => navigate('/products')}
          isLoading={dataLoading}
          ariaLabel={`Produits actifs: ${quickStatsData.products.value}, variation: ${quickStatsData.products.change}`}
        />
        <QuickStatCard
          label="Clients"
          value={quickStatsData.customers.value}
          change={quickStatsData.customers.change}
          changeType={quickStatsData.customers.changeType}
          icon={Users}
          color="warning"
          onClick={() => navigate('/customers')}
          isLoading={dataLoading}
          ariaLabel={`Clients: ${quickStatsData.customers.value}, variation: ${quickStatsData.customers.change}`}
        />
      </div>

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

          {/* Sync Timeline - Données réelles */}
          {syncEvents.length > 0 && (
            <ChannableSyncTimeline events={syncEvents} />
          )}

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
                <ChannableChannelHealth metrics={healthMetrics} />
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
                <ChannableActivityFeed events={activityEvents} realtime />
              </motion.div>
            </CollapsibleContent>
          </Collapsible>

          {/* Loading Indicator */}
          {dataLoading && (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">Chargement des données...</span>
            </div>
          )}
        </div>
      </div>

      {/* Widget Library Dialog */}
      <WidgetLibrary open={showWidgetLibrary} onOpenChange={setShowWidgetLibrary} />
    </ChannablePageWrapper>
  );
}
