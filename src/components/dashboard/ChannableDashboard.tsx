/**
 * Dashboard style Channable avec hero image et design premium
 * Version complète avec données RÉELLES depuis la base de données
 * 
 * OPTIMISÉ v5.7.4:
 * - Lazy loading des widgets (recharts ~100KB non chargé initialement)
 * - Quick Stats dynamiques avec données réelles
 * - Support prefers-reduced-motion
 * - Accessibilité WCAG 2.1 AA
 * - Widget de bienvenue pour nouveaux utilisateurs
 * - Raccourcis clavier (R = refresh, E = edit)
 */

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
const RealtimeKPIGridLazy = lazy(() => import('./RealtimeKPIGrid').then(m => ({ default: m.RealtimeKPIGrid })));
import { FreeTrialBanner } from './FreeTrialBanner';
import { SuspensionBanner } from './SuspensionBanner';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useDashboardData } from '@/hooks/useDashboardData';
import { DashboardWidgetWrapper } from './DashboardWidgetWrapper';
import { TimeRangeSelector } from './TimeRangeSelector';
import { WidgetLibrary } from './WidgetLibrary';
import { SmartAlertsChannable } from './SmartAlertsChannable';
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
import { useTabletLayout } from './TabletOptimizedDashboard';
import { useTranslation } from 'react-i18next';

// Lazy load ALL widgets (each pulls in recharts ~100KB)
const RevenueWidgetChannable = lazy(() => import('./widgets/RevenueWidgetChannable').then(m => ({ default: m.RevenueWidgetChannable })));
const OrdersWidgetChannable = lazy(() => import('./widgets/OrdersWidgetChannable').then(m => ({ default: m.OrdersWidgetChannable })));
const CustomersWidgetChannable = lazy(() => import('./widgets/CustomersWidgetChannable').then(m => ({ default: m.CustomersWidgetChannable })));
const ConversionWidget = lazy(() => import('./widgets/ConversionWidget').then(m => ({ default: m.ConversionWidget })));
const TopProductsWidget = lazy(() => import('./widgets/TopProductsWidget').then(m => ({ default: m.TopProductsWidget })));
const InventoryWidgetAdvanced = lazy(() => import('./widgets/InventoryWidgetAdvanced').then(m => ({ default: m.InventoryWidgetAdvanced })));
const AlertsWidgetAdvanced = lazy(() => import('./widgets/AlertsWidgetAdvanced').then(m => ({ default: m.AlertsWidgetAdvanced })));
const TrafficWidget = lazy(() => import('./widgets/TrafficWidget').then(m => ({ default: m.TrafficWidget })));
const ProfitWidget = lazy(() => import('./widgets/ProfitWidget').then(m => ({ default: m.ProfitWidget })));
const RecentActivityWidget = lazy(() => import('./widgets/RecentActivityWidget').then(m => ({ default: m.RecentActivityWidget })));
const GoalsWidget = lazy(() => import('./widgets/GoalsWidget').then(m => ({ default: m.GoalsWidget })));
const MarketingWidget = lazy(() => import('./widgets/MarketingWidget').then(m => ({ default: m.MarketingWidget })));
const ShippingWidget = lazy(() => import('./widgets/ShippingWidget').then(m => ({ default: m.ShippingWidget })));
const ComparisonWidget = lazy(() => import('./widgets/ComparisonWidget').then(m => ({ default: m.ComparisonWidget })));
const ConnectedStoresWidget = lazy(() => import('./widgets/ConnectedStoresWidget').then(m => ({ default: m.ConnectedStoresWidget })));
const MarketplacesWidget = lazy(() => import('./widgets/MarketplacesWidget').then(m => ({ default: m.MarketplacesWidget })));

// Import du système d'onboarding unifié
import { OnboardingWidget, OnboardingModal } from '@/components/onboarding/UnifiedOnboarding';
import { DashboardEmptyState } from './DashboardEmptyState';
import { useDashboardEmptyState } from '@/hooks/useDashboardEmptyState';
import { ActiveJobsBanner } from '@/components/jobs';
import { GuidedTour } from '@/components/onboarding/GuidedTour';

