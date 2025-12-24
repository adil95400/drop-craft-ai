import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ShoppingCart, UserPlus, Package, CreditCard, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface RecentActivityWidgetProps {
  timeRange: string;
  settings?: {
    maxItems?: number;
    showTimestamp?: boolean;
  };
}

const activities = [
  { id: 1, type: 'order', message: 'Nouvelle commande #1247', time: 'Il y a 2 min', icon: ShoppingCart, color: 'text-blue-500' },
  { id: 2, type: 'customer', message: 'Nouveau client inscrit', time: 'Il y a 15 min', icon: UserPlus, color: 'text-green-500' },
  { id: 3, type: 'payment', message: 'Paiement reçu 89.99€', time: 'Il y a 23 min', icon: CreditCard, color: 'text-purple-500' },
  { id: 4, type: 'shipping', message: 'Commande #1245 expédiée', time: 'Il y a 45 min', icon: Package, color: 'text-orange-500' },
  { id: 5, type: 'alert', message: 'Stock bas: iPhone Case', time: 'Il y a 1h', icon: AlertTriangle, color: 'text-red-500' },
  { id: 6, type: 'order', message: 'Nouvelle commande #1246', time: 'Il y a 1h30', icon: ShoppingCart, color: 'text-blue-500' },
  { id: 7, type: 'customer', message: '2 nouveaux clients', time: 'Il y a 2h', icon: UserPlus, color: 'text-green-500' },
  { id: 8, type: 'payment', message: 'Paiement reçu 156.50€', time: 'Il y a 3h', icon: CreditCard, color: 'text-purple-500' },
];

const typeLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  order: { label: 'Commande', variant: 'default' },
  customer: { label: 'Client', variant: 'secondary' },
  payment: { label: 'Paiement', variant: 'outline' },
  shipping: { label: 'Livraison', variant: 'secondary' },
  alert: { label: 'Alerte', variant: 'destructive' },
};

export function RecentActivityWidget({ settings }: RecentActivityWidgetProps) {
  const maxItems = settings?.maxItems ?? 6;
  const showTimestamp = settings?.showTimestamp ?? true;
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-3">
            {displayedActivities.map((activity) => {
              const Icon = activity.icon;
              const typeInfo = typeLabels[activity.type];
              
              return (
                <div 
                  key={activity.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2 rounded-full bg-muted ${activity.color}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{activity.message}</p>
                      <Badge variant={typeInfo.variant} className="text-[10px] px-1.5 py-0">
                        {typeInfo.label}
                      </Badge>
                    </div>
                    {showTimestamp && (
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
