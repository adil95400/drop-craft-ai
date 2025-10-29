import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';
import { SalesWidget } from './widgets/SalesWidget';
import { CustomerWidget } from './widgets/CustomerWidget';
import { InventoryWidget } from './widgets/InventoryWidget';
import { AdsWidget } from './widgets/AdsWidget';
import { RevenueWidget } from './widgets/RevenueWidget';
import { AlertsWidget } from './widgets/AlertsWidget';

interface DashboardGridProps {
  isCustomizing: boolean;
}

export function DashboardGrid({ isCustomizing }: DashboardGridProps) {
  const { widgets, toggleWidget } = useDashboardWidgets();

  const widgetComponents = {
    sales: SalesWidget,
    customers: CustomerWidget,
    inventory: InventoryWidget,
    ads: AdsWidget,
    revenue: RevenueWidget,
    alerts: AlertsWidget,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {widgets
        .filter(w => w.enabled)
        .sort((a, b) => a.position - b.position)
        .map((widget) => {
          const WidgetComponent = widgetComponents[widget.id as keyof typeof widgetComponents];
          return WidgetComponent ? (
            <WidgetComponent key={widget.id} isCustomizing={isCustomizing} />
          ) : null;
        })}
    </div>
  );
}
