import { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings2, RefreshCw, Plus, LayoutGrid, RotateCcw, Loader2 } from 'lucide-react';
import { useDashboardConfig, getTimeRangeLabel } from '@/hooks/useDashboardConfig';
import { DashboardWidgetWrapper } from './DashboardWidgetWrapper';
import { TimeRangeSelector } from './TimeRangeSelector';
import { WidgetLibrary } from './WidgetLibrary';
import { SmartAlerts } from './SmartAlerts';
import { RevenueWidgetAdvanced } from './widgets/RevenueWidgetAdvanced';
import { OrdersWidgetAdvanced } from './widgets/OrdersWidgetAdvanced';
import { CustomersWidgetAdvanced } from './widgets/CustomersWidgetAdvanced';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ModularDashboard() {
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
    // Trigger a re-fetch by updating last refresh timestamp
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

  const renderWidget = (widget: typeof widgets[0]) => {
    const commonProps = {
      key: widget.id,
      timeRange,
      settings: widget.settings,
      lastRefresh,
    };

    switch (widget.type) {
      case 'revenue':
        return <RevenueWidgetAdvanced {...commonProps} />;
      case 'orders':
        return <OrdersWidgetAdvanced {...commonProps} />;
      case 'customers':
        return <CustomersWidgetAdvanced {...commonProps} />;
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Tableau de bord</h1>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
            Vue d'ensemble de votre activité
            {autoRefresh && (
              <Badge variant="secondary" className="text-xs">
                Auto-refresh {refreshInterval}s
              </Badge>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <TimeRangeSelector />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
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
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            {isCustomizing ? 'Terminer' : 'Personnaliser'}
          </Button>
        </div>
      </div>

      {/* Customization Bar */}
      {isCustomizing && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border-2 border-dashed border-primary/30">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground flex-1">
            Glissez les widgets pour les réorganiser, ou utilisez les options ci-dessous
          </span>
          <Button variant="outline" size="sm" onClick={() => setShowWidgetLibrary(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter widget
          </Button>
          <Button variant="ghost" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
        </div>
      )}

      {/* Smart Alerts */}
      <SmartAlerts />

      {/* Time Range Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {getTimeRangeLabel(timeRange)}
        </Badge>
        <span className="text-xs text-muted-foreground">
          Dernière mise à jour : {lastRefresh.toLocaleTimeString()}
        </span>
      </div>

      {/* Widgets Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={enabledWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {enabledWidgets.map((widget) => (
              <div key={widget.id} className={cn(getWidgetColSpan(widget.size))}>
                <DashboardWidgetWrapper
                  widget={widget}
                  isCustomizing={isCustomizing}
                >
                  {renderWidget(widget)}
                </DashboardWidgetWrapper>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {enabledWidgets.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun widget actif</h3>
          <p className="text-muted-foreground mb-4">Ajoutez des widgets pour personnaliser votre tableau de bord</p>
          <Button onClick={() => setShowWidgetLibrary(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter des widgets
          </Button>
        </div>
      )}

      {/* Widget Library Dialog */}
      <WidgetLibrary open={showWidgetLibrary} onOpenChange={setShowWidgetLibrary} />
    </div>
  );
}