// Widget loading skeleton
const WidgetSkeleton = () => (
  <Card className="h-full min-h-[200px] overflow-hidden">
    <CardContent className="p-5 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-32 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-9 w-28 rounded-lg" />
      <Skeleton className="h-[120px] w-full rounded-xl" />
    </CardContent>
  </Card>
);

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
  
  const colorConfig = {
    primary: {
      card: 'bg-gradient-to-br from-primary/[0.08] via-primary/[0.04] to-transparent border-primary/20 hover:border-primary/40',
      icon: 'bg-primary/10 text-primary',
      glow: 'group-hover:shadow-[0_8px_30px_hsl(221_83%_53%/0.12)]',
    },
    success: {
      card: 'bg-gradient-to-br from-success/[0.08] via-success/[0.04] to-transparent border-success/20 hover:border-success/40',
      icon: 'bg-success/10 text-success',
      glow: 'group-hover:shadow-[0_8px_30px_hsl(142_76%_36%/0.12)]',
    },
    warning: {
      card: 'bg-gradient-to-br from-warning/[0.08] via-warning/[0.04] to-transparent border-warning/20 hover:border-warning/40',
      icon: 'bg-warning/10 text-warning',
      glow: 'group-hover:shadow-[0_8px_30px_hsl(38_92%_50%/0.12)]',
    },
    info: {
      card: 'bg-gradient-to-br from-info/[0.08] via-info/[0.04] to-transparent border-info/20 hover:border-info/40',
      icon: 'bg-info/10 text-info',
      glow: 'group-hover:shadow-[0_8px_30px_hsl(199_89%_48%/0.12)]',
    },
  };

  const cfg = colorConfig[color];
  const motionProps = prefersReducedMotion 
    ? {} 
    : { whileHover: { scale: 1.03, y: -4 }, whileTap: { scale: 0.97 } };

  return (
    <motion.div
      {...motionProps}
      onClick={onClick}
      className={cn(
        "group cursor-pointer relative overflow-hidden rounded-2xl border p-5 backdrop-blur-sm transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
        cfg.card, cfg.glow
      )}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel || `${label}: ${value}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* Subtle decorative element */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-current/[0.04] to-transparent pointer-events-none" aria-hidden="true" />
      
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110", cfg.icon)} aria-hidden="true">
          <Icon className="h-4 w-4" />
        </div>
        {change && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
              changeType === 'positive' && 'text-success border-success/30 bg-success/10',
              changeType === 'negative' && 'text-destructive border-destructive/30 bg-destructive/10',
              changeType === 'neutral' && 'text-muted-foreground border-border bg-muted/50'
            )}
            aria-label={`Variation: ${change}`}
          >
            {changeType === 'positive' && '↑ '}{changeType === 'negative' && '↓ '}{change}
          </Badge>
        )}
      </div>
      <div className="space-y-1.5">
        {isLoading ? (
          <div className="h-8 w-28 rounded-lg shimmer" />
        ) : (
          <p className="text-2xl font-bold tracking-tight text-foreground font-heading">{value}</p>
        )}
        <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{label}</p>
      </div>
    </motion.div>
  );
}

export function ChannableDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
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

  // Tablet layout optimization
  const { isTablet, gridColumns, showCompactView, cardPadding } = useTabletLayout();

  // Utiliser les données RÉELLES
  const { stats: dashboardStats, rawStats, activityEvents, syncEvents, healthMetrics, isLoading: dataLoading } = useDashboardData();
  
  // Vérifier si le dashboard doit afficher l'état vide
  const { isEmpty: showEmptyState, isLoading: emptyStateLoading } = useDashboardEmptyState();
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
    toast.success(t('refreshed'));
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
      label: t('quickActions.addProduct'),
      icon: Plus,
      onClick: () => navigate('/products'),
      variant: 'primary'
    },
    {
      id: 'view-analytics',
      label: t('quickActions.analytics'),
      icon: BarChart3,
      onClick: () => navigate('/analytics'),
      description: t('quickActions.analyticsDesc')
    },
    {
      id: 'optimize',
      label: t('quickActions.optimize'),
      icon: Zap,
      onClick: () => navigate('/automation'),
      description: t('quickActions.optimizeDesc')
    },
    {
      id: 'reports',
      label: t('quickActions.reports'),
      icon: TrendingUp,
      onClick: () => navigate('/reports'),
      description: t('quickActions.reportsDesc')
    }
  ];

  const renderWidget = (widget: typeof widgets[0]) => {
    const commonProps = {
      timeRange,
      settings: widget.settings,
      lastRefresh,
    };

    // Wrap each widget in Suspense for lazy loading
    const getWidgetComponent = () => {
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

    return (
      <Suspense key={widget.id} fallback={<WidgetSkeleton />}>
        {getWidgetComponent()}
      </Suspense>
    );
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
      title={t('title')}
      subtitle={t('subtitle')}
      description={t('description')}
      heroImage="dashboard"
      badge={{
        label: autoRefresh ? `Rafraîchissement auto ${refreshInterval}s` : t('realtime'),
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
            <span className="ml-2 hidden sm:inline">{t('widgets.refresh')}</span>
          </Button>

          <Button
            variant={isCustomizing ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={cn(!isCustomizing && "bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80")}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            {isCustomizing ? t('widgets.done') : t('widgets.customize')}
          </Button>

          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowWidgetLibrary(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('widgets.addWidget')}
          </Button>
        </>
      }
    >
      {/* Suspension banner (past_due / cancelled) */}
      <SuspensionBanner />
      
      {/* Free tier upgrade banner */}
      <FreeTrialBanner />

      {/* Modal d'onboarding pour premier login */}
      <OnboardingModal />

      {/* État vide si pas de données */}
      {showEmptyState && !emptyStateLoading ? (
        <>
          <OnboardingWidget />
          <DashboardEmptyState />
        </>
      ) : (
        <>
          {/* Widget d'onboarding compact */}
          <OnboardingWidget />

          {/* Active Jobs Banner */}
          <ActiveJobsBanner />

          {/* Realtime KPIs with live Supabase subscription */}
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <RealtimeKPIGridLazy />
          </Suspense>

          {/* Quick Stats Grid Premium - DONNÉES DYNAMIQUES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="region" aria-label={t('quickStats')}>
        <QuickStatCard
          label={t('stats.revenue')}
          value={quickStatsData.revenue.value}
          change={quickStatsData.revenue.change}
          changeType={quickStatsData.revenue.changeType}
          icon={DollarSign}
          color="primary"
          onClick={() => navigate('/analytics')}
          isLoading={dataLoading}
          ariaLabel={`${t('stats.revenue')}: ${quickStatsData.revenue.value}, ${quickStatsData.revenue.change}`}
        />
        <QuickStatCard
          label={t('stats.orders')}
          value={quickStatsData.orders.value}
          change={quickStatsData.orders.change}
          changeType={quickStatsData.orders.changeType}
          icon={ShoppingCart}
          color="success"
          onClick={() => navigate('/orders')}
          isLoading={dataLoading}
          ariaLabel={`${t('stats.orders')}: ${quickStatsData.orders.value}, ${quickStatsData.orders.change}`}
        />
        <QuickStatCard
          label={t('stats.activeProducts')}
          value={quickStatsData.products.value}
          change={quickStatsData.products.change}
          changeType={quickStatsData.products.changeType}
          icon={Package}
          color="info"
          onClick={() => navigate('/products')}
          isLoading={dataLoading}
          ariaLabel={`${t('stats.activeProducts')}: ${quickStatsData.products.value}, ${quickStatsData.products.change}`}
        />
        <QuickStatCard
          label={t('stats.customers')}
          value={quickStatsData.customers.value}
          change={quickStatsData.customers.change}
          changeType={quickStatsData.customers.changeType}
          icon={Users}
          color="warning"
          onClick={() => navigate('/customers')}
          isLoading={dataLoading}
          ariaLabel={`${t('stats.customers')}: ${quickStatsData.customers.value}, ${quickStatsData.customers.change}`}
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
            {t('widgets.dragToReorder')}
          </span>
          <Button variant="outline" size="sm" onClick={() => setShowWidgetLibrary(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t('widgets.addWidget')}
          </Button>
          <Button variant="ghost" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-1" />
            {t('widgets.reset')}
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
              {t('lastUpdate')} : {lastRefresh.toLocaleTimeString()}
            </span>
          </div>

          {/* Widgets Grid - Tablet optimized */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={enabledWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
              <div className={cn(
                "grid gap-4",
                // Responsive columns with tablet optimization
                "grid-cols-1",
                "md:grid-cols-2",
                isTablet ? "md:gap-5" : "lg:grid-cols-3"
              )}>
                {enabledWidgets.map((widget, index) => (
                  <motion.div 
                    key={widget.id} 
                    className={cn(
                      getWidgetColSpan(widget.size),
                      // Enhanced touch targets on tablet
                      isTablet && "min-h-[180px]"
                    )}
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.3, delay: prefersReducedMotion ? 0 : index * 0.05 }}
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
              <h3 className="text-xl font-semibold mb-2">{t('widgets.noActiveWidgets')}</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {t('widgets.noActiveWidgetsDesc')}
              </p>
              <Button onClick={() => setShowWidgetLibrary(true)} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                {t('widgets.addWidgets')}
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
                  <span className="font-medium text-sm">{t('sidebar.channelHealth')}</span>
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
                  <span className="font-medium text-sm">{t('sidebar.recentActivity')}</span>
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
              <span className="text-sm">{t('loadingData')}</span>
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* Widget Library Dialog */}
      <WidgetLibrary open={showWidgetLibrary} onOpenChange={setShowWidgetLibrary} />

      {/* Guided Tour for new users */}
      <GuidedTour />
    </ChannablePageWrapper>
  );
}
