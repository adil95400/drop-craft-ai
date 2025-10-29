import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';
import { SalesWidget } from './widgets/SalesWidget';
import { CustomerWidget } from './widgets/CustomerWidget';
import { InventoryWidget } from './widgets/InventoryWidget';
import { AdsWidget } from './widgets/AdsWidget';
import { RevenueWidget } from './widgets/RevenueWidget';
import { AlertsWidget } from './widgets/AlertsWidget';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableWidget } from './SortableWidget';

interface DashboardGridProps {
  isCustomizing: boolean;
}

export function DashboardGrid({ isCustomizing }: DashboardGridProps) {
  const { widgets, reorderWidgets } = useDashboardWidgets();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);

      const reorderedWidgets = arrayMove(widgets, oldIndex, newIndex).map((w, index) => ({
        ...w,
        position: index,
      }));

      reorderWidgets(reorderedWidgets);
    }
  };

  const widgetComponents = {
    sales: SalesWidget,
    customers: CustomerWidget,
    inventory: InventoryWidget,
    ads: AdsWidget,
    revenue: RevenueWidget,
    alerts: AlertsWidget,
  };

  const enabledWidgets = widgets
    .filter(w => w.enabled)
    .sort((a, b) => a.position - b.position);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={enabledWidgets.map(w => w.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enabledWidgets.map((widget) => {
            const WidgetComponent = widgetComponents[widget.id as keyof typeof widgetComponents];
            return WidgetComponent ? (
              <SortableWidget key={widget.id} id={widget.id} isCustomizing={isCustomizing}>
                <WidgetComponent isCustomizing={isCustomizing} />
              </SortableWidget>
            ) : null;
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
