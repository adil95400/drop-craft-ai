import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';
import { TrendingUp, Users, Package, Target, DollarSign, AlertCircle } from 'lucide-react';

const widgetIcons = {
  sales: TrendingUp,
  customers: Users,
  inventory: Package,
  ads: Target,
  revenue: DollarSign,
  alerts: AlertCircle,
};

export function WidgetSelector() {
  const { widgets, toggleWidget } = useDashboardWidgets();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Widgets Disponibles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {widgets.map((widget) => {
            const Icon = widgetIcons[widget.id as keyof typeof widgetIcons];
            return (
              <div key={widget.id} className="flex items-center space-x-2">
                <Switch
                  id={widget.id}
                  checked={widget.enabled}
                  onCheckedChange={() => toggleWidget(widget.id)}
                />
                <Label htmlFor={widget.id} className="flex items-center gap-2 cursor-pointer">
                  {Icon && <Icon className="h-4 w-4" />}
                  {widget.title}
                </Label>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
